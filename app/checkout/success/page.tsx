import type { Metadata } from "next";
import Link from "next/link";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function getOrder(sessionId?: string) {
  if (!sessionId || !isStripeConfigured()) return null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return {
      paid: session.payment_status === "paid",
      email: session.customer_details?.email ?? null,
      amount: session.amount_total,
      currency: session.currency ?? "usd",
    };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const order = await getOrder(searchParams.session_id);
  const amount =
    order?.amount != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: (order.currency ?? "usd").toUpperCase(),
        }).format(order.amount / 100)
      : null;

  return (
    <div className="mx-auto flex max-w-prose flex-col items-center px-5 py-24 text-center sm:px-8">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>

      <h1 className="mb-3 mt-6 font-heading text-[32px] font-extrabold tracking-[-0.02em] text-text">
        Thank you for your order!
      </h1>
      <p className="mb-8 max-w-[46ch] font-body text-[17px] leading-[1.6] text-muted">
        {order?.paid
          ? `Your payment${amount ? ` of ${amount}` : ""} was successful${
              order.email ? `. A receipt is on its way to ${order.email}` : ""
            }.`
          : "Your order is being processed. You'll receive a confirmation email shortly."}
      </p>

      <Link
        href="/"
        className="rounded-[6px] bg-navy px-[26px] py-[13px] font-heading text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Back to Home
      </Link>
    </div>
  );
}
