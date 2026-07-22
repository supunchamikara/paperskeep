"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/lib/site";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-navy transition-theme">
      <div className="mx-auto flex h-[72px] max-w-container items-center gap-6 px-5 sm:px-8 lg:px-12">
        {/* Left: logo */}
        <div className="flex flex-1 items-center">
          <Logo />
        </div>

        {/* Center: nav (desktop) */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-[34px] font-heading text-[15px] font-medium md:flex"
        >
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={
                isActive(item.href)
                  ? "text-white"
                  : "text-white/70 transition-colors hover:text-white"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-[18px]">
          <Link
            href="/articles"
            aria-label="Search articles"
            className="flex p-1.5 text-white/85 transition-colors hover:text-white"
          >
            <SearchIcon />
          </Link>

          <ThemeToggle />

          <Link
            href="/contact"
            className="hidden rounded-[6px] bg-accent px-5 py-2.5 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-accent-strong sm:inline-block"
          >
            Subscribe
          </Link>

          {/* Hamburger (mobile) */}
          <button
            type="button"
            className="flex p-1.5 text-white md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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
          className="border-t border-white/[0.08] bg-navy px-5 pb-5 pt-2 md:hidden"
        >
          <ul className="flex flex-col">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block py-3 font-heading text-[16px] font-medium ${
                    isActive(item.href) ? "text-white" : "text-white/70"
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
                className="mt-2 block rounded-[6px] bg-accent px-5 py-3 text-center font-heading text-[15px] font-semibold text-white"
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
