import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt: string;
  /** Fallback initials (e.g., "TZ" for "Taha Zaman") */
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { container: "h-8 w-8", text: "text-xs", px: 32 },
  md: { container: "h-10 w-10", text: "text-sm", px: 40 },
  lg: { container: "h-14 w-14", text: "text-base", px: 56 },
  xl: { container: "h-20 w-20", text: "text-lg", px: 80 },
};

/**
 * Avatar with image and fallback initials.
 *
 * @example
 * <Avatar src="/avatars/user.webp" alt="Taha Zaman" fallback="TZ" size="lg" />
 */
export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const { container, text, px } = sizeMap[size];

  if (src) {
    return (
      <div
        className={cn(
          container,
          "relative rounded-full overflow-hidden",
          "border border-[var(--color-line-700)]",
          className
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          className="object-cover"
        />
      </div>
    );
  }

  // Fallback with initials
  const initials =
    fallback ||
    alt
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div
      className={cn(
        container,
        "flex items-center justify-center rounded-full",
        "bg-[var(--color-bg-700)] border border-[var(--color-line-700)]",
        "text-[var(--color-gold-400)]",
        text,
        "font-semibold select-none",
        className
      )}
      aria-label={alt}
    >
      {initials}
    </div>
  );
}
