"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Animated light/dark switch. The knob slides and the icon swaps.
 * Keyboard-operable (native <button>), with aria-pressed reflecting state.
 * Renders a neutral placeholder until mounted to avoid a hydration/flash.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-7 w-[52px] rounded-pill border border-white/20 transition-colors duration-300"
      style={{
        background: isDark ? "var(--accent)" : "rgba(255,255,255,.14)",
      }}
    >
      <span
        className="absolute top-[2px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-[11px] shadow-[0_1px_2px_rgba(0,0,0,.35)] transition-[left] duration-300"
        style={{ left: isDark ? "26px" : "2px" }}
      >
        {mounted ? (isDark ? "☾" : "☀") : ""}
      </span>
    </button>
  );
}
