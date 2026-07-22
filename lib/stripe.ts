import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Lazily create the Stripe client so a missing key doesn't break the build —
 * it only throws when checkout is actually attempted. Server-only.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local to enable checkout."
    );
  }
  if (!client) client = new Stripe(key);
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
