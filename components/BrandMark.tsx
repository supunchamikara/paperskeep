/**
 * Paperskeep brand mark — a stacked "papers" glyph in the accent tile.
 * Uses var(--accent) so it adapts to light/dark. For the static favicon see
 * app/icon.svg (same artwork with fixed colors).
 */
export default function BrandMark({
  size = 30,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      {/* back sheet (the "stack") */}
      <rect
        x="8"
        y="10"
        width="12"
        height="14.5"
        rx="2"
        fill="#ffffff"
        opacity="0.4"
      />
      {/* front sheet with a folded corner */}
      <path
        d="M11 8.25h6.19a1.5 1.5 0 0 1 1.06.44l2.81 2.81a1.5 1.5 0 0 1 .44 1.06V22.5A1.75 1.75 0 0 1 19.75 24.25h-8.75A1.75 1.75 0 0 1 9.25 22.5V10A1.75 1.75 0 0 1 11 8.25Z"
        fill="#ffffff"
      />
      <path
        d="M17.75 8.6v2.65c0 .6.49 1.1 1.1 1.1h2.65"
        stroke="#bfe0dc"
        strokeWidth="1.1"
        fill="none"
      />
      {/* text lines */}
      <rect x="11.75" y="15" width="6.5" height="1.5" rx="0.75" fill="var(--accent)" />
      <rect x="11.75" y="18" width="4.5" height="1.5" rx="0.75" fill="var(--accent)" />
    </svg>
  );
}
