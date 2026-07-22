import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-prose flex-col items-center px-5 py-28 text-center sm:px-8">
      <span className="font-heading text-[80px] font-extrabold leading-none text-accent">
        404
      </span>
      <h1 className="mb-3 mt-4 font-heading text-[28px] font-bold text-text">
        This page wandered off.
      </h1>
      <p className="mb-8 font-body text-[17px] text-muted">
        The article you&apos;re looking for may have moved or never existed.
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
