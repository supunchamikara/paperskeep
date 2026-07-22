import Link from "next/link";
import BrandMark from "./BrandMark";

export default function Logo({
  size = "md",
  onNavy = true,
}: {
  size?: "sm" | "md";
  onNavy?: boolean;
}) {
  const px = size === "sm" ? 26 : 30;
  const label = size === "sm" ? "text-[16px]" : "text-[19px]";
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5"
      aria-label="Paperskeep home"
    >
      <BrandMark
        size={px}
        className="drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
      />
      {size === "md" && (
        <span
          className={`font-heading font-bold tracking-[-0.015em] ${label} ${
            onNavy ? "text-white" : "text-text"
          }`}
        >
          Paper<span className="text-accent">skeep</span>
        </span>
      )}
    </Link>
  );
}
