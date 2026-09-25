import { useEffect, useState } from "react";

export default function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(() => {
      sessionStorage.setItem("splashSeen", "1");
      onEnter();
    }, 600);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      onClick={handleEnter}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-500 ${exiting ? "opacity-0" : "opacity-100"}`}
      style={{ background: "radial-gradient(ellipse at center, #5c0a1f 0%, #3d0512 60%, #1f0208 100%)" }}
    >
      <div className="text-center px-6 max-w-lg">
        {/* Logo */}
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30 animate-ping" />
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/50 scale-125" />
          <img
            src="/logo.png"
            alt="Leo Club of KUSMS"
            className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 drop-shadow-2xl"
          />
        </div>

        {/* Text */}
        <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.3em] mb-3">
          WELCOME TO THE OFFICIAL PORTAL
        </div>
        <div className="text-white/70 text-xs tracking-[0.2em] mb-6">
          LEADERSHIP · EXPERIENCE · OPPORTUNITY
        </div>
        <h1 className="text-white font-bold text-3xl md:text-5xl leading-tight mb-2">
          LEO CLUB OF
        </h1>
        <h1 className="text-white font-bold text-3xl md:text-5xl leading-tight mb-8">
          KUSMS
        </h1>

        {/* Divider */}
        <div className="w-24 h-px bg-[#D4AF37]/50 mx-auto mb-8" />

        {/* Tap to continue */}
        <div className="text-white/60 text-sm md:text-base animate-pulse">
          TAP OR PRESS{" "}
          <span className="inline-block border border-white/40 rounded px-2 py-0.5 text-white/80 mx-1">
            ENTER ↵
          </span>{" "}
          TO CONTINUE
        </div>
      </div>
    </div>
  );
}