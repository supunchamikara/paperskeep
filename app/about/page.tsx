import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import BrandMark from "@/components/BrandMark";
import SocialIcons from "@/components/SocialIcons";

export const metadata: Metadata = {
  title: "About",
  description:
    "Paperskeep is a modern publication covering the systems, tools, and people building a more thoughtful internet.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const { author } = siteConfig;
  return (
    <div className="mx-auto max-w-prose px-5 py-16 sm:px-8">
      <span className="inline-block rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">
        About Paperskeep
      </span>

      <h1 className="mb-6 mt-5 text-balance font-heading text-[38px] font-extrabold leading-[1.12] tracking-[-0.02em] text-text">
        Thoughtful writing for people who build.
      </h1>

      <div className="prose-paperskeep">
        <p>
          Paperskeep is a small, independent publication about the systems, tools,
          and people shaping a more thoughtful internet. We cover technology,
          business, lifestyle, and culture — not as separate beats, but as one
          conversation about how we work and live online.
        </p>
        <p>
          We believe the best writing respects your time. No listicles for the
          algorithm, no manufactured outrage. Just clear, honest analysis from
          people who&apos;ve done the work.
        </p>

        <h2>What we cover</h2>
        <ul>
          <li>
            <strong>Technology</strong> — infrastructure, developer tooling, and
            the quiet shifts that change how we build.
          </li>
          <li>
            <strong>Business</strong> — pricing, open-source economics, and the
            realities of shipping products.
          </li>
          <li>
            <strong>Lifestyle</strong> — sustainable work, focus, and designing a
            day that doesn&apos;t burn you out.
          </li>
          <li>
            <strong>Culture</strong> — independent media, the creator economy, and
            the ideas moving through the industry.
          </li>
        </ul>

        <h2>A note on affiliate links</h2>
        <p>
          Some articles include product recommendations through the Amazon
          Associates program. When you buy through those links we may earn a
          commission at no extra cost to you. We only recommend gear we&apos;d
          actually use — the disclosure is always shown on the card.
        </p>
      </div>

      {/* Brand card */}
      <div className="mt-12 flex flex-col items-start gap-5 rounded-block border border-border bg-surface p-7 shadow-token transition-theme sm:flex-row sm:items-center">
        <BrandMark size={80} className="flex-shrink-0 drop-shadow-sm" />
        <div className="flex-1">
          <div className="font-heading text-[18px] font-bold text-text">
            {author.name}
          </div>
          <div className="mb-2 font-heading text-[14px] text-accent">
            {author.role}
          </div>
          <p className="mb-3 font-body text-[15px] leading-[1.6] text-muted">
            {author.bio}
          </p>
          <SocialIcons variant="surface" />
        </div>
      </div>
    </div>
  );
}
