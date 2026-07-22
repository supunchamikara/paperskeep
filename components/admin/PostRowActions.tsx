"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deletePost, togglePublish } from "@/app/admin/actions";

export default function PostRowActions({
  id,
  slug,
  title,
  published,
}: {
  id: string;
  slug: string;
  title: string;
  published: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href={`/articles/${slug}`}
        target="_blank"
        className="font-heading text-[13px] font-semibold text-muted hover:text-accent"
      >
        View
      </Link>
      <Link
        href={`/admin/${id}/edit`}
        className="font-heading text-[13px] font-semibold text-accent hover:text-accent-strong"
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => togglePublish(id, !published))
        }
        className="font-heading text-[13px] font-semibold text-muted hover:text-accent disabled:opacity-50"
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete “${title}”? This cannot be undone.`)) {
            startTransition(() => deletePost(id));
          }
        }}
        className="font-heading text-[13px] font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
