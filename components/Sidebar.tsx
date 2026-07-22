import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

/** Sticky right-hand sidebar: tag cloud + newsletter widget. */
export default function Sidebar({ tags }: { tags: string[] }) {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
      {/* Tag cloud */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-token transition-theme">
        <h4 className="mb-4 font-heading text-[13px] font-bold uppercase tracking-[0.05em] text-muted">
          Search by Category
        </h4>
        <div className="flex flex-wrap gap-[9px]">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/articles?tag=${encodeURIComponent(tag)}`}
              className="rounded-pill border border-border bg-pill px-[13px] py-[7px] font-heading text-[13px] font-medium text-text transition-theme hover:border-accent hover:bg-accent hover:text-white"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterForm variant="widget" />
    </aside>
  );
}
