import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByCategory } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { slugifyTerm } from "@/lib/slug";
import PostGrid from "@/components/PostGrid";
import JsonLd from "@/components/JsonLd";

export const revalidate = 60;

export function generateStaticParams() {
  return siteConfig.categories.map((c) => ({ slug: slugifyTerm(c) }));
}

function resolveCategory(slug: string): string | undefined {
  return siteConfig.categories.find((c) => slugifyTerm(c) === slug);
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const category = resolveCategory(params.slug);
  if (!category) return { title: "Not found" };
  const title = `${category} Articles`;
  const description = `Read the latest ${category} articles on ${siteConfig.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${params.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteConfig.url}/category/${params.slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = resolveCategory(params.slug);
  if (!category) notFound();

  const posts = await getPostsByCategory(category);
  const url = `${siteConfig.url}/category/${params.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category} Articles`,
    url,
    isPartOf: { "@id": `${siteConfig.url}/#organization` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Articles",
          item: `${siteConfig.url}/articles`,
        },
        { "@type": "ListItem", position: 3, name: category, item: url },
      ],
    },
  };

  return (
    <div className="mx-auto max-w-container px-5 py-12 sm:px-8 lg:px-12">
      <JsonLd data={jsonLd} />

      <nav className="mb-4 font-heading text-[13px] text-muted">
        <Link href="/articles" className="hover:text-accent">
          Articles
        </Link>{" "}
        <span className="px-1">/</span>{" "}
        <span className="text-text">{category}</span>
      </nav>

      <header className="mb-8">
        <span className="inline-block rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">
          Category
        </span>
        <h1 className="mt-4 font-heading text-[36px] font-extrabold tracking-[-0.02em] text-text">
          {category}
        </h1>
        <p className="mt-2 font-body text-[16px] text-muted">
          {posts.length} article{posts.length === 1 ? "" : "s"}
        </p>
      </header>

      <PostGrid posts={posts} />
    </div>
  );
}
