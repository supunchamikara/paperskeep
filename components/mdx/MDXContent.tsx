import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { mdxComponents } from "./mdx-components";

/**
 * next-mdx-remote v6's RSC renderer drops JSX *expression* attributes
 * (e.g. `rating={4.7}`) while keeping string attributes. So numeric props
 * written as `{4.7}` arrive as `undefined`. Convert the numeric expression
 * attributes we use (rating/reviews/price/salePrice) into string attributes,
 * which pass through reliably — our components coerce them back to numbers.
 */
function normalizeMdx(src: string): string {
  return src.replace(
    /\b(rating|reviews|price|salePrice)\s*=\s*\{([^{}]*)\}/g,
    (_m, key, value) =>
      `${key}="${String(value).trim().replace(/^["']|["']$/g, "")}"`
  );
}

/**
 * Server component that compiles and renders an MDX string.
 * Runs at request/build time inside RSC — no client bundle for MDX.
 */
export default function MDXContent({ source }: { source: string }) {
  return (
    <div className="prose-paperskeep">
      <MDXRemote
        source={normalizeMdx(source)}
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
