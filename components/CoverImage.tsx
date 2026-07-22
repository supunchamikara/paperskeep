import Image from "next/image";

/**
 * Cover image that shows the WHOLE image (object-contain) regardless of
 * aspect ratio — so portrait / Pinterest-style images aren't cropped — while
 * a blurred, zoomed copy of the same image fills the surrounding frame so the
 * letterbox never looks empty. `className` sizes/rounds the frame.
 */
export default function CoverImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-pill ${className}`}>
      {/* Blurred backdrop fills the frame (decorative). Same URL → cached. */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        className="scale-110 object-cover blur-2xl opacity-50"
      />
      {/* The actual image, shown in full. */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </div>
  );
}
