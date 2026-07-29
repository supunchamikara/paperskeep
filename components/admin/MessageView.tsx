"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Contact message body with a clamped preview and a "View" popup that shows
 * the full text (long messages are unreadable inline).
 */
export default function MessageView({
  name,
  email,
  message,
  date,
}: {
  name: string;
  email: string;
  message: string;
  date: string;
}) {
  const [open, setOpen] = useState(false);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <p className="mt-2 line-clamp-3 whitespace-pre-wrap font-body text-[14.5px] leading-[1.6] text-text">
        {message}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 font-heading text-[13px] font-semibold text-accent transition-colors hover:text-accent-strong"
      >
        View full message
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lightbox-in fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[10vh] backdrop-blur-sm"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Message from ${name}`}
                className="flex max-h-[76vh] w-full max-w-[640px] flex-col overflow-hidden rounded-block border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
                  <div>
                    <p className="font-heading text-[16px] font-bold text-text">
                      {name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                      <a
                        href={`mailto:${email}`}
                        className="font-heading text-[13px] text-accent hover:text-accent-strong"
                      >
                        {email}
                      </a>
                      <span className="font-heading text-[12.5px] text-muted">
                        {date}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close message"
                    className="rounded-[6px] border border-border px-2 py-1 font-heading text-[11px] font-semibold text-muted"
                  >
                    ESC
                  </button>
                </div>

                <div className="overflow-y-auto px-6 py-5">
                  <p className="whitespace-pre-wrap break-words font-body text-[15px] leading-[1.7] text-text">
                    {message}
                  </p>
                </div>

                <div className="border-t border-border px-6 py-3 text-right">
                  <a
                    href={`mailto:${email}`}
                    className="font-heading text-[13px] font-semibold text-accent hover:text-accent-strong"
                  >
                    Reply by email →
                  </a>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
