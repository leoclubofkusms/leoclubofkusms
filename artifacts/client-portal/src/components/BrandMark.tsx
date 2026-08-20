type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-16 h-16 text-xl",
} as const;

export default function BrandMark({ size = "md", className = "" }: BrandMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D4AF37] font-black text-[#002147] ${sizeClasses[size]} ${className}`}
      aria-label="Leo Club of KUSMS"
    >
      <img
        src="/logo.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <span aria-hidden="true">LEO</span>
    </span>
  );
}