import Image from "next/image";
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import CategoryPill from "./CategoryPill";

/** Horizontal list-row variant of a post, used by the "list" view. */
export default function PostListItem({ post }: { post: PostMeta }) {
  return (
    <article className="group overflow-hidden rounded-card border border-border bg-surface shadow-token transition-theme hover:border-accent">
      <Link
        href={`/articles/${post.slug}`}
        className="flex flex-col sm:flex-row"
      >
        <div className="relative h-[180px] w-full flex-shrink-0 sm:h-auto sm:w-[240px]">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, 240px"
            className="object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
          <CategoryPill category={post.category} />

          <h3 className="mb-2 mt-3 font-heading text-[20px] font-bold leading-[1.3] tracking-[-0.01em] text-text transition-colors group-hover:text-accent">
            {post.title}
          </h3>

          <p className="mb-4 max-w-[62ch] font-body text-[15px] leading-[1.6] text-muted">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-2.5 font-heading text-[12.5px] text-muted">
            <span>{post.formattedDate}</span>
            <span className="inline-block h-[3px] w-[3px] rounded-full bg-muted" />
            <span>{post.readingTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
