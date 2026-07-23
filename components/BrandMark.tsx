import Image from "next/image";

/**
 * Paperskeep brand mark. Renders the logo image at /logo.png (place your
 * icon file in the project's `public/` folder). Used in the header, byline,
 * About card, and admin login.
 */
export default function BrandMark({
  size = 30,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Paperskeep"
      width={size}
      height={size}
      className={`rounded-[8px] ${className}`}
    />
  );
}
