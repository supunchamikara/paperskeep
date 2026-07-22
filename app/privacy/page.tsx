import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Paperskeep handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-prose px-5 py-16 sm:px-8">
      <h1 className="mb-6 font-heading text-[38px] font-extrabold tracking-[-0.02em] text-text">
        Privacy Policy
      </h1>
      <div className="prose-paperskeep">
        <p>
          <em>Last updated: {new Date().getFullYear()}.</em> This is a sample
          policy for the Paperskeep demo and is not legal advice.
        </p>
        <h2>What we collect</h2>
        <p>
          If you subscribe to our newsletter we store the email address you
          provide, solely to send you the digest. You can unsubscribe at any
          time using the link in any email.
        </p>
        <h2>Affiliate links</h2>
        <p>
          Paperskeep participates in the Amazon Associates program. Some article
          links are affiliate links; purchases made through them may earn us a
          commission at no additional cost to you. These links are always
          clearly disclosed.
        </p>
        <h2>Analytics &amp; cookies</h2>
        <p>
          This demo does not set tracking cookies. Your theme preference is
          stored locally in your browser and never leaves your device.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href="mailto:hello@paperskeep.blog">hello@paperskeep.blog</a>.
        </p>
      </div>
    </div>
  );
}
