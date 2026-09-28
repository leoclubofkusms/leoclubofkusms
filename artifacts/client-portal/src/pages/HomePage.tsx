import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import { getMembers, getActivities, getBodMembers, getFeaturedActivities, getClubSettings, getAwards, getAnnouncements, getClubEvents, getServiceImpact, computeVolunteersFromActivities } from "@/lib/firestore";
import type { Member, Activity, BodMember, ClubSettings, Award as AwardType, Announcement, ClubEvent, ServiceImpact } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK, CLUB_ID, LEO_YEARS, MONTHS, getCurrentLeoYear, getCurrentLeoYearLabel, isAnnouncementExpired, formatImpactNumber, formatCurrency } from "@/lib/types";
import {
  ArrowRight, Award, Users, Calendar, Shield, Mail, Phone,
  ChevronLeft, ChevronRight, Pin, Info, Facebook, ExternalLink,
  Star, Heart, TrendingUp, MessageCircle,
  Zap, Trophy, Flame, BarChart3, Megaphone, X as XIcon, Clock, DollarSign,
} from "lucide-react";

// ── Animated counter hook — preserves 1 decimal for non-integers ──────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    const hasDecimal = !Number.isInteger(target);
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const raw = eased * target;
      setCount(hasDecimal ? Math.round(raw * 10) / 10 : Math.floor(raw));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ── Merged Service Impact + Club Snapshot section ─────────────────────────────
