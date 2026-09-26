type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
} as const;

export default function BrandMark({ size = "md", className = "" }: BrandMarkProps) {
  return (
    <img
      src="/logo.png"
      alt="Leo Club of KUSMS"
      className={`${sizeClasses[size]} shrink-0 object-contain rounded-full ${className}`}
    />
  );
}