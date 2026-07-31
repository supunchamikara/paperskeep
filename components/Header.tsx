"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import SearchDialog from "./SearchDialog";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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
  const [searchOpen, setSearchOpen] = useState(false);
  // Which nav dropdown is open, keyed by label. Hover opens it; focus keeps it
  // open for keyboard users; Escape and navigation close it.
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Elevate the header once the page is scrolled for a layered, "sticky" feel.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⌘K / Ctrl+K opens search; Escape closes an open dropdown.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Landing on a new page should never leave a menu hanging open.
  useEffect(() => {
    setOpenMenu(null);
    setMenuOpen(false);
  }, [pathname]);

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
            const open = openMenu === item.label;

            const link = (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-haspopup={item.children ? "true" : undefined}
                aria-expanded={item.children ? open : undefined}
                className={`relative flex items-center gap-1.5 px-3.5 transition-colors ${
                  active ? "text-white" : "text-white/65 hover:text-white"
                }`}
              >
                {item.label}
                {item.children && <ChevronIcon open={open} />}
                {/* active underline indicator */}
                <span
                  className={`absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-accent transition-opacity duration-200 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );

            if (!item.children) {
              return <div key={item.href} className="flex">{link}</div>;
            }

            return (
              <div
                key={item.href}
                className="relative flex"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
                // Keyboard users get the same panel: it opens when focus lands
                // inside and closes once focus leaves the group entirely.
                onFocus={() => setOpenMenu(item.label)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOpenMenu(null);
                  }
                }}
              >
                {link}

                {/* The panel sits flush against the header's bottom edge so
                    there is no dead gap to cross with the pointer. */}
                <div
                  className={`absolute left-0 top-full z-50 w-[288px] pt-2 transition-all duration-200 ${
                    open
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0"
                  }`}
                >
                  {/* Opaque on purpose. The theme colors are CSS variables,
                      so Tailwind's `/95` opacity modifier silently generates
                      no rule for them — and a translucent panel over article
                      artwork is unreadable anyway. */}
                  <div className="overflow-hidden rounded-[10px] border border-white/10 bg-navy p-1.5 shadow-[0_18px_44px_rgba(2,6,23,0.5)]">
                    <ul>
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              aria-current={childActive ? "page" : undefined}
                              className={`block rounded-[7px] px-3 py-2.5 transition-colors ${
                                childActive ? "bg-white/10" : "hover:bg-white/10"
                              }`}
                            >
                              <span
                                className={`block text-[14px] font-semibold ${
                                  childActive ? "text-accent" : "text-white"
                                }`}
                              >
                                {child.label}
                              </span>
                              <span className="mt-0.5 block text-[12px] font-normal leading-snug text-white/55">
                                {child.description}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mx-3 my-1.5 h-px bg-white/10" />

                    <Link
                      href={item.href}
                      className="block rounded-[7px] px-3 py-2 text-[12.5px] font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Browse all {item.label.toLowerCase()} →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search articles"
            className="flex rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <SearchIcon />
          </button>

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

                {/* Sub-items are always visible on mobile: there is no hover
                    to reveal them, and the list is short. */}
                {item.children && (
                  <ul className="mb-1 ml-3 border-l border-white/10 pl-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setMenuOpen(false)}
                          aria-current={
                            pathname === child.href ? "page" : undefined
                          }
                          className={`block rounded-[7px] px-3 py-2.5 font-heading text-[14.5px] font-medium transition-colors ${
                            pathname === child.href
                              ? "bg-white/10 text-accent"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
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

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
