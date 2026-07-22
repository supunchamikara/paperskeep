import { getAllPosts, getFeaturedPosts, getAllTags } from "@/lib/posts";
import FeaturedHero from "@/components/FeaturedHero";
import FilterableGrid from "@/components/FilterableGrid";
import Sidebar from "@/components/Sidebar";

// Revalidate periodically; admin mutations also revalidate these paths.
export const revalidate = 60;

export default async function HomePage() {
  const [featured, allPosts, tags] = await Promise.all([
    getFeaturedPosts(2),
    getAllPosts(),
    getAllTags(),
  ]);

  // Keep the featured posts out of the grid to avoid duplication.
  const featuredSlugs = new Set(featured.map((p) => p.slug));
  const gridPosts = allPosts.filter((p) => !featuredSlugs.has(p.slug));

  return (
    <div className="mx-auto max-w-container px-5 pt-11 sm:px-8 lg:px-12">
      {featured.length === 1 && (
        <FeaturedHero post={featured[0]} variant="wide" />
      )}
      {featured.length >= 2 && (
        <div className="grid gap-7 lg:grid-cols-2">
          {featured.slice(0, 2).map((p, i) => (
            <FeaturedHero
              key={p.slug}
              post={p}
              variant="split"
              priority={i === 0}
            />
          ))}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-9 pb-16 lg:grid-cols-[1fr_316px] lg:items-start">
        <FilterableGrid posts={gridPosts} columns={2} />
        <Sidebar tags={tags} />
      </div>
    </div>
  );
}
