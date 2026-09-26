import { useEffect, useState } from "react";
import { getClubSettings } from "@/lib/firestore";
import type { ClubSettings } from "@/lib/types";
import { getCurrentLeoYear } from "@/lib/types";
import { ArrowRight } from "lucide-react";

export default function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [settings, setSettings] = useState<ClubSettings>({});

  useEffect(() => {
    getClubSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onEnter(), 850);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  const presidentName = (settings as any).presidentSloganName || "Our President";
  const presidentRole = (settings as any).presidentSloganRole || "President";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Enter site"
      onClick={handleEnter}
      className={`fixed inset-0 z-[9999] cursor-pointer overflow-y-auto transition-all duration-[850ms] ease-out ${
        exiting ? "opacity-0 scale-[1.08] blur-md" : "opacity-100 scale-100 blur-0"
      }`}
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 15%, #1a3a6b 0%, #0d2247 35%, #06152e 70%, #020b18 100%)",
      }}
    >
      <style>{`
        @keyframes leo-drift {
          0%   { transform: translateY(0) translateX(0); opacity: 0.3; }
          50%  { opacity: 0.7; }
          100% { transform: translateY(-110vh) translateX(30px); opacity: 0; }
        }
        @keyframes leo-logo-in {
          0%   { opacity: 0; transform: scale(0.7) translateY(-40px); }
          60%  { opacity: 1; transform: scale(1.06) translateY(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes leo-fade-up {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes leo-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.75; transform: scale(1.08); }
        }
        @keyframes leo-ring-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes leo-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes leo-cta-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.45), 0 0 30px 0 rgba(212,175,55,0.25); }
          50%      { box-shadow: 0 0 0 12px rgba(212,175,55,0), 0 0 40px 6px rgba(212,175,55,0.35); }
        }
        @keyframes leo-logo-halo {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.15); }
        }
        .leo-logo-in { animation: leo-logo-in 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .leo-fade-up { animation: leo-fade-up 1s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .leo-shimmer-text {
          background: linear-gradient(90deg, #D4AF37 0%, #f5e5a8 25%, #D4AF37 50%, #f5e5a8 75%, #D4AF37 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: leo-shimmer 4s linear infinite;
        }
        .leo-cta-pulse { animation: leo-cta-pulse 2.6s ease-in-out infinite; }
      `}</style>

      {/* Slow-drifting gold particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 22 }).map((_, i) => {
          const size = 1.5 + (i % 4);
          const left = (i * 47) % 100;
          const delay = (i % 8) * 1.2;
          const duration = 14 + (i % 6) * 2;
          return (
            <div
              key={i}
              className="absolute rounded-full bg-[#D4AF37]"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: "-10px",
                opacity: 0.3,
                animation: `leo-drift ${duration}s linear ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Top/bottom shimmer lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />

      {/* Content */}
      <div className="relative min-h-full flex flex-col items-center justify-center px-6 py-14">
        <div className="w-full max-w-lg flex flex-col items-center text-center">

          {/* ── LOGO ── */}
          <div className="relative mb-8 leo-logo-in">
            {/* Halo glow */}
            <div
              className="absolute inset-0 rounded-full bg-[#D4AF37] blur-3xl"
              style={{ animation: "leo-logo-halo 3.4s ease-in-out infinite" }}
            />
            <img
              src="/logo.png"
              alt="Leo Club of KUSMS"
              className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_8px_30px_rgba(212,175,55,0.35)]"
            />
          </div>

          {/* ── WELCOME ── */}
          <div
            className="leo-fade-up text-[10px] md:text-[11px] font-medium tracking-[0.45em] text-white/50 uppercase mb-5"
            style={{ animationDelay: "0.4s" }}
          >
            Welcome to the Official Portal
          </div>

          {/* ── CLUB NAME ── */}
          <h1
            className="leo-fade-up leo-shimmer-text font-serif font-normal text-5xl md:text-6xl leading-[1.05] tracking-tight mb-1"
            style={{ animationDelay: "0.55s" }}
          >
            Leo Club
          </h1>
          <h2
            className="leo-fade-up font-serif font-normal text-2xl md:text-3xl text-white/90 tracking-wide mb-6"
            style={{ animationDelay: "0.7s" }}
          >
            of KUSMS
          </h2>

          {/* ── TAGLINE ── */}
          <div
            className="leo-fade-up flex items-center gap-3 text-[10px] md:text-[11px] tracking-[0.35em] text-white/40 uppercase mb-10"
            style={{ animationDelay: "0.85s" }}
          >
            <span className="w-6 h-px bg-[#D4AF37]/40" />
            Leadership · Experience · Opportunity
            <span className="w-6 h-px bg-[#D4AF37]/40" />
          </div>

          {/* ── SLOGAN ── */}
          {settings.presidentSlogan && (
            <div
              className="leo-fade-up w-full mb-10"
              style={{ animationDelay: "1s" }}
            >
              <div className="text-[10px] md:text-[11px] font-semibold tracking-[0.3em] text-[#D4AF37] uppercase mb-3">
                President's Slogan · {getCurrentLeoYear()}
              </div>
              <div className="relative">
                <p className="font-serif italic text-2xl md:text-3xl text-white leading-snug px-3">
                  "{settings.presidentSlogan}"
                </p>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-4" />
              </div>
            </div>
          )}

          {/* ── PRESIDENT PHOTO ── */}
          {settings.presidentSloganPhotoUrl && (
            <div
              className="leo-fade-up flex flex-col items-center mb-10"
              style={{ animationDelay: "1.15s" }}
            >
              <div className="relative mb-4">
                {/* Rotating gold ring */}
                <div
                  className="absolute -inset-2 rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, #D4AF37 90deg, transparent 180deg, #D4AF37 270deg, transparent 360deg)",
                    animation: "leo-ring-rotate 6s linear infinite",
                    filter: "blur(3px)",
                    maskImage:
                      "radial-gradient(circle, transparent 68%, black 70%, black 100%)",
                    WebkitMaskImage:
                      "radial-gradient(circle, transparent 68%, black 70%, black 100%)",
                  }}
                />
                {/* Outer glow */}
                <div className="absolute -inset-3 rounded-full bg-[#D4AF37] blur-2xl opacity-40" />
                {/* Photo */}
                <img
                  src={settings.presidentSloganPhotoUrl}
                  alt="President"
                  className="relative w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-[3px] border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.4)]"
                />
              </div>
              <div className="text-white font-semibold text-base md:text-lg tracking-wide">
                {presidentName}
              </div>
              <div className="text-[#D4AF37] text-xs tracking-[0.25em] uppercase mt-1">
                {presidentRole}
              </div>
            </div>
          )}

          {/* ── CTA BUTTON ── */}
          <button
            onClick={handleEnter}
            className="leo-fade-up leo-cta-pulse group inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] via-[#e8c766] to-[#D4AF37] text-[#002147] font-bold px-8 py-3.5 rounded-full text-sm md:text-base tracking-wide transition-all hover:scale-[1.03] active:scale-95"
            style={{ animationDelay: "1.35s" }}
          >
            Enter Website
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* ── HINT ── */}
          <div
            className="leo-fade-up mt-5 text-[10px] md:text-xs text-white/40 tracking-wider"
            style={{ animationDelay: "1.5s" }}
          >
            or press{" "}
            <span className="inline-block border border-white/25 rounded px-1.5 py-0.5 text-white/70 font-mono text-[10px]">
              Enter ↵
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}