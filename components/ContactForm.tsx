"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

/** Simple contact form. Posts to /api/subscribe as a lightweight stub. */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, message: data.message, name: data.name }),
      });
      if (!res.ok) throw new Error("Something went wrong");
      setStatus("success");
      setMessage("Thanks — we'll be in touch soon.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  const field =
    "w-full rounded-[6px] border border-border bg-surface px-3.5 py-3 font-body text-[15px] text-text outline-none transition-colors focus:border-accent";
  const label = "mb-1.5 block font-heading text-[13px] font-semibold text-text";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className={label}>
          Name
        </label>
        <input id="name" name="name" required className={field} />
      </div>
      <div>
        <label htmlFor="email" className={label}>
          Email
        </label>
        <input id="email" name="email" type="email" required className={field} />
      </div>
      <div>
        <label htmlFor="message" className={label}>
          Message
        </label>
        <textarea id="message" name="message" required rows={5} className={field} />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="self-start rounded-[6px] bg-navy px-[26px] py-[13px] font-heading text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
      {message && (
        <p
          role="status"
          className={`font-heading text-[14px] ${
            status === "error" ? "text-red-500" : "text-accent"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
