import Link from "next/link";

export default function Logo({
  size = "md",
  onNavy = true,
}: {
  size?: "sm" | "md";
  onNavy?: boolean;
}) {
  const box = size === "sm" ? "h-[26px] w-[26px] text-[14px] rounded-[6px]" : "h-[30px] w-[30px] text-[16px] rounded-[6px]";
  const label = size === "sm" ? "text-[16px]" : "text-[19px]";
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Paperskeep home">
      <span
        className={`flex items-center justify-center bg-accent font-heading font-extrabold text-white ${box}`}
      >
        P
      </span>
      {size === "md" && (
        <span
          className={`font-heading font-bold tracking-[-0.01em] ${label} ${
            onNavy ? "text-white" : "text-text"
          }`}
        >
          Paperskeep
        </span>
      )}
    </Link>
  );
}
