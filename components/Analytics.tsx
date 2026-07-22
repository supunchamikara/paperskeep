"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fire-and-forget page-view beacon. Mounted once in the root layout; on every
 * route change it bumps that page's counter via /api/track. Admin pages are
 * excluded so internal browsing doesn't skew the stats.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const slug = pathname.startsWith("/articles/")
      ? pathname.slice("/articles/".length)
      : null;

    const payload = JSON.stringify({ path: pathname, slug });

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
