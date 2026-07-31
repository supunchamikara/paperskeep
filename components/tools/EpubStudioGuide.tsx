import Link from "next/link";
import {
  EPUB_STUDIO_INTRO,
  faqs,
  features,
  markup,
  steps,
} from "./epubStudioContent";

/**
 * The EPUB Studio documentation, rendered at /tools/epub-studio/guide.
 *
 * It lives on its own page rather than under the workspace: the tool is a
 * full-height three-pane app that owns the viewport, and burying the manual
 * below it meant nobody scrolled to it. This is also the page search engines
 * and AI assistants actually read — the tool itself is a client app whose text
 * lives in inputs and is invisible to a crawler.
 */
export default function EpubStudioGuide() {
  return (
    <div className="bg-bg">
      <div className="mx-auto max-w-[880px] px-5 py-16 sm:px-8">
        {/* Visible trail mirroring the BreadcrumbList schema — it gives the
            page an exit upward and reinforces the hierarchy for crawlers. */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 font-heading text-[13px] text-muted">
            <li>
              <Link href="/tools" className="hover:text-accent">
                Tools
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/tools/epub-studio" className="hover:text-accent">
                EPUB Studio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-text">Guide</li>
          </ol>
        </nav>

        {/* Intro */}
        <span className="inline-block rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">
          Free browser tool
        </span>

        <h1 className="mb-5 mt-5 text-balance font-heading text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-text sm:text-[38px]">
          Turn your manuscript into a KDP-ready EPUB
        </h1>

        <p className="mb-8 text-[18px] leading-[1.75] text-muted">
          {EPUB_STUDIO_INTRO}
        </p>

        <Link
          href="/tools/epub-studio"
          className="mb-12 inline-block rounded-[7px] bg-accent px-[18px] py-2.5 font-heading text-[14px] font-semibold text-white shadow-[0_2px_10px_rgba(44,140,135,0.35)] transition-all hover:-translate-y-px hover:bg-accent-strong"
        >
          Open EPUB Studio
        </Link>

        {/* Features */}
        <h2 className="mb-6 font-heading text-[24px] font-bold tracking-[-0.01em] text-text">
          What EPUB Studio does
        </h2>

        <ul className="mb-14 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-card border border-border bg-surface p-5 shadow-token transition-theme"
            >
              <h3 className="mb-1.5 font-heading text-[15.5px] font-bold text-text">
                {feature.title}
              </h3>
              <p className="text-[14.5px] leading-[1.6] text-muted">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>

        {/* How to */}
        <h2 className="mb-6 font-heading text-[24px] font-bold tracking-[-0.01em] text-text">
          How to create an EPUB for Kindle Direct Publishing
        </h2>

        <ol className="mb-14 grid gap-5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] font-heading text-[14px] font-bold text-accent"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="mb-1 font-heading text-[16.5px] font-bold text-text">
                  {step.title}
                </h3>
                <p className="text-[15.5px] leading-[1.65] text-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Markup reference */}
        <h2 className="mb-3 font-heading text-[24px] font-bold tracking-[-0.01em] text-text">
          Formatting reference
        </h2>
        <p className="mb-6 text-[15.5px] leading-[1.65] text-muted">
          Every toolbar button inserts one of these markers. You can also type
          them directly — the preview updates either way.
        </p>

        <div className="mb-14 overflow-x-auto rounded-card border border-border bg-surface shadow-token">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-heading text-[12px] font-bold uppercase tracking-[0.05em] text-muted">
                  Type this
                </th>
                <th className="px-5 py-3 font-heading text-[12px] font-bold uppercase tracking-[0.05em] text-muted">
                  You get
                </th>
              </tr>
            </thead>
            <tbody>
              {markup.map((row) => (
                <tr
                  key={row.syntax}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="whitespace-nowrap px-5 py-3">
                    <code className="rounded-[6px] border border-border bg-pill px-2 py-1 font-mono text-[13px] text-text">
                      {row.syntax}
                    </code>
                  </td>
                  <td className="px-5 py-3 text-[14.5px] leading-[1.55] text-muted">
                    {row.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <h2 className="mb-6 font-heading text-[24px] font-bold tracking-[-0.01em] text-text">
          Frequently asked questions
        </h2>

        <div className="mb-12 grid gap-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-card border border-border bg-surface px-5 py-4 shadow-token transition-theme"
            >
              <summary className="cursor-pointer list-none font-heading text-[16px] font-semibold text-text marker:hidden">
                <span className="flex items-start justify-between gap-4">
                  {faq.q}
                  <span
                    aria-hidden="true"
                    className="mt-1 flex-none text-accent transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        <p className="text-[15px] leading-[1.7] text-muted">
          Looking for something else?{" "}
          <Link
            href="/tools"
            className="text-accent underline underline-offset-[3px] hover:text-accent-strong"
          >
            Browse all Paperskeep tools
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
