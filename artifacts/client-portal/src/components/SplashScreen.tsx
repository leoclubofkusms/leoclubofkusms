import { useEffect, useState } from "react";
import { getClubSettings } from "@/lib/firestore";
import type { ClubSettings } from "@/lib/types";
import { getCurrentLeoYear } from "@/lib/types";
import { ArrowRight, MoveDown, ShieldCheck, Sparkles } from "lucide-react";

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
    // handleEnter intentionally uses the latest exit state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  const presidentName = settings.presidentSloganName || "Leo Club Leadership";
  const presidentRole = settings.presidentSloganRole || "Service · Leadership · Opportunity";

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
        @keyframes leo-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes leo-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.28), 0 18px 50px rgba(0,0,0,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(212,175,55,0), 0 22px 60px rgba(212,175,55,0.18); }
        }
        .leo-rise { animation: leo-rise 800ms cubic-bezier(.22,1,.36,1) both; }
        .leo-float { animation: leo-float 5s ease-in-out infinite; }
        .leo-pulse { animation: leo-pulse 2.8s ease-in-out infinite; }
        .leo-delay-1 { animation-delay: 120ms; }
        .leo-delay-2 { animation-delay: 220ms; }
        .leo-delay-3 { animation-delay: 320ms; }
        .leo-delay-4 { animation-delay: 440ms; }
        @media (prefers-reduced-motion: reduce) {
          .leo-rise, .leo-float, .leo-pulse { animation: none !important; }
        }
      `}</style>

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
        <div className="flex items-center justify-between border-b border-white/10 pb-4 sm:pb-5">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-[#d4af37] shadow-[0_0_14px_rgba(212,175,55,.8)]" />
            Official Club Portal
          </div>
          <div className="text-[10px] font-medium tracking-[0.18em] text-white/40 sm:text-xs">
            {getCurrentLeoYear()}
          </div>
        </div>

        <div className="flex flex-1 items-center py-10 sm:py-14 lg:py-16">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-20">
            <div className="text-center lg:text-left">
              <div className={`leo-rise inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f3d77e] sm:text-xs ${entered ? "" : "opacity-0"}`}>
                <Sparkles size={13} />
                Welcome to KUSMS
              </div>

              <div className={`leo-rise leo-delay-1 mt-8 flex justify-center lg:justify-start ${entered ? "" : "opacity-0"}`}>
                <div className="relative">
                  <div className="absolute -inset-5 rounded-full bg-[#d4af37]/15 blur-2xl" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-[#e8c766]/60 bg-white/[0.08] p-3 shadow-[0_18px_60px_rgba(0,0,0,.3)] sm:h-28 sm:w-28">
                    <img src="/logo.png" alt="Leo Club of KUSMS" className="h-full w-full object-contain" />
                  </div>
                </div>
              </div>

              <div className={`leo-rise leo-delay-2 mt-8 ${entered ? "" : "opacity-0"}`}>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/45 sm:text-xs">
                  Leadership through service
                </p>
                <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.4rem]">
                  Leo Club
                  <span className="mt-2 block bg-gradient-to-r from-[#d4af37] via-[#f4df9a] to-[#b7861b] bg-clip-text text-transparent">
                    of KUSMS
                  </span>
                </h1>
              </div>

              <p className={`leo-rise leo-delay-3 mx-auto mt-7 max-w-xl text-sm leading-7 text-white/55 sm:text-base lg:mx-0 ${entered ? "" : "opacity-0"}`}>
                A digital home for the people, purpose, and community impact behind our club.
              </p>

              {settings.presidentSlogan && (
                <div className={`leo-rise leo-delay-4 mx-auto mt-8 max-w-xl border-l-2 border-[#d4af37] pl-4 text-left lg:mx-0 ${entered ? "" : "opacity-0"}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
                    President&apos;s Slogan · {getCurrentLeoYear()}
                  </p>
                  <p className="mt-2 text-lg font-medium leading-7 text-white sm:text-xl">
                    “{settings.presidentSlogan}”
                  </p>
                </div>
              )}

              <div className={`leo-rise leo-delay-4 mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start ${entered ? "" : "opacity-0"}`}>
                <button
                  type="button"
                  onClick={handleEnter}
                  className="leo-pulse group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f1d77f] to-[#c49828] px-7 text-sm font-bold text-[#071a34] transition-transform hover:scale-[1.03] active:scale-95 sm:px-8"
                >
                  Enter website
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
                <span className="inline-flex items-center gap-2 text-xs text-white/35">
                  <MoveDown size={14} />
                  Press Enter to continue
                </span>
              </div>
            </div>

            <div className={`leo-rise leo-delay-3 relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto ${entered ? "" : "opacity-0"}`}>
              <div className="absolute -inset-6 rounded-[2.5rem] bg-[#d4af37]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-5 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[#d4af37]">Our chapter</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Make an impact.</h2>
                  </div>
                  <ShieldCheck className="text-[#e8c766]" size={22} />
                </div>

                <div className="my-7 h-px bg-gradient-to-r from-[#d4af37]/70 via-white/15 to-transparent" />

                {settings.presidentSloganPhotoUrl ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={settings.presidentSloganPhotoUrl}
                      alt={presidentName}
                      className="h-16 w-16 shrink-0 rounded-2xl border border-[#d4af37]/70 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">{presidentName}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-white/45">{presidentRole}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="leo-float flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/35 bg-[#d4af37]/10 text-[#f1d77f]">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{presidentName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{presidentRole}</p>
                    </div>
                  </div>
                )}

                <div className="mt-7 grid grid-cols-3 gap-2">
                  {[
                    ["01", "Serve"],
                    ["02", "Lead"],
                    ["03", "Grow"],
                  ].map(([number, label]) => (
                    <div key={number} className="rounded-2xl border border-white/10 bg-black/10 px-3 py-3">
                      <p className="text-[10px] font-semibold text-[#d4af37]">{number}</p>
                      <p className="mt-1 text-xs font-medium text-white/65">{label}</p>
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

        <div className="flex items-center justify-center border-t border-white/10 pt-4 text-center text-[10px] tracking-[0.15em] text-white/30 sm:justify-between sm:text-xs">
          <span>Leo Club of Kathmandu University School of Medical Sciences</span>
          <span className="hidden sm:inline">Dhulikhel, Nepal</span>
        </div>
      </div>
    </div>
  );
}