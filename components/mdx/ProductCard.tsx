import Image from "next/image";

export interface ProductCardProps {
  title: string;
  image: string;
  /** 0–5, one decimal (e.g. 4.8). */
  rating: number;
  /** Number of reviews/ratings. */
  reviews: number;
  /** Current/original price as a display string, e.g. "$229". */
  price: string;
  /** Optional sale price; when present, `price` is shown struck-through. */
  salePrice?: string;
  description: string;
  /** Amazon (affiliate) product URL. */
  url: string;
}

/** Renders 5 stars with partial fill based on the rating. */
function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2; // nearest half
  return (
    <span
      className="inline-flex items-center gap-[2px]"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rounded - i)); // 0, 0.5 or 1
        return (
          <span key={i} className="relative inline-block h-[15px] w-[15px]">
            <Star className="absolute inset-0 text-border" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="text-[#F5A623]" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
    </svg>
  );
}

/**
 * Reusable Amazon Associate product card for MDX posts.
 * Drop `<ProductCard {...} />` inline anywhere in a post body; add as many
 * as you like. Renders the affiliate link with `rel="nofollow sponsored"`.
 */
export default function ProductCard({
  title,
  image,
  rating,
  reviews,
  price,
  salePrice,
  description,
  url,
}: ProductCardProps) {
  const hasSale = Boolean(salePrice);
  const displayPrice = hasSale ? salePrice! : price;

  return (
    <div className="my-9 overflow-hidden rounded-block border border-border bg-surface shadow-token transition-theme not-prose">
      {/* Header + affiliate disclosure */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-5 py-3">
        <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
          Editor&apos;s Pick
        </span>
        <span className="font-heading text-[11px] text-muted">
          #ad · As an Amazon Associate we earn from qualifying purchases
        </span>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[170px_1fr]">
        {/* Product image */}
        <div className="relative mx-auto h-[170px] w-[170px] overflow-hidden rounded-[8px] border border-border bg-white sm:mx-0">
          <Image
            src={image}
            alt={title}
            fill
            sizes="170px"
            className="object-contain p-2"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h4 className="mb-2 font-heading text-[20px] font-bold leading-[1.3] text-text">
            {title}
          </h4>

          <div className="mb-3 flex items-center gap-[9px]">
            <StarRating rating={rating} />
            <span className="font-heading text-[13px] text-muted">
              {rating.toFixed(1)} · {reviews.toLocaleString()} ratings
            </span>
          </div>

          <p className="mb-auto font-body text-[14.5px] leading-[1.55] text-muted">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[26px] font-extrabold text-text">
                {displayPrice}
              </span>
              {hasSale && (
                <span className="font-heading text-[14px] text-muted line-through">
                  {price}
                </span>
              )}
            </div>

            <a
              href={url}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="inline-flex items-center gap-[9px] rounded-pill border border-[#FCD200] bg-[#FFD814] px-[22px] py-3 font-heading text-[14px] font-semibold text-[#1a1a1a] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(252,210,0,.35)]"
              aria-label={`View ${title} on Amazon (opens in a new tab)`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1.5" />
                <circle cx="18" cy="21" r="1.5" />
                <path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L23 7H6" />
              </svg>
              View on Amazon
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
