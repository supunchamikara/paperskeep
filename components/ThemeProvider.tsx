"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Wraps next-themes with the class strategy. `disableTransitionOnChange`
 * is intentionally OFF so our CSS variable transitions animate smoothly.
 */
export default function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="paperskeep-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
