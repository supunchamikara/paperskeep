"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface Item {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string;
  readingTime: string;
  /** Set for non-article destinations (tools, maps); posts resolve by slug. */
  href?: string;
}

/** Relevance score for a post against the query. Higher = closer match. */
function score(p: Item, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const words = q.split(/\s+/).filter(Boolean);
  const title = p.title.toLowerCase();
  const category = p.category.toLowerCase();
  const tags = p.tags.map((t) => t.toLowerCase());
  const excerpt = p.excerpt.toLowerCase();

  let s = 0;
  if (title.startsWith(q)) s += 120;
  if (title.includes(q)) s += 80;
  if (tags.some((t) => t.includes(q))) s += 50;
  if (category.includes(q)) s += 35;
  if (excerpt.includes(q)) s += 15;

  for (const w of words) {
    if (title.includes(w)) s += 20;
    if (tags.some((t) => t.includes(w))) s += 12;
    if (category.includes(w)) s += 8;
    if (excerpt.includes(w)) s += 4;
  }
  return s;
}

export default function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Item[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch the index the first time the dialog opens; focus the input.
  useEffect(() => {
    if (!open) return;
    if (!index) {
      fetch("/api/search")
        .then((r) => r.json())
        .then((data: Item[]) => setIndex(data))
        .catch(() => setIndex([]));
    }
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, index]);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!q.trim() || !index) return [];
    return index
      .map((p) => ({ p, s: score(p, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.p);
  }, [q, index]);

  useEffect(() => setActive(0), [q]);

  function go(item: Item) {
    router.push(item.href ?? `/articles/${item.slug}`);
    onClose();
    setQ("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="lightbox-in fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] overflow-hidden rounded-block border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search articles and tools…"
            aria-label="Search articles and tools"
            className="w-full bg-transparent py-4 font-body text-[16px] text-text outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-[6px] border border-border px-2 py-1 font-heading text-[11px] font-semibold text-muted"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim() === "" ? (
            <p className="px-4 py-8 text-center font-body text-[14px] text-muted">
              Type to search articles and tools by title, tag, or category.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-8 text-center font-body text-[14px] text-muted">
              No results for “{q}”.
            </p>
          ) : (
            <ul className="py-2">
              {results.map((item, i) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors ${
                      i === active ? "bg-pill" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-pill bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] px-2 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.04em] text-accent">
                        {item.category}
                      </span>
                      <span className="font-heading text-[12px] text-muted">
                        {item.readingTime}
                      </span>
                    </div>
                    <span className="mt-0.5 font-heading text-[15px] font-semibold leading-snug text-text">
                      {item.title}
                    </span>
                    <span className="line-clamp-1 font-body text-[13px] text-muted">
                      {item.excerpt}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
