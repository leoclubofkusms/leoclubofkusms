import {
  ArrowRight,
  MoveDown,
  ShieldCheck,
  Sparkles,
  HandHeart,
  Users,
  TrendingUp,
} from "lucide-react";
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => setEntered(true), 80);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, []);

  const handleEnter = () => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(onEnter, 700);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  const presidentName = settings.presidentSloganName || "Leo Club Leadership";
  const presidentRole =
    settings.presidentSloganRole || "Service · Leadership · Opportunity";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Leo Club of KUSMS welcome screen"
      tabIndex={0}
      onClick={handleEnter}
      onKeyDown={(event) => {
        if (event.key === "Escape") handleEnter();
      }}
      className={`fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-[#020b18] text-white transition-all duration-700 ease-out ${
        exiting ? "pointer-events-none scale-[1.03] opacity-0 blur-sm" : "scale-100 opacity-100"
      }`}
    >
      <style>{`
        @keyframes leo-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes leo-float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }
        @keyframes leo-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.28), 0 18px 50px rgba(0,0,0,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(212,175,55,0), 0 22px 60px rgba(212,175,55,0.18); }
        }
        @keyframes leo-shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .leo-rise { animation: leo-rise 800ms cubic-bezier(.22,1,.36,1) both; }
        .leo-float { animation: leo-float 5s ease-in-out infinite; }
        .leo-pulse { animation: leo-pulse 2.8s ease-in-out infinite; }
        .leo-delay-1 { animation-delay: 120ms; }
        .leo-delay-2 { animation-delay: 220ms; }
        .leo-delay-3 { animation-delay: 320ms; }
        .leo-delay-4 { animation-delay: 440ms; }
        .leo-delay-5 { animation-delay: 540ms; }
        .leo-shimmer-text {
          background: linear-gradient(90deg, #d4af37 0%, #f5e5a8 50%, #d4af37 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: leo-shimmer 3.4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .leo-rise, .leo-float, .leo-pulse, .leo-shimmer-text { animation: none !important; }
        }
      `}</style>

      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-36 h-[28rem] w-[28rem] rounded-full bg-[#0d4d84]/30 blur-3xl" />
        <div className="absolute -bottom-48 -right-40 h-[32rem] w-[32rem] rounded-full bg-[#a47d16]/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-[#e8c766]/70"
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${12 + ((index * 29) % 78)}%`,
              opacity: 0.2 + (index % 4) * 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
        {/* Top bar: Logo + Club Name + Year */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 sm:pb-5">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Leo Club of KUSMS"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-[0_4px_14px_rgba(212,175,55,0.4)]"
            />
            <div className="text-left">
              <p className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                Leo Club of KUSMS
              </p>
              <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.24em] text-[#d4af37]/80">
                Official Portal
              </p>
            </div>
          </div>
          <div className="text-[10px] font-medium tracking-[0.18em] text-white/40 sm:text-xs">
            {getCurrentLeoYear()}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 items-center py-8 sm:py-12 lg:py-16">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            {/* LEFT SIDE */}
            <div className="text-center lg:text-left">
              {/* Welcome chip */}
              <div
                className={`leo-rise inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f3d77e] sm:text-xs ${
                  entered ? "" : "opacity-0"
                }`}
              >
                <Sparkles size={13} />
                Welcome to Leo Club of KUSMS
              </div>

              {/* Big headline */}
              <div className={`leo-rise leo-delay-1 mt-6 ${entered ? "" : "opacity-0"}`}>
                <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.5rem]">
                  Leadership
                  <span className="mt-1 block leo-shimmer-text">Through Service</span>
                </h1>
              </div>

              {/* Tagline */}
              <p
                className={`leo-rise leo-delay-2 mx-auto mt-6 max-w-xl text-sm leading-7 text-white/55 sm:text-base lg:mx-0 ${
                  entered ? "" : "opacity-0"
                }`}
              >
                A digital home for the people, purpose, and community impact behind
                Leo Club of Kathmandu University School of Medical Sciences.
              </p>

              {/* Slogan + photo side by side */}
              {settings.presidentSlogan && (
                <div
                  className={`leo-rise leo-delay-3 mt-8 flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:justify-start ${
                    entered ? "" : "opacity-0"
                  }`}
                >
                  {settings.presidentSloganPhotoUrl && (
                    <div className="relative shrink-0">
                      <div className="absolute -inset-3 rounded-full bg-[#d4af37]/25 blur-2xl" />
                      <img
                        src={settings.presidentSloganPhotoUrl}
                        alt={presidentName}
                        className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-2 border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                      />
                    </div>
                  )}
                  <div className="text-center lg:text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
                      President&apos;s Slogan · {getCurrentLeoYear()}
                    </p>
                    <p className="mt-2 text-xl font-medium italic leading-tight tracking-[-0.01em] text-white sm:text-2xl">
                      &ldquo;{settings.presidentSlogan}&rdquo;
                    </p>
                    {settings.presidentSloganPhotoUrl && (
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/45">
                        {presidentName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div
                className={`leo-rise leo-delay-4 mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start ${
                  entered ? "" : "opacity-0"
                }`}
              >
                <button
                  type="button"
                  onClick={handleEnter}
                  className="leo-pulse group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f1d77f] to-[#c49828] px-7 text-sm font-bold text-[#071a34] transition-transform hover:scale-[1.03] active:scale-95 sm:px-8"
                >
                  Enter Website
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
                <span className="inline-flex items-center gap-2 text-xs text-white/35">
                  <MoveDown size={14} />
                  Press Enter to continue
                </span>
              </div>
            </div>

            {/* RIGHT SIDE: Make an Impact card */}
            <div
              className={`leo-rise leo-delay-3 relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto ${
                entered ? "" : "opacity-0"
              }`}
            >
              <div className="absolute -inset-6 rounded-[2.5rem] bg-[#d4af37]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-5 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[#d4af37]">
                      Our Chapter
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      Make an Impact.
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-white/50 sm:text-sm">
                      Join a community of future medical professionals driving real
                      change in Nepal.
                    </p>
                  </div>
                  <ShieldCheck className="text-[#e8c766] shrink-0" size={22} />
                </div>

                <div className="my-6 h-px bg-gradient-to-r from-[#d4af37]/70 via-white/15 to-transparent" />

                {/* Premium 3-card values */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { number: "01", label: "Serve", sub: "Community First", Icon: HandHeart, delay: "leo-delay-1" },
                    { number: "02", label: "Lead", sub: "Build Leaders", Icon: Users, delay: "leo-delay-2" },
                    { number: "03", label: "Grow", sub: "Lifelong Bonds", Icon: TrendingUp, delay: "leo-delay-3" },
                  ].map(({ number, label, sub, Icon, delay }) => (
                    <div
                      key={number}
                      className={`group leo-rise ${delay} relative overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-gradient-to-b from-[#d4af37]/[0.08] via-white/[0.03] to-black/30 p-3 text-center transition-all duration-500 active:scale-95 hover:-translate-y-1.5 hover:border-[#d4af37]/70 hover:from-[#d4af37]/15 hover:shadow-[0_20px_45px_-8px_rgba(212,175,55,0.35)]`}
                    >
                      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#d4af37]/25 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
                      <div className="pointer-events-none absolute left-1/2 top-6 h-16 w-16 -translate-x-1/2 rounded-full bg-[#d4af37]/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="absolute right-2 top-2 text-[9px] font-bold tracking-widest text-[#d4af37]/40 transition-colors group-hover:text-[#d4af37]/70">
                        {number}
                      </div>
                      <div className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 ring-1 ring-[#d4af37]/30 transition-all duration-500 group-hover:scale-110 group-hover:ring-[#d4af37]/60">
                        <Icon
                          size={18}
                          className="text-[#e8c766] transition-all duration-500 group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                        />
                      </div>
                      <p className="relative mt-2.5 text-xs font-semibold tracking-tight text-white transition-colors group-hover:text-[#f1d77f] sm:text-sm">
                        {label}
                      </p>
                      <p className="relative mt-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/35 transition-colors group-hover:text-white/60">
                        {sub}
                      </p>
                      <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent transition-all duration-500 group-hover:w-3/4" />
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-xs leading-5 text-white/35">
                  Lions Clubs International · District 325L · Club #172194
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-center border-t border-white/10 pt-4 text-center text-[10px] tracking-[0.15em] text-white/30 sm:justify-between sm:text-xs">
          <span>Leo Club of Kathmandu University School of Medical Sciences</span>
          <span className="hidden sm:inline">Dhulikhel, Nepal</span>
        </div>
      </div>
    </div>
  );
}