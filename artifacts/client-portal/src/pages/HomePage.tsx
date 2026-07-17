import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import { getMembers, getActivities, getBodMembers, getFeaturedActivities, getClubSettings, getAwards, getAnnouncements } from "@/lib/firestore";
import type { Member, Activity, BodMember, ClubSettings, Award as AwardType, Announcement } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK, CLUB_ID, LEO_YEARS, MONTHS } from "@/lib/types";
import {
  ArrowRight, Award, Users, Calendar, Shield, Mail, Phone,
  ChevronLeft, ChevronRight, Pin, Info, Facebook, ExternalLink,
  Star, Building, Quote, Heart, TrendingUp, MessageCircle,
  Zap, Trophy, Flame, BarChart3, Megaphone, X as XIcon,
} from "lucide-react";

// ── Animated counter hook ──────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ── Impact Stats Section ───────────────────────────────────────────────────────
function ImpactStats({
  memberCount, activityCount, participationCount,
}: { memberCount: number; activityCount: number; participationCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const m = useCountUp(memberCount, 1600, visible);
  const a = useCountUp(activityCount, 1800, visible);
  const p = useCountUp(participationCount, 2000, visible);
  const y = useCountUp(2, 1200, visible);

  const stats = [
    { label: "Active Members", value: m, icon: Users, suffix: "+" },
    { label: "Activities Completed", value: a, icon: Calendar, suffix: "" },
    { label: "Service Participations", value: p, icon: Heart, suffix: "+" },
    { label: "Years of Service", value: y, icon: TrendingUp, suffix: "+" },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden rounded-3xl bg-[#002147] text-white py-12 px-6 shadow-xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-3">
            <TrendingUp size={13} /> Our Impact
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Making a Difference Together</h2>
          <p className="text-white/60 text-sm mt-2">Every member, every activity, every life touched counts.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, suffix }) => (
            <div key={label} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-center transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-3">
                <Icon size={18} className="text-[#D4AF37]" />
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums">
                {value}{suffix}
              </div>
              <div className="text-white/50 text-xs leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Leo Analytics (AI-powered insights) ───────────────────────────────────────
function LeoAnalytics({
  members, activities, awards,
}: { members: Member[]; activities: Activity[]; awards: AwardType[] }) {
  // Top contributor by activity count in the most recent Leo year with data
  const latestYearWithData = [...LEO_YEARS].reverse().find((y) =>
    activities.some((a) => a.year === y)
  ) ?? LEO_YEARS[0];

  const participationCounts: Record<string, number> = {};
  activities.forEach((a) => {
    a.participants.forEach((p) => {
      participationCounts[p.memberId] = (participationCounts[p.memberId] ?? 0) + 1;
    });
  });

  const currentYearCounts: Record<string, number> = {};
  activities.filter((a) => a.year === latestYearWithData).forEach((a) => {
    a.participants.forEach((p) => {
      currentYearCounts[p.memberId] = (currentYearCounts[p.memberId] ?? 0) + 1;
    });
  });

  const topAllTime = [...members]
    .filter((m) => participationCounts[m.memberId])
    .sort((a, b) => (participationCounts[b.memberId] ?? 0) - (participationCounts[a.memberId] ?? 0))
    .slice(0, 3);

  const topThisYear = [...members]
    .filter((m) => currentYearCounts[m.memberId])
    .sort((a, b) => (currentYearCounts[b.memberId] ?? 0) - (currentYearCounts[a.memberId] ?? 0))
    .slice(0, 3);

  const mostProductiveYear = LEO_YEARS.reduce<{ year: string; count: number }>(
    (best, y) => {
      const count = activities.filter((a) => a.year === y).length;
      return count > best.count ? { year: y, count } : best;
    },
    { year: "", count: 0 }
  );

  const mostActiveMonth = MONTHS.reduce<{ month: string; count: number }>(
    (best, m) => {
      const count = activities.filter((a) => a.month === m).length;
      return count > best.count ? { month: m, count } : best;
    },
    { month: "", count: 0 }
  );

  const mostAwardedMember = [...members]
    .map((m) => ({ member: m, count: awards.filter((a) => a.memberId === m.memberId).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)[0];

  const suggestedLeoOfMonth = topThisYear[0];

  if (!topAllTime.length && !suggestedLeoOfMonth) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#002147] flex items-center justify-center">
              <Zap size={14} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-bold text-[#002147]">Leo Analytics</h2>
          </div>
          <p className="text-gray-500 text-sm">Data-driven insights from our club's activity history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Suggested Leo of the Month */}
        {suggestedLeoOfMonth && (
          <div className="bg-gradient-to-br from-[#002147] to-[#003575] rounded-2xl p-6 text-white shadow-lg md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Suggested Leo of the Month</span>
              <span className="ml-auto text-xs text-white/40">Leo Year {latestYearWithData}</span>
            </div>
            <div className="flex items-center gap-4">
              {suggestedLeoOfMonth.photoUrl ? (
                <img src={suggestedLeoOfMonth.photoUrl} alt={suggestedLeoOfMonth.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37] shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-[#D4AF37]">{suggestedLeoOfMonth.name[0]}</span>
                </div>
              )}
              <div>
                <div className="text-xl font-bold">{suggestedLeoOfMonth.name}</div>
                <div className="text-white/60 text-sm">{suggestedLeoOfMonth.currentRole || "Leo Member"}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="bg-[#D4AF37] text-[#002147] text-xs font-bold px-3 py-1 rounded-full">
                    {currentYearCounts[suggestedLeoOfMonth.memberId]} activit{currentYearCounts[suggestedLeoOfMonth.memberId] === 1 ? "y" : "ies"} this year
                  </div>
                  <Link href={`/members/${suggestedLeoOfMonth.memberId}`}
                    className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1">
                    View Profile <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </div>
            {topThisYear.length > 1 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="text-xs text-white/40 mb-3">Other top contributors this year</div>
                <div className="flex gap-3 flex-wrap">
                  {topThisYear.slice(1).map((m, i) => (
                    <Link key={m.memberId} href={`/members/${m.memberId}`}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-colors">
                      {m.photoUrl
                        ? <img src={m.photoUrl} alt={m.name} className="w-6 h-6 rounded-full object-cover border border-white/30" />
                        : <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{m.name[0]}</div>
                      }
                      <span className="text-sm font-medium">{m.name}</span>
                      <span className="text-xs text-white/50">{currentYearCounts[m.memberId]} acts</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top All-Time Contributors */}
        {topAllTime.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-[#D4AF37]" />
              <h3 className="font-bold text-[#002147]">Top Contributors — All Time</h3>
            </div>
            <div className="space-y-3">
              {topAllTime.map((m, i) => (
                <Link key={m.memberId} href={`/members/${m.memberId}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${i === 0 ? "bg-[#D4AF37] text-[#002147]" : i === 1 ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-500"}`}>
                    #{i + 1}
                  </div>
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt={m.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0" />
                    : <div className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold shrink-0">{m.name[0]}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#002147] group-hover:text-[#003575] transition-colors truncate">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.currentRole || "Leo Member"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-[#002147]">{participationCounts[m.memberId]}</div>
                    <div className="text-xs text-gray-400">activities</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Club Stats Summary */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-[#002147]" />
            <h3 className="font-bold text-[#002147]">Club Intelligence</h3>
          </div>
          <div className="space-y-4">
            {mostProductiveYear.year && (
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                <div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Most Productive Year</div>
                  <div className="font-bold text-[#002147] mt-0.5">Leo Year {mostProductiveYear.year}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#D4AF37]">{mostProductiveYear.count}</div>
                  <div className="text-xs text-gray-400">activities</div>
                </div>
              </div>
            )}
            {mostActiveMonth.month && (
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                <div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Most Active Month</div>
                  <div className="font-bold text-[#002147] mt-0.5">{mostActiveMonth.month}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#D4AF37]">{mostActiveMonth.count}</div>
                  <div className="text-xs text-gray-400">across all years</div>
                </div>
              </div>
            )}
            {mostAwardedMember && (
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                <div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Most Recognized Leo</div>
                  <div className="font-bold text-[#002147] mt-0.5 truncate max-w-[160px]">{mostAwardedMember.member.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#D4AF37]">{mostAwardedMember.count}</div>
                  <div className="text-xs text-gray-400">awards</div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-[#002147] rounded-xl">
              <div>
                <div className="text-xs text-white/50 font-medium uppercase tracking-wide">Total Service Hours</div>
                <div className="font-bold text-white mt-0.5">Estimated Impact</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[#D4AF37]">
                  {Object.values(participationCounts).reduce((s, v) => s + v * 4, 0)}+
                </div>
                <div className="text-xs text-white/50">hours served</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Animated Featured Activities Carousel ─────────────────────────────────────
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
      {/* Background photo */}
      {act.photos[0] && (
        <div className="absolute inset-0">
          <img
            src={act.photos[0]}
            alt={act.title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002147]/95 via-[#002147]/80 to-transparent" />
        </div>
      )}

      <div className="relative px-8 py-10 md:px-12 md:py-14">
        <div
          className="transition-all duration-300"
          style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(8px)" : "translateY(0)" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-5">
            <Pin size={11} /> Featured Activity · {act.month} {act.year}
          </div>

          {/* Content */}
          <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight max-w-xl">
            {act.title}
          </h3>
          <p className="text-white/70 text-base leading-relaxed max-w-lg mb-6 line-clamp-3">
            {act.description}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-8">
            {act.participants.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Users size={15} className="text-[#D4AF37]" />
                {act.participants.length} participants
              </div>
            )}
            {act.photos.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar size={15} className="text-[#D4AF37]" />
                {act.photos.length} photos
              </div>
            )}
          </div>

          {/* Photo strip if multiple */}
          {act.photos.length > 1 && (
            <div className="flex gap-2 mb-8">
              {act.photos.slice(0, 4).map((p, i) => (
                <img key={i} src={p} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white/20" />
              ))}
            </div>
          )}

          <Link
            href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#c9a432] transition-colors"
          >
            View Full Activity <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Controls */}
      {activities.length > 1 && (
        <>
          {/* Arrow buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 right-8 flex gap-2">
            {activities.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "w-6 h-2 bg-[#D4AF37]" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── President Card ────────────────────────────────────────────────────────────
function PresidentCard({ president }: { president: BodMember }) {
  return (
    <div className="bg-gradient-to-br from-[#002147] to-[#003575] text-white rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
        {/* Photo */}
        <div className="shrink-0">
          {president.photoUrl ? (
            <img
              src={president.photoUrl}
              alt={president.name}
              className="w-36 h-36 rounded-2xl object-cover border-4 border-[#D4AF37] shadow-lg"
            />
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-[#D4AF37] flex items-center justify-center shadow-lg">
              <span className="text-5xl font-bold text-[#002147]">{president.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-3">
            <Award size={12} /> {president.role}
          </div>
          <h3 className="text-3xl font-bold mb-1">{president.name}</h3>
          {president.bio && (
            <p className="text-white/70 text-base mb-4">{president.bio}</p>
          )}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {president.email && (
              <a
                href={`mailto:${president.email}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors"
              >
                <Mail size={14} className="text-[#D4AF37]" />
                <span>{president.email}</span>
              </a>
            )}
            {president.phone && (
              <a
                href={`tel:${president.phone}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors"
              >
                <Phone size={14} className="text-[#D4AF37]" />
                <span>{president.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
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
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMembers().catch(() => [] as Member[]),
      getActivities().catch(() => [] as Activity[]),
      getFeaturedActivities().catch(() => [] as Activity[]),
      getBodMembers().catch(() => [] as BodMember[]),
      getClubSettings().catch(() => ({} as ClubSettings)),
      getAwards().catch(() => [] as AwardType[]),
      getAnnouncements().catch(() => [] as Announcement[]),
    ]).then(([m, a, f, b, s, aw, ann]) => {
      setMembers(m);
      setActivities(a);
      setFeaturedActivities(f);
      setBod(b);
      setClubSettings(s);
      setAwards(aw);
      setAnnouncements(ann);
    }).finally(() => setLoading(false));
  }, []);

  const visibleAnnouncements = announcements.filter((a) => !dismissedAnnouncements.has(a.id));

  const president = bod[0] ?? null;
  const otherBod = bod.slice(1);
  const latest = activities.slice(0, 6); // already sorted newest-first from Firestore

  const stats = [
    { label: "Active Members", value: loading ? "—" : members.length, icon: Users },
    { label: "Activities Completed", value: loading ? "—" : activities.length, icon: Calendar },
    { label: "Service Awards Given", value: loading ? "—" : activities.reduce((s, a) => s + a.participants.length, 0), icon: Award },
    { label: "Years of Service", value: "3+", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div
        className="relative bg-[#002147] text-white overflow-hidden"
        style={{ minHeight: "520px" }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-6">
              <Award size={14} /> Lions Clubs International — District 325L · Club #{CLUB_ID}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2">
              Leo Club of Kathmandu University
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
              School of Medical Sciences (KUSMS)
            </h2>
            <p className="text-xl md:text-2xl text-white/80 font-light mb-2">
              Leadership Through Service
            </p>
            <p className="text-white/60 text-base mb-10 leading-relaxed max-w-xl">
              A community of future medical professionals committed to service,
              leadership, and making a meaningful impact in our community.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-semibold hover:bg-[#c9a432] transition-colors"
              >
                About Us <ArrowRight size={18} />
              </Link>
              <Link
                href="/members"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                <Users size={18} /> Our Members
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#002147]/5 flex items-center justify-center mx-auto mb-2">
                    <Icon size={20} className="text-[#002147]" />
                  </div>
                  <div className="text-3xl font-bold text-[#002147]">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Announcements Banner ──────────────────────────────────────────── */}
        {visibleAnnouncements.length > 0 && (
          <section>
            <div className="space-y-3">
              {visibleAnnouncements.map((ann) => {
                const typeColors = {
                  info: { bg: "bg-blue-50 border-blue-200", icon: "text-blue-600", title: "text-blue-900", body: "text-blue-700" },
                  update: { bg: "bg-amber-50 border-amber-200", icon: "text-amber-600", title: "text-amber-900", body: "text-amber-700" },
                  event: { bg: "bg-green-50 border-green-200", icon: "text-green-600", title: "text-green-900", body: "text-green-700" },
                }[ann.type];
                return (
                  <div key={ann.id} className={`rounded-2xl border px-5 py-4 flex items-start gap-4 ${typeColors.bg}`}>
                    <Megaphone size={18} className={`shrink-0 mt-0.5 ${typeColors.icon}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${typeColors.title}`}>{ann.title}</span>
                        {ann.pinned && <span className="text-xs font-semibold opacity-60">📌 Pinned</span>}
                        <span className={`text-xs opacity-50 ${typeColors.body}`}>
                          {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {ann.body && <p className={`text-sm mt-0.5 ${typeColors.body}`}>{ann.body}</p>}
                    </div>
                    <button
                      onClick={() => setDismissedAnnouncements((prev) => new Set([...prev, ann.id]))}
                      className={`shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors ${typeColors.icon}`}
                      aria-label="Dismiss"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── President & BOD ─────────────────────────────────────────────────── */}
        {(president || bod.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Our Leadership</h2>
                <p className="text-gray-500 text-sm mt-1">The team guiding our club this year</p>
              </div>
              <Link href="/about" className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                Full About Page <ArrowRight size={14} />
              </Link>
            </div>

            {/* President */}
            {president && (
              <div className="mb-6">
                <PresidentCard president={president} />
              </div>
            )}

            {/* Other BOD */}
            {otherBod.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {otherBod.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-[#D4AF37]/30 mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3">
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <div className="font-bold text-[#002147] text-sm leading-tight">{m.name}</div>
                    <div className="text-xs text-[#D4AF37] font-semibold mt-0.5">{m.role}</div>
                    {m.bio && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{m.bio}</p>}
                    <div className="flex justify-center gap-2 mt-3">
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="p-1.5 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                          <Mail size={13} />
                        </a>
                      )}
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="p-1.5 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                          <Phone size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && bod.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">BOD members will appear here once added from the admin dashboard.</p>
              </div>
            )}

            {/* President's Slogan */}
            {clubSettings.presidentSlogan && (
              <div className="mt-6 bg-gradient-to-r from-[#002147] to-[#003575] rounded-2xl px-6 py-5 flex items-center gap-4">
                <Quote size={28} className="text-[#D4AF37] shrink-0 opacity-70" />
                <div className="flex-1">
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">President's Slogan — Leo Year 2026/27</p>
                  <p className="text-white font-bold text-xl md:text-2xl italic">{clubSettings.presidentSlogan}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Featured Activities Carousel ─────────────────────────────────────── */}
        {featuredActivities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Featured Activities</h2>
                <p className="text-gray-500 text-sm mt-1">Highlights from our recent service work</p>
              </div>
              <Link href={`/archive/2026-27/january`} className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                Full Archive <ArrowRight size={14} />
              </Link>
            </div>
            <FeaturedCarousel activities={featuredActivities} />
          </section>
        )}

        {/* ── Latest Activities Grid ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#002147]">Latest Activities</h2>
              <p className="text-gray-500 text-sm mt-1">Our most recent service work</p>
            </div>
            <Link
              href="/archive/2026-27/january"
              className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1"
            >
              View Archive <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-36 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : latest.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p>No activities yet. Admin can add the first one from the dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {latest.map((act) => (
                <Link
                  key={act.id}
                  href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden block"
                >
                  {act.photos[0] ? (
                    <img
                      src={act.photos[0]}
                      alt={act.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-[#002147] to-[#003575] flex items-center justify-center">
                      <Calendar size={36} className="text-[#D4AF37]/60" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full">
                        {act.month} · {act.year}
                      </span>
                      {act.featured && <Pin size={11} className="text-[#D4AF37]" />}
                    </div>
                    <h3 className="font-bold text-[#002147] group-hover:text-[#003575] transition-colors line-clamp-2">
                      {act.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{act.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                      <Users size={11} /> {act.participants.length} participants
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Awards & Recognition ────────────────────────────────────────── */}
        {(awards.length > 0 || loading) && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Awards & Recognition</h2>
                <p className="text-gray-500 text-sm mt-1">Leo of the Month, outstanding member and club achievements</p>
              </div>
              <Link href="/awards" className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {awards.filter((a) => a.featured || a.type === "member").slice(0, 6).map((a) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start gap-3">
                      {a.photoUrl
                        ? <img src={a.photoUrl} alt={a.recipientName} className="w-12 h-12 rounded-xl object-cover border-2 border-[#D4AF37]/30 shrink-0" />
                        : <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${a.type === "member" ? "bg-[#D4AF37]/20" : "bg-[#002147]/10"}`}>
                            {a.type === "member" ? <Star size={20} className="text-[#D4AF37]" /> : <Building size={20} className="text-[#002147]" />}
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wide mb-0.5">{a.title}</div>
                        <div className="font-bold text-[#002147] truncate">{a.recipientName}</div>
                        {a.awardedBy && <div className="text-xs text-gray-400 truncate">By {a.awardedBy}</div>}
                        <div className="text-xs text-gray-400 mt-1">{a.month} · {a.year}</div>
                      </div>
                    </div>
                    {a.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{a.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {!loading && awards.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
                <Award size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Awards will appear here once added from the admin dashboard.</p>
              </div>
            )}
          </section>
        )}

        {/* ── Chartered Certificate ────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#002147]">Official Charter</h2>
            <p className="text-gray-500 text-sm mt-1">Officially established by Lions Clubs International District 325L · Club #172194</p>
          </div>
          <div className="bg-gradient-to-br from-[#002147] to-[#003575] rounded-3xl overflow-hidden shadow-xl text-white">
            <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
              {/* Left: info */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-4">
                  <Award size={12} /> Officially Chartered
                </div>
                <h3 className="text-2xl font-bold mb-2">Leo Club of KUSMS</h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  Chartered by Lions Clubs International under District 325L · Club #172194.<br />
                  Handover ceremony held on <span className="text-[#D4AF37] font-semibold">{CLUB_ESTABLISHED}</span>.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <Calendar size={14} className="text-[#D4AF37]" />
                    <span>Established {CLUB_ESTABLISHED}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <Award size={14} className="text-[#D4AF37]" />
                    <span>District 325L · Club #{CLUB_ID}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-5 justify-center md:justify-start">
                  <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565c0] rounded-xl px-4 py-2 text-sm font-medium transition-colors">
                    <Facebook size={14} /> Facebook
                  </a>
                  <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/50 hover:bg-black/70 border border-white/20 rounded-xl px-4 py-2 text-sm font-medium transition-colors">
                    <ExternalLink size={14} /> TikTok
                  </a>
                </div>
              </div>
              {/* Right: certificate or placeholder */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                {clubSettings.charteredCertificateUrl ? (
                  <div className="bg-white rounded-2xl p-2 shadow-lg">
                    {clubSettings.charteredCertificateType === "pdf" ? (
                      <a href={clubSettings.charteredCertificateUrl} target="_blank" rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 text-[#002147] p-6 hover:text-[#D4AF37] transition-colors">
                        <Award size={40} />
                        <span className="text-sm font-semibold">View Certificate (PDF)</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <img src={clubSettings.charteredCertificateUrl} alt="Chartered Certificate"
                        className="max-w-[220px] max-h-[280px] rounded-xl object-contain" />
                    )}
                  </div>
                ) : (
                  <div className="bg-white/10 border-2 border-dashed border-white/30 rounded-2xl p-8 flex flex-col items-center gap-3 text-white/50 text-center min-w-[180px]">
                    <Award size={36} className="text-[#D4AF37]/50" />
                    <p className="text-xs leading-relaxed">Chartered certificate will appear here.<br />Upload from Admin → Club Settings.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Impact Stats ─────────────────────────────────────────────────── */}
        <ImpactStats
          memberCount={members.length}
          activityCount={activities.length}
          participationCount={activities.reduce((s, a) => s + a.participants.length, 0)}
        />

        {/* ── Become a Leo / Join Us ───────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left */}
            <div className="p-8 md:p-10">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#002147] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-5">
                <Heart size={12} className="text-[#D4AF37]" /> Become a Leo
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#002147] mb-3">
                Join Our Community
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Are you a KUSMS student who wants to lead, serve, and grow? Leo Club of KUSMS welcomes passionate individuals who believe in making a difference through service.
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
                <a href={`https://wa.me/977?text=${encodeURIComponent("Hello! I'm interested in joining Leo Club of KUSMS.")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#20b858] transition-colors">
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
            </div>
            {/* Right: Requirements card */}
            <div className="bg-[#002147] p-8 md:p-10 flex flex-col justify-center">
              <h3 className="text-white font-bold text-lg mb-6">Who Can Join?</h3>
              <div className="space-y-4">
                {[
                  { title: "KUSMS Student", desc: "Currently enrolled at Kathmandu University School of Medical Sciences" },
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

        {/* ── Leo Analytics ──────────────────────────────────────────────────── */}
        {!loading && members.length > 0 && activities.length > 0 && (
          <LeoAnalytics members={members} activities={activities} awards={awards} />
        )}

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-[#002147] to-[#003575] text-white rounded-3xl p-10 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] flex items-center justify-center mx-auto mb-5">
            <Shield size={26} className="text-[#002147]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify a Member</h2>
          <p className="text-white/60 mb-6">Scan a QR code or enter a Member ID to verify credentials</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/members" className="flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-semibold hover:bg-[#c9a432] transition-colors">
              <Users size={18} /> Member Directory
            </Link>
            <Link href="/about" className="flex items-center gap-2 border border-white/30 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              <Info size={18} /> About Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
