import type { PostMeta } from "@/lib/posts";
import PostCard from "./PostCard";

/** Simple responsive auto-fill grid of post cards (server component). */
export default function PostGrid({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface p-10 text-center font-body text-[16px] text-muted shadow-token">
        No articles here yet. Check back soon.
      </p>
    );
  }
  return (
    <div
      className="grid gap-[26px]"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
      }}
    >
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
