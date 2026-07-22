"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

function SearchIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Elevate the header once the page is scrolled for a layered, "sticky" feel.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-white/10 shadow-[0_6px_24px_rgba(2,6,23,0.28)]"
          : "border-white/[0.06] shadow-none"
      }`}
      style={{
        backgroundColor: scrolled
          ? "color-mix(in srgb, var(--navy) 82%, transparent)"
          : "color-mix(in srgb, var(--navy) 92%, transparent)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
      }}
    >
      {/* subtle top accent hairline for a premium finish */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div
        className={`mx-auto flex max-w-container items-stretch gap-6 px-5 transition-[height] duration-300 sm:px-8 lg:px-12 ${
          scrolled ? "h-[64px]" : "h-[72px]"
        }`}
      >
        {/* Left: logo */}
        <div className="flex flex-1 items-center">
          <Logo />
        </div>

        {/* Center: nav (desktop) */}
        <nav
          aria-label="Primary"
          className="hidden items-stretch gap-1 font-heading text-[14.5px] font-medium md:flex"
        >
          {siteConfig.nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center px-3.5 transition-colors ${
                  active ? "text-white" : "text-white/65 hover:text-white"
                }`}
              >
                {item.label}
                {/* active underline indicator */}
                <span
                  className={`absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-accent transition-opacity duration-200 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3.5">
          <Link
            href="/articles"
            aria-label="Search articles"
            className="flex rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <SearchIcon />
          </Link>

          <ThemeToggle />

          <Link
            href="/contact"
            className="hidden rounded-[7px] bg-accent px-[18px] py-2.5 font-heading text-[13.5px] font-semibold text-white shadow-[0_2px_10px_rgba(44,140,135,0.35)] transition-all hover:-translate-y-px hover:bg-accent-strong hover:shadow-[0_4px_14px_rgba(44,140,135,0.45)] sm:inline-block"
          >
            Subscribe
          </Link>

          {/* Hamburger (mobile) */}
          <button
            type="button"
            className="flex rounded-full p-2 text-white transition-colors hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-white/10 bg-navy px-5 pb-5 pt-2 md:hidden"
        >
          <ul className="flex flex-col">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-[7px] px-3 py-3 font-heading text-[16px] font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="mt-2 block rounded-[7px] bg-accent px-5 py-3 text-center font-heading text-[15px] font-semibold text-white"
              >
                Subscribe
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
