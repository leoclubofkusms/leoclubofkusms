import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HandHeart,
  Users,
  TrendingUp,
  Flame,
  Flower2,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getClubSettings } from "@/lib/firestore";
import type { ClubSettings } from "@/lib/types";
import { formatPresidentSlogan, getCurrentLeoYear } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Festival config                                                           */
/* -------------------------------------------------------------------------- */

const ACTIVE_FESTIVAL: "dashain" | "tihar" | null = "dashain";

type DashainDay = { date: string; tithi: string; description: string };

// Verify these against the official 2083 patro before launch.
const DASHAIN_2083: DashainDay[] = [
  { date: "2026-10-11", tithi: "Ghatasthapana", description: "Jamara is sown — the auspicious beginning of Dashain." },
  { date: "2026-10-12", tithi: "Dwitiya", description: "Day 2 of the sacred festival." },
  { date: "2026-10-13", tithi: "Tritiya", description: "Families gather and prepare for the days ahead." },
  { date: "2026-10-14", tithi: "Chaturthi", description: "Traditions continue — homes fill with joy." },
  { date: "2026-10-15", tithi: "Panchami", description: "The air fills with festivity across Nepal." },
  { date: "2026-10-16", tithi: "Shasthi", description: "Preparations for Phulpati begin." },
  { date: "2026-10-17", tithi: "Phulpati", description: "The royal jamara arrives — Dashain deepens." },
  { date: "2026-10-18", tithi: "Maha Ashtami", description: "Goddess Durga is worshipped in her fiercest form." },
  { date: "2026-10-19", tithi: "Maha Navami", description: "The victory of good over evil approaches." },
  { date: "2026-10-20", tithi: "Maha Navami", description: "Devotees gather for worship and celebration." },
  { date: "2026-10-21", tithi: "Vijaya Dashami", description: "Tika, jamara, and blessings — Happy Dashain!" },
  { date: "2026-10-22", tithi: "Ekadashi", description: "Tika continues — blessings shared with family." },
  { date: "2026-10-23", tithi: "Dwadashi", description: "Tika continues — loved ones visit each other." },
  { date: "2026-10-24", tithi: "Trayodashi", description: "Blessings carry on across the nation." },
  { date: "2026-10-25", tithi: "Kojagrat Purnima", description: "Dashain concludes under the full moon." },
];

// Nepal is UTC+5:45. The old toISOString() used UTC, so between midnight and
// ~5:45 AM in Nepal the splash showed *yesterday's* tithi.
const nepalFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kathmandu",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getTodaysDashain(): { day: DashainDay; index: number } | null {
  const iso = nepalFormatter.format(new Date()); // YYYY-MM-DD
  const index = DASHAIN_2083.findIndex((d) => d.date === iso);
  return index === -1 ? null : { day: DASHAIN_2083[index], index };
}

/* -------------------------------------------------------------------------- */
/*  Styles (one block, no duplicates)                                         */
/* -------------------------------------------------------------------------- */

const STYLES = `
@keyframes leo-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes leo-shimmer { to { background-position: -200% center; } }
@keyframes leo-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,.3); }
  50% { box-shadow: 0 0 0 10px rgba(212,175,55,0); }
}
@keyframes leo-spin { to { transform: rotate(360deg); } }
@keyframes leo-flicker { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .85; transform: scale(.95); } }
@keyframes leo-sway { 0%,100% { transform: rotate(-1.2deg); } 50% { transform: rotate(1.2deg); } }
@keyframes leo-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes leo-petal {
  0%   { opacity: 0; transform: translate3d(0,-20px,0) rotate(0); }
  12%  { opacity: .9; }
  88%  { opacity: .7; }
  100% { opacity: 0; transform: translate3d(var(--drift),var(--fall),0) rotate(300deg); }
}
.leo-rise { animation: leo-rise 700ms cubic-bezier(.22,1,.36,1) both; }
.leo-shimmer-text {
  background: linear-gradient(90deg,#d4af37,#f5e5a8,#d4af37);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: leo-shimmer 3.4s linear infinite;
}
.leo-pulse { animation: leo-pulse 2.8s ease-in-out infinite; }
.leo-spin { animation: leo-spin 60s linear infinite; }
.leo-flicker { animation: leo-flicker 2.4s ease-in-out infinite; }
.leo-sway { transform-origin: 50% 0; animation: leo-sway 6s ease-in-out infinite; }
.leo-stem { transform-origin: 50% 100%; animation: leo-grow 900ms cubic-bezier(.22,1,.36,1) both; }
.leo-petal {
  position: absolute; top: 0;
  animation: leo-petal var(--dur) linear infinite;
  animation-delay: var(--delay);
  will-change: transform, opacity;
}
.leo-deva { font-family: "Noto Sans Devanagari","Mukta","Kohinoor Devanagari",system-ui,sans-serif; }
@media (prefers-reduced-motion: reduce) {
  .leo-rise, .leo-shimmer-text, .leo-pulse, .leo-spin,
  .leo-flicker, .leo-sway, .leo-stem, .leo-petal { animation: none !important; }
  .leo-petal { display: none; }
}
`;

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

