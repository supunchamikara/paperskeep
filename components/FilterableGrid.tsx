"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PostMeta } from "@/lib/posts";
import PostCard from "./PostCard";
import PostListItem from "./PostListItem";

const CATEGORIES = ["All", "Technology", "Business", "Lifestyle", "Culture"];

type View = "grid" | "list";

const GRID_GAP = 26; // px, matches the grid gap below
const GRID_ROWS_PER_PAGE = 3; // grid: show this many full rows per page
const LIST_PER_PAGE = 5;

/**
 * Client-side filterable post list with a grid/list view toggle and
 * pagination. `initialCategory` / `initialTag` seed the filter from URL
 * params (e.g. the sidebar tag cloud links to /articles?tag=Edge).
 */
export default function FilterableGrid({
  posts,
  initialCategory = "All",
  initialTag,
  columns = 2,
}: {
  posts: PostMeta[];
  initialCategory?: string;
  initialTag?: string;
  columns?: 2 | 3;
}) {
  const [category, setCategory] = useState(
    CATEGORIES.includes(initialCategory) ? initialCategory : "All"
  );
  const [tag, setTag] = useState<string | undefined>(initialTag);
  const [view, setView] = useState<View>("grid");
  const [page, setPage] = useState(1);
  const [gridCols, setGridCols] = useState(2);
  const topRef = useRef<HTMLDivElement>(null);

  const minCardPx = columns === 3 ? 260 : 300;

  // Measure how many columns actually fit and page by whole rows, so a wider
  // screen shows more posts per page (never fewer than fit on screen).
  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const cols = Math.max(
        1,
        Math.floor((w + GRID_GAP) / (minCardPx + GRID_GAP))
      );
      setGridCols(cols);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minCardPx]);

  const filtered = useMemo(() => {
    let list = posts;
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (tag) list = list.filter((p) => p.tags.includes(tag));
    return list;
  }, [posts, category, tag]);

  const perPage =
    view === "list" ? LIST_PER_PAGE : gridCols * GRID_ROWS_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));

  // Keep the page in range whenever the filtered set or page size changes.
  useEffect(() => {
    setPage(1);
  }, [category, tag, view]);

  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  function goTo(next: number) {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Auto-fill grid: cards keep a fixed target width and the column count
  // grows with the container, instead of the cards themselves stretching.
  // `min(100%, …)` prevents overflow on very narrow screens.
  const minCardWidth = columns === 3 ? "260px" : "300px";
  const gridTemplateColumns = `repeat(auto-fill, minmax(min(100%, ${minCardWidth}), 1fr))`;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Header: title · tag-clear · category pills · view toggle */}
      <div className="mb-[26px] flex flex-wrap items-center gap-3">
        <span className="mr-2 font-heading text-[20px] font-bold text-text">
          {tag ? `Tagged “${tag}”` : "Recent Articles"}
        </span>
        <div className="flex-1" />

        {tag && (
          <button
            type="button"
            onClick={() => setTag(undefined)}
            className="rounded-pill border border-border bg-surface px-4 py-2 font-heading text-[13px] font-semibold text-muted transition-theme hover:border-accent hover:text-accent"
          >
            Clear tag ✕
          </button>
        )}

        <div
          role="group"
          aria-label="Filter articles by category"
          className="flex flex-wrap gap-3"
        >
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className={`rounded-pill border px-4 py-2 font-heading text-[13px] font-semibold transition-theme ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Grid / list view toggle */}
        <div
          role="group"
          aria-label="Change layout"
          className="flex overflow-hidden rounded-pill border border-border"
        >
          <button
            type="button"
            aria-pressed={view === "grid"}
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className={`flex items-center justify-center px-3 py-2 transition-theme ${
              view === "grid"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-accent"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            aria-label="List view"
            onClick={() => setView("list")}
            className={`flex items-center justify-center border-l border-border px-3 py-2 transition-theme ${
              view === "list"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-accent"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results */}
      {visible.length > 0 ? (
        view === "grid" ? (
          <div className="grid gap-[26px]" style={{ gridTemplateColumns }}>
            {visible.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {visible.map((post) => (
              <PostListItem key={post.slug} post={post} />
            ))}
          </div>
        )
      ) : (
        <p className="rounded-card border border-border bg-surface p-10 text-center font-body text-[16px] text-muted shadow-token">
          No articles found in this category yet. Check back soon.
        </p>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="rounded-[6px] border border-border bg-surface px-3.5 py-2 font-heading text-[14px] font-semibold text-text transition-theme hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text"
          >
            ←
          </button>

          {Array.from({ length: pageCount }).map((_, i) => {
            const n = i + 1;
            const active = n === currentPage;
            return (
              <button
                key={n}
                type="button"
                onClick={() => goTo(n)}
                aria-current={active ? "page" : undefined}
                className={`h-10 w-10 rounded-[6px] border font-heading text-[14px] font-semibold transition-theme ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface text-text hover:border-accent hover:text-accent"
                }`}
              >
                {n}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === pageCount}
            aria-label="Next page"
            className="rounded-[6px] border border-border bg-surface px-3.5 py-2 font-heading text-[14px] font-semibold text-text transition-theme hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text"
          >
            →
          </button>
        </nav>
      )}
    </div>
  );
}
