import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[420px] flex-col justify-center px-5 py-16 sm:px-8">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-accent font-heading text-[20px] font-extrabold text-white">
          P
        </div>
        <h1 className="font-heading text-[26px] font-extrabold tracking-[-0.02em] text-text">
          Paperskeep Admin
        </h1>
        <p className="font-body text-[15px] text-muted">
          Sign in to manage your posts.
        </p>
      </div>

      <div className="rounded-block border border-border bg-surface p-7 shadow-token">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
