import Image from "next/image";
import { createCheckout } from "@/app/actions/checkout";
import { isStripeConfigured } from "@/lib/stripe";

export interface BuyCardProps {
  /** Product name. */
  name: string;
  description: string;
  /** Price in major units, e.g. 49 or 49.99. */
  price: number | string;
  image: string;
  /** ISO currency code (default "usd"). */
  currency?: string;
  /** Small header label (default "Available now"). */
  badge?: string;
}

/**
 * A ProductCard for YOUR OWN products, checked out via Stripe. Drop it inline
 * in any MDX post. The Buy button submits to a server action that creates a
 * Stripe Checkout Session with the price baked in server-side, so the amount
 * can't be tampered with from the browser.
 */
export default function BuyCard({
  name,
  description,
  price,
  image,
  currency = "usd",
  badge = "Available now",
}: BuyCardProps) {
  const numericPrice = Number(price);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);

  // Bind product details server-side (Next encrypts these; client can't edit).
  const checkout = createCheckout.bind(null, {
    name,
    description,
    image,
    price: numericPrice,
    currency,
  });

  const configured = isStripeConfigured();

  return (
    <div className="my-9 overflow-hidden rounded-block border border-border bg-surface shadow-token transition-theme not-prose">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-5 py-3">
        <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
          {badge}
        </span>
        <span className="inline-flex items-center gap-1.5 font-heading text-[11px] text-muted">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secure checkout · Powered by Stripe
        </span>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[170px_1fr]">
        {/* Product image */}
        <div className="relative mx-auto h-[170px] w-[170px] overflow-hidden rounded-[8px] border border-border bg-white sm:mx-0">
          <Image
            src={image}
            alt={name}
            fill
            sizes="170px"
            className="object-contain p-2"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h4 className="mb-2 font-heading text-[20px] font-bold leading-[1.3] text-text">
            {name}
          </h4>

          <p className="mb-auto font-body text-[14.5px] leading-[1.55] text-muted">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <span className="font-heading text-[26px] font-extrabold text-text">
              {formattedPrice}
            </span>

            <form action={checkout}>
              <button
                type="submit"
                disabled={!configured}
                title={
                  configured
                    ? undefined
                    : "Set STRIPE_SECRET_KEY in .env.local to enable checkout"
                }
                className="inline-flex items-center gap-2 rounded-[8px] bg-accent px-[22px] py-3 font-heading text-[14px] font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                aria-label={`Buy ${name} for ${formattedPrice}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1.5" />
                  <circle cx="18" cy="21" r="1.5" />
                  <path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L23 7H6" />
                </svg>
                Buy now · {formattedPrice}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
