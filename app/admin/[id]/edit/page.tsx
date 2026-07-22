import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminPost, updatePost } from "../../actions";
import PostForm from "@/components/admin/PostForm";

export const metadata: Metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getAdminPost(params.id);
  if (!post) notFound();

  // Bind the post id so the shared form's (prev, formData) signature holds.
  const action = updatePost.bind(null, post.id);

  return (
    <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-8">
      <h1 className="mb-2 font-heading text-[30px] font-extrabold tracking-[-0.02em] text-text">
        Edit Post
      </h1>
      <p className="mb-8 font-body text-[15px] text-muted">
        Editing “{post.title}”
      </p>
      <PostForm action={action} post={post} submitLabel="Save changes" />
    </div>
  );
}
