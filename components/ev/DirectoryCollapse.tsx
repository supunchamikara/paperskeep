"use client";

import { useState } from "react";

/**
 * Clamps the station directory on small screens.
 *
 * The full list is ~16,000px tall on a phone, which buries the footer and makes
 * the page feel broken. Every station stays in the DOM — this only limits the
 * visible height — so crawlers still see the whole directory. Desktop is
 * unaffected: the multi-column grid is a reasonable length there.
 */
export default function DirectoryCollapse({
  children,
  count,
}: {
  children: React.ReactNode;
  count: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className={`relative md:max-h-none ${open ? "max-h-none" : "max-h-[65vh] overflow-hidden"}`}
      >
        {children}
        {!open && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg via-bg/85 to-transparent md:hidden"
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-5 w-full rounded-[7px] border border-border bg-surface px-4 py-3 font-heading text-[14px] font-semibold text-text shadow-token transition-colors hover:border-accent hover:text-accent md:hidden"
      >
        {open ? "Show fewer stations" : `Show all ${count} stations`}
      </button>
    </div>
  );
}
