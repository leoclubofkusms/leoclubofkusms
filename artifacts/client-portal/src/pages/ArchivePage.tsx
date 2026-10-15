import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { getActivitiesByMonth, getMembers } from "@/lib/firestore";
import type { Activity, Member } from "@/lib/types";
import { LEO_YEARS, getMonthsInLeoOrder, leoMonthToCalendarYear } from "@/lib/types";
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, CircleAlert, Image as ImageIcon, RefreshCw, Users } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { sanitizeActivities } from "@/lib/sanitizeActivities";

interface ArchivePageProps {
  year: string;
  month: string;
}

const CSS = `
.font-display{font-family:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;letter-spacing:-.015em}
.gold-text{background:linear-gradient(100deg,#b8912a,#f1d77f 45%,#d4af37);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
@keyframes ar-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ar-shimmer{to{background-position:-200% 0}}
.ar-rise{animation:ar-rise .7s cubic-bezier(.22,1,.36,1) both}
.ar-skel{background:linear-gradient(90deg,rgba(0,33,71,.06) 25%,rgba(0,33,71,.12) 50%,rgba(0,33,71,.06) 75%);background-size:200% 100%;animation:ar-shimmer 1.4s linear infinite}
.ar-noscroll{scrollbar-width:none}.ar-noscroll::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.ar-rise,.ar-skel{animation:none!important}}
`;

const LAZY = "[content-visibility:auto] [contain-intrinsic-size:auto_720px]";
const CARD = "rounded-3xl border border-[#002147]/[0.06] bg-white shadow-[0_1px_2px_rgba(0,33,71,.04),0_18px_40px_-18px_rgba(0,33,71,.22)]";
const BTN_NAVY = "inline-flex items-center gap-2 rounded-xl bg-[#002147] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#07345e] active:scale-[.98]";
const PARTICIPANT_PREVIEW = 12;
const PHOTO_PREVIEW = 5; // hero + 4 tiles; the rest live on the activity page

function safeCalendarYear(leoYear: string, month: string): string | number {
  try {
    const v = leoMonthToCalendarYear(leoYear, month);
    if (v === undefined || v === null || Number.isNaN(v as number)) return "";
    return v as string | number;
  } catch (e) {
    console.error("leoMonthToCalendarYear failed:", leoYear, month, e);
    return "";
  }
}

const slugify = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/** Scroll a horizontal strip so its current item is centred (the active month can start off-screen on phones). */
function centerCurrent(container: HTMLElement | null) {
  const el = container?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!container || !el) return;
  container.scrollLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
}

