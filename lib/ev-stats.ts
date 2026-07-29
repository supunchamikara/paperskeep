import { createPublicClient } from "@/utils/supabase/public";
import type { EvStation } from "./ev";
import { hasCoords } from "./ev";

/**
 * Dataset health for the EV map, shown on the admin statistics page.
 *
 * These are counts of the *data*, not of traffic — how much of the table is
 * actually mappable, and how much of it we only know approximately. Coverage
 * gaps are the point: they drive the next import phase.
 */
export interface EvStats {
  total: number;
  mappable: number;
  missingCoords: number;
  approximate: number;
  exact: number;
  /** True when the table predates the geo_precision column. */
  precisionUnavailable: boolean;
  districts: { name: string; count: number; mappable: number }[];
  operators: { name: string; count: number }[];
  provinces: number;
  lastVerified: string | null;
}

const EMPTY: EvStats = {
  total: 0, mappable: 0, missingCoords: 0, approximate: 0, exact: 0,
  precisionUnavailable: false, districts: [], operators: [], provinces: 0,
  lastVerified: null,
};

export async function getEvStats(): Promise<EvStats> {
  const supabase = createPublicClient();

  const { data, error } = await supabase.from("ev_stations").select("*");
  if (error || !data) return EMPTY;

  const rows = data as EvStation[];
  const tally = (key: (r: EvStation) => string | null) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = key(r);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };

  const districtMappable = new Map<string, number>();
  for (const r of rows) {
    if (r.district && hasCoords(r)) {
      districtMappable.set(r.district, (districtMappable.get(r.district) ?? 0) + 1);
    }
  }

  const districts = [...tally((r) => r.district)]
    .map(([name, count]) => ({ name, count, mappable: districtMappable.get(name) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const operators = [...tally((r) => r.operator_network)]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // The column is absent on databases seeded before it was introduced; treating
  // "no value anywhere" as "all exact" would overstate how good the data is.
  const precisionUnavailable = rows.every((r) => r.geo_precision == null);
  const approximate = rows.filter((r) => r.geo_precision === "approximate").length;
  const mappable = rows.filter(hasCoords).length;

  const dates = rows.map((r) => r.last_verified).filter(Boolean) as string[];

  return {
    total: rows.length,
    mappable,
    missingCoords: rows.length - mappable,
    approximate,
    exact: mappable - approximate,
    precisionUnavailable,
    districts,
    operators,
    provinces: new Set(rows.map((r) => r.province).filter(Boolean)).size,
    lastVerified: dates.length ? dates.sort().at(-1)! : null,
  };
}
