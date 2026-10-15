import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { getBodMembers, getLeaderQuotes, getPastLeaders, getClubSettings } from "@/lib/firestore";
import type { BodMember, LeaderQuote, PastLeader, ClubSettings } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK, CLUB_ID } from "@/lib/types";
import { Mail, Phone, ArrowLeft, Award, Heart, Target, Users, Calendar, Facebook, ExternalLink, Crown, Play, Pause, MessageCircle } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shared bits                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const CSS = `
.font-display{font-family:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;letter-spacing:-.015em}
.gold-text{background:linear-gradient(100deg,#b8912a,#f1d77f 45%,#d4af37);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
@keyframes ab-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes ab-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes ab-shimmer{to{background-position:-200% 0}}
@keyframes ab-bar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.ab-rise{animation:ab-rise .8s cubic-bezier(.22,1,.36,1) both}
.ab-fade{animation:ab-fade .45s ease both}
.ab-bar{transform-origin:50% 100%;animation:ab-bar 900ms ease-in-out infinite}
.ab-skel{background:linear-gradient(90deg,rgba(0,33,71,.06) 25%,rgba(0,33,71,.12) 50%,rgba(0,33,71,.06) 75%);background-size:200% 100%;animation:ab-shimmer 1.4s linear infinite}
@media (prefers-reduced-motion:reduce){.ab-rise,.ab-fade,.ab-bar,.ab-skel{animation:none!important}}
`;

