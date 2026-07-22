import type { Metadata } from "next";
import { createPost } from "../actions";
import PostForm from "@/components/admin/PostForm";

export const metadata: Metadata = {
  title: "New Post",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-8">
      <h1 className="mb-8 font-heading text-[30px] font-extrabold tracking-[-0.02em] text-text">
        New Post
      </h1>
      <PostForm action={createPost} submitLabel="Create post" />
    </div>
  );
}
