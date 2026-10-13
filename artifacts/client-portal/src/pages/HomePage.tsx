import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  getMembers, getActivities, getBodMembers, getFeaturedActivities, getClubSettings,
  getAwards, getAnnouncements, getClubEvents, getServiceImpact, computeVolunteersFromActivities,
} from "@/lib/firestore";
import type {
  Member, Activity, BodMember, ClubSettings, Award as AwardType, Announcement, ClubEvent, ServiceImpact,
} from "@/lib/types";
import {
  CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_ID, MONTHS, getCurrentLeoYear, getCurrentLeoYearLabel,
  formatPresidentSlogan, isAnnouncementExpired, formatImpactNumber, formatCurrency,
} from "@/lib/types";
import {
  ArrowRight, Award, Users, Calendar, Shield, Mail, Phone, ChevronLeft, ChevronRight, Pin, Info,
  Facebook, Star, Heart, TrendingUp, MessageCircle, Trophy, BarChart3, Megaphone, X as XIcon,
  Clock, DollarSign, Copy, Check, MapPin,
} from "lucide-react";
import ShareButton from "@/components/ShareButton";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shared bits                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

// Nepal is UTC+5:45; toISOString() is UTC and flips the date at the wrong hour.
const npDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" });
const nepalToday = () => npDate.format(new Date()); // YYYY-MM-DD

const CSS = `
.font-display{font-family:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;letter-spacing:-.015em}
.gold-text{background:linear-gradient(100deg,#b8912a,#f1d77f 45%,#d4af37);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
@keyframes hp-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes hp-fade{from{opacity:0;transform:scale(.995)}to{opacity:1;transform:none}}
@keyframes hp-shimmer{to{background-position:-200% 0}}
@keyframes hp-orbit{to{transform:rotate(360deg)}}
.hp-rise{animation:hp-rise .8s cubic-bezier(.22,1,.36,1) both}
.hp-fade{animation:hp-fade .5s ease both}
.hp-orbit{animation:hp-orbit 80s linear infinite}
.hp-skel{background:linear-gradient(90deg,rgba(0,33,71,.06) 25%,rgba(0,33,71,.12) 50%,rgba(0,33,71,.06) 75%);background-size:200% 100%;animation:hp-shimmer 1.4s linear infinite}
@media (prefers-reduced-motion:reduce){.hp-rise,.hp-fade,.hp-orbit,.hp-skel{animation:none!important}}
`;

