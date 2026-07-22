import Image from "next/image";
import Link from "next/link";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import ProductCard from "./ProductCard";
import BuyCard from "./BuyCard";

/**
 * Components made available to every MDX post. `ProductCard` lets authors
 * drop affiliate cards inline; the image/link overrides route through
 * next/image and next/link for optimization and client-side navigation.
 */
export const mdxComponents: MDXRemoteProps["components"] = {
  ProductCard,
  BuyCard,
  img: (props) => {
    const { src = "", alt = "" } = props as {
      src?: string;
      alt?: string;
    };
    return (
      <Image
        src={src}
        alt={alt}
        width={760}
        height={440}
        className="h-auto w-full rounded-block"
      />
    );
  },
  a: (props) => {
    const { href = "", children, ...rest } = props as {
      href?: string;
      children?: React.ReactNode;
    };
    const isInternal = href.startsWith("/") || href.startsWith("#");
    if (isInternal) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },
};
