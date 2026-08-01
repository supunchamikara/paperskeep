import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByCategory } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { slugifyTerm } from "@/lib/slug";
import PostGrid from "@/components/PostGrid";
import CategoryNav from "@/components/CategoryNav";
import JsonLd from "@/components/JsonLd";

export const revalidate = 60;

export function generateStaticParams() {
  return siteConfig.categories.map((c) => ({ slug: slugifyTerm(c) }));
}

function resolveCategory(slug: string): string | undefined {
  return siteConfig.categories.find((c) => slugifyTerm(c) === slug);
}

/** Cuts at a word boundary so a snippet never ends mid-headline. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const boundary = cut.lastIndexOf(" ");
  return `${(boundary > max * 0.6 ? cut.slice(0, boundary) : cut).replace(/[;,\s]+$/, "")}…`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = resolveCategory(params.slug);
  if (!category) return { title: "Not found" };

  // A category the desk has not published into yet is a thin page. Keep it
  // reachable and crawlable, but out of the index until it earns a place.
  const posts = await getPostsByCategory(category);

  const title = `${category} Articles`;
  // Lead with the newest headlines: a description made of real article titles
  // earns the click that "Read the latest X articles" never did. Trimmed to
  // the ~160 characters a result actually shows.
  const description = posts.length
    ? truncate(
        `${posts.length} ${category.toLowerCase()} article${
          posts.length === 1 ? "" : "s"
        } on ${siteConfig.name}, newest first: ${posts
          .slice(0, 3)
          .map((post) => post.title)
          .join("; ")}.`,
        158
      )
    : `${category} writing on ${siteConfig.name}. This desk is just opening — the first pieces are on their way.`;

  return {
    title,
    description,
    robots: posts.length ? undefined : { index: false, follow: true },
    alternates: { canonical: `/category/${params.slug}` },
    openGraph: {
      type: "website",
      title: `${title} · ${siteConfig.name}`,
      description,
      url: `${siteConfig.url}/category/${params.slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${siteConfig.name}`,
      description,
      site: siteConfig.twitterHandle,
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
    // The articles themselves, so the page is a described collection rather
    // than a bare heading as far as a crawler is concerned.
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 25).map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteConfig.url}/articles/${post.slug}`,
        name: post.title,
      })),
    },
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

      {/* Browse other categories */}
      <div className="mb-9">
        <CategoryNav active={category} />
      </div>

      <PostGrid posts={posts} />
    </div>
  );
}
