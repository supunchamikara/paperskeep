"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Stable per-browser id (approximates unique visitors), stored locally. */
function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem("paperskeep_vid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem("paperskeep_vid", id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget page-view beacon. Mounted once in the root layout; sends a
 * view on every route change. Admin pages are excluded so internal browsing
 * doesn't skew the stats.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const slug = pathname.startsWith("/articles/")
      ? pathname.slice("/articles/".length)
      : null;

    const payload = JSON.stringify({
      path: pathname,
      slug,
      visitorId: getVisitorId(),
      referrer: document.referrer || null,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track",
          new Blob([payload], { type: "application/json" })
        );
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      /* analytics must never break the page */
    }
  }, [pathname]);

  return null;
}
