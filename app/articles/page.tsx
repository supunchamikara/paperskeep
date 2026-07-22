import type { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import FilterableGrid from "@/components/FilterableGrid";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Browse every article on Paperskeep — filter by Technology, Business, Lifestyle, and Culture.",
};

export const revalidate = 60;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string };
}) {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);

  return (
    <div className="mx-auto max-w-container px-5 pt-11 sm:px-8 lg:px-12">
      <header className="mb-8">
        <h1 className="font-heading text-[34px] font-extrabold tracking-[-0.02em] text-text">
          All Articles
        </h1>
        <p className="mt-2 font-body text-[17px] text-muted">
          {posts.length} pieces on technology, business, lifestyle, and culture.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-9 pb-16 lg:grid-cols-[1fr_316px] lg:items-start">
        <FilterableGrid
          posts={posts}
          initialCategory={searchParams.category ?? "All"}
          initialTag={searchParams.tag}
          columns={2}
        />
        <Sidebar tags={tags} />
      </div>
    </div>
  );
}