function Photo({ src, alt, className = "", eager = false, children }: { src: string; alt: string; className?: string; eager?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`group relative overflow-hidden bg-[#dde5ea] ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      {children}
    </div>
  );
}

function PhotoMosaic({ photos, title, activityHref, eager }: { photos: string[]; title: string; activityHref: string; eager: boolean }) {
  if (photos.length === 1) {
    return <Photo src={photos[0]} alt={`${title} photo 1`} eager={eager} className="aspect-[16/9] max-h-[34rem] w-full rounded-2xl" />;
  }
  const extras = photos.slice(1, PHOTO_PREVIEW);
  const hidden = photos.length - PHOTO_PREVIEW;
  const wide = extras.length <= 2 ? "md:col-span-2" : "";
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:h-[26rem] md:grid-cols-4 md:grid-rows-2">
      <Photo src={photos[0]} alt={`${title} photo 1`} eager={eager} className="col-span-2 aspect-[4/3] rounded-2xl md:row-span-2 md:aspect-auto" />
      {extras.map((url, i) => {
        const last = i === extras.length - 1 && hidden > 0;
        return (
          <Photo key={url + i} src={url} alt={`${title} photo ${i + 2}`} className={`aspect-square rounded-2xl md:aspect-auto ${extras.length === 1 ? "md:col-span-2 md:row-span-2" : wide}`}>
            {last && (
              <Link href={activityHref} className="absolute inset-0 flex items-center justify-center bg-[#002147]/70 text-lg font-semibold text-white backdrop-blur-[2px] transition hover:bg-[#002147]/80">
                +{hidden} more
              </Link>
            )}
          </Photo>
        );
      })}
    </div>
  );
}

function ActivityActions({ url, title, description, meta, activityHref }: { url: string; title: string; description: string; meta: string; activityHref: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ShareButton url={url} title={title} description={description} meta={meta} variant="full" label="Share this activity"
        className="!bg-[#002147] !border-[#002147] hover:!bg-[#07345e] !text-white" />
      <Link href={activityHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#002147] transition-colors hover:text-[#a17f15]">
        Open full activity <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function ArchivePage({ year, month }: ArchivePageProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const yearsRef = useRef<HTMLDivElement>(null);
  const monthsRef = useRef<HTMLDivElement>(null);

  const displayYear = year.replace("-", "/");
  const normalizedMonth = month.toLowerCase();
  const displayMonth = normalizedMonth.charAt(0).toUpperCase() + normalizedMonth.slice(1);
  const displayCalendarYear = safeCalendarYear(displayYear, displayMonth);
  const meta = `${displayMonth} ${displayCalendarYear} · Leo Year ${displayYear}`;

  // Activities: cancelled if you switch month first, so a slow old response can't overwrite a newer one.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(false);
    setExpanded(new Set());
    getActivitiesByMonth(displayYear, displayMonth)
      .then((acts) => alive && setActivities(sanitizeActivities(acts)))
      .catch((e) => {
        console.error(e);
        if (alive) { setActivities([]); setLoadError(true); }
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [displayYear, displayMonth, reloadToken]);

  // Members: fetched once for the whole session of this page, not on every month change,
  // and never blocks (or breaks) the activity list.
  useEffect(() => {
    let alive = true;
    getMembers()
      .then((m) => alive && setMembers(m ?? []))
      .catch(() => {})
      .finally(() => alive && setMembersLoaded(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    centerCurrent(yearsRef.current);
    centerCurrent(monthsRef.current);
  }, [year, normalizedMonth]);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.memberId, m])), [members]);

  const monthsInLeoOrder = getMonthsInLeoOrder();
  const monthIdx = monthsInLeoOrder.findIndex((m) => m.toLowerCase() === normalizedMonth);
  const yearIdx = LEO_YEARS.findIndex((y) => y.replace("/", "-") === year);

  function neighbor(dir: -1 | 1): { href: string; label: string } | null {
    if (monthIdx < 0 || yearIdx < 0) return null;
    const last = monthsInLeoOrder.length - 1;
    const nm = monthIdx + dir;
    if (nm >= 0 && nm <= last) return { href: `/archive/${year}/${monthsInLeoOrder[nm].toLowerCase()}`, label: monthsInLeoOrder[nm].slice(0, 3) };
    const ny = yearIdx + dir;
    if (ny < 0 || ny >= LEO_YEARS.length) return null;
    const m = monthsInLeoOrder[dir === -1 ? last : 0];
    return { href: `/archive/${LEO_YEARS[ny].replace("/", "-")}/${m.toLowerCase()}`, label: m.slice(0, 3) };
  }
  const prev = neighbor(-1);
  const next = neighbor(1);

  const navBtn = "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm";
  const off = `${navBtn} cursor-not-allowed border border-white/10 bg-white/5 text-white/25`;

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#002147]">
      <style>{CSS}</style>

      {/* ═══ HERO ═══ */}
      <header className="relative isolate overflow-hidden bg-[#001833] text-white">
        <div className="absolute inset-0 -z-10" style={{
          background: "radial-gradient(46rem 28rem at 92% -10%,rgba(212,175,55,.22),transparent 60%),radial-gradient(36rem 26rem at -5% 115%,rgba(0,86,170,.45),transparent 60%),linear-gradient(180deg,#002147,#001833)",
        }} />
        <div className="ar-rise relative mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-11">
          <Link href="/archive" className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft size={15} /> Back to archive
          </Link>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#e3c458]"><Calendar size={14} /> Leo Year {displayYear}</p>
              <h1 className="font-display text-5xl font-semibold leading-[1.05] sm:text-7xl">
                {displayMonth} <span className="gold-text">{displayCalendarYear}</span>
              </h1>
              <p className="mt-4 text-sm text-white/60 sm:text-base">
                A month in the club&apos;s record ·{" "}
                <span className="text-white/85">
                  {loading ? "loading…" : `${activities.length} activit${activities.length === 1 ? "y" : "ies"} recorded`}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 lg:pb-1">
              {prev ? (
                <Link href={prev.href} aria-label={`Previous month, ${prev.label}`} className={`${navBtn} border border-white/15 bg-white/5 text-white/85 hover:border-white/30 hover:bg-white/10`}>
                  <ArrowLeft size={15} /> {prev.label}
                </Link>
              ) : <span className={off}><ArrowLeft size={15} /> Previous</span>}
              {next ? (
                <Link href={next.href} aria-label={`Next month, ${next.label}`} className={`${navBtn} bg-gradient-to-b from-[#e3c458] to-[#c9a432] font-bold text-[#002147] hover:brightness-105`}>
                  {next.label} <ArrowRight size={15} />
                </Link>
              ) : <span className={off}>Next <ArrowRight size={15} /></span>}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ STICKY YEAR / MONTH NAV ═══ */}
      <nav aria-label="Archive navigation" className="sticky top-16 z-40 border-b border-[#002147]/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div ref={yearsRef} className="ar-noscroll flex items-center gap-1 overflow-x-auto border-b border-[#002147]/[0.06] py-2">
            <span className="mr-2 shrink-0 text-xs font-semibold text-slate-400">Leo year</span>
            {LEO_YEARS.map((ly) => {
              const on = ly.replace("/", "-") === year;
              return (
                <Link key={ly} href={`/archive/${ly.replace("/", "-")}/${normalizedMonth}`} aria-current={on ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${on ? "bg-[#002147] text-white" : "text-slate-500 hover:bg-slate-100 hover:text-[#002147]"}`}>
                  {ly}
                </Link>
              );
            })}
          </div>
          <div ref={monthsRef} className="ar-noscroll flex gap-1 overflow-x-auto py-2">
            {monthsInLeoOrder.map((m) => {
              const on = m.toLowerCase() === normalizedMonth;
              return (
                <Link key={m} href={`/archive/${year}/${m.toLowerCase()}`} aria-current={on ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:px-3.5 sm:text-sm ${on ? "bg-gradient-to-b from-[#e3c458] to-[#c9a432] text-[#002147] shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-[#002147]"}`}>
                  {m.slice(0, 3)}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ═══ CONTENT ═══ */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {loading ? (
          <div className="space-y-7" aria-label="Loading activities" aria-busy="true">
            {[1, 2].map((i) => (
              <div key={i} className={`${CARD} p-6 sm:p-8`}>
                <div className="ar-skel mb-5 h-3 w-28 rounded" />
                <div className="ar-skel mb-4 h-8 w-2/3 rounded" />
                <div className="ar-skel h-4 w-full rounded" />
                <div className="ar-skel mt-2 h-4 w-4/5 rounded" />
                <div className="ar-skel mt-7 h-56 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#002147] text-[#D4AF37]"><CircleAlert size={25} /></div>
            <h2 className="font-display text-2xl font-semibold">This record could not be opened</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">There was a problem loading the activities for {displayMonth} {displayCalendarYear}. Please try again.</p>
            <button type="button" onClick={() => setReloadToken((t) => t + 1)} className={`${BTN_NAVY} mt-6`}><RefreshCw size={15} /> Try again</button>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-24 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002147]/5"><Calendar size={29} strokeWidth={1.6} /></div>
            <h2 className="font-display text-2xl font-semibold">No activities this month</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">No activities were recorded for {displayMonth} {displayCalendarYear}.</p>
            <Link href="/archive" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#a17f15] hover:text-[#002147]">Browse the full archive <ChevronRight size={15} /></Link>
          </div>
        ) : (
          <div className="space-y-10">
            {activities.map((act, idx) => {
              const rawId = act.id ?? "";
              const safeId = encodeURIComponent(rawId);
              const actUrl = `${window.location.origin}${import.meta.env.BASE_URL}activity/${safeId}`;
              const activityHref = `/activity/${safeId}`;
              const photos = act.photos ?? [];
              const participants = act.participants ?? [];
              const title = act.title || "Untitled activity";
              const description = act.description || "";
              const key = rawId || String(idx);
              const showAll = expanded.has(key);
              const shown = showAll ? participants : participants.slice(0, PARTICIPANT_PREVIEW);

              return (
                <article key={key} id={slugify(title)} className={`${CARD} scroll-mt-44 overflow-hidden ${LAZY}`}>
                  <div className="p-6 sm:p-8">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1.5 text-[#a17f15]"><Calendar size={12} /> {displayMonth} {displayCalendarYear}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>Leo Year {displayYear}</span>
                        {act.featured && <span className="rounded-full bg-[#f6ecc4] px-2.5 py-1 text-[#806313]">Featured</span>}
                      </div>
                      <ShareButton url={actUrl} title={title} description={description} meta={meta} variant="icon"
                        className="!bg-[#002147]/5 !text-[#002147] hover:!bg-[#002147]/15" />
                    </div>
                    <h2 className="font-display text-2xl font-semibold leading-tight sm:text-4xl">{title}</h2>
                    <div className="mt-3 h-[3px] w-10 rounded-full bg-[#D4AF37]" />
                    {description && <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">{description}</p>}
                  </div>

                  {photos.length > 0 && (
                    <div className="px-4 pb-6 sm:px-8">
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400"><ImageIcon size={13} /> {photos.length} {photos.length === 1 ? "photo" : "photos"}</p>
                      <PhotoMosaic photos={photos} title={title} activityHref={activityHref} eager={idx === 0} />
                    </div>
                  )}

                  {participants.length > 0 && (
                    <div className="border-t border-slate-100 px-6 pb-2 pt-6 sm:px-8">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold"><Users size={16} className="text-[#a17f15]" /> Participants</h3>
                        <span className="text-xs text-slate-400">{participants.length} listed</span>
                      </div>
                      <ul className="flex flex-wrap gap-2">
                        {shown.map((p, i) => {
                          const mid = p.memberId ?? "";
                          const m = mid ? memberMap.get(mid) : undefined;
                          const fallbackName = (p as { name?: string }).name;
                          const name = m?.name ?? fallbackName ?? (membersLoaded ? mid || "Unknown" : "");
                          const inner = (
                            <>
                              {m?.photoUrl ? (
                                <img src={m.photoUrl} alt="" width={32} height={32} loading="lazy" decoding="async" className="h-8 w-8 shrink-0 rounded-full object-cover object-top" />
                              ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#002147] text-[10px] font-bold text-[#D4AF37]">{name ? initials(name) : ""}</span>
                              )}
                              <span className="min-w-0 pr-1">
                                {name ? <span className="block max-w-[11rem] truncate text-sm font-semibold">{name}</span> : <span className="ar-skel block h-3.5 w-20 rounded" />}
                                {p.awardTitle && <span className="block max-w-[11rem] truncate text-xs text-[#a17f15]">{p.awardTitle}</span>}
                              </span>
                            </>
                          );
                          const pill = "flex items-center gap-2 rounded-full border border-slate-200 bg-[#F6F8FB] py-1 pl-1 pr-3";
                          return (
                            <li key={`${mid || "p"}-${i}`}>
                              {mid ? (
                                <Link href={`/verify/member/${encodeURIComponent(mid)}`} className={`${pill} transition hover:border-[#D4AF37]/70 hover:bg-white hover:shadow-sm`}>{inner}</Link>
                              ) : (
                                <div className={pill}>{inner}</div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {participants.length > PARTICIPANT_PREVIEW && (
                        <button type="button" aria-expanded={showAll}
                          onClick={() => setExpanded((prevSet) => { const n = new Set(prevSet); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                          className="mt-4 text-sm font-semibold text-[#002147] transition-colors hover:text-[#a17f15]">
                          {showAll ? "Show fewer" : `Show all ${participants.length}`}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="p-6 pt-5 sm:px-8 sm:pb-8">
                    <ActivityActions url={actUrl} title={title} description={description} meta={meta} activityHref={activityHref} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}