// Off-screen sections skip layout/paint until near the viewport.
const LAZY = "[content-visibility:auto] [contain-intrinsic-size:auto_560px]";
const CARD = "rounded-3xl border border-[#002147]/[0.06] bg-white shadow-[0_1px_2px_rgba(0,33,71,.04),0_18px_40px_-18px_rgba(0,33,71,.22)]";
const NAVY_PANEL = "relative overflow-hidden rounded-3xl bg-[#002147] text-white shadow-[0_24px_60px_-20px_rgba(0,33,71,.55)] ring-1 ring-[#D4AF37]/25";
const BTN_GOLD = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e3c458] to-[#c9a432] px-5 py-2.5 text-sm font-semibold text-[#002147] shadow-[0_6px_18px_-6px_rgba(212,175,55,.6)] transition hover:brightness-105 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]";
const BTN_GHOST = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Fetch one resource independently so the page renders as each piece arrives. */
function useResource<T>(fn: () => Promise<T>, fallback: T) {
  const [state, setState] = useState<{ data: T; loaded: boolean }>({ data: fallback, loaded: false });
  useEffect(() => {
    let alive = true;
    fn().catch(() => fallback).then((data) => alive && setState({ data, loaded: true }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

/** Count-up that cleans up its frame, respects reduced motion, and re-animates if the target changes. */
function useCountUp(target: number, start: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target; setValue(target); return;
    }
    const a = from.current;
    const decimal = !Number.isInteger(target);
    let raf = 0;
    let t0 = 0;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const raw = a + (target - a) * (1 - Math.pow(1 - p, 3));
      const v = decimal ? Math.round(raw * 10) / 10 : Math.round(raw);
      from.current = v; setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
}

function SectionHead({ title, sub, href, cta }: { title: string; sub: string; href: string; cta: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#002147] sm:text-3xl">{title}</h2>
        <div className="mt-2 h-[3px] w-10 rounded-full bg-[#D4AF37]" />
        <p className="mt-2 text-sm text-slate-500">{sub}</p>
      </div>
      <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#002147] transition-colors hover:text-[#b8912a]">
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Skeleton({ className = "h-72" }: { className?: string }) {
  return <div className={`hp-skel rounded-3xl ${className}`} aria-hidden="true" />;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  One carousel for activities, awards and events                            */
/* ────────────────────────────────────────────────────────────────────────── */

function Carousel<T>({ items, label, interval = 5000, render, className = "" }: {
  items: T[];
  label: string;
  interval?: number;
  render: (item: T) => ReactNode;
  className?: string;
}) {
  const n = items.length;
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const [hidden, setHidden] = useState(false);
  const touchX = useRef<number | null>(null);
  const idx = n ? i % n : 0;

  const go = useCallback((d: number) => setI((c) => (c + d + n) % n), [n]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (n <= 1 || hover || hidden) return;
    const t = setInterval(() => setI((c) => (c + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, hover, hidden, interval]);

  if (!n) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={`${NAVY_PANEL} ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div key={idx} className="hp-fade" aria-live="polite">{render(items[idx])}</div>

      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label={`Previous ${label}`}
            className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white ring-1 ring-white/20 transition hover:bg-black/40 sm:flex">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => go(1)} aria-label={`Next ${label}`}
            className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white ring-1 ring-white/20 transition hover:bg-black/40 sm:flex">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-4 right-6 z-10 flex gap-2">
            {items.map((_, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`Go to ${label} ${k + 1}`} aria-current={k === idx}
                className={`h-2 rounded-full transition-all duration-300 ${k === idx ? "w-6 bg-[#D4AF37]" : "w-2 bg-white/35 hover:bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Backdrop({ src }: { src?: string }) {
  if (!src) return null;
  return (
    <div className="absolute inset-0">
      <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#002147] via-[#002147]/85 to-[#002147]/30" />
    </div>
  );
}

const Tag = ({ children }: { children: ReactNode }) => (
  <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#002147]">{children}</div>
);

function ActivitySlide(act: Activity) {
  const url = typeof window !== "undefined" ? `${window.location.origin}${import.meta.env.BASE_URL}activity/${act.id}` : "";
  return (
    <>
      <Backdrop src={act.photos[0]} />
      <div className="relative px-6 py-10 sm:px-12 sm:py-14">
        <Tag><Pin size={11} /> Featured activity · {act.month} {act.year}</Tag>
        <h3 className="font-display max-w-xl text-2xl font-semibold leading-tight sm:text-4xl">{act.title}</h3>
        <p className="mb-6 mt-3 line-clamp-3 max-w-lg text-base leading-relaxed text-white/70">{act.description}</p>
        <div className="mb-7 flex flex-wrap gap-4 text-sm text-white/65">
          {act.participants.length > 0 && <span className="flex items-center gap-2"><Users size={15} className="text-[#D4AF37]" />{act.participants.length} participants</span>}
          {act.photos.length > 0 && <span className="flex items-center gap-2"><Calendar size={15} className="text-[#D4AF37]" />{act.photos.length} photos</span>}
        </div>
        {act.photos.length > 1 && (
          <div className="mb-7 flex gap-2">
            {act.photos.slice(0, 4).map((p, k) => (
              <img key={k} src={p} alt="" width={56} height={56} loading="lazy" decoding="async" className="h-14 w-14 rounded-xl border-2 border-white/20 object-cover" />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`} className={BTN_GOLD}>View full activity <ArrowRight size={15} /></Link>
          <ShareButton url={url} title={act.title} description={act.description} meta={`${act.month} · Leo Year ${act.year}`} variant="full" label="Share" />
        </div>
      </div>
    </>
  );
}

function AwardSlide(award: AwardType) {
  const url = typeof window !== "undefined" ? `${window.location.origin}${import.meta.env.BASE_URL}awards#${award.id}` : "";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="relative aspect-[4/3] bg-[#001a38] md:aspect-auto md:min-h-[420px]">
        {award.photoUrl ? (
          <img src={award.photoUrl} alt={award.recipientName} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e3c458] to-[#b8912a]"><Trophy size={72} className="text-[#002147]/70" /></div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#002147]/70 to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#002147]/50" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#002147] shadow-lg"><Trophy size={11} /> Featured award</div>
        <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#002147] shadow-lg">
          {award.type === "member" ? <><Star size={10} /> Member</> : <><Shield size={10} /> Club</>}
        </div>
      </div>
      <div className="flex flex-col justify-center p-6 pb-12 sm:p-10">
        <p className="text-xs font-semibold text-[#D4AF37]">{award.month} · Leo Year {award.year}</p>
        <p className="mt-3 text-sm font-semibold text-[#D4AF37]/80">{award.title}</p>
        <h3 className="font-display mt-1 text-2xl font-semibold leading-tight sm:text-4xl">{award.recipientName}</h3>
        {award.awardedBy && <p className="mt-3 text-sm text-white/60">Awarded by <span className="font-semibold text-white/85">{award.awardedBy}</span></p>}
        {award.description && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/70 sm:text-base">{award.description}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/awards" className={BTN_GOLD}>View all awards <ArrowRight size={15} /></Link>
          <ShareButton url={url} title={`${award.title} — ${award.recipientName}`}
            description={award.description || `${award.type === "member" ? "Member" : "Club"} award by Leo Club of KUSMS`}
            meta={`${award.month} · Leo Year ${award.year}`} variant="full" label="Share"
            className="!bg-white/10 !border-white/25 !text-white hover:!bg-white/20" />
        </div>
      </div>
    </div>
  );
}

function EventSlide(ev: ClubEvent) {
  const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(d).toLocaleDateString("en-GB", o);
  const dateStr = ev.endDate && ev.endDate !== ev.date
    ? `${fmt(ev.date, { day: "numeric", month: "short" })} – ${fmt(ev.endDate, { day: "numeric", month: "short", year: "numeric" })}`
    : fmt(ev.date, { day: "numeric", month: "long", year: "numeric" });
  const canApply = ev.applicationsEnabled && ev.status !== "cancelled" &&
    (!ev.applicationDeadline || ev.applicationDeadline >= nepalToday());
  return (
    <>
      <Backdrop src={ev.photoUrl} />
      <div className="relative px-6 py-10 sm:px-12 sm:py-14">
        <Tag><Pin size={11} /> Featured event · {dateStr}</Tag>
        <h3 className="font-display max-w-xl text-2xl font-semibold leading-tight sm:text-4xl">{ev.title}</h3>
        {ev.description && <p className="mb-6 mt-3 line-clamp-3 max-w-lg text-base leading-relaxed text-white/70">{ev.description}</p>}
        <div className="mb-6 flex flex-wrap gap-4 text-sm text-white/65">
          {ev.location && <span className="flex items-center gap-2"><MapPin size={15} className="text-[#D4AF37]" />{ev.location}</span>}
          {ev.eventType && <span className="flex items-center gap-2"><Calendar size={15} className="text-[#D4AF37]" />{ev.eventType}</span>}
          {ev.applicationsEnabled && <span className="flex items-center gap-2 text-emerald-300"><Users size={15} />{ev.applicationType || "Applications open"}</span>}
        </div>
        {ev.applicationPrompt && <p className="mb-6 max-w-lg text-sm italic text-white/70">{ev.applicationPrompt}</p>}
        <Link href="/events" className={BTN_GOLD}>
          {canApply ? `Apply as ${ev.applicationType || "applicant"}` : "View event details"} <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Service impact                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function ServiceImpactSection({ impact, activities, leoYear, memberCount, activityCount, ready }: {
  impact: ServiceImpact | null; activities: Activity[]; leoYear: string;
  memberCount: number; activityCount: number; ready: boolean;
}) {
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [ref, seen] = useInView<HTMLElement>();
  const go = seen && ready;

  const volunteers = useMemo(() => computeVolunteersFromActivities(activities, leoYear), [activities, leoYear]);
  const funds = (npr?: number, usd?: number) => (currency === "USD" ? usd : npr) ?? 0;

  const years = useMemo(() => {
    const est = new Date("June 11, 2024");
    const now = new Date();
    let y = now.getFullYear() - est.getFullYear();
    if (now.getMonth() < est.getMonth() || (now.getMonth() === est.getMonth() && now.getDate() < est.getDate())) y -= 1;
    return Math.max(1, y);
  }, []);

  const people = useCountUp(impact?.peopleServed ?? 0, go);
  const vols = useCountUp(volunteers, go);
  const hours = useCountUp(impact?.volunteerHours ?? 0, go);
  const members = useCountUp(memberCount, go, 1400);
  const acts = useCountUp(activityCount, go);
  const yrs = useCountUp(years, go, 1200);

  // Plain function, not a component: a component defined here would remount every animation frame.
  const val = (v: string) =>
    ready ? v : <span className="inline-block h-7 w-16 animate-pulse rounded bg-white/10 align-middle" />;

  const tiles = [
    { label: "People served", value: formatImpactNumber(people), Icon: Heart },
    { label: "Volunteers", value: formatImpactNumber(vols), Icon: Users },
    { label: "Volunteer hours", value: formatImpactNumber(hours), Icon: Clock },
    { label: "Funds donated", value: formatCurrency(funds(impact?.fundsDonatedNpr, impact?.fundsDonatedUsd), currency), Icon: DollarSign },
    { label: "Funds raised", value: formatCurrency(funds(impact?.fundsRaisedNpr, impact?.fundsRaisedUsd), currency), Icon: TrendingUp },
  ];
  const snapshot = [
    { label: "Active members", value: `${members}`, Icon: Users },
    { label: "Activities completed", value: `${acts}`, Icon: Calendar },
    { label: "Years of service", value: `${yrs}+`, Icon: Shield },
  ];

  return (
    <section ref={ref} className={`${NAVY_PANEL} px-4 py-10 sm:px-8 sm:py-12 ${LAZY}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.18),transparent_65%)]" />
      <div className="relative">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[#D4AF37]"><Heart size={14} /> Our service impact</p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Leo Year {leoYear}</h2>
            <p className="mt-2 max-w-xl text-sm text-white/60">Lives touched, hours served, and generosity given — counted as we go.</p>
          </div>
          <div className="flex items-center gap-1 self-start rounded-xl border border-white/15 bg-white/10 p-1" role="group" aria-label="Currency">
            {(["NPR", "USD"] as const).map((c) => (
              <button key={c} onClick={() => setCurrency(c)} aria-pressed={currency === c}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${currency === c ? "bg-[#D4AF37] text-[#002147]" : "text-white/60 hover:text-white"}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {tiles.map(({ label, value, Icon }, k) => (
            <div key={label} className={`rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center ${k === 0 ? "col-span-2 md:col-span-1" : ""}`}>
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/20"><Icon size={16} className="text-[#D4AF37]" /></div>
              <div className="font-display break-words text-2xl font-semibold tabular-nums leading-tight sm:text-3xl">{val(value)}</div>
              <div className="mt-1 text-xs text-white/55">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
          {snapshot.map(({ label, value, Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Icon size={13} className="text-[#D4AF37]" />
                <span className="text-lg font-bold tabular-nums">{val(value)}</span>
              </div>
              <div className="mt-0.5 text-xs leading-tight text-white/55">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-xs text-white/55 sm:flex-row">
          {impact ? (
            <span>Last updated {new Date(impact.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          ) : ready ? (
            <span className="italic">Impact data for this Leo Year will appear once added by admin.</span>
          ) : null}
          <Link href="/stats" className="flex items-center gap-1 font-semibold text-[#D4AF37] hover:underline">View full impact report <ArrowRight size={12} /></Link>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  President + announcements                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function PresidentCard({ president, whatsappNumber, whatsappMessage }: { president: BodMember; whatsappNumber?: string; whatsappMessage?: string }) {
  const photo = "h-72 w-full max-w-[18rem] rounded-2xl object-cover object-top shadow-2xl ring-2 ring-[#D4AF37] sm:h-96";
  return (
    <div className={NAVY_PANEL}>
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.16),transparent_65%)]" />
      <div className="relative flex flex-col items-center gap-8 p-6 sm:p-10 md:flex-row md:items-start">
        {president.photoUrl ? (
          <img src={president.photoUrl} alt={president.name} width={288} height={384} loading="lazy" decoding="async" className={photo} />
        ) : (
          <div className={`${photo} flex items-center justify-center bg-[#D4AF37]`}><span className="font-display text-8xl font-bold text-[#002147]">{president.name.charAt(0)}</span></div>
        )}
        <div className="flex-1 text-center md:text-left">
          <Tag><Award size={12} /> {president.role}</Tag>
          <h3 className="font-display text-3xl font-semibold sm:text-4xl">{president.name}</h3>
          {president.bio && <p className="mt-3 text-base leading-relaxed text-white/70">{president.bio}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            {president.email && <a href={`mailto:${president.email}`} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"><Mail size={14} className="text-[#D4AF37]" />{president.email}</a>}
            {president.phone && <a href={`tel:${president.phone}`} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"><Phone size={14} className="text-[#D4AF37]" />{president.phone}</a>}
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage || "Hello President, I would like to connect with Leo Club of KUSMS.")}`}
                target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold transition hover:bg-[#20b858]">
                <MessageCircle size={14} /> Contact president
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ANN_STYLES = {
  info: { bg: "bg-blue-50 border-blue-200", icon: "text-blue-600", title: "text-blue-900", body: "text-blue-700", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
  update: { bg: "bg-amber-50 border-amber-200", icon: "text-amber-600", title: "text-amber-900", body: "text-amber-700", btn: "bg-amber-600 hover:bg-amber-700 text-white" },
  event: { bg: "bg-green-50 border-green-200", icon: "text-green-600", title: "text-green-900", body: "text-green-700", btn: "bg-green-600 hover:bg-green-700 text-white" },
} as const;

function AnnouncementBanner({ ann, onDismiss }: { ann: Announcement; onDismiss: () => void }) {
  const c = ANN_STYLES[ann.type];
  const external = ann.linkUrl ? /^https?:\/\//i.test(ann.linkUrl) : false;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 sm:gap-4 sm:px-5 ${c.bg}`}>
      {ann.imageUrl && (
        <img src={ann.imageUrl} alt="" width={80} height={80} loading="lazy" decoding="async"
          className="h-16 w-16 shrink-0 rounded-xl border border-white/60 bg-white object-cover sm:h-20 sm:w-20"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
      <Megaphone size={18} className={`mt-0.5 hidden shrink-0 sm:block ${c.icon}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm font-bold ${c.title}`}>{ann.title}</span>
          {ann.pinned && <span className="flex items-center gap-1 text-xs font-semibold opacity-60"><Pin size={10} /> Pinned</span>}
          <span className={`text-xs opacity-60 ${c.body}`}>{new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
        {ann.body && <p className={`mt-0.5 text-sm ${c.body}`}>{ann.body}</p>}
        {ann.linkLabel && ann.linkUrl && (
          <a href={ann.linkUrl} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${c.btn}`}>
            {ann.label || ann.linkLabel} <ArrowRight size={12} />
          </a>
        )}
      </div>
      <button onClick={onDismiss} aria-label="Dismiss announcement" className={`shrink-0 rounded-lg p-1 transition-colors hover:bg-black/10 ${c.icon}`}><XIcon size={14} /></button>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }).catch(() => {}); }}
      aria-label="Copy account number"
      className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#D4AF37] hover:text-[#002147]">
      {done ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const leoYear = getCurrentLeoYear();

  // Each piece loads on its own; nothing waits on the slowest query.
  const settingsR = useResource(getClubSettings, {} as ClubSettings);
  const impactR = useResource(() => getServiceImpact(leoYear), null as ServiceImpact | null);
  const annR = useResource(getAnnouncements, [] as Announcement[]);
  const eventsR = useResource(getClubEvents, [] as ClubEvent[]);
  const awardsR = useResource(getAwards, [] as AwardType[]);
  const featActR = useResource(getFeaturedActivities, [] as Activity[]);
  const bodR = useResource(getBodMembers, [] as BodMember[]);
  const membersR = useResource(getMembers, [] as Member[]);
  const activitiesR = useResource(getActivities, [] as Activity[]);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const settings = settingsR.data;
  const slogan = formatPresidentSlogan(settings.presidentSlogan);
  const president = bodR.data[0] ?? null;

  const announcements = useMemo(
    () => annR.data.filter((a) => !dismissed.has(a.id) && !isAnnouncementExpired(a)),
    [annR.data, dismissed]
  );

  const featuredAwards = useMemo(() => {
    const explicit = awardsR.data.filter((a) => a.featured);
    if (explicit.length) return explicit;
    return [...awardsR.data]
      .sort((a, b) => (b.year ?? "").localeCompare(a.year ?? "") || MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month))
      .slice(0, 3);
  }, [awardsR.data]);

  const featuredEvents = useMemo(() => {
    const today = nepalToday();
    return eventsR.data
      .filter((e) => e.pinned && e.status !== "cancelled" && (e.endDate || e.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [eventsR.data]);

  const joinHref = settings.membershipChairWhatsApp
    ? `https://wa.me/${settings.membershipChairWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(settings.membershipChairWhatsAppMessage || "Hello! I'm interested in joining Leo Club of KUSMS.")}`
    : CLUB_FACEBOOK;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F6F8FB]">
      <style>{CSS}</style>

      {/* ═══ HERO ═══ */}
      <header className="relative isolate overflow-hidden bg-[#001833] text-white">
        <div className="absolute inset-0 -z-10" style={{
          background:
            "radial-gradient(50rem 32rem at 85% -10%,rgba(212,175,55,.22),transparent 60%),radial-gradient(40rem 30rem at -5% 110%,rgba(0,86,170,.45),transparent 60%),linear-gradient(180deg,#002147,#001833)",
        }} />
        <div className="absolute inset-0 -z-10 opacity-[0.12]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          WebkitMaskImage: "linear-gradient(to bottom,black,transparent 80%)",
          maskImage: "linear-gradient(to bottom,black,transparent 80%)",
        }} />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.25fr_.75fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="hp-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-1.5 text-sm font-medium text-[#f1d77f]">
              <Award size={14} /> Lions Clubs International · District 325L · Club #{CLUB_ID}
            </p>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.08] sm:text-6xl">
              Leo Club of Kathmandu University
              <span className="gold-text mt-2 block text-3xl sm:text-5xl">School of Medical Sciences</span>
            </h1>
            <p className="mt-5 text-xl font-light text-white/85 sm:text-2xl">Leadership through service</p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/60">
              A community of future medical professionals committed to service, leadership, and meaningful impact in our community.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#donate" className={BTN_GOLD}><Heart size={17} /> Donate now</a>
              <Link href="/about" className={BTN_GHOST}>About us <ArrowRight size={16} /></Link>
              <Link href="/members" className={BTN_GHOST}><Users size={16} /> Our members</Link>
            </div>
          </div>

          {/* Crest: pure CSS rings around the logo, no heavy image */}
          <div className="relative mx-auto hidden h-80 w-80 lg:block" aria-hidden="true">
            <div className="hp-orbit absolute inset-0 rounded-full border border-dashed border-[#D4AF37]/40" />
            <div className="absolute inset-6 rounded-full border border-[#D4AF37]/25" />
            <div className="absolute inset-12 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.2),transparent_70%)]" />
            <img src="/logo.png" alt="" width={192} height={192} fetchPriority="high" decoding="async"
              className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_10px_30px_rgba(212,175,55,.45)]" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-16 px-4 pb-16 sm:px-6 lg:px-8">

        {/* Club facts bar overlaps the hero edge */}
        <div className={`${CARD} -mt-10 grid grid-cols-3 divide-x divide-slate-100 py-4 text-center`}>
          {[
            { k: "Chartered", v: `${CLUB_ESTABLISHED}` },
            { k: "District", v: "325L" },
            { k: "Club ID", v: `#${CLUB_ID}` },
          ].map(({ k, v }) => (
            <div key={k} className="px-2">
              <div className="font-display text-lg font-semibold text-[#002147] sm:text-2xl">{v}</div>
              <div className="text-xs text-slate-500">{k}</div>
            </div>
          ))}
        </div>

        {/* ═══ PRESIDENT'S SLOGAN ═══ */}
        {settings.presidentSlogan && (
          <section className={`${NAVY_PANEL} ${LAZY}`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_90%_0%,rgba(212,175,55,.18),transparent_60%)]" />
            <div className="relative flex flex-col items-center gap-8 px-6 py-10 md:flex-row md:gap-12 md:px-12 md:py-12">
              {settings.presidentSloganPhotoUrl && (
                <img src={settings.presidentSloganPhotoUrl} alt="President" width={176} height={176} loading="lazy" decoding="async"
                  className="h-32 w-32 shrink-0 rounded-3xl border border-[#D4AF37]/70 bg-white object-contain p-3 shadow-[0_16px_40px_rgba(0,0,0,.3)] sm:h-40 sm:w-40 md:h-44 md:w-44" />
              )}
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm font-medium text-[#D4AF37]">{getCurrentLeoYearLabel()} · President&apos;s slogan</p>
                <div className="relative mt-4">
                  <span aria-hidden="true" className="font-display absolute -left-1 -top-6 text-7xl leading-none text-[#D4AF37]/80 sm:-left-3 sm:-top-8 sm:text-8xl">“</span>
                  <p className="font-display max-w-4xl pl-6 text-2xl font-semibold leading-snug sm:pl-9 sm:text-4xl lg:text-5xl">{slogan}</p>
                </div>
                {(settings.presidentSloganName || settings.presidentSloganRole) && (
                  <div className="mt-6 text-sm">
                    {settings.presidentSloganName && <div className="font-semibold text-white/85">{settings.presidentSloganName}</div>}
                    {settings.presidentSloganRole && <div className="text-xs text-[#D4AF37]">{settings.presidentSloganRole}</div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ═══ SERVICE IMPACT ═══ */}
        <ServiceImpactSection
          impact={impactR.data}
          activities={activitiesR.data}
          leoYear={leoYear}
          memberCount={membersR.data.length}
          activityCount={activitiesR.data.length}
          ready={impactR.loaded && membersR.loaded && activitiesR.loaded}
        />

        {/* ═══ ANNOUNCEMENTS ═══ */}
        {announcements.length > 0 && (
          <section className="space-y-3" aria-label="Announcements">
            {announcements.map((a) => (
              <AnnouncementBanner key={a.id} ann={a} onDismiss={() => setDismissed((p) => new Set(p).add(a.id))} />
            ))}
          </section>
        )}

        {/* ═══ EVENTS ═══ */}
        {!eventsR.loaded ? <Skeleton /> : featuredEvents.length > 0 && (
          <section className={LAZY}>
            <SectionHead title="Upcoming events" sub={featuredEvents.length === 1 ? "Our next big event" : "Featured events — don't miss these"} href="/events" cta="View all events" />
            <Carousel items={featuredEvents} label="event" render={EventSlide} />
          </section>
        )}

        {/* ═══ AWARDS ═══ */}
        {!awardsR.loaded ? <Skeleton className="h-96" /> : featuredAwards.length > 0 && (
          <section className={LAZY}>
            <SectionHead title="Featured awards" sub="Recognition of our members and club achievements" href="/awards" cta="All awards" />
            <Carousel items={featuredAwards} label="award" render={AwardSlide} />
          </section>
        )}

        {/* ═══ LEADERSHIP ═══ */}
        {!bodR.loaded ? <Skeleton className="h-96" /> : president && (
          <section className={LAZY}>
            <SectionHead title="Our leadership" sub="The team guiding our club this year" href="/about" cta="View full board" />
            <PresidentCard president={president} whatsappNumber={settings.presidentWhatsApp} whatsappMessage={settings.presidentWhatsAppMessage} />
          </section>
        )}

        {/* ═══ ACTIVITIES ═══ */}
        {!featActR.loaded ? <Skeleton /> : featActR.data.length > 0 && (
          <section className={LAZY}>
            <SectionHead title="Featured activities" sub="Highlights from our recent service work" href="/archive" cta="Full archive" />
            <Carousel items={featActR.data} label="activity" interval={4500} render={ActivitySlide} />
          </section>
        )}

        {/* ═══ BECOME A LEO ═══ */}
        <section className={`${CARD} overflow-hidden ${LAZY}`}>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-bold text-[#002147]"><Heart size={12} className="text-[#b8912a]" /> Become a Leo</p>
              <h2 className="font-display mt-4 text-3xl font-semibold text-[#002147]">Join our community</h2>
              <p className="mt-3 leading-relaxed text-slate-500">
                Are you a KUSMS student or any student around us who wants to lead, serve, and grow? Leo Club of KUSMS welcomes passionate individuals who believe in making a difference through service.
              </p>
              <ul className="my-6 space-y-3">
                {[
                  "Participate in health camps and community service",
                  "Develop leadership and teamwork skills",
                  "Network with Lions Clubs International members",
                  "Earn recognition, awards, and verified certificates",
                  "Build lasting friendships at KUSMS",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20"><Star size={10} className="text-[#b8912a]" /></span>{t}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1565c0]"><Facebook size={15} /> Message us on Facebook</a>
                <a href={joinHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20b858]"><MessageCircle size={15} /> WhatsApp</a>
              </div>
            </div>
            <div className="flex flex-col justify-center bg-[#002147] p-8 text-white md:p-10">
              <h3 className="font-display text-xl font-semibold">Who can join?</h3>
              <div className="mt-6 space-y-4">
                {[
                  { t: "KUSMS student", d: "Currently enrolled at Kathmandu University School of Medical Sciences can be General Members" },
                  { t: "Any student around us", d: "Currently enrolled at any school can be Associate Members" },
                  { t: "Passionate about service", d: "Willing to commit time to community service and club activities" },
                  { t: "Age 12–30", d: "Open to all Leo-eligible age groups as per Lions Clubs International" },
                ].map(({ t, d }) => (
                  <div key={t} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/20"><Shield size={14} className="text-[#D4AF37]" /></span>
                    <div><div className="text-sm font-semibold">{t}</div><div className="mt-0.5 text-xs leading-relaxed text-white/55">{d}</div></div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
                <div className="text-sm font-bold text-[#D4AF37]">Chartered since {CLUB_ESTABLISHED}</div>
                <div className="mt-1 text-xs text-white/55">Lions Clubs International · District 325L · Club #{CLUB_ID}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ DONATE ═══ */}
        <section id="donate" className={`${CARD} scroll-mt-6 overflow-hidden ${LAZY}`}>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col justify-center p-8 md:p-10">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-bold text-[#002147]"><Heart size={12} className="text-[#b8912a]" /> Support us</p>
              <h2 className="font-display mt-4 text-3xl font-semibold text-[#002147]">Donate now</h2>
              <p className="mb-6 mt-3 leading-relaxed text-slate-500">Your contribution helps us run health camps, community outreach, and service activities. Every donation makes a difference.</p>
              {(settings.donationBankName || settings.donationAccountName || settings.donationAccountNumber) && (
                <dl className="space-y-3 rounded-2xl border border-slate-200 bg-[#F6F8FB] p-5">
                  {settings.donationBankName && <div className="flex items-center justify-between gap-4"><dt className="text-sm text-slate-500">Bank</dt><dd className="text-sm font-semibold text-[#002147]">{settings.donationBankName}</dd></div>}
                  {settings.donationAccountName && <div className="flex items-center justify-between gap-4"><dt className="text-sm text-slate-500">Account name</dt><dd className="text-sm font-semibold text-[#002147]">{settings.donationAccountName}</dd></div>}
                  {settings.donationAccountNumber && (
                    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                      <dt className="text-sm text-slate-500">Account no.</dt>
                      <dd className="flex items-center font-mono text-base font-bold tracking-wide text-[#002147]">{settings.donationAccountNumber}<CopyButton text={settings.donationAccountNumber} /></dd>
                    </div>
                  )}
                  {settings.donationNote && <p className="border-t border-slate-100 pt-3 text-xs italic text-slate-400">{settings.donationNote}</p>}
                </dl>
              )}
            </div>
            <div className="flex flex-col items-center justify-center gap-5 bg-[#002147] p-8 md:p-10">
              {settings.donationQrUrl ? (
                <>
                  <div className="rounded-2xl bg-white p-4 shadow-lg"><img src={settings.donationQrUrl} alt="Donation QR code" width={192} height={192} loading="lazy" decoding="async" className="h-48 w-48 object-contain" /></div>
                  <p className="text-center text-sm text-white/60">Scan the QR code to donate</p>
                </>
              ) : (
                <div className="text-center text-white/40"><Heart size={48} className="mx-auto mb-3 opacity-40" /><p className="text-sm">QR code coming soon</p></div>
              )}
              <a href="mailto:leoclubofkusms@gmail.com?subject=Donation Inquiry" className={BTN_GOLD}><Mail size={15} /> Contact for queries</a>
            </div>
          </div>
        </section>

        {/* ═══ EXPLORE ═══ */}
        <section className={`${NAVY_PANEL} p-8 text-center md:p-12 ${LAZY}`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(34rem_16rem_at_50%_0%,rgba(212,175,55,.2),transparent_65%)]" />
          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#e3c458] to-[#c9a432]"><Shield size={26} className="text-[#002147]" /></div>
            <h2 className="font-display text-3xl font-semibold">Explore more</h2>
            <p className="mb-7 mt-2 text-white/60">Dive deeper into our club — member directory, activities, awards, and more.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/members" className={BTN_GOLD}><Users size={16} /> Member directory</Link>
              <Link href="/archive" className={BTN_GHOST}><Calendar size={16} /> Activity archive</Link>
              <Link href="/awards" className={BTN_GHOST}><Trophy size={16} /> Awards</Link>
              <Link href="/stats" className={BTN_GHOST}><BarChart3 size={16} /> Statistics</Link>
              <Link href="/about" className={BTN_GHOST}><Info size={16} /> About us</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}