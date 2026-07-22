"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

/**
 * "On this page" list with scroll-spy: the heading currently in view is
 * highlighted via an IntersectionObserver watching the injected heading ids.
 */
export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      // Trigger when a heading nears the top; ignore the lower 65% of viewport.
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 }
    );

    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-card border border-border bg-surface p-5 shadow-token transition-theme"
    >
      <h4 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.06em] text-muted">
        On this page
      </h4>
      <ul className="flex flex-col gap-0.5 border-l border-border">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`-ml-px block border-l-2 py-1.5 font-heading text-[13.5px] leading-snug transition-colors ${
                  item.level === 3 ? "pl-6" : "pl-3.5"
                } ${
                  active
                    ? "border-accent font-semibold text-accent"
                    : "border-transparent text-muted hover:text-text"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
