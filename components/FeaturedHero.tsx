import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import CoverImage from "./CoverImage";

/** 2-column featured hero card driven by the post with `featured: true`. */
export default function FeaturedHero({ post }: { post: PostMeta }) {
  return (
    <section className="grid overflow-hidden rounded-hero border border-border bg-surface shadow-token transition-theme md:grid-cols-[1.15fr_0.85fr]">
      <CoverImage
        src={post.coverImage}
        alt={post.title}
        priority
        sizes="(max-width: 768px) 100vw, 700px"
        className="min-h-[240px] md:min-h-[420px]"
      />

      <div className="flex flex-col justify-center p-8 md:p-11">
        <span className="self-start rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">
          Featured · {post.category}
        </span>

        <h1 className="mb-3.5 mt-[18px] text-balance font-heading text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-text md:text-[36px]">
          {post.title}
        </h1>

        <p className="mb-[26px] max-w-[46ch] font-body text-[17px] leading-[1.65] text-muted">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <Link
            href={`/articles/${post.slug}`}
            className="rounded-[6px] bg-navy px-[26px] py-[13px] font-heading text-[15px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,24,40,.18)]"
          >
            Read Article →
          </Link>
          <span className="font-heading text-[13px] text-muted">
            {post.readingTime} · {post.formattedDate}
          </span>
        </div>
      </div>
    </section>
  );
}
