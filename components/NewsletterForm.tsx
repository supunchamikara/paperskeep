"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Newsletter sign-up. Posts to /api/subscribe. Two visual variants:
 * "widget" (sidebar navy card) and "banner" (full-width navy CTA).
 */
export default function NewsletterForm({
  variant = "widget",
}: {
  variant?: "widget" | "banner";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("success");
      setMessage(data.message ?? "You're subscribed!");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const inputBase =
    "w-full rounded-[6px] border font-heading text-[14px] outline-none transition-colors";

  if (variant === "banner") {
    return (
      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label htmlFor="nl-banner" className="sr-only">
          Email address
        </label>
        <input
          id="nl-banner"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={`${inputBase} border-white/20 bg-white/10 px-3.5 py-3 text-white placeholder:text-white/50 focus:border-accent sm:flex-1`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="whitespace-nowrap rounded-[6px] bg-accent px-[26px] py-[13px] font-heading text-[15px] font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
        {message && (
          <p
            role="status"
            className={`font-heading text-[13px] sm:ml-2 ${
              status === "error" ? "text-red-300" : "text-white/80"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    );
  }

  // widget
  return (
    <div className="rounded-card bg-navy p-6 shadow-token transition-theme">
      <h4 className="mb-2 font-heading text-[18px] font-bold text-white">
        Stay in the loop
      </h4>
      <p className="mb-[18px] font-body text-[14px] leading-[1.55] text-white/[0.66]">
        A thoughtful digest, every other Friday. No spam.
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="nl-widget" className="sr-only">
          Email address
        </label>
        <input
          id="nl-widget"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={`${inputBase} mb-2.5 border-white/[0.16] bg-white/[0.06] px-3.5 py-[11px] text-white placeholder:text-white/50 focus:border-accent`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-[6px] bg-accent px-3 py-3 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p
          role="status"
          className={`mt-2.5 font-heading text-[13px] ${
            status === "error" ? "text-red-300" : "text-white/80"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
