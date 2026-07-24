import { getAllPosts, getFeaturedPool, getPopularTags } from "@/lib/posts";
import FeaturedRotator from "@/components/FeaturedRotator";
import FilterableGrid from "@/components/FilterableGrid";
import Sidebar from "@/components/Sidebar";

// Revalidate periodically; admin mutations also revalidate these paths.
export const revalidate = 60;

// Seconds between featured-hero rotations (configurable via .env).
const ROTATE_SECONDS =
  Number(process.env.NEXT_PUBLIC_FEATURED_ROTATE_SECONDS) || 10;

export default async function HomePage() {
  const [featured, allPosts, tags] = await Promise.all([
    getFeaturedPool(),
    getAllPosts(),
    getPopularTags(18),
  ]);

  // Keep the featured posts out of the grid to avoid duplication.
  const featuredSlugs = new Set(featured.map((p) => p.slug));
  const gridPosts = allPosts.filter((p) => !featuredSlugs.has(p.slug));

  return (
    <div className="mx-auto max-w-container px-5 pt-11 sm:px-8 lg:px-12">
      {featured.length > 0 && (
        <FeaturedRotator posts={featured} intervalMs={ROTATE_SECONDS * 1000} />
      )}

      <div className="mt-10 grid grid-cols-1 gap-9 pb-16 lg:grid-cols-[1fr_316px] lg:items-start">
        <FilterableGrid posts={gridPosts} columns={2} />
        <Sidebar tags={tags} />
      </div>
    </div>
  );
}
