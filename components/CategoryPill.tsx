/** Small uppercase category pill used on cards and article headers. */
export default function CategoryPill({
  category,
  className = "",
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-pill bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] px-[10px] py-[5px] font-heading text-[11px] font-semibold uppercase tracking-[0.04em] text-accent ${className}`}
    >
      {category}
    </span>
  );
}
