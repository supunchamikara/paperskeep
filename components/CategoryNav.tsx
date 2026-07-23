import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { slugifyTerm } from "@/lib/slug";

/**
 * Row of category pills linking to each category page, with the current one
 * highlighted. `active` is the category name (undefined = "All" active).
 */
export default function CategoryNav({ active }: { active?: string }) {
  const base =
    "rounded-pill border px-4 py-2 font-heading text-[13px] font-semibold transition-theme";
  const activeCls = "border-accent bg-accent text-white";
  const idleCls =
    "border-border bg-surface text-muted hover:border-accent hover:text-accent";

  return (
    <nav
      aria-label="Browse categories"
      className="flex flex-wrap gap-2.5"
    >
      <Link
        href="/articles"
        className={`${base} ${active ? idleCls : activeCls}`}
      >
        All
      </Link>
      {siteConfig.categories.map((category) => {
        const isActive = category === active;
        return (
          <Link
            key={category}
            href={`/category/${slugifyTerm(category)}`}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${isActive ? activeCls : idleCls}`}
          >
            {category}
          </Link>
        );
      })}
    </nav>
  );
}
