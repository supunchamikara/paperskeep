import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import ContactForm from "@/components/ContactForm";
import SocialIcons from "@/components/SocialIcons";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Paperskeep team — story tips, feedback, and partnerships.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-container px-5 py-16 sm:px-8 lg:px-12">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
        <div>
          <span className="inline-block rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">
            Get in touch
          </span>
          <h1 className="mb-4 mt-5 text-balance font-heading text-[38px] font-extrabold leading-[1.12] tracking-[-0.02em] text-text">
            We&apos;d love to hear from you.
          </h1>
          <p className="mb-9 max-w-[52ch] font-body text-[17px] leading-[1.65] text-muted">
            Story tips, feedback on a piece, or a partnership idea — drop us a
            note and a real person will read it.
          </p>
          <ContactForm />
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-card border border-border bg-surface p-6 shadow-token transition-theme">
            <h4 className="mb-3 font-heading text-[13px] font-bold uppercase tracking-[0.05em] text-muted">
              Email
            </h4>
            <a
              href="mailto:hello@paperskeep.blog"
              className="font-body text-[16px] text-accent hover:text-accent-strong"
            >
              hello@paperskeep.blog
            </a>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-token transition-theme">
            <h4 className="mb-3 font-heading text-[13px] font-bold uppercase tracking-[0.05em] text-muted">
              Follow along
            </h4>
            <SocialIcons variant="surface" />
          </div>
          <div className="rounded-card bg-navy p-6 shadow-token transition-theme">
            <h4 className="mb-2 font-heading text-[16px] font-bold text-white">
              Press &amp; partnerships
            </h4>
            <p className="font-body text-[14px] leading-[1.55] text-white/[0.66]">
              For media inquiries, reach the {siteConfig.name} team directly at{" "}
              <a href="mailto:press@paperskeep.blog" className="text-accent">
                press@paperskeep.blog
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
