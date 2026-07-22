import { siteConfig } from "@/lib/site";

/**
 * Minimalist circular social buttons. `variant` controls the border/color
 * palette so the same component works on light surfaces and the navy footer.
 */
export default function SocialIcons({
  variant = "navy",
}: {
  variant?: "navy" | "surface";
}) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-full border font-heading text-[12px] font-semibold transition-theme hover:bg-accent hover:border-accent hover:text-white";
  const palette =
    variant === "navy"
      ? "border-white/20 text-white/80"
      : "border-border text-muted";

  return (
    <div className="flex gap-2.5">
      {siteConfig.social.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className={`${base} ${palette}`}
        >
          {s.short}
        </a>
      ))}
    </div>
  );
}
