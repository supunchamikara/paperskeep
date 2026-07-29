/**
 * EV station importer — loads sri_lanka_ev_charging_stations.csv into the
 * `public.ev_stations` table.
 *
 * Idempotent: rows are upserted on `station_id`, so re-running after a new
 * import phase appends the new stations and refreshes the existing ones.
 *
 * Requires the SERVICE ROLE key (RLS grants the public key read-only access).
 *
 * Usage (Node 20+):
 *   npm run db:seed:ev
 *   node --env-file=.env.local scripts/seed-ev-stations.mjs [path/to/other.csv]
 *   node scripts/seed-ev-stations.mjs --dry-run   # parse + report, no writes
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!url || !serviceKey)) {
  console.error(
    "\n✗ Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY are set in .env.local, then run:\n" +
      "    node --env-file=.env.local scripts/seed-ev-stations.mjs\n"
  );
  process.exit(1);
}

const csvPath = path.resolve(
  args.find((a) => !a.startsWith("--")) ?? "sri_lanka_ev_charging_stations.csv"
);

const supabase = dryRun
  ? null
  : createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

/**
 * Minimal RFC-4180 parser — the CSV quotes addresses containing commas and
 * uses "" for an embedded quote. Small enough not to warrant a dependency.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  // Strip a BOM and normalise line endings so \r never lands inside a value.
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }

  // Trailing field / row when the file doesn't end in a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;
  return body
    .filter((r) => r.some((v) => v.trim() !== "")) // skip blank lines
    .map((r) =>
      Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()]))
    );
}

/** Empty CSV cells become NULL rather than "". */
const text = (v) => (v && v.length ? v : null);

/** Blank or unparseable coordinates import as NULL — flagged for geocoding. */
const num = (v) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function main() {
  const raw = await readFile(csvPath, "utf8");
  const records = parseCsv(raw);

  const rows = records
    .filter((r) => r.station_id && r.station_name)
    .map((r) => ({
      station_id: r.station_id,
      station_name: r.station_name,
      operator_network: text(r.operator_network),
      district: text(r.district),
      province: text(r.province),
      address: text(r.address),
      charger_level: text(r.charger_level),
      connector_types: text(r.connector_types),
      power_kw: text(r.power_kw),
      latitude: num(r.latitude),
      longitude: num(r.longitude),
      maps_link: text(r.maps_link),
      access: text(r.access),
      status: text(r.status) ?? "active",
      source: text(r.source),
      last_verified: text(r.last_verified),
      added_phase: text(r.added_phase),
      geo_precision: text(r.geo_precision) ?? "exact",
    }));

  if (!rows.length) {
    console.error(`✗ No usable rows found in ${csvPath}`);
    process.exit(1);
  }

  // A database created before geo_precision existed can still take the rest of
  // the import — drop the column and carry on rather than failing the run.
  let skipPrecision = false;

  async function upsert(chunk) {
    const payload = skipPrecision
      ? chunk.map(({ geo_precision, ...rest }) => rest)
      : chunk;
    return supabase.from("ev_stations").upsert(payload, { onConflict: "station_id" });
  }

  // Chunked so a future multi-thousand-row phase doesn't blow the payload cap.
  const CHUNK = 500;
  for (let i = 0; i < rows.length && !dryRun; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    let { error } = await upsert(chunk);

    if (error && /geo_precision/.test(error.message)) {
      console.warn(
        "\n⚠ The ev_stations table has no `geo_precision` column — importing " +
          "without it.\n  Run this, then re-run the seed to record which pins " +
          "are only approximate:\n" +
          "    alter table public.ev_stations\n" +
          "      add column if not exists geo_precision text default 'exact';\n"
      );
      skipPrecision = true;
      ({ error } = await upsert(chunk));
    }

    if (error) {
      console.error(`✗ Upsert failed at row ${i + 1}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ↑ upserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  if (skipPrecision) {
    console.warn("⚠ geo_precision was NOT written — see the note above.");
  }

  const missingCoords = rows.filter(
    (r) => r.latitude === null || r.longitude === null
  );

  console.log(
    `\n✓ ${rows.length} stations ${dryRun ? "parsed (dry run — nothing written)" : "imported"} from ${path.basename(csvPath)}`
  );
  if (missingCoords.length) {
    console.log(
      `⚠ ${missingCoords.length} row(s) have no coordinates and will not render ` +
        `as markers until geocoded:\n` +
        missingCoords.map((r) => `    ${r.station_id}  ${r.station_name}`).join("\n")
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