function Marigold({ size = 12 }: { size?: number }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {petals.map((r) => (
        <ellipse key={r} cx="12" cy="5.5" rx="2.6" ry="3.4" fill={r % 90 ? "#f9c74f" : "#f7a21b"} transform={`rotate(${r} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.4" fill="#e8830c" />
      <circle cx="12" cy="12" r="1.4" fill="#ffd17a" />
    </svg>
  );
}

/** Hanging marigold garland (torana) laid along a curve, as seen over Nepali doorways. */
function Torana() {
  const flowers = useMemo(() => {
    const count = 15;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      // quadratic bezier: (0,4) → control (200,52) → (400,4)
      const x = (1 - t) ** 2 * 0 + 2 * (1 - t) * t * 200 + t ** 2 * 400;
      const y = (1 - t) ** 2 * 4 + 2 * (1 - t) * t * 52 + t ** 2 * 4;
      return { x, y, key: i };
    });
  }, []);

  return (
    <svg viewBox="0 0 400 56" className="leo-sway block w-full" aria-hidden="true">
      <path d="M0 4 Q200 52 400 4" fill="none" stroke="#3f7d3a" strokeWidth="2" />
      {flowers.map(({ x, y, key }) => (
        <g key={key} transform={`translate(${x - 9} ${y - 3})`}>
          <ellipse cx="9" cy="-1" rx="2.5" ry="5" fill="#4d9a45" transform={`rotate(${key % 2 ? 35 : -35} 9 0)`} />
          <Marigold size={18} />
        </g>
      ))}
    </svg>
  );
}

/** Jamara grows through the festival: one stem per day, grown up to today. */
function JamaraTimeline({ index }: { index: number }) {
  return (
    <div>
      <div className="flex h-12 items-end justify-between gap-1" role="img" aria-label={`Day ${index + 1} of 15`}>
        {DASHAIN_2083.map((_, i) => {
          const grown = i <= index;
          const isToday = i === index;
          const height = 14 + ((i * 7) % 5) * 5 + (i === DASHAIN_2083.length - 1 ? 0 : 4);
          return grown ? (
            <span
              key={i}
              className="leo-stem w-full max-w-[10px] rounded-t-full"
              style={{
                height,
                animationDelay: `${300 + i * 60}ms`,
                background: isToday
                  ? "linear-gradient(to top,#e6c84a,#f5e08a)"
                  : "linear-gradient(to top,#2f6b34,#8bc34a)",
              }}
            />
          ) : (
            <span key={i} className="h-1.5 w-full max-w-[10px] rounded-full bg-white/15" />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-white/55">
        Day {index + 1} of 15 · jamara grows with each day
      </p>
    </div>
  );
}

function Tile({ Icon, label, sub, tone }: { Icon: LucideIcon; label: string; sub: string; tone: "gold" | "saffron" }) {
  const accent = tone === "saffron" ? "255,169,64" : "212,175,55";
  return (
    <div
      className="rounded-2xl border p-3 text-center transition-transform duration-300 active:scale-95 sm:hover:-translate-y-1"
      style={{ borderColor: `rgba(${accent},.3)`, background: `linear-gradient(to bottom,rgba(${accent},.1),rgba(0,0,0,.25))` }}
    >
      <div
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: `rgba(${accent},.15)`, boxShadow: `inset 0 0 0 1px rgba(${accent},.3)` }}
      >
        <Icon size={18} className="text-[#f1d77f]" />
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{label}</p>
      <p className="mt-0.5 text-[11px] text-white/45">{sub}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

const PETALS = [
  { left: "8%",  delay: "0s",   dur: "9s",    size: 14, drift: "14px" },
  { left: "30%", delay: "2.4s", dur: "11s",   size: 11, drift: "-10px" },
  { left: "52%", delay: "1s",   dur: "10s",   size: 13, drift: "12px" },
  { left: "74%", delay: "3.2s", dur: "9.5s",  size: 10, drift: "-12px" },
  { left: "90%", delay: "4.4s", dur: "10.5s", size: 12, drift: "8px" },
];

export default function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const enterRef = useRef<HTMLButtonElement>(null);

  const dashain = useMemo(
    () => (ACTIVE_FESTIVAL === "dashain" ? getTodaysDashain() : null),
    []
  );

  // Settings load in the background; the splash never waits on them.
  useEffect(() => {
    let alive = true;
    getClubSettings()
      .then((s) => alive && setSettings(s))
      .catch(() => alive && setSettings({}));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      setEntered(true);
      enterRef.current?.focus({ preventScroll: true });
    });
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(onEnter, 500);
  }, [exiting, onEnter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleEnter]);

  const presidentName = settings?.presidentSloganName || "Leo Club Leadership";
  // Static class strings so Tailwind's scanner can see them.
  const DELAYS = ["", "[animation-delay:110ms]", "[animation-delay:220ms]", "[animation-delay:330ms]", "[animation-delay:440ms]"];
  const reveal = (n: number) => `leo-rise ${DELAYS[n]} ${entered ? "" : "opacity-0"}`;
  const festive = !!dashain;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Leo Club of KUSMS welcome screen"
      onClick={handleEnter}
      className={`fixed inset-0 z-[9999] overflow-y-auto overscroll-contain text-white transition-[opacity,transform] duration-500 ease-out ${
        exiting ? "pointer-events-none scale-[1.02] opacity-0" : "opacity-100"
      }`}
      style={{
        // Gradients instead of blur-3xl blobs: far cheaper to paint on phones.
        background: festive
          ? "radial-gradient(60rem 40rem at 85% 110%,rgba(176,38,38,.35),transparent 60%),radial-gradient(50rem 36rem at 0% -10%,rgba(13,77,132,.35),transparent 60%),#07101f"
          : "radial-gradient(50rem 36rem at 0% -10%,rgba(13,77,132,.4),transparent 60%),radial-gradient(50rem 36rem at 100% 110%,rgba(164,125,22,.25),transparent 60%),#020b18",
      }}
    >
      <style>{STYLES}</style>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Leo Club of KUSMS"
              width={56}
              height={56}
              decoding="async"
              fetchPriority="high"
              data-photo-viewer="off"
              className="h-12 w-12 object-contain drop-shadow-[0_4px_14px_rgba(212,175,55,0.4)] sm:h-14 sm:w-14"
            />
            <div>
              <p className="text-sm font-bold leading-tight sm:text-base">Leo Club of KUSMS</p>
              <p className="text-xs text-[#d4af37]/80">Official Portal</p>
            </div>
          </div>
          <span className="text-xs text-white/45">{getCurrentLeoYear()}</span>
        </header>

        <main className="flex flex-1 items-center py-8 sm:py-12">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            {/* Left: message */}
            <div className="text-center lg:text-left">
              <div className={`${reveal(0)} inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-medium text-[#f3d77e]`}>
                <Sparkles size={13} />
                Welcome to Leo Club of KUSMS
              </div>

              <h1 className={`${reveal(1)} mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.5rem]`}>
                Leadership
                <span className="leo-shimmer-text mt-1 block">Through Service</span>
              </h1>

              <p className={`${reveal(2)} mx-auto mt-6 max-w-xl text-sm leading-7 text-white/60 sm:text-base lg:mx-0`}>
                A digital home for the people, purpose, and community impact behind
                Leo Club of Kathmandu University School of Medical Sciences.
              </p>

              {/* Slogan block: space is reserved until settings arrive, so nothing jumps. */}
              <div className="mt-8 min-h-[2rem]">
                {settings?.presidentSlogan && (
                  <div className="leo-rise flex flex-col items-center gap-5 lg:flex-row lg:justify-start">
                    {settings.presidentSloganPhotoUrl && (
                      <img
                        src={settings.presidentSloganPhotoUrl}
                        alt={presidentName}
                        width={160}
                        height={160}
                        loading="eager"
                        decoding="async"
                        className="h-32 w-32 shrink-0 rounded-2xl border-2 border-[#d4af37] bg-white object-contain p-2 shadow-[0_0_32px_rgba(212,175,55,0.35)] sm:h-40 sm:w-40"
                      />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-[#d4af37]">
                        President&apos;s Slogan · {getCurrentLeoYear()}
                      </p>
                      <p className="mt-2 text-xl font-medium italic leading-tight sm:text-2xl">
                        <span aria-hidden="true" className="mr-1 font-serif text-3xl text-[#d4af37]">&ldquo;</span>
                        {formatPresidentSlogan(settings.presidentSlogan)}
                      </p>
                      {settings.presidentSloganPhotoUrl && (
                        <p className="mt-2 text-xs text-white/50">{presidentName}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`${reveal(4)} mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start`}>
                <button
                  ref={enterRef}
                  type="button"
                  onClick={handleEnter}
                  className="leo-pulse group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f1d77f] to-[#c49828] px-8 text-sm font-bold text-[#071a34] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-95"
                >
                  Enter website
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
                <span className="hidden text-xs text-white/40 sm:inline">or press Enter</span>
              </div>
            </div>

            {/* Right: card */}
            <div className={`${reveal(3)} relative mx-auto w-full max-w-md lg:ml-auto lg:mr-0`}>
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] shadow-[0_30px_80px_rgba(0,0,0,.4)] sm:backdrop-blur-xl">
                {festive && dashain ? (
                  <div
                    className="relative"
                    style={{ background: "linear-gradient(180deg,rgba(150,28,28,.38),rgba(60,10,20,.2) 55%,transparent)" }}
                  >
                    {/* Slow mandala behind the greeting */}
                    <svg
                      className="leo-spin pointer-events-none absolute -right-16 top-6 h-64 w-64 opacity-[0.12]"
                      viewBox="0 0 200 200"
                      aria-hidden="true"
                    >
                      <g fill="none" stroke="#f5c76b" strokeWidth="1">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <ellipse key={i} cx="100" cy="52" rx="14" ry="46" transform={`rotate(${i * 30} 100 100)`} />
                        ))}
                        <circle cx="100" cy="100" r="22" />
                        <circle cx="100" cy="100" r="96" strokeDasharray="2 5" />
                      </g>
                    </svg>

                    <Torana />

                    {/* Falling petals, limited on small screens */}
                    <div className="pointer-events-none absolute inset-x-0 top-10 h-[26rem] overflow-hidden" aria-hidden="true">
                      {PETALS.map((p, i) => (
                        <div
                          key={i}
                          className={`leo-petal ${i > 2 ? "hidden sm:block" : ""}`}
                          style={
                            {
                              left: p.left,
                              "--delay": p.delay,
                              "--dur": p.dur,
                              "--drift": p.drift,
                              "--fall": "26rem",
                            } as React.CSSProperties
                          }
                        >
                          <Marigold size={p.size} />
                        </div>
                      ))}
                    </div>

                    <div className="relative px-5 pb-5 pt-3 sm:px-7 sm:pb-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#f5c76b]">
                            Dashain 2083 · {dashain.day.tithi}
                          </p>
                          <h2 className="leo-deva mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
                            <span className="leo-shimmer-text">शुभ दशैं</span>
                            <span className="ml-2 text-[#f5e5a8]">२०८३</span>
                          </h2>
                          <p className="mt-1 text-base font-medium text-white/90">Happy Dashain</p>
                          <p className="mt-2 text-sm leading-6 text-white/65">{dashain.day.description}</p>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#ffa940]/15 shadow-[0_0_24px_rgba(255,169,64,0.35)]">
                          <Flame size={20} className="leo-flicker text-[#ffc96b]" />
                        </div>
                      </div>

                      <div className="my-5 h-px bg-gradient-to-r from-[#d4af37]/70 via-[#ffa940]/30 to-transparent" />

                      <JamaraTimeline index={dashain.index} />

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <Tile Icon={Flame} label="Celebrate" sub="With family" tone="saffron" />
                        <Tile Icon={Flower2} label="Bless" sub="Tika & jamara" tone="saffron" />
                        <Tile Icon={Heart} label="Share" sub="Joy with all" tone="saffron" />
                      </div>

                      <p className="mt-5 text-xs leading-5 text-white/40">
                        Leo Club of KUSMS · Lions Clubs International · District 325L · Club #172194
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-[#d4af37]">Our chapter</p>
                        <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Make an impact.</h2>
                        <p className="mt-2 text-sm leading-6 text-white/55">
                          Join a community of future medical professionals driving real change in Nepal.
                        </p>
                      </div>
                      <ShieldCheck className="shrink-0 text-[#e8c766]" size={22} />
                    </div>
                    <div className="my-6 h-px bg-gradient-to-r from-[#d4af37]/70 via-white/15 to-transparent" />
                    <div className="grid grid-cols-3 gap-3">
                      <Tile Icon={HandHeart} label="Serve" sub="Community first" tone="gold" />
                      <Tile Icon={Users} label="Lead" sub="Build leaders" tone="gold" />
                      <Tile Icon={TrendingUp} label="Grow" sub="Lifelong bonds" tone="gold" />
                    </div>
                    <p className="mt-6 text-xs leading-5 text-white/40">
                      Lions Clubs International · District 325L · Club #172194
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-center border-t border-white/10 pt-4 text-center text-xs text-white/35 sm:justify-between">
          <span>Leo Club of Kathmandu University School of Medical Sciences</span>
          <span className="hidden sm:inline">Dhulikhel, Nepal</span>
        </footer>
      </div>
    </div>
  );
}
