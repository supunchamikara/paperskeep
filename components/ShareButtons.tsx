"use client";

import { siteConfig } from "@/lib/site";

/** Share row on the article byline. Uses the Web Share API when available. */
export default function ShareButtons({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const url = `${siteConfig.url}/articles/${slug}`;

  const links: { label: string; short: string; href: string }[] = [
    {
      label: "Share on X",
      short: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "Share on LinkedIn",
      short: "in",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,
    },
    {
      label: "Share on Facebook",
      short: "f",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
    },
  ];

  return (
    <div className="flex gap-2.5">
      {links.map((l) => (
        <a
          key={l.short}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border font-heading text-[12px] font-semibold text-muted transition-theme hover:border-accent hover:bg-accent hover:text-white"
        >
          {l.short}
        </a>
      ))}
    </div>
  );
}
