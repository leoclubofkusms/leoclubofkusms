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
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      sessionStorage.setItem("splashSeen", "1");
      onEnter();
    }, 700);
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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 ${exiting ? "opacity-0 scale-105" : "opacity-100 scale-100"}`}
      style={{
        background:
          "radial-gradient(ellipse at top, #003575 0%, #002147 45%, #001228 100%)",
      }}
    >
      {/* Floating gold particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#D4AF37] animate-pulse"
            style={{
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              opacity: 0.12 + (i % 5) * 0.1,
              animationDuration: `${3 + (i % 4)}s`,
              animationDelay: `${(i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative gold glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Gold shimmer lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />

      <div
        className={`relative text-center px-6 max-w-2xl transition-all duration-1000 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* Logo with pulsing rings */}
        <div className="mb-10 relative inline-flex items-center justify-center">
          <div className="absolute w-44 h-44 md:w-56 md:h-56 rounded-full border border-[#D4AF37]/20 animate-ping" />
          <div className="absolute w-40 h-40 md:w-52 md:h-52 rounded-full border border-[#D4AF37]/30" />
          <div className="absolute w-48 h-48 md:w-60 md:h-60 rounded-full border border-[#D4AF37]/10" />
          <div
            className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center relative z-10 shadow-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,55,0.30) 0%, rgba(212,175,55,0) 70%)",
            }}
          >
            <img
              src="/logo.png"
              alt="Leo Club of KUSMS"
              className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-[0.4em] mb-4">
          WELCOME TO THE OFFICIAL PORTAL
        </div>

        <h1 className="text-white font-black text-4xl md:text-6xl leading-tight tracking-tight mb-1">
          LEO CLUB
        </h1>
        <h2 className="text-[#D4AF37] font-black text-2xl md:text-4xl leading-tight tracking-tight mb-6">
          OF KUSMS
        </h2>

        <div className="text-white/60 text-[10px] md:text-xs tracking-[0.35em] uppercase mb-10">
          Leadership · Experience · Opportunity
        </div>

        {settings.presidentSlogan && (
          <div className="relative mb-10">
            <div className="text-[#D4AF37]/20 text-6xl md:text-8xl font-serif leading-none absolute -top-6 left-1/2 -translate-x-1/2 select-none">
              &ldquo;
            </div>

            <div className="relative pt-8 px-4">
              <div className="text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-5 flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-[#D4AF37]/50" />
                President's Slogan · {getCurrentLeoYear()}
                <span className="w-8 h-px bg-[#D4AF37]/50" />
              </div>

              <p className="text-white italic font-bold text-xl md:text-3xl leading-snug mb-6 max-w-xl mx-auto">
                {settings.presidentSlogan}
              </p>

              {settings.presidentSloganPhotoUrl && (
                <div className="relative inline-block">
                  <div className="absolute inset-0 rounded-full bg-[#D4AF37] blur-lg opacity-40" />
                  <img
                    src={settings.presidentSloganPhotoUrl}
                    alt="President"
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-[#D4AF37] shadow-2xl"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {!settings.presidentSlogan && (
          <div className="w-24 h-px bg-[#D4AF37]/50 mx-auto mb-10" />
        )}

        <div className="text-white/70 text-xs md:text-sm animate-pulse">
          TAP OR PRESS{" "}
          <span className="inline-block border border-[#D4AF37]/50 rounded px-2 py-0.5 text-[#D4AF37] mx-1 font-mono">
            ENTER ↵
          </span>{" "}
          TO CONTINUE
        </div>
      </div>
    </div>
  );
}