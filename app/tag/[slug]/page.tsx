import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { slugifyTerm } from "@/lib/slug";
import PostGrid from "@/components/PostGrid";
import JsonLd from "@/components/JsonLd";

export const revalidate = 60;

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((t) => ({ slug: slugifyTerm(t) }));
}

async function resolveTag(slug: string): Promise<string | undefined> {
  const tags = await getAllTags();
  return tags.find((t) => slugifyTerm(t) === slug);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tag = await resolveTag(params.slug);
  if (!tag) return { title: "Not found" };
  const title = `#${tag} — Articles`;
  const description = `Articles tagged "${tag}" on ${siteConfig.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/tag/${params.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteConfig.url}/tag/${params.slug}`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: { slug: string };
}) {
  const tag = await resolveTag(params.slug);
  if (!tag) notFound();

  const posts = await getPostsByTag(tag);
  const url = `${siteConfig.url}/tag/${params.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Articles tagged ${tag}`,
    url,
    isPartOf: { "@id": `${siteConfig.url}/#organization` },
  };

  return (
    <div className="mx-auto max-w-container px-5 py-12 sm:px-8 lg:px-12">
      <JsonLd data={jsonLd} />

      <nav className="mb-4 font-heading text-[13px] text-muted">
        <Link href="/articles" className="hover:text-accent">
          Articles
        </Link>{" "}
        <span className="px-1">/</span> <span className="text-text">#{tag}</span>
      </nav>

      <header className="mb-8">
        <span className="inline-block rounded-pill bg-pill px-3 py-1.5 font-heading text-[12px] font-semibold text-muted">
          Tag
        </span>
        <h1 className="mt-4 font-heading text-[36px] font-extrabold tracking-[-0.02em] text-text">
          #{tag}
        </h1>
        <p className="mt-2 font-body text-[16px] text-muted">
          {posts.length} article{posts.length === 1 ? "" : "s"}
        </p>
      </header>

      <PostGrid posts={posts} />
    </div>
  );
}
