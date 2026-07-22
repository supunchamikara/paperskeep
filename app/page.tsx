import {
  getAllPosts,
  getFeaturedPost,
  getAllTags,
} from "@/lib/posts";
import FeaturedHero from "@/components/FeaturedHero";
import FilterableGrid from "@/components/FilterableGrid";
import Sidebar from "@/components/Sidebar";

// Revalidate periodically; admin mutations also revalidate these paths.
export const revalidate = 60;

export default async function HomePage() {
  const [featured, allPosts, tags] = await Promise.all([
    getFeaturedPost(),
    getAllPosts(),
    getAllTags(),
  ]);
  // Keep the featured post out of the grid to avoid duplication.
  const gridPosts = allPosts.filter((p) => p.slug !== featured?.slug);

  return (
    <div className="mx-auto max-w-container px-5 pt-11 sm:px-8 lg:px-12">
      {featured && <FeaturedHero post={featured} />}

      <div className="mt-10 grid grid-cols-1 gap-9 pb-16 lg:grid-cols-[1fr_316px] lg:items-start">
        <FilterableGrid posts={gridPosts} columns={2} />
        <Sidebar tags={tags} />
      </div>
    </div>
  );
}
