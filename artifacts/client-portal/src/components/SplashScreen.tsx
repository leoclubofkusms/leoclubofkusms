import { useEffect, useState } from "react";
import { getClubSettings } from "@/lib/firestore";
import type { ClubSettings } from "@/lib/types";
import { getCurrentLeoYear } from "@/lib/types";

export default function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [settings, setSettings] = useState<ClubSettings>({});

  useEffect(() => {
    getClubSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onEnter(), 800);
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

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Enter site"
      onClick={handleEnter}
      className={`fixed inset-0 z-[9999] cursor-pointer overflow-y-auto transition-all duration-700 ${
        exiting ? "opacity-0 scale-110 blur-sm" : "opacity-100 scale-100 blur-0"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at top, #003575 0%, #002147 45%, #001228 100%)",
      }}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes leo-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes leo-rotate-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes leo-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes leo-logo-in {
          from { opacity: 0; transform: scale(1.08); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes leo-glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%      { opacity: 0.6;  transform: scale(1.08); }
        }
        .leo-shimmer-text {
          animation: leo-shimmer 3.4s linear infinite;
        }
        .leo-logo-in { animation: leo-logo-in 1.1s ease-out both; }
        .leo-fade-up { animation: leo-fade-up 0.9s ease-out both; }
        .leo-glow-pulse { animation: leo-glow-pulse 3s ease-in-out infinite; }
      `}</style>

      {/* Floating gold particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#D4AF37] animate-pulse"
            style={{
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              opacity: 0.1 + (i % 6) * 0.09,
              animationDuration: `${3 + (i % 4)}s`,
              animationDelay: `${(i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Gold glow orbs */}
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/8 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Top/bottom shimmer lines */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />

      {/* Content wrapper — centered & scrollable */}
      <div className="relative min-h-full flex flex-col items-center justify-center py-12 px-6">
        <div
          className={`relative text-center max-w-2xl w-full transition-all duration-1000 ${
            entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* ── LOGO ── */}
          <div className="mb-12 relative inline-flex items-center justify-center leo-logo-in">
            {/* Rotating gold sweep */}
            <div
              className="absolute rounded-full opacity-40"
              style={{
                width: "16rem",
                height: "16rem",
                background:
                  "conic-gradient(from 0deg, transparent 0deg, #D4AF37 40deg, transparent 80deg, transparent 360deg)",
                animation: "leo-rotate-slow 8s linear infinite",
                filter: "blur(2px)",
                maskImage:
                  "radial-gradient(circle, transparent 60%, black 61%, black 100%)",
                WebkitMaskImage:
                  "radial-gradient(circle, transparent 60%, black 61%, black 100%)",
              }}
            />
            {/* Pulsing rings */}
            <div
              className="absolute rounded-full border border-[#D4AF37]/20 animate-ping"
              style={{ width: "14rem", height: "14rem", animationDuration: "3s" }}
            />
            <div
              className="absolute rounded-full border border-[#D4AF37]/30"
              style={{ width: "13rem", height: "13rem" }}
            />
            <div
              className="absolute rounded-full border border-[#D4AF37]/10"
              style={{ width: "15rem", height: "15rem" }}
            />
            {/* Glow behind logo */}
            <div
              className="absolute rounded-full bg-[#D4AF37] blur-3xl opacity-40 leo-glow-pulse"
              style={{ width: "10rem", height: "10rem" }}
            />
            {/* Logo */}
            <div
              className="rounded-full flex items-center justify-center relative z-10"
              style={{
                width: "11rem",
                height: "11rem",
                background:
                  "radial-gradient(circle, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0) 70%)",
              }}
            >
              <img
                src="/logo.png"
                alt="Leo Club of KUSMS"
                className="object-contain drop-shadow-2xl"
                style={{ width: "10rem", height: "10rem" }}
              />
            </div>
          </div>

          {/* ── WELCOME LINE ── */}
          <div
            className="text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-[0.4em] mb-4 leo-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            WELCOME TO THE OFFICIAL PORTAL
          </div>

          {/* ── TITLE ── */}
          <h1
            className="leo-shimmer-text leo-fade-up font-black text-4xl md:text-6xl leading-tight tracking-tight mb-1 bg-clip-text text-transparent"
            style={{
              animationDelay: "0.35s",
              backgroundImage:
                "linear-gradient(90deg, #ffffff 0%, #D4AF37 25%, #ffffff 50%, #D4AF37 75%, #ffffff 100%)",
              backgroundSize: "200% auto",
            }}
          >
            LEO CLUB
          </h1>
          <h2
            className="leo-shimmer-text leo-fade-up font-black text-2xl md:text-4xl leading-tight tracking-tight mb-6 bg-clip-text text-transparent"
            style={{
              animationDelay: "0.5s",
              backgroundImage:
                "linear-gradient(90deg, #D4AF37 0%, #ffffff 25%, #D4AF37 50%, #ffffff 75%, #D4AF37 100%)",
              backgroundSize: "200% auto",
            }}
          >
            OF KUSMS
          </h2>

          {/* ── TAGLINE ── */}
          <div
            className="text-white/60 text-[10px] md:text-xs tracking-[0.35em] uppercase mb-10 leo-fade-up"
            style={{ animationDelay: "0.65s" }}
          >
            Leadership · Experience · Opportunity
          </div>

          {/* ── SLOGAN ── */}
          {settings.presidentSlogan && (
            <div
              className="relative mb-10 leo-fade-up"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="text-[#D4AF37]/20 text-6xl md:text-8xl font-serif leading-none absolute -top-6 left-1/2 -translate-x-1/2 select-none">
                &ldquo;
              </div>

              <div className="relative pt-8 px-4">
                <div className="text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-5 flex items-center justify-center gap-3">
                  <span className="w-8 h-px bg-[#D4AF37]/50" />
                  President's Slogan · {getCurrentLeoYear()}
                  <span className="w-8 h-px bg-[#D4AF37]/50" />
                </div>

                <p className="text-white italic font-bold text-xl md:text-3xl leading-snug mb-6 max-w-xl mx-auto drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]">
                  {settings.presidentSlogan}
                </p>

                {settings.presidentSloganPhotoUrl && (
                  <div className="relative inline-block">
                    <div
                      className="absolute inset-0 rounded-full bg-[#D4AF37] blur-xl opacity-50 animate-pulse"
                      style={{ animationDuration: "2.5s" }}
                    />
                    <img
                      src={settings.presidentSloganPhotoUrl}
                      alt="President"
                      className="relative rounded-full object-cover border-4 border-[#D4AF37] shadow-2xl"
                      style={{ width: "9rem", height: "9rem" }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {!settings.presidentSlogan && (
            <div className="w-24 h-px bg-[#D4AF37]/50 mx-auto mb-10" />
          )}

          {/* ── ENTER HINT ── */}
          <div
            className="text-white/70 text-xs md:text-sm animate-pulse leo-fade-up"
            style={{ animationDelay: "1s" }}
          >
            TAP OR PRESS{" "}
            <span className="inline-block border border-[#D4AF37]/50 rounded px-2 py-0.5 text-[#D4AF37] mx-1 font-mono">
              ENTER ↵
            </span>{" "}
            TO CONTINUE
          </div>
        </div>
      </div>
    </div>
  );
}