function ServiceImpactSection({
  impact, activities, leoYear, memberCount, activityCount,
}: {
  impact: ServiceImpact | null;
  activities: Activity[];
  leoYear: string;
  memberCount: number;
  activityCount: number;
}) {
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const volunteers = computeVolunteersFromActivities(activities, leoYear);
  const peopleServed = impact?.peopleServed ?? 0;
  const volunteerHours = impact?.volunteerHours ?? 0;
  const fundsDonated = currency === "USD"
    ? (impact?.fundsDonatedUsd ?? 0)
    : (impact?.fundsDonatedNpr ?? 0);
  const fundsRaised = currency === "USD"
    ? (impact?.fundsRaisedUsd ?? 0)
    : (impact?.fundsRaisedNpr ?? 0);

  const hasData = impact !== null;

  const peopleCount = useCountUp(peopleServed, 1600, visible);
  const volunteerCount = useCountUp(volunteers, 1600, visible);
  const hoursCount = useCountUp(volunteerHours, 1600, visible);
  const memberCountAnim = useCountUp(memberCount, 1400, visible);
  const activityCountAnim = useCountUp(activityCount, 1600, visible);

  const yearsOfService = (() => {
    const established = new Date("June 11, 2024");
    const now = new Date();
    let years = now.getFullYear() - established.getFullYear();
    if (
      now.getMonth() < established.getMonth() ||
      (now.getMonth() === established.getMonth() && now.getDate() < established.getDate())
    ) {
      years -= 1;
    }
    return Math.max(1, years);
  })();
  const yearsCountAnim = useCountUp(yearsOfService, 1200, visible);

  const impactStats = [
    { label: "People Served", value: formatImpactNumber(peopleCount), icon: Heart },
    { label: "Volunteers", value: formatImpactNumber(volunteerCount), icon: Users },
    { label: "Volunteer Hours", value: formatImpactNumber(hoursCount), icon: Clock },
    { label: "Funds Donated", value: formatCurrency(fundsDonated, currency), icon: DollarSign },
    { label: "Funds Raised", value: formatCurrency(fundsRaised, currency), icon: TrendingUp },
  ];

  const clubStats = [
    { label: "Active Members", value: `${memberCountAnim}`, icon: Users },
    { label: "Activities Completed", value: `${activityCountAnim}`, icon: Calendar },
    { label: "Years of Service", value: `${yearsCountAnim}+`, icon: Shield },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002147] to-[#003575] text-white py-10 sm:py-12 px-4 sm:px-6 shadow-xl border-2 border-[#D4AF37]/20">
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#D4AF37]/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-3">
              <Heart size={13} /> Our Service Impact
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Leo Year {leoYear}</h2>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Making a difference together — measured in lives touched, hours served, and generosity given.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-xl p-1 self-center sm:self-start">
            {(["NPR", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currency === c ? "bg-[#D4AF37] text-[#002147]" : "text-white/60 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3">
          {impactStats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 sm:p-4 text-center transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Icon size={15} className="text-[#D4AF37]" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 tabular-nums leading-tight break-words">
                {value}
              </div>
              <div className="text-white/50 text-[10px] sm:text-xs leading-tight">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 sm:p-4">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]/80 mb-2.5 text-center sm:text-left">
            Club Snapshot
          </div>
          <div className="grid grid-cols-3 gap-3">
            {clubStats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icon size={12} className="text-[#D4AF37]" />
                  <span className="text-base sm:text-lg font-bold text-white tabular-nums">{value}</span>
                </div>
                <div className="text-[10px] sm:text-xs text-white/50 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-white/50">
          {hasData ? (
            <span>Last updated {new Date(impact!.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          ) : (
            <span className="italic">Impact data for this Leo Year will appear once added by admin.</span>
          )}
          <Link href="/stats" className="text-[#D4AF37] font-semibold hover:underline flex items-center gap-1">
            View full impact report <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Featured Activities Carousel ──────────────────────────────────────────────
function FeaturedCarousel({ activities }: { activities: Activity[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current) return;
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setFading(false);
      }, 300);
    },
    [current]
  );

  const prev = () => goTo((current - 1 + activities.length) % activities.length);
  const next = useCallback(() => goTo((current + 1) % activities.length), [current, goTo, activities.length]);

  useEffect(() => {
    if (activities.length <= 1) return;
    const timer = setInterval(() => next(), 4500);
    return () => clearInterval(timer);
  }, [next, activities.length]);

  if (!activities.length) return null;
  const act = activities[current];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002147] to-[#003575] text-white shadow-2xl">
      {act.photos[0] && (
        <div className="absolute inset-0">
          <img src={act.photos[0]} alt={act.title} className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002147]/95 via-[#002147]/80 to-transparent" />
        </div>
      )}

      <div className="relative px-8 py-10 md:px-12 md:py-14">
        <div className="transition-all duration-300" style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(8px)" : "translateY(0)" }}>
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-5">
            <Pin size={11} /> Featured Activity · {act.month} {act.year}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight max-w-xl">{act.title}</h3>
          <p className="text-white/70 text-base leading-relaxed max-w-lg mb-6 line-clamp-3">{act.description}</p>
          <div className="flex flex-wrap gap-4 mb-8">
            {act.participants.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Users size={15} className="text-[#D4AF37]" /> {act.participants.length} participants
              </div>
            )}
            {act.photos.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar size={15} className="text-[#D4AF37]" /> {act.photos.length} photos
              </div>
            )}
          </div>
          {act.photos.length > 1 && (
            <div className="flex gap-2 mb-8">
              {act.photos.slice(0, 4).map((p, i) => (
                <img key={i} src={p} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white/20" />
              ))}
            </div>
          )}
          <Link href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#c9a432] transition-colors">
            View Full Activity <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {activities.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-5 right-8 flex gap-2">
            {activities.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-2 bg-[#D4AF37]" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Featured Events Carousel ──────────────────────────────────────────────────
function FeaturedEventsCarousel({ events }: { events: ClubEvent[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current) return;
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setFading(false);
      }, 300);
    },
    [current]
  );

  const prev = () => goTo((current - 1 + events.length) % events.length);
  const next = useCallback(() => goTo((current + 1) % events.length), [current, goTo, events.length]);

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => next(), 5000);
    return () => clearInterval(timer);
  }, [next, events.length]);

  useEffect(() => {
    if (current >= events.length) setCurrent(0);
  }, [events.length, current]);

  if (!events.length) return null;
  const ev = events[current];

  const dateStr = ev.endDate && ev.endDate !== ev.date
    ? `${new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(ev.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const today = new Date().toISOString().split("T")[0];
  const canApply =
    ev.applicationsEnabled &&
    ev.status !== "cancelled" &&
    (!ev.applicationDeadline || ev.applicationDeadline >= today);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002147] to-[#003575] text-white shadow-2xl border-2 border-[#D4AF37]/20">
      {ev.photoUrl && (
        <div className="absolute inset-0">
          <img src={ev.photoUrl} alt={ev.title} className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002147]/95 via-[#002147]/85 to-transparent" />
        </div>
      )}

      <div className="relative px-8 py-10 md:px-12 md:py-14">
        <div className="transition-all duration-300" style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(8px)" : "translateY(0)" }}>
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-5">
            <Pin size={11} /> Featured Event · {dateStr}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight max-w-xl">{ev.title}</h3>
          {ev.description && (
            <p className="text-white/70 text-base leading-relaxed max-w-lg mb-6 line-clamp-3">
              {ev.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mb-8">
            {ev.location && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>📍</span> {ev.location}
              </div>
            )}
            {ev.eventType && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>🏷️</span> {ev.eventType}
              </div>
            )}
            {ev.applicationsEnabled && (
              <div className="flex items-center gap-2 text-sm text-green-300">
                <Users size={15} /> {ev.applicationType || "Applications open"}
              </div>
            )}
          </div>

          {ev.applicationPrompt && (
            <p className="text-white/70 italic text-sm mb-6 max-w-lg">
              {ev.applicationPrompt}
            </p>
          )}

          <Link href="/events"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#c9a432] transition-colors">
            {canApply ? `Apply as ${ev.applicationType || "Applicant"}` : "View Event Details"} <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {events.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-5 right-8 flex gap-2">
            {events.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-2 bg-[#D4AF37]" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── President Card ────────────────────────────────────────────────────────────
function PresidentCard({ president, whatsappNumber, whatsappMessage }: { president: BodMember; whatsappNumber?: string; whatsappMessage?: string }) {
  return (
    <div className="bg-gradient-to-br from-[#002147] to-[#003575] text-white rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-4 sm:p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        <div className="flex w-full justify-center md:w-auto md:justify-start">
          {president.photoUrl ? (
            <img src={president.photoUrl} alt={president.name}
              className="h-64 w-[min(100%,18rem)] rounded-2xl border-2 border-[#D4AF37] object-cover object-top shadow-2xl sm:h-80 sm:w-64 md:h-96 md:w-72 md:border-4" />
          ) : (
            <div className="flex h-64 w-[min(100%,18rem)] items-center justify-center rounded-2xl bg-[#D4AF37] shadow-2xl sm:h-80 sm:w-64 md:h-96 md:w-72">
              <span className="text-8xl font-bold text-[#002147]">{president.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-3">
            <Award size={12} /> {president.role}
          </div>
          <h3 className="text-3xl font-bold mb-1">{president.name}</h3>
          {president.bio && <p className="text-white/70 text-base mb-4">{president.bio}</p>}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {president.email && (
              <a href={`mailto:${president.email}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors">
                <Mail size={14} className="text-[#D4AF37]" /> <span>{president.email}</span>
              </a>
            )}
            {president.phone && (
              <a href={`tel:${president.phone}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors">
                <Phone size={14} className="text-[#D4AF37]" /> <span>{president.phone}</span>
              </a>
            )}
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage || "Hello President, I would like to connect with Leo Club of KUSMS.")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] rounded-xl px-4 py-2 text-sm font-semibold transition-colors">
                <MessageCircle size={14} /> <span>Contact President</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Announcement Banner ──────────────────────────────────────────────────────
function AnnouncementBanner({
  ann, onDismiss,
}: { ann: Announcement; onDismiss: () => void }) {
  const typeColors = {
    info: { bg: "bg-blue-50 border-blue-200", icon: "text-blue-600", title: "text-blue-900", body: "text-blue-700", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
    update: { bg: "bg-amber-50 border-amber-200", icon: "text-amber-600", title: "text-amber-900", body: "text-amber-700", btn: "bg-amber-600 hover:bg-amber-700 text-white" },
    event: { bg: "bg-green-50 border-green-200", icon: "text-green-600", title: "text-green-900", body: "text-green-700", btn: "bg-green-600 hover:bg-green-700 text-white" },
  }[ann.type];

  const isExternal = ann.linkUrl ? /^https?:\/\//i.test(ann.linkUrl) : false;

  return (
    <div className={`rounded-2xl border px-4 sm:px-5 py-4 flex items-start gap-3 sm:gap-4 ${typeColors.bg}`}>
      {ann.imageUrl && (
        <img
          src={ann.imageUrl}
          alt=""
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-white/60 shrink-0 bg-white"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <Megaphone size={18} className={`shrink-0 mt-0.5 hidden sm:block ${typeColors.icon}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold text-sm ${typeColors.title}`}>{ann.title}</span>
          {ann.pinned && <span className="text-xs font-semibold opacity-60">📌 Pinned</span>}
          <span className={`text-xs opacity-50 ${typeColors.body}`}>
            {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        {ann.body && <p className={`text-sm mt-0.5 ${typeColors.body}`}>{ann.body}</p>}
        {ann.linkLabel && ann.linkUrl && (
          <a
            href={ann.linkUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={`inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${typeColors.btn}`}
          >
            {ann.linkLabel} <ArrowRight size={12} />
          </a>
        )}
      </div>
      <button onClick={onDismiss}
        className={`shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors ${typeColors.icon}`} aria-label="Dismiss">
        <XIcon size={14} />
      </button>
    </div>
  );
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [featuredActivities, setFeaturedActivities] = useState<Activity[]>([]);
  const [bod, setBod] = useState<BodMember[]>([]);
  const [clubSettings, setClubSettings] = useState<ClubSettings>({});
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [serviceImpact, setServiceImpact] = useState<ServiceImpact | null>(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const currentLeoYear = getCurrentLeoYear();

  useEffect(() => {
    Promise.all([
      getMembers().catch(() => [] as Member[]),
      getActivities().catch(() => [] as Activity[]),
      getFeaturedActivities().catch(() => [] as Activity[]),
      getBodMembers().catch(() => [] as BodMember[]),
      getClubSettings().catch(() => ({} as ClubSettings)),
      getAwards().catch(() => [] as AwardType[]),
      getAnnouncements().catch(() => [] as Announcement[]),
      getClubEvents().catch(() => [] as ClubEvent[]),
      getServiceImpact(currentLeoYear).catch(() => null),
    ]).then(([m, a, f, b, s, aw, ann, evs, impact]) => {
      setMembers(m); setActivities(a); setFeaturedActivities(f); setBod(b);
      setClubSettings(s); setAwards(aw); setAnnouncements(ann); setEvents(evs);
      setServiceImpact(impact);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedAnnouncements.has(a.id) && !isAnnouncementExpired(a)
  );
  const president = bod[0] ?? null;

  const today = new Date().toISOString().split("T")[0];
  const featuredEvents = events
    .filter((e) => e.pinned && e.status !== "cancelled" && (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F8FAFC]">
      {/* ═══ 1. HERO ═══ */}
      <div className="relative bg-[#002147] text-white overflow-hidden" style={{ minHeight: "520px" }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-6">
              <Award size={14} /> Lions Clubs International — District 325L · Club #{CLUB_ID}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2">Leo Club of Kathmandu University</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">School of Medical Sciences (KUSMS)</h2>
            <p className="text-xl md:text-2xl text-white/80 font-light mb-2">Leadership Through Service</p>
            <p className="text-white/60 text-base mb-10 leading-relaxed max-w-xl">
              A community of future medical professionals committed to service, leadership, and making a meaningful impact in our community.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#donate" className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-bold hover:bg-[#c9a432] transition-colors shadow-lg">
                <Heart size={18} /> Donate Now
              </a>
              <Link href="/about" className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                About Us <ArrowRight size={18} />
              </Link>
              <Link href="/members" className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                <Users size={18} /> Our Members
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ═══ 2. PRESIDENT'S SLOGAN ═══ */}
        {clubSettings.presidentSlogan && (
          <section className="bg-gradient-to-r from-[#002147] via-[#003575] to-[#002147] rounded-3xl border-2 border-[#D4AF37]/30 overflow-hidden shadow-xl">
            <div className="px-6 py-8 md:px-12 md:py-12">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                {clubSettings.presidentSloganPhotoUrl && (
                  <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl border border-[#D4AF37]/70 bg-white/10 p-3 shadow-[0_16px_40px_rgba(0,0,0,.25)] sm:h-36 sm:w-36 md:h-44 md:w-44">
                    <img src={clubSettings.presidentSloganPhotoUrl} alt="President"
                      className="h-full w-full rounded-2xl bg-white p-2 object-contain" />
                  </div>
                )}
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-4 flex items-center justify-center gap-3 md:justify-start">
                    <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4AF37] md:w-16" />
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] md:text-xs">
                      {getCurrentLeoYearLabel()} · President&apos;s Slogan
                    </div>
                    <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#D4AF37] md:hidden" />
                  </div>
                  <div className="relative">
                    <p className="max-w-4xl text-xl font-semibold leading-snug tracking-[-0.02em] text-white sm:text-2xl md:text-4xl lg:text-5xl">
                      {clubSettings.presidentSlogan}
                    </p>
                    <div className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-[#D4AF37] to-transparent md:w-28" />
                  </div>
                  {(clubSettings.presidentSloganName || clubSettings.presidentSloganRole) && (
                    <div className="mt-5 text-sm text-white/60">
                      {clubSettings.presidentSloganName && (
                        <div className="font-semibold text-white/80">{clubSettings.presidentSloganName}</div>
                      )}
                      {clubSettings.presidentSloganRole && (
                        <div className="text-xs text-[#D4AF37]">{clubSettings.presidentSloganRole}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ 3. SERVICE IMPACT ═══ */}
        <ServiceImpactSection
          impact={serviceImpact}
          activities={activities}
          leoYear={currentLeoYear}
          memberCount={members.length}
          activityCount={activities.length}
        />

        {/* ═══ 4. ANNOUNCEMENTS ═══ */}
        {visibleAnnouncements.length > 0 && (
          <section>
            <div className="space-y-3">
              {visibleAnnouncements.map((ann) => (
                <AnnouncementBanner
                  key={ann.id}
                  ann={ann}
                  onDismiss={() => setDismissedAnnouncements((prev) => new Set([...prev, ann.id]))}
                />
              ))}
            </div>
          </section>
        )}

        {/* ═══ 5. UPCOMING EVENTS ═══ */}
        {featuredEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Upcoming Events</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {featuredEvents.length === 1 ? "Our next big event" : "Featured events — don't miss these"}
                </p>
              </div>
              <Link href="/events" className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                View All Events <ArrowRight size={14} />
              </Link>
            </div>
            <FeaturedEventsCarousel events={featuredEvents} />
          </section>
        )}

        {/* ═══ 6. OUR LEADERSHIP (President only) ═══ */}
        {president && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Our Leadership</h2>
                <p className="text-gray-500 text-sm mt-1">The team guiding our club this year</p>
              </div>
              <Link href="/about" className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                View Full Board <ArrowRight size={14} />
              </Link>
            </div>
            <PresidentCard president={president}
              whatsappNumber={clubSettings.presidentWhatsApp}
              whatsappMessage={clubSettings.presidentWhatsAppMessage} />
          </section>
        )}

        {/* ═══ 7. FEATURED ACTIVITIES ═══ */}
        {featuredActivities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Featured Activities</h2>
                <p className="text-gray-500 text-sm mt-1">Highlights from our recent service work</p>
              </div>
              <Link href="/archive" className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                Full Archive <ArrowRight size={14} />
              </Link>
            </div>
            <FeaturedCarousel activities={featuredActivities} />
          </section>
        )}

        {/* ═══ 8. BECOME A LEO ═══ */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-10">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#002147] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-5">
                <Heart size={12} className="text-[#D4AF37]" /> Become a Leo
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#002147] mb-3">Join Our Community</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Are you a KUSMS student or any student around us who wants to lead, serve, and grow? Leo Club of KUSMS welcomes passionate individuals who believe in making a difference through service.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Participate in health camps and community service",
                  "Develop leadership and teamwork skills",
                  "Network with Lions Club International members",
                  "Earn recognition, awards, and verified certificates",
                  "Build lasting friendships at KUSMS",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Star size={10} className="text-[#D4AF37]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#1877F2] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1565c0] transition-colors">
                  <Facebook size={15} /> Message Us on Facebook
                </a>
                <a
                  href={
                    clubSettings.membershipChairWhatsApp
                      ? `https://wa.me/${clubSettings.membershipChairWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(
                          clubSettings.membershipChairWhatsAppMessage ||
                            "Hello! I'm interested in joining Leo Club of KUSMS."
                        )}`
                      : CLUB_FACEBOOK
                  }
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#20b858] transition-colors">
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
            </div>
            <div className="bg-[#002147] p-8 md:p-10 flex flex-col justify-center">
              <h3 className="text-white font-bold text-lg mb-6">Who Can Join?</h3>
              <div className="space-y-4">
                {[
                  { title: "KUSMS Student", desc: "Currently enrolled at Kathmandu University School of Medical Sciences can be General Members" },
                  { title: "Any Student Around Us", desc: "Currently enrolled at any School can be Associate Members" },
                  { title: "Passionate About Service", desc: "Willing to commit time to community service and club activities" },
                  { title: "Age 12–30", desc: "Open to all Leo-eligible age groups as per Lions Club International" },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                      <Shield size={14} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{title}</div>
                      <div className="text-white/50 text-xs mt-0.5 leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl p-4">
                <div className="text-[#D4AF37] font-bold text-sm mb-1">Chartered since {CLUB_ESTABLISHED}</div>
                <div className="text-white/50 text-xs">Lions Clubs International · District 325L · Club #{CLUB_ID}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 9. DONATE NOW ═══ */}
        <section id="donate" className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#002147] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-5 w-fit">
                <Heart size={12} className="text-[#D4AF37]" /> Support Us
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#002147] mb-3">Donate Now</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Your contribution helps us carry out health camps, community outreach, and service activities. Every donation makes a difference.
              </p>
              {(clubSettings.donationBankName || clubSettings.donationAccountName || clubSettings.donationAccountNumber) && (
                <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bank Details</div>
                  {clubSettings.donationBankName && (
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-gray-500">Bank</span>
                      <span className="text-sm font-semibold text-[#002147]">{clubSettings.donationBankName}</span>
                    </div>
                  )}
                  {clubSettings.donationAccountName && (
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-gray-500">Account Name</span>
                      <span className="text-sm font-semibold text-[#002147]">{clubSettings.donationAccountName}</span>
                    </div>
                  )}
                  {clubSettings.donationAccountNumber && (
                    <div className="flex justify-between items-center gap-4 border-t border-gray-200 pt-3">
                      <span className="text-sm text-gray-500">Account No.</span>
                      <span className="text-base font-bold text-[#002147] font-mono tracking-wide">{clubSettings.donationAccountNumber}</span>
                    </div>
                  )}
                  {clubSettings.donationNote && (
                    <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">{clubSettings.donationNote}</p>
                  )}
                </div>
              )}
            </div>
            <div className="bg-[#002147] p-8 md:p-10 flex flex-col items-center justify-center gap-5">
              {clubSettings.donationQrUrl ? (
                <>
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <img src={clubSettings.donationQrUrl} alt="Donation QR Code" className="w-48 h-48 object-contain" />
                  </div>
                  <p className="text-white/60 text-sm text-center">Scan the QR code to donate</p>
                </>
              ) : (
                <div className="text-center text-white/40">
                  <Heart size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">QR code coming soon</p>
                </div>
              )}
              <a href={`mailto:leoclubofkusms@gmail.com?subject=Donation Inquiry`}
                className="flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#c9a432] transition-colors">
                <Mail size={15} /> Contact for Queries
              </a>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER CTA — Compact links ═══ */}
        <section className="bg-gradient-to-r from-[#002147] to-[#003575] text-white rounded-3xl p-8 md:p-10 shadow-xl">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] flex items-center justify-center mx-auto mb-5">
              <Shield size={26} className="text-[#002147]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Explore More</h2>
            <p className="text-white/60 mb-6">Dive deeper into our club — member directory, activities, awards, and more.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/members" className="flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl font-semibold hover:bg-[#c9a432] transition-colors text-sm">
                <Users size={16} /> Member Directory
              </Link>
              <Link href="/archive" className="flex items-center gap-2 border border-white/30 px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
                <Calendar size={16} /> Activity Archive
              </Link>
              <Link href="/awards" className="flex items-center gap-2 border border-white/30 px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
                <Trophy size={16} /> Awards
              </Link>
              <Link href="/stats" className="flex items-center gap-2 border border-white/30 px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
                <BarChart3 size={16} /> Statistics
              </Link>
              <Link href="/about" className="flex items-center gap-2 border border-white/30 px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
                <Info size={16} /> About Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
