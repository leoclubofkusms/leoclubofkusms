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
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/70 bg-[#001a38] p-1 font-black text-[#D4AF37] shadow-[0_4px_18px_rgba(0,0,0,.2)] ${sizeClasses[size]} ${className}`}
      aria-label="Leo Club of KUSMS"
    >
      <img
        src="/logo.png"
        alt=""
        className="h-full w-full rounded-lg object-contain"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <span aria-hidden="true">LEO</span>
    </span>
  );
}