const LAZY = "[content-visibility:auto] [contain-intrinsic-size:auto_520px]";
const CARD = "rounded-3xl border border-[#002147]/[0.06] bg-white shadow-[0_1px_2px_rgba(0,33,71,.04),0_18px_40px_-18px_rgba(0,33,71,.22)]";
const NAVY = "relative overflow-hidden rounded-3xl bg-[#002147] text-white shadow-[0_24px_60px_-20px_rgba(0,33,71,.55)] ring-1 ring-[#D4AF37]/25";
const BTN_GOLD = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e3c458] to-[#c9a432] px-5 py-2.5 text-sm font-semibold text-[#002147] shadow-[0_6px_18px_-6px_rgba(212,175,55,.6)] transition hover:brightness-105 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]";
const BTN_GHOST = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const CHIP = "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20 sm:text-sm";

/** Each query loads independently, so one slow collection never blocks the rest. */
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

/** One audio player for the whole page: starting a clip stops the previous one, and it stops on unmount. */
function useSinglePlayer() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [id, setId] = useState<string | null>(null);

  const stop = useCallback(() => {
    ref.current?.pause();
    ref.current = null;
    setId(null);
  }, []);

  useEffect(() => stop, [stop]);

  const toggle = useCallback((nextId: string, url: string) => {
    if (ref.current && id === nextId) { stop(); return; }
    stop();
    const a = new Audio(url);
    a.preload = "none";
    ref.current = a;
    setId(nextId);
    const done = () => { if (ref.current === a) stop(); };
    a.onended = done;
    a.onerror = done;
    a.play().catch(done);
  }, [id, stop]);

  return { id, toggle, stop };
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="font-display text-3xl font-semibold text-[#002147] sm:text-4xl">{title}</h2>
      <div className="mx-auto mt-3 h-[3px] w-10 rounded-full bg-[#D4AF37]" />
      {sub && <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

function Skeleton({ className = "h-72" }: { className?: string }) {
  return <div className={`ab-skel rounded-3xl ${className}`} aria-hidden="true" />;
}

/** Portrait that keeps faces in frame (object-top) and falls back to an initial or icon. */
function Portrait({ src, name, className = "", fallback }: { src?: string; name: string; className?: string; fallback?: ReactNode }) {
  return src ? (
    <img src={src} alt={name} loading="lazy" decoding="async" className={`h-full w-full object-cover object-top ${className}`} />
  ) : (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#003575] to-[#001a38] ${className}`}>
      {fallback ?? <span className="font-display text-6xl font-semibold text-[#D4AF37]">{name.charAt(0)}</span>}
    </div>
  );
}

function PlayButton({ playing, onClick, label, dark = false }: { playing: boolean; onClick: () => void; label: string; dark?: boolean }) {
  return (
    <button onClick={onClick} aria-pressed={playing}
      className={`inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-xs font-semibold transition ${
        dark
          ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
          : "bg-[#002147]/5 text-[#002147] ring-1 ring-[#002147]/10 hover:bg-[#002147]/10"
      }`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#e3c458] to-[#c9a432] text-[#002147]">
        {playing ? <Pause size={13} /> : <Play size={13} className="translate-x-px" />}
      </span>
      {playing ? (
        <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
          {[0, 1, 2, 3].map((k) => <span key={k} className="ab-bar block h-4 w-[3px] rounded-full bg-[#D4AF37]" style={{ animationDelay: `${k * 120}ms` }} />)}
        </span>
      ) : null}
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Board                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function PresidentFeature({ p, settings }: { p: BodMember; settings: ClubSettings }) {
  const wa = settings.presidentWhatsApp;
  return (
    <div className={`${NAVY} mb-8`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_22rem_at_100%_0%,rgba(212,175,55,.18),transparent_60%)]" />
      <div className="relative grid lg:grid-cols-[22rem_1fr]">
        {/* Photo runs edge to edge: top of the card on phones, left column on desktop */}
        <div className="relative aspect-[4/5] bg-[#001a38] sm:aspect-[16/11] lg:aspect-auto lg:min-h-[30rem]">
          <Portrait src={p.photoUrl} name={p.name} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#002147] via-[#002147]/60 to-transparent lg:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-[#002147] to-transparent lg:block" />
        </div>
        <div className="relative -mt-20 px-6 pb-8 text-center sm:px-10 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:p-12 lg:text-left">
          <p className="inline-flex w-fit items-center gap-1.5 self-center rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#002147] lg:self-start"><Award size={12} /> {p.role}</p>
          <h3 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{p.name}</h3>
          <div className="mx-auto mt-4 h-[3px] w-10 rounded-full bg-[#D4AF37] lg:mx-0" />
          {p.bio && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 lg:mx-0">{p.bio}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {p.email && <a href={`mailto:${p.email}`} className={CHIP}><Mail size={13} className="text-[#D4AF37]" />{p.email}</a>}
            {p.phone && <a href={`tel:${p.phone}`} className={CHIP}><Phone size={13} className="text-[#D4AF37]" />{p.phone}</a>}
            {wa && (
              <a href={`https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(settings.presidentWhatsAppMessage || "Hello President, I would like to connect with Leo Club of KUSMS.")}`}
                target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-semibold transition hover:bg-[#20b858] sm:text-sm">
                <MessageCircle size={13} /> WhatsApp president
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Portrait tile: the photo is the card, name sits on a gradient, nothing is cropped to a landscape box. */
function BodTile({ m }: { m: BodMember }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#002147]/[0.06] bg-white shadow-[0_1px_2px_rgba(0,33,71,.04),0_14px_30px_-16px_rgba(0,33,71,.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-16px_rgba(0,33,71,.35)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#001a38]">
        <div className="h-full w-full transition duration-500 group-hover:scale-[1.04]"><Portrait src={m.photoUrl} name={m.name} /></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#001a38] via-[#001a38]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="font-display text-lg font-semibold leading-tight sm:text-xl">{m.name}</h3>
          <p className="mt-0.5 text-xs font-semibold text-[#e3c458] sm:text-sm">{m.role}</p>
        </div>
      </div>
      {(m.bio || m.email || m.phone) && (
        <div className="p-4">
          {m.bio && <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{m.bio}</p>}
          {(m.email || m.phone) && (
            <div className={`flex gap-2 ${m.bio ? "mt-3" : ""}`}>
              {m.email && <a href={`mailto:${m.email}`} aria-label={`Email ${m.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#002147]"><Mail size={15} /></a>}
              {m.phone && <a href={`tel:${m.phone}`} aria-label={`Call ${m.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#002147]"><Phone size={15} /></a>}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Leader voices: one spotlighted quote, picked from a row of faces          */
/* ────────────────────────────────────────────────────────────────────────── */

function QuoteStage({ quotes, player }: { quotes: LeaderQuote[]; player: ReturnType<typeof useSinglePlayer> }) {
  const [sel, setSel] = useState(0);
  const q = quotes[sel % quotes.length];
  const pid = `q:${q.id}`;

  return (
    <div className={NAVY}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(36rem_20rem_at_0%_0%,rgba(212,175,55,.18),transparent_60%)]" />
      <div key={q.id} className="ab-fade relative grid gap-8 p-6 sm:p-10 md:grid-cols-[15rem_1fr] md:items-center md:gap-12 lg:p-12">
        <div className="mx-auto aspect-[4/5] w-44 overflow-hidden rounded-2xl bg-[#001a38] shadow-2xl ring-2 ring-[#D4AF37]/60 md:w-full">
          <Portrait src={q.photoUrl} name={q.name} />
        </div>
        <div className="text-center md:text-left">
          <span aria-hidden="true" className="font-display block h-12 text-7xl leading-none text-[#D4AF37]/80 sm:h-14 sm:text-8xl">“</span>
          <blockquote className="font-display text-xl font-medium leading-snug sm:text-3xl">{q.quote}</blockquote>
          <div className="mt-6">
            <div className="font-semibold text-white">{q.name}</div>
            <div className="text-sm text-[#e3c458]">{q.role}{q.leoYear ? ` · ${q.leoYear}` : ""}</div>
            {q.introduction && <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-white/55 md:mx-0">{q.introduction}</p>}
          </div>
          {q.audioUrl && (
            <div className="mt-5">
              <PlayButton dark playing={player.id === pid} onClick={() => player.toggle(pid, q.audioUrl!)} label={player.id === pid ? "Stop" : "Hear it in their voice"} />
            </div>
          )}
        </div>
      </div>

      {quotes.length > 1 && (
        <div className="relative border-t border-white/10 bg-black/15 px-4 py-4 sm:px-8">
          <div role="tablist" aria-label="Choose a leader" className="flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
            {quotes.map((x, k) => {
              const on = k === sel % quotes.length;
              return (
                <button key={x.id} role="tab" aria-selected={on} aria-label={x.name}
                  onClick={() => { if (!on) { player.stop(); setSel(k); } }}
                  className={`group shrink-0 snap-center rounded-full p-0.5 transition ${on ? "bg-gradient-to-b from-[#f1d77f] to-[#c9a432]" : "bg-white/15 hover:bg-white/30"}`}>
                  <span className={`block h-12 w-12 overflow-hidden rounded-full border-2 border-[#002147] transition sm:h-14 sm:w-14 ${on ? "" : "opacity-60 group-hover:opacity-100"}`}>
                    <Portrait src={x.photoUrl} name={x.name} fallback={<span className="font-semibold text-[#D4AF37]">{x.name.charAt(0)}</span>} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Past leaders: a timeline grouped by Leo year                              */
/* ────────────────────────────────────────────────────────────────────────── */

function PastLeaderTile({ l, player }: { l: PastLeader; player: ReturnType<typeof useSinglePlayer> }) {
  const pid = `p:${l.id}`;
  return (
    <article className={`${CARD} overflow-hidden md:flex`}>
      <div className="aspect-[4/3] bg-[#001a38] md:aspect-auto md:min-h-[18rem] md:w-72 md:shrink-0 lg:w-80">
        <Portrait src={l.photoUrl} name={l.name} fallback={<Crown size={44} className="text-[#D4AF37]" />} />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 md:flex-1">
        <h4 className="font-display text-2xl font-semibold leading-tight text-[#002147]">{l.name}</h4>
        <p className="mt-1 text-sm font-semibold text-[#b8912a]">{l.role}</p>
        {l.note && <p className="mt-3 text-sm italic leading-relaxed text-slate-500">{l.note}</p>}
        {l.quote && (
          <blockquote className="mt-4 border-l-2 border-[#D4AF37] pl-4 font-display text-lg leading-relaxed text-slate-700">
            {l.quote}
          </blockquote>
        )}
        {l.audioUrl && <div className="mt-5"><PlayButton playing={player.id === pid} onClick={() => player.toggle(pid, l.audioUrl!)} label={player.id === pid ? "Stop" : "Listen to voice"} /></div>}
      </div>
    </article>
  );
}

function PastLeaderTimeline({ leaders, player }: { leaders: PastLeader[]; player: ReturnType<typeof useSinglePlayer> }) {
  const groups = useMemo(() => {
    const sorted = [...leaders].sort((a, b) => (a.leoYear ?? "").localeCompare(b.leoYear ?? "") || a.order - b.order);
    const map = new Map<string, PastLeader[]>();
    for (const l of sorted) {
      const key = l.leoYear || "Earlier";
      const list = map.get(key);
      if (list) list.push(l); else map.set(key, [l]);
    }
    return [...map];
  }, [leaders]);

  return (
    <div className="relative ml-2 space-y-12 border-l border-[#D4AF37]/45 pl-6 sm:ml-4 sm:pl-10">
      {groups.map(([year, list]) => (
        <div key={year} className="relative">
          <span className="absolute -left-[31px] top-2 h-3 w-3 rounded-full bg-[#D4AF37] ring-4 ring-[#F6F8FB] sm:-left-[47px]" aria-hidden="true" />
          <h3 className="font-display mb-5 text-2xl font-semibold text-[#002147]">{year}</h3>
          <div className="space-y-6">
            {list.map((l) => <PastLeaderTile key={l.id} l={l} player={player} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

const VALUES = [
  { Icon: Heart, title: "Service", desc: "Community first — volunteering, health camps, blood drives, and outreach that makes a real difference." },
  { Icon: Target, title: "Leadership", desc: "Tomorrow's leaders grow through real responsibility, decisions, and hands-on management of meaningful projects." },
  { Icon: Users, title: "Fellowship", desc: "Lifelong bonds between medical students across batches, united by shared values and a passion for service." },
];

export default function AboutPage() {
  const bodR = useResource(getBodMembers, [] as BodMember[]);
  const quotesR = useResource(getLeaderQuotes, [] as LeaderQuote[]);
  const pastR = useResource(getPastLeaders, [] as PastLeader[]);
  const settingsR = useResource(getClubSettings, {} as ClubSettings);
  const player = useSinglePlayer();

  const settings = settingsR.data;
  const president = bodR.data[0] ?? null;
  const others = bodR.data.slice(1);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F6F8FB]">
      <style>{CSS}</style>

      {/* ═══ HERO ═══ */}
      <header className="relative isolate overflow-hidden bg-[#001833] text-white">
        <div className="absolute inset-0 -z-10" style={{
          background: "radial-gradient(48rem 30rem at 90% -10%,rgba(212,175,55,.22),transparent 60%),radial-gradient(38rem 28rem at -5% 110%,rgba(0,86,170,.45),transparent 60%),linear-gradient(180deg,#002147,#001833)",
        }} />
        <div className="absolute inset-0 -z-10 opacity-[0.1]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          WebkitMaskImage: "linear-gradient(to bottom,black,transparent 85%)",
          maskImage: "linear-gradient(to bottom,black,transparent 85%)",
        }} />
        <div className="ab-rise mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 lg:px-8">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"><ArrowLeft size={16} /> Back to home</Link>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-1.5 text-sm font-medium text-[#f1d77f]">
            <Award size={14} /> Lions Clubs International · District 325L · Club #{CLUB_ID}
          </p>
          <h1 className="font-display mt-6 text-5xl font-semibold leading-[1.05] sm:text-7xl">About <span className="gold-text">our club</span></h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            Leo Club of Kathmandu University School of Medical Sciences — a community of future healthcare leaders united by the spirit of service.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm">
            <Calendar size={14} className="text-[#D4AF37]" />
            <span className="text-white/75">Officially chartered on</span>
            <span className="font-bold">{CLUB_ESTABLISHED}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-24 px-4 py-16 sm:px-6 lg:px-8">

        {/* ═══ MISSION ═══ */}
        <section className={LAZY}>
          <SectionTitle title="Our mission & values" />
          <div className={`${CARD} grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0`}>
            {VALUES.map(({ Icon, title, desc }) => (
              <div key={title} className="p-8 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003575] to-[#001a38] shadow-lg ring-1 ring-[#D4AF37]/30"><Icon size={24} className="text-[#D4AF37]" /></div>
                <h3 className="font-display text-xl font-semibold text-[#002147]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ BOARD ═══ */}
        <section>
          <SectionTitle title="Board of directors" sub="The team guiding the club this Leo year." />
          {!bodR.loaded ? (
            <div className="space-y-6"><Skeleton className="h-80" /><div className="grid grid-cols-2 gap-5 lg:grid-cols-3"><Skeleton className="aspect-[4/5]" /><Skeleton className="aspect-[4/5]" /><Skeleton className="hidden aspect-[4/5] lg:block" /></div></div>
          ) : bodR.data.length === 0 ? (
            <div className="py-12 text-center text-slate-400"><Users size={40} className="mx-auto mb-3 opacity-30" /><p>Board information coming soon.</p></div>
          ) : (
            <>
              {president && <PresidentFeature p={president} settings={settings} />}
              {others.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                  {others.map((m) => <BodTile key={m.id} m={m} />)}
                </div>
              )}
            </>
          )}
        </section>

        {/* ═══ LEADER VOICES ═══ */}
        {!quotesR.loaded ? <Skeleton className="h-96" /> : quotesR.data.length > 0 && (
          <section className={LAZY}>
            <SectionTitle title="What our leaders say" sub="Voices from our current and past leadership." />
            <QuoteStage quotes={quotesR.data} player={player} />
          </section>
        )}

        {/* ═══ PAST LEADERS ═══ */}
        {!pastR.loaded ? <Skeleton className="h-96" /> : pastR.data.length > 0 && (
          <section className={LAZY}>
            <SectionTitle title="Past leaders" sub="Honoring those who led our journey from the chartered year to today." />
            <PastLeaderTimeline leaders={pastR.data} player={player} />
          </section>
        )}

        {/* ═══ CHARTER ═══ */}
        <section className={LAZY}>
          <SectionTitle title="Official charter" sub={`Established by Lions Clubs International · District 325L · Club #${CLUB_ID}`} />
          <div className={NAVY}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(36rem_20rem_at_100%_100%,rgba(212,175,55,.2),transparent_60%)]" />
            <div className="relative flex flex-col items-center gap-10 p-8 md:flex-row md:p-12">
              <div className="flex-1 text-center md:text-left">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#002147]"><Award size={12} /> Officially chartered</p>
                <h3 className="font-display mt-4 text-3xl font-semibold">Leo Club of KUSMS</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Chartered by Lions Clubs International under District 325L · Club #{CLUB_ID}. Handover ceremony held on <span className="font-semibold text-[#e3c458]">{CLUB_ESTABLISHED}</span>.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm md:justify-start">
                  <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><Calendar size={14} className="text-[#D4AF37]" />Established {CLUB_ESTABLISHED}</span>
                  <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><Award size={14} className="text-[#D4AF37]" />District 325L · Club #{CLUB_ID}</span>
                </div>
              </div>
              <div className="shrink-0">
                {settings.charteredCertificateUrl ? (
                  settings.charteredCertificateType === "pdf" ? (
                    <a href={settings.charteredCertificateUrl} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 rounded-2xl bg-white p-8 text-[#002147] shadow-xl transition hover:-translate-y-1">
                      <Award size={40} className="text-[#b8912a]" />
                      <span className="text-sm font-semibold">View certificate (PDF)</span>
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-b from-[#f1d77f] to-[#b8912a] p-1.5 shadow-2xl">
                      <img src={settings.charteredCertificateUrl} alt="Chartered certificate" loading="lazy" decoding="async"
                        className="max-h-[300px] max-w-[240px] rounded-xl bg-white object-contain" />
                    </div>
                  )
                ) : (
                  <div className="flex min-w-[180px] flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/25 bg-white/5 p-8 text-center text-white/55">
                    <Award size={36} className="text-[#D4AF37]/60" />
                    <p className="text-xs">Certificate coming soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FOLLOW + CONTACT ═══ */}
        <section className={LAZY}>
          <SectionTitle title="Stay connected" />
          <div className="mx-auto grid max-w-xl gap-4 sm:grid-cols-2">
            <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer" className={`${CARD} group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-[#1877F2]/30`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] transition-transform group-hover:scale-110"><Facebook size={22} className="text-white" /></span>
              <span><span className="block font-bold text-[#002147]">Facebook</span><span className="text-xs text-slate-400">Official page</span></span>
              <ExternalLink size={14} className="ml-auto text-slate-400" />
            </a>
            <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer" className={`${CARD} group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-slate-300`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black transition-transform group-hover:scale-110"><span className="text-lg font-black text-white">TT</span></span>
              <span><span className="block font-bold text-[#002147]">TikTok</span><span className="text-xs text-slate-400">@leoclub.kusms</span></span>
              <ExternalLink size={14} className="ml-auto text-slate-400" />
            </a>
          </div>

          <div className={`${NAVY} mt-8 p-8 text-center md:p-12`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(34rem_16rem_at_50%_0%,rgba(212,175,55,.2),transparent_65%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold">Get in touch</h2>
              <p className="mb-7 mt-2 text-white/60">Have a question or want to collaborate on a service project?</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="mailto:leoclubofkusms@gmail.com" className={BTN_GOLD}><Mail size={16} /> leoclubofkusms@gmail.com</a>
                <Link href="/members" className={BTN_GHOST}><Users size={16} /> Browse members</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}