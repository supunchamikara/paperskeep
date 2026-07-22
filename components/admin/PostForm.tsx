"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { PostRow } from "@/lib/posts";
import type { ActionResult } from "@/app/admin/actions";
import MarkdownToolbar from "./MarkdownToolbar";

const CATEGORIES = ["Technology", "Business", "Lifestyle", "Culture"];

type FormAction = (
  prev: ActionResult,
  formData: FormData
) => Promise<ActionResult>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[6px] bg-navy px-[26px] py-[13px] font-heading text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function PostForm({
  action,
  post,
  submitLabel,
}: {
  action: FormAction;
  post?: PostRow;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, {} as ActionResult);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const field =
    "w-full rounded-[6px] border border-border bg-surface px-3.5 py-2.5 font-body text-[15px] text-text outline-none transition-colors focus:border-accent";
  const label =
    "mb-1.5 block font-heading text-[13px] font-semibold text-text";
  const hint = "mt-1 font-body text-[12.5px] text-muted";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p
          role="alert"
          className="rounded-[6px] border border-red-300 bg-red-50 px-4 py-3 font-heading text-[14px] text-red-600 dark:bg-red-950/40"
        >
          {state.error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={label}>
            Title *
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="slug" className={label}>
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="auto-generated-from-title"
            className={field}
          />
          <p className={hint}>URL: /articles/{slug || "…"}</p>
        </div>

        <div>
          <label htmlFor="category" className={label}>
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={post?.category ?? "Technology"}
            className={field}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="excerpt" className={label}>
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt ?? ""}
            className={field}
          />
          <p className={hint}>
            Shown on cards and as the standout intro on the article page.
          </p>
        </div>

        <div>
          <label htmlFor="coverImage" className={label}>
            Cover image URL
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="url"
            defaultValue={post?.cover_image ?? ""}
            placeholder="https://…"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="author" className={label}>
            Author
          </label>
          <input
            id="author"
            name="author"
            defaultValue={post?.author ?? ""}
            placeholder="Paperskeep"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="date" className={label}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={post?.date ?? new Date().toISOString().slice(0, 10)}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="tags" className={label}>
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={post?.tags?.join(", ") ?? ""}
            placeholder="Edge, Performance, Web Platform"
            className={field}
          />
          <p className={hint}>Comma-separated.</p>
        </div>
      </div>

      <div>
        <label htmlFor="content" className={label}>
          Content (Markdown / MDX)
        </label>
        <MarkdownToolbar textareaRef={contentRef} />
        <textarea
          ref={contentRef}
          id="content"
          name="content"
          rows={20}
          defaultValue={post?.content ?? ""}
          placeholder={
            "Write your article in Markdown.\n\n## A heading\n\n> A pull-quote\n\nUse the ProductCard button above to drop in an affiliate card."
          }
          className={`${field} rounded-t-none font-mono text-[14px] leading-[1.7]`}
        />
        <p className={hint}>
          Supports Markdown + the <code>&lt;ProductCard /&gt;</code> component.
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2.5 font-heading text-[14px] font-medium text-text">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={post?.featured ?? false}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Featured (shows in the hero)
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 font-heading text-[14px] font-medium text-text">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post?.published ?? true}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Published (visible on the site)
        </label>
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-6">
        <SubmitButton label={submitLabel} />
        <Link
          href="/admin"
          className="font-heading text-[14px] font-semibold text-muted hover:text-accent"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
