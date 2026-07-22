import Link from "next/link";
import Logo from "./Logo";
import SocialIcons from "./SocialIcons";

export default function Footer() {
  return (
    <footer className="bg-navy text-white transition-theme">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-6 px-5 py-[34px] sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="font-heading text-[14px] text-white/70">
            © {new Date().getFullYear()} Paperskeep. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="font-heading text-[14px] text-white/70 transition-colors hover:text-white"
          >
            Privacy Policy
          </Link>
          <SocialIcons variant="navy" />
        </div>
      </div>
    </footer>
  );
}
