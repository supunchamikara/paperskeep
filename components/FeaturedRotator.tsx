"use client";

import { useEffect, useState } from "react";
import type { PostMeta } from "@/lib/posts";
import FeaturedHero from "./FeaturedHero";

/**
 * Shows two featured posts and rotates through the whole featured pool,
 * advancing by two every `intervalMs`. Pauses on hover. If there are two or
 * fewer featured posts, it just shows them (nothing to rotate).
 */
export default function FeaturedRotator({
  posts,
  intervalMs = 10000,
}: {
  posts: PostMeta[];
  intervalMs?: number;
}) {
  const n = posts.length;
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (n <= 2 || paused) return;
    const id = setInterval(
      () => setStart((s) => (s + 2) % n),
      Math.max(2000, intervalMs)
    );
    return () => clearInterval(id);
  }, [n, intervalMs, paused]);

  if (n === 0) return null;

  const first = posts[start % n];
  const second = n > 1 ? posts[(start + 1) % n] : null;

  if (n === 1) {
    return <FeaturedHero post={first} variant="wide" priority />;
  }

  return (
    <div
      className="grid gap-7 lg:grid-cols-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* key changes on rotate → remount → fade animation */}
      <div key={first.slug} className="fade-swap">
        <FeaturedHero post={first} variant="split" priority />
      </div>
      {second && (
        <div key={second.slug} className="fade-swap">
          <FeaturedHero post={second} variant="split" priority={false} />
        </div>
      )}
    </div>
  );
}
