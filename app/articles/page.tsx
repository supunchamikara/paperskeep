import type { Metadata } from "next";
import { getAllPosts, getPopularTags } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import FilterableGrid from "@/components/FilterableGrid";
import Sidebar from "@/components/Sidebar";
import JsonLd from "@/components/JsonLd";

const ARTICLES_DESCRIPTION =
  "Every article on Paperskeep — long-form writing on technology, business and culture, style and beauty, health, food, travel and living well.";

export const metadata: Metadata = {
  title: "Articles",
  description: ARTICLES_DESCRIPTION,
  alternates: { canonical: "/articles" },
  // Without these the index inherits the homepage's card, so a shared link
  // to /articles previewed as the site's front page.
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/articles`,
    title: `Articles · ${siteConfig.name}`,
    description: ARTICLES_DESCRIPTION,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: `Articles · ${siteConfig.name}`,
    description: ARTICLES_DESCRIPTION,
    site: siteConfig.twitterHandle,
  },
  robots: { index: true, follow: true },
};

export const revalidate = 60;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string };
}) {
  const [posts, tags] = await Promise.all([getAllPosts(), getPopularTags(18)]);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteConfig.name} Articles`,
    url: `${siteConfig.url}/articles`,
    description: ARTICLES_DESCRIPTION,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.excerpt,
      url: `${siteConfig.url}/articles/${p.slug}`,
      datePublished: new Date(p.date).toISOString(),
      articleSection: p.category,
    })),
  };

  return (
    <div className="mx-auto max-w-container px-5 pt-11 sm:px-8 lg:px-12">
      <JsonLd data={blogJsonLd} />
      <header className="mb-8">
        <h1 className="font-heading text-[34px] font-extrabold tracking-[-0.02em] text-text">
          Papers &amp; Pieces
        </h1>
        <p className="mt-2 font-body text-[17px] text-muted">
          {posts.length} pieces on technology, business, culture, style and
          living well.
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
