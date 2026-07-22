import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout canceled",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto flex max-w-prose flex-col items-center px-5 py-24 text-center sm:px-8">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-border text-muted">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>

      <h1 className="mb-3 mt-6 font-heading text-[32px] font-extrabold tracking-[-0.02em] text-text">
        Checkout canceled
      </h1>
      <p className="mb-8 max-w-[46ch] font-body text-[17px] leading-[1.6] text-muted">
        No charge was made. You can pick up where you left off whenever
        you&apos;re ready.
      </p>

      <Link
        href="/articles"
        className="rounded-[6px] bg-navy px-[26px] py-[13px] font-heading text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Back to Articles
      </Link>
    </div>
  );
}
