import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { slugifyTerm } from "@/lib/slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/articles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const posts = await getAllPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/articles/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dedicated category pages.
  const categoryRoutes: MetadataRoute.Sitemap = siteConfig.categories.map(
    (category) => ({
      url: `${base}/category/${slugifyTerm(category)}`,
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  // Dedicated tag pages.
  const tags = await getAllTags();
  const tagRoutes: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${base}/tag/${slugifyTerm(tag)}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
