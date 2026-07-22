import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { mdxComponents } from "./mdx-components";

/**
 * Server component that compiles and renders an MDX string.
 * Runs at request/build time inside RSC — no client bundle for MDX.
 */
export default function MDXContent({ source }: { source: string }) {
  return (
    <div className="prose-paperskeep">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        }}
      />
    </div>
  );
}
