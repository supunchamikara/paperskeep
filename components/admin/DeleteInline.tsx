"use client";

import { useTransition } from "react";

/**
 * Small inline delete control for admin rows. Confirms, then runs the given
 * server action inside a transition.
 */
export default function DeleteInline({
  action,
  confirmText,
  label = "Delete",
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmText)) startTransition(() => action());
      }}
      className="font-heading text-[13px] font-semibold text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}
