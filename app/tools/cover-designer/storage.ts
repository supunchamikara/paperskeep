/**
 * Draft persistence for the Cover Designer.
 *
 * The design is kept in IndexedDB rather than localStorage because the cover
 * image is held as a data URI: a single 3 MB photograph becomes ~4 MB of
 * base64, which blows the ~5 MB localStorage quota on its own. IndexedDB has
 * room for it, so a reload restores the artwork as well as the typography.
 *
 * localStorage is kept as a fallback for private windows and browsers where
 * IndexedDB is unavailable — there, the type survives a reload but the image
 * cannot, and the caller says so rather than failing silently.
 */
import { createDefaultDoc, createLayer, type CoverDoc, type TextLayer } from "./types";

const DB_NAME = "paperskeep-cover-designer";
const DB_VERSION = 1;
const STORE = "drafts";
const RECORD_KEY = "current";
const FALLBACK_KEY = "paperskeep-cover-designer-draft";

type CoverDraft = {
  version: 1;
  savedAt: number;
  doc: CoverDoc;
};

/** "full" kept the image too; "partial" saved the typography only. */
export type SaveResult = "full" | "partial";

export type LoadResult = {
  doc: CoverDoc;
  savedAt: number;
  /** True when the draft came back without the image it was saved with. */
  imageDropped: boolean;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("open failed"));
    request.onblocked = () => reject(new Error("IndexedDB is blocked"));
  });
}

function writeFallback(doc: CoverDoc): void {
  const lean: CoverDraft = {
    version: 1,
    savedAt: Date.now(),
    // The image is dropped deliberately — it is the one field that cannot fit.
    doc: { ...doc, image: null },
  };
  window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(lean));
}

export async function saveDraft(doc: CoverDoc): Promise<SaveResult> {
  const draft: CoverDraft = { version: 1, savedAt: Date.now(), doc };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(draft, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("write failed"));
      tx.onabort = () => reject(tx.error ?? new Error("write aborted"));
    });
    db.close();

    // One copy of the truth: a stale fallback would win on the next load if
    // IndexedDB later became unavailable.
    try {
      window.localStorage.removeItem(FALLBACK_KEY);
    } catch {
      /* nothing to clean up */
    }
    return "full";
  } catch {
    writeFallback(doc);
    return "partial";
  }
}

/** Rebuilds a stored document, filling in anything a newer build has added. */
function hydrate(stored: Partial<CoverDoc> | undefined): CoverDoc | null {
  if (!stored || !Array.isArray(stored.layers)) return null;

  const layers = stored.layers
    .filter((layer): layer is TextLayer => Boolean(layer) && typeof layer === "object")
    .map((layer) => ({ ...createLayer(layer.role ?? "custom", ""), ...layer }));

  if (!layers.length) return null;
  return { ...createDefaultDoc(), ...stored, layers };
}

export async function loadDraft(): Promise<LoadResult | null> {
  try {
    const db = await openDb();
    const record = await new Promise<CoverDraft | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(RECORD_KEY);
      request.onsuccess = () => resolve(request.result as CoverDraft | undefined);
      request.onerror = () => reject(request.error ?? new Error("read failed"));
    });
    db.close();

    const doc = hydrate(record?.doc);
    if (doc) {
      return { doc, savedAt: record?.savedAt ?? 0, imageDropped: false };
    }
  } catch {
    /* fall through to the localStorage copy */
  }

  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CoverDraft;
    const doc = hydrate(parsed?.doc);
    if (!doc) return null;
    return { doc, savedAt: parsed.savedAt ?? 0, imageDropped: true };
  } catch {
    // A corrupt draft must never block the tool; start fresh instead.
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
    db.close();
  } catch {
    /* nothing stored there */
  }

  try {
    window.localStorage.removeItem(FALLBACK_KEY);
  } catch {
    /* nothing stored there */
  }
}
