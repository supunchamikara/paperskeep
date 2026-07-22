import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
} from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { extractToc } from "@/lib/toc";
import MDXContent from "@/components/mdx/MDXContent";
import CategoryPill from "@/components/CategoryPill";
import CoverImage from "@/components/CoverImage";
import BrandMark from "@/components/BrandMark";
import ShareButtons from "@/components/ShareButtons";
import PostCard from "@/components/PostCard";
import NewsletterForm from "@/components/NewsletterForm";
import TableOfContents from "@/components/article/TableOfContents";

// Re-check the DB periodically; admin edits revalidate these paths directly.
export const revalidate = 60;

// Pre-render every published post at build time; allow new ones on-demand.
export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Not found" };

  const url = `${siteConfig.url}/articles/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author ?? siteConfig.author.name],
      tags: post.tags,
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, 3);
  // Articles are credited to the publication itself.
  const byline = siteConfig.name;
  const toc = extractToc(post.content);

  // Article structured data for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.date,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    mainEntityOfPage: `${siteConfig.url}/articles/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-[1500px] px-5 pt-7 sm:px-8 lg:px-12">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 py-1.5 font-heading text-[14px] font-semibold text-muted transition-colors hover:text-accent"
        >
          ← Back to Articles
        </Link>
      </div>

      {/* Two-column, full-width article: reading column + sticky sidebar */}
      <div className="mx-auto w-full max-w-[1500px] px-5 pt-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          <article className="min-w-0">
            {/* Header + text share a readable measure */}
            <div className="max-w-[820px]">
              <CategoryPill
                category={post.category}
                className="!text-[12px] !px-[13px] !py-1.5"
              />

              <h1 className="mb-5 mt-[22px] text-balance font-heading text-[32px] font-extrabold leading-[1.12] tracking-[-0.02em] text-text sm:text-[44px]">
                {post.title}
              </h1>

              <p className="mb-[30px] font-body text-[20px] italic leading-[1.6] text-muted">
                {post.excerpt}
              </p>

              {/* Byline row */}
              <div className="mb-9 flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
                <div className="flex items-center gap-3.5">
                  <BrandMark size={46} className="flex-shrink-0 drop-shadow-sm" />
                  <div>
                    <div className="font-heading text-[15px] font-bold text-text">
                      {byline}
                    </div>
                    <div className="font-heading text-[13px] text-muted">
                      {post.formattedDate} · {post.readingTime}
                    </div>
                  </div>
                </div>
                <ShareButtons title={post.title} slug={post.slug} />
              </div>
            </div>

            {/* Hero image spans the reading column */}
            <CoverImage
              src={post.coverImage}
              alt={post.title}
              priority
              sizes="(max-width: 1024px) 100vw, 820px"
              className="mb-10 h-[300px] max-w-[820px] rounded-block sm:h-[460px]"
            />

            {/* Long-form MDX body */}
            <div className="max-w-[820px]">
              <MDXContent source={post.content} />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-[9px] border-t border-border py-7">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/articles?tag=${encodeURIComponent(tag)}`}
                      className="rounded-pill border border-border bg-pill px-[13px] py-[7px] font-heading text-[13px] font-medium text-text transition-theme hover:border-accent hover:bg-accent hover:text-white"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Subscribe CTA */}
              <div className="mb-[60px] mt-5 rounded-block bg-navy p-8 transition-theme">
                <div className="mb-4">
                  <h3 className="mb-1.5 font-heading text-[22px] font-bold text-white">
                    Enjoyed this piece?
                  </h3>
                  <p className="font-body text-[15px] text-white/[0.66]">
                    Get the next one in your inbox, every other Friday.
                  </p>
                </div>
                <NewsletterForm variant="banner" />
              </div>
            </div>
          </article>

          {/* Sticky sidebar (second part) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[96px] flex flex-col gap-6">
              <TableOfContents items={toc} />
              <NewsletterForm variant="widget" />
            </div>
          </aside>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mx-auto w-full max-w-[1500px] px-5 pb-[72px] pt-4 sm:px-8 lg:px-12">
          <h3 className="mb-6 font-heading text-[22px] font-bold text-text">
            More from Paperskeep
          </h3>
          {/* Auto-fill: add columns as width grows, keep card width fixed. */}
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            }}
          >
            {related.map((p) => (
              <PostCard key={p.slug} post={p} compact />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
