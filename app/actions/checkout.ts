"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";

export interface CheckoutProduct {
  name: string;
  description?: string;
  image?: string;
  price: number; // major units, e.g. 49 or 49.99
  currency: string; // ISO code, e.g. "usd"
}

/**
 * Creates a Stripe Checkout Session and redirects to it.
 *
 * IMPORTANT: `product` is a bound argument supplied by the server-rendered
 * <BuyCard/>. Next.js encrypts closed-over server-action arguments, so the
 * price the customer pays comes from your MDX content on the server — the
 * browser can't tamper with it.
 */
export async function createCheckout(
  product: CheckoutProduct,
  _formData?: FormData
): Promise<void> {
  const stripe = getStripe();

  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid product price.");
  }
  const unitAmount = Math.round(price * 100); // smallest currency unit

  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency || "usd",
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
            ...(product.description
              ? { description: product.description }
              : {}),
            ...(product.image ? { images: [product.image] } : {}),
          },
        },
      },
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
  });

  if (!session.url) throw new Error("Could not create a checkout session.");

  // redirect() must be called outside try/catch — it works with external URLs.
  redirect(session.url);
}
