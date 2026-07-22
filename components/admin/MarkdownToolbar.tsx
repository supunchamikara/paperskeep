"use client";

import type { RefObject } from "react";

/**
 * Formatting toolbar for the post-body <textarea>. Each button inserts or
 * wraps Markdown/MDX at the current cursor position using the native
 * `setRangeText`, so it works with the uncontrolled textarea and preserves
 * the form value. The standout button drops in a full <ProductCard /> block.
 */

const PRODUCT_CARD_SNIPPET = `<ProductCard
  title="Product name"
  image="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&q=80"
  rating={4.8}
  reviews={2417}
  price="$229"
  salePrice="$199"
  description="Why you'd recommend it — one or two honest sentences."
  url="https://www.amazon.com/dp/XXXXXXX?tag=your-associate-id"
/>`;

const BUY_CARD_SNIPPET = `<BuyCard
  name="Your product name"
  description="What the buyer gets, in a sentence or two."
  price={49}
  currency="usd"
  image="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&q=80"
/>`;

export default function MarkdownToolbar({
  textareaRef,
}: {
  textareaRef: RefObject<HTMLTextAreaElement>;
}) {
  /** Wrap the current selection (or a placeholder) with before/after tokens. */
  function surround(before: string, after: string, placeholder: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const hasSelection = e > s;
    const inner = hasSelection ? value.slice(s, e) : placeholder;
    const insert = before + inner + after;

    ta.focus();
    ta.setRangeText(insert, s, e, "end");
    // Select the inner text so the user can immediately type over it.
    const selStart = s + before.length;
    ta.setSelectionRange(selStart, selStart + inner.length);
  }

  /** Add a prefix (e.g. "## ", "> ", "- ") to the start of the current line. */
  function linePrefix(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, value } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;

    ta.focus();
    ta.setRangeText(prefix, lineStart, lineStart, "end");
    const caret = s + prefix.length;
    ta.setSelectionRange(caret, caret);
  }

  /** Insert a standalone block, padded with blank lines so it renders alone. */
  function insertBlock(block: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const before = value.slice(0, s);
    const after = value.slice(e);

    const pad = (edge: string, side: "b" | "a") => {
      if (edge.length === 0) return "";
      if (side === "b") return edge.endsWith("\n\n") ? "" : edge.endsWith("\n") ? "\n" : "\n\n";
      return edge.startsWith("\n\n") ? "" : edge.startsWith("\n") ? "\n" : "\n\n";
    };

    const prefix = pad(before, "b");
    const suffix = pad(after, "a");
    const insert = prefix + block + suffix;

    ta.focus();
    ta.setRangeText(insert, s, e, "end");
    const caret = s + prefix.length + block.length;
    ta.setSelectionRange(caret, caret);
  }

  const btn =
    "rounded-[6px] border border-border bg-surface px-2.5 py-1.5 font-heading text-[12.5px] font-semibold text-text transition-theme hover:border-accent hover:text-accent";

  const actions: {
    label: string;
    title: string;
    onClick: () => void;
  }[] = [
    { label: "H2", title: "Heading 2", onClick: () => linePrefix("## ") },
    { label: "H3", title: "Heading 3", onClick: () => linePrefix("### ") },
    { label: "B", title: "Bold", onClick: () => surround("**", "**", "bold text") },
    { label: "i", title: "Italic", onClick: () => surround("*", "*", "italic text") },
    { label: "❝ Quote", title: "Pull-quote", onClick: () => linePrefix("> ") },
    { label: "• List", title: "Bullet list", onClick: () => linePrefix("- ") },
    { label: "Link", title: "Link", onClick: () => surround("[", "](https://)", "link text") },
    { label: "Image", title: "Image", onClick: () => surround("![", "](https://)", "alt text") },
    { label: "Code", title: "Inline code", onClick: () => surround("`", "`", "code") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-t-[6px] border border-b-0 border-border bg-pill px-2 py-2">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          title={a.title}
          aria-label={a.title}
          onClick={a.onClick}
          className={a.label === "B" ? `${btn} font-extrabold` : a.label === "i" ? `${btn} italic` : btn}
        >
          {a.label}
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      {/* Standout: insert a full Amazon affiliate product card */}
      <button
        type="button"
        title="Insert an Amazon affiliate ProductCard"
        aria-label="Insert Amazon ProductCard"
        onClick={() => insertBlock(PRODUCT_CARD_SNIPPET)}
        className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#FCD200] bg-[#FFD814] px-3 py-1.5 font-heading text-[12.5px] font-bold text-[#1a1a1a] transition-transform hover:-translate-y-px"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="21" r="1.5" />
          <circle cx="18" cy="21" r="1.5" />
          <path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L23 7H6" />
        </svg>
        Amazon
      </button>

      {/* Insert your own Stripe-paid product card */}
      <button
        type="button"
        title="Insert your own product (Stripe checkout)"
        aria-label="Insert BuyCard"
        onClick={() => insertBlock(BUY_CARD_SNIPPET)}
        className="inline-flex items-center gap-1.5 rounded-[6px] border border-accent bg-accent px-3 py-1.5 font-heading text-[12.5px] font-bold text-white transition-transform hover:-translate-y-px"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        Sell product
      </button>
    </div>
  );
}
