import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import CategoryPill from "./CategoryPill";
import CoverImage from "./CoverImage";

/**
 * Post card used in the home/articles grid.
 * `compact` is used by the "More from Paperskeep" related row (no excerpt).
 */
export default function PostCard({
  post,
  compact = false,
}: {
  post: PostMeta;
  compact?: boolean;
}) {
  return (
    <article className="hover-lift article-accent-border group overflow-hidden rounded-card border border-border bg-surface shadow-token transition-theme">
      <Link href={`/articles/${post.slug}`} className="block">
        <CoverImage
          src={post.coverImage}
          alt={post.title}
          sizes="(max-width: 768px) 100vw, 400px"
          className={compact ? "h-[200px]" : "h-[240px]"}
        />

        <div className={compact ? "p-[18px]" : "p-5 pb-[22px]"}>
          <CategoryPill category={post.category} />

          <h3
            className={`mt-[14px] font-heading font-bold leading-[1.3] tracking-[-0.01em] text-text transition-colors group-hover:text-accent ${
              compact ? "text-[17px] mb-3" : "text-[19px] mb-2.5"
            }`}
          >
            {post.title}
          </h3>

          {!compact && (
            <p className="mb-[18px] font-body text-[14.5px] leading-[1.6] text-muted">
              {post.excerpt}
            </p>
          )}

          <div
            className={`flex items-center gap-2.5 font-heading text-[12.5px] text-muted ${
              compact ? "" : "border-t border-border pt-3.5"
            }`}
          >
            <span>{post.formattedDate}</span>
            <span className="inline-block h-[3px] w-[3px] rounded-full bg-muted" />
            <span>{post.readingTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
