import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import CoverImage from "./CoverImage";
import Zoomable from "./Zoomable";

/**
 * Featured hero card.
 * - "wide"  → single big card, image beside the text (used for one feature).
 * - "split" → image on top, text below (used two-up, side by side in a row).
 */
export default function FeaturedHero({
  post,
  variant = "wide",
  priority = true,
}: {
  post: PostMeta;
  variant?: "wide" | "split";
  priority?: boolean;
}) {
  const Body = (
    <div
      className={
        variant === "wide"
          ? "flex flex-col justify-center p-8 md:p-11"
          : "flex flex-1 flex-col justify-center p-7"
      }
    >
      <span className="self-start rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">
        Featured · {post.category}
      </span>

      <h2
        className={`mb-3.5 mt-4 text-balance font-heading font-extrabold leading-[1.15] tracking-[-0.02em] text-text ${
          variant === "wide" ? "text-[28px] md:text-[36px]" : "text-[24px]"
        }`}
      >
        {post.title}
      </h2>

      <p
        className={`mb-6 font-body leading-[1.65] text-muted ${
          variant === "wide" ? "max-w-[46ch] text-[17px]" : "text-[15.5px]"
        }`}
      >
        {post.excerpt}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-5">
        <Link
          href={`/articles/${post.slug}`}
          className="rounded-[6px] bg-navy px-[22px] py-3 font-heading text-[14.5px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,24,40,.18)]"
        >
          Read Article →
        </Link>
        <span className="font-heading text-[13px] text-muted">
          {post.readingTime} · {post.formattedDate}
        </span>
      </div>
    </div>
  );

  const cover = (
    <Zoomable src={post.coverImage} alt={post.title} className="h-full">
      <CoverImage
        src={post.coverImage}
        alt={post.title}
        priority={priority}
        sizes={
          variant === "wide"
            ? "(max-width: 768px) 100vw, 700px"
            : "(max-width: 1024px) 100vw, 340px"
        }
        className={
          variant === "wide"
            ? "h-full min-h-[240px] md:min-h-[420px]"
            : "h-full min-h-[220px]"
        }
      />
    </Zoomable>
  );

  if (variant === "split") {
    // Image on the LEFT, text on the right (1:3 ratio); stacks on mobile.
    return (
      <section className="grid h-full overflow-hidden rounded-hero border border-border bg-surface shadow-token transition-theme sm:grid-cols-[1fr_3fr]">
        {cover}
        {Body}
      </section>
    );
  }

  return (
    <section className="grid overflow-hidden rounded-hero border border-border bg-surface shadow-token transition-theme md:grid-cols-[1.15fr_0.85fr]">
      {cover}
      {Body}
    </section>
  );
}
