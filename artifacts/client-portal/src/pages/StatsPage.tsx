import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import {
  getMembers, getActivities, getAllServiceImpacts,
  getBodMembers, getAwards, computeVolunteersFromActivities,
} from "@/lib/firestore";
import type { Member, Activity, ServiceImpact, BodMember, Award } from "@/lib/types";
import {
  LEO_YEARS, MONTHS, getMonthsInLeoOrder, getCurrentLeoYear,
  formatImpactNumber, formatCurrency,
} from "@/lib/types";
import {
  Users, Calendar, Award as AwardIcon, BarChart3, TrendingUp,
  Star, Heart, DollarSign, Clock, Flame, Trophy, Zap,
  Sparkles, AlertCircle,
} from "lucide-react";

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!isFinite(value) || value === 0) { setDisplay(0); return; }
    const duration = 700;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{display.toLocaleString("en-US")}</span>;
}

// ── Bar ───────────────────────────────────────────────────────────────────────
function Bar({ pct, tone = "navy" }: { pct: number; tone?: "navy" | "gold" | "muted" }) {
  const fill =
    tone === "gold"   ? "linear-gradient(90deg,#F0D77A,#D4AF37,#B8912A)" :
    tone === "muted"  ? "linear-gradient(90deg,#cbd5e1,#94a3b8)" :
                        "linear-gradient(90deg,#003575,#002147)";
  return (
    <div className="flex-1 bg-gray-100/80 rounded-full h-2.5 overflow-hidden relative">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.max(pct * 100, pct > 0 ? 4 : 0)}%`,
          background: fill,
          boxShadow: pct > 0 ? "0 0 12px rgba(212,175,55,0.15)" : "none",
        }}
      />
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({
  icon: Icon, title, subtitle,
}: { icon: typeof Users; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002147] to-[#003575] flex items-center justify-center shadow-md ring-1 ring-[#D4AF37]/25">
        <Icon size={17} className="text-[#D4AF37]" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#002147] tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function pickTopMember(
  members: Member[],
  activitiesInScope: Activity[],
  bodMemberIds: Set<string>
): { member: Member; count: number } | null {
  const counts: Record<string, number> = {};
  activitiesInScope.forEach((a) => {
    (a.participants ?? []).forEach((p) => {
      if (!p.memberId) return;
      if (bodMemberIds.has(p.memberId)) return;
      counts[p.memberId] = (counts[p.memberId] ?? 0) + 1;
    });
  });
  const eligible = members
    .filter((m) => counts[m.memberId] && !bodMemberIds.has(m.memberId))
    .sort((a, b) => {
      const diff = (counts[b.memberId] ?? 0) - (counts[a.memberId] ?? 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  const top = eligible[0];
  if (!top) return null;
  return { member: top, count: counts[top.memberId] ?? 0 };
}

export default function StatsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [impacts, setImpacts] = useState<ServiceImpact[]>([]);
  const [bodMembers, setBodMembers] = useState<BodMember[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  const currentLeoYear = getCurrentLeoYear();
  const [viewYear, setViewYear] = useState<string>(currentLeoYear);

  useEffect(() => {
    Promise.all([
      getMembers(),
      getActivities(),
      getAllServiceImpacts().catch(() => [] as ServiceImpact[]),
      getBodMembers().catch(() => [] as BodMember[]),
      getAwards().catch(() => [] as Award[]),
    ])
      .then(([m, a, imp, bod, aw]) => {
        setMembers(m ?? []);
        setActivities(a ?? []);
        setImpacts(imp ?? []);
        setBodMembers(bod ?? []);
        setAwards(aw ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeMembers = useMemo(() => members.filter((m) => m.isActive !== false), [members]);
  const pastMembers = useMemo(() => members.filter((m) => m.isActive === false), [members]);

  const totalParticipations = useMemo(
    () => activities.reduce((s, a) => s + (a.participants?.length ?? 0), 0),
    [activities]
  );

  const everParticipated = useMemo(() => {
    const ids = new Set<string>();
    activities.forEach((a) => (a.participants ?? []).forEach((p) => p.memberId && ids.add(p.memberId)));
    return ids.size;
  }, [activities]);

  const bodMemberIds = useMemo(
    () => new Set(bodMembers.map((b) => b.memberId).filter((id): id is string => Boolean(id))),
    [bodMembers]
  );

  const activityYears = useMemo(() => {
    const s = new Set<string>();
    activities.forEach((a) => a.year && s.add(a.year));
    return s;
  }, [activities]);
  const impactYears = useMemo(() => new Set(impacts.map((i) => i.leoYear)), [impacts]);

  const yearOptions = useMemo(() => {
    const opts = LEO_YEARS.filter((y) => activityYears.has(y) || impactYears.has(y) || y === currentLeoYear);
    return opts.length > 0 ? opts : [currentLeoYear];
  }, [activityYears, impactYears, currentLeoYear]);

  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()];
  const currentCalendarYear = now.getFullYear();

  const monthActivities = useMemo(
    () => activities.filter((a) => a.month === currentMonthName && a.year === currentLeoYear),
    [activities, currentMonthName, currentLeoYear]
  );
  const yearActivities = useMemo(
    () => activities.filter((a) => a.year === currentLeoYear),
    [activities, currentLeoYear]
  );
  const leoOfMonth = useMemo(
    () => pickTopMember(members, monthActivities, bodMemberIds),
    [members, monthActivities, bodMemberIds]
  );
  const leoOfYear = useMemo(
    () => pickTopMember(members, yearActivities, bodMemberIds),
    [members, yearActivities, bodMemberIds]
  );

  // ── Faculty distribution ──────────────────────────────────────────────────
  // Blank faculty is labeled "Unspecified" — NOT "Other". "Other" only appears
  // if a member explicitly picked "Other" from the dropdown.
  const facultyRows = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      const raw = (m.faculty ?? "").trim();
      const key = raw === "" ? "Unspecified" : raw;
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const order = ["MBBS", "BDS", "B.Sc. Nursing", "BPT", "BMIT", "BNS"];
    const rows = Object.entries(counts).map(([label, count]) => ({ label, count }));
    rows.sort((a, b) => {
      const ai = order.indexOf(a.label); const bi = order.indexOf(b.label);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      if (a.label === "Other") return 1;
      if (b.label === "Other") return -1;
      if (a.label === "Unspecified") return 1;
      if (b.label === "Unspecified") return -1;
      return b.count - a.count;
    });
    return rows;
  }, [members]);
  const maxFaculty = Math.max(1, ...facultyRows.map((r) => r.count));
  const unspecifiedCount = facultyRows.find((r) => r.label === "Unspecified")?.count ?? 0;

  const actsByYear = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach((a) => { counts[a.year] = (counts[a.year] ?? 0) + 1; });
    return counts;
  }, [activities]);

  const actYearRows = useMemo(
    () =>
      LEO_YEARS
        .map((y) => ({ label: y, count: actsByYear[y] ?? 0 }))
        .filter((r) => r.count > 0 || r.label === currentLeoYear)
        .sort((a, b) => LEO_YEARS.indexOf(a.label) - LEO_YEARS.indexOf(b.label)),
    [actsByYear, currentLeoYear]
  );
  const maxActYear = Math.max(1, ...actYearRows.map((r) => r.count));

  const busiestMonthRows = useMemo(() => {
    const filtered = activities.filter((a) => a.year === viewYear);
    const counts: Record<string, number> = {};
    filtered.forEach((a) => { counts[a.month] = (counts[a.month] ?? 0) + 1; });
    const leoOrder = getMonthsInLeoOrder();
    return leoOrder
      .map((m) => ({ label: m, count: counts[m] ?? 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return leoOrder.indexOf(a.label) - leoOrder.indexOf(b.label);
      })
      .slice(0, 8);
  }, [activities, viewYear]);
  const maxBusiestMonth = Math.max(1, ...busiestMonthRows.map((r) => r.count));

  const topMembers = useMemo(
    () => [...members]
      .sort((a, b) => (b.activities?.length ?? 0) - (a.activities?.length ?? 0))
      .slice(0, 10),
    [members]
  );

  const impactRows = useMemo(() => {
    const years = [...new Set([...impactYears, ...activityYears])]
      .sort((a, b) => LEO_YEARS.indexOf(b) - LEO_YEARS.indexOf(a));
    return years.map((year) => {
      const rec = impacts.find((i) => i.leoYear === year) ?? null;
      const volunteers = computeVolunteersFromActivities(activities, year);
      const activityCount = actsByYear[year] ?? 0;
      return {
        leoYear: year,
        peopleServed: rec?.peopleServed ?? 0,
        volunteers,
        volunteerHours: rec?.volunteerHours ?? 0,
        fundsDonatedNpr: rec?.fundsDonatedNpr ?? 0,
        fundsRaisedNpr: rec?.fundsRaisedNpr ?? 0,
        hasRecord: rec !== null,
        activityCount,
      };
    });
  }, [impactYears, activityYears, impacts, activities, actsByYear]);

  const impactTotals = useMemo(
    () =>
      impactRows.reduce(
        (acc, r) => ({
          peopleServed: acc.peopleServed + r.peopleServed,
          volunteersPerYear: acc.volunteersPerYear + r.volunteers,
          volunteerHours: acc.volunteerHours + r.volunteerHours,
          fundsDonatedNpr: acc.fundsDonatedNpr + r.fundsDonatedNpr,
          fundsRaisedNpr: acc.fundsRaisedNpr + r.fundsRaisedNpr,
        }),
        { peopleServed: 0, volunteersPerYear: 0, volunteerHours: 0, fundsDonatedNpr: 0, fundsRaisedNpr: 0 }
      ),
    [impactRows]
  );

  const mostProductiveYear = useMemo(() => {
    return LEO_YEARS.reduce<{ year: string; count: number }>(
      (best, y) => {
        const count = activities.filter((a) => a.year === y).length;
        return count > best.count ? { year: y, count } : best;
      },
      { year: "", count: 0 }
    );
  }, [activities]);

  const mostActiveMonth = useMemo(() => {
    return MONTHS.reduce<{ month: string; count: number }>(
      (best, m) => {
        const count = activities.filter((a) => a.month === m).length;
        return count > best.count ? { month: m, count } : best;
      },
      { month: "", count: 0 }
    );
  }, [activities]);

  const mostAwardedMember = useMemo(() => {
    return [...members]
      .map((m) => ({ member: m, count: awards.filter((a) => a.memberId === m.memberId).length }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)[0];
  }, [members, awards]);

  const growthRows = useMemo(() => {
    const joined: Record<string, number> = {};
    members.forEach((m) => {
      const y = m.joinedLeoYear ?? "";
      if (!y) return;
      joined[y] = (joined[y] ?? 0) + 1;
    });
    return LEO_YEARS
      .map((y) => ({ label: y, count: joined[y] ?? 0 }))
      .filter((r) => r.count > 0);
  }, [members]);
  const maxGrowth = Math.max(1, ...growthRows.map((r) => r.count));
  const totalJoined = growthRows.reduce((s, r) => s + r.count, 0);
  const membersMissingJoinYear = members.filter((m) => !m.joinedLeoYear).length;

  const dataWarnings: string[] = [];
  if (unspecifiedCount > 0) {
    dataWarnings.push(
      `${unspecifiedCount} member${unspecifiedCount === 1 ? "" : "s"} have no faculty set — shown as "Unspecified".`
    );
  }
  if (membersMissingJoinYear > 0) {
    dataWarnings.push(
      `${membersMissingJoinYear} member${membersMissingJoinYear === 1 ? "" : "s"} have no joined Leo year — excluded from growth chart.`
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-[#001a38] via-[#002147] to-[#003575] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(900px 260px at 15% 0%, rgba(212,175,55,0.18), transparent 60%), radial-gradient(700px 220px at 90% 100%, rgba(212,175,55,0.10), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(212,175,55,0.8),transparent)" }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F0D77A] text-[10px] font-bold uppercase tracking-[0.18em] mb-4">
            <Sparkles size={11} /> Live Snapshot
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F0D77A] to-[#D4AF37] flex items-center justify-center shrink-0 shadow-lg ring-1 ring-white/20">
              <BarChart3 size={21} className="text-[#002147]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em]">Club Statistics</h1>
          </div>
          <p className="text-white/70 max-w-2xl">
            A snapshot of Leo Club of KUSMS — members, activities, and impact across every Leo Year.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-9">
            {[
              { label: "Total Members", value: members.length, icon: Users },
              { label: "Active Members", value: activeMembers.length, icon: Star },
              { label: "Activities", value: activities.length, icon: Calendar },
              { label: "Participations", value: totalParticipations, icon: AwardIcon },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-4 hover:bg-white/[0.07] transition-colors"
                >
                  <Icon size={14} className="text-[#D4AF37] mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-white leading-none">
                    <Counter value={s.value} />
                  </div>
                  <div className="text-white/55 text-[11px] mt-1.5 tracking-wide uppercase font-medium">
                    {s.label}
                  </div>
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Data notes ── */}
        {dataWarnings.length > 0 && (
          <div className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#fffbea] to-[#fff7d6] p-4 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-[#002147] flex items-center justify-center shrink-0">
              <AlertCircle size={15} className="text-[#D4AF37]" />
            </div>
            <div className="text-sm text-[#4a3a06] space-y-1">
              <div className="font-semibold tracking-wide">Data notes</div>
              {dataWarnings.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          </div>
        )}

        {/* ── Service Impact ── */}
        {impactRows.length > 0 && (
          <section className="relative rounded-3xl overflow-hidden shadow-xl border border-[#D4AF37]/25">
            <div className="absolute inset-0 bg-gradient-to-br from-[#001a38] via-[#002147] to-[#003575]" />
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background:
                  "radial-gradient(700px 220px at 100% 0%, rgba(212,175,55,0.16), transparent 55%), radial-gradient(500px 180px at 0% 100%, rgba(212,175,55,0.10), transparent 55%)",
              }}
            />
            <div className="relative p-6 sm:p-8 text-white">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F0D77A] to-[#D4AF37] flex items-center justify-center shadow-md ring-1 ring-white/20">
                  <Heart size={18} className="text-[#002147]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-[-0.01em]">Our Service Impact</h2>
                  <p className="text-white/55 text-xs">Cumulative impact across all Leo Years</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "People Served", value: formatImpactNumber(impactTotals.peopleServed), icon: Heart },
                  { label: "Volunteer-Years", value: formatImpactNumber(impactTotals.volunteersPerYear), icon: Users, sub: `${everParticipated} unique` },
                  { label: "Hours", value: formatImpactNumber(impactTotals.volunteerHours), icon: Clock },
                  { label: "Funds Donated", value: formatCurrency(impactTotals.fundsDonatedNpr, "NPR"), icon: DollarSign },
                  { label: "Funds Raised", value: formatCurrency(impactTotals.fundsRaisedNpr, "NPR"), icon: TrendingUp },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-4 text-center hover:bg-white/[0.08] transition-colors"
                    >
                      <Icon size={14} className="text-[#D4AF37] mx-auto mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-white tabular-nums leading-tight">{s.value}</div>
                      <div className="text-white/55 text-[10px] sm:text-xs mt-1 leading-tight uppercase tracking-wide">{s.label}</div>
                      {s.sub && <div className="text-[9px] text-[#F0D77A]/85 mt-1">{s.sub}</div>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 overflow-x-auto -mx-2 sm:mx-0 rounded-2xl border border-white/10">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-white/55 text-[10px] uppercase tracking-wider bg-white/[0.04]">
                      <th className="py-3 px-4 font-semibold">Leo Year</th>
                      <th className="py-3 px-4 font-semibold text-right">People Served</th>
                      <th className="py-3 px-4 font-semibold text-right">Volunteers</th>
                      <th className="py-3 px-4 font-semibold text-right">Hours</th>
                      <th className="py-3 px-4 font-semibold text-right">Donated</th>
                      <th className="py-3 px-4 font-semibold text-right">Raised</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impactRows.map((r) => {
                      const isCurrent = r.leoYear === currentLeoYear;
                      const isEmpty = !r.hasRecord && r.activityCount === 0;
                      return (
                        <tr key={r.leoYear} className={`border-t border-white/5 ${isCurrent ? "bg-[#D4AF37]/10" : ""}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white">{r.leoYear}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold text-[#002147] bg-[#D4AF37] px-1.5 py-0.5 rounded-full uppercase">Current</span>
                              )}
                              {!r.hasRecord && !isEmpty && <span className="text-[9px] text-white/40 italic">auto</span>}
                              {isEmpty && <span className="text-[9px] text-white/40 italic">no data</span>}
                            </div>
                            <div className="text-xs text-white/40 mt-0.5">
                              {r.activityCount} activit{r.activityCount === 1 ? "y" : "ies"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-white">{formatImpactNumber(r.peopleServed)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-white">{formatImpactNumber(r.volunteers)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-white">{formatImpactNumber(r.volunteerHours)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-white">{formatCurrency(r.fundsDonatedNpr, "NPR")}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-white">{formatCurrency(r.fundsRaisedNpr, "NPR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#D4AF37]/40 bg-[#D4AF37]/5">
                      <td className="py-3 px-4 font-bold text-[#F0D77A]">Total</td>
                      <td className="py-3 px-4 text-right font-bold text-[#F0D77A] tabular-nums">{formatImpactNumber(impactTotals.peopleServed)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#F0D77A] tabular-nums">{formatImpactNumber(impactTotals.volunteersPerYear)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#F0D77A] tabular-nums">{formatImpactNumber(impactTotals.volunteerHours)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#F0D77A] tabular-nums">{formatCurrency(impactTotals.fundsDonatedNpr, "NPR")}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#F0D77A] tabular-nums">{formatCurrency(impactTotals.fundsRaisedNpr, "NPR")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-xs text-white/40 mt-4">
                Volunteers are counted per Leo Year (unique members within each year). The same person may be counted in multiple years.
                {" "}<span className="text-[#F0D77A]/80">{everParticipated} unique member{everParticipated === 1 ? "" : "s"}</span> have ever participated.
              </p>
            </div>
          </section>
        )}

        {/* ── Leo of Month / Year ── */}
        {(leoOfMonth || leoOfYear) && (
          <section>
            <SectionHeading icon={Flame} title="Suggested Leo of the Month & Year" subtitle="Recognizing outstanding non-BOD contributors" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leoOfMonth && (
                <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#D4AF37]/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#001a38] via-[#002147] to-[#003575]" />
                  <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(400px 140px at 100% 0%, rgba(212,175,55,0.20), transparent 60%)" }} />
                  <div className="relative p-5 sm:p-6 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Flame size={15} className="text-[#D4AF37]" />
                      <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-[0.16em]">Leo of the Month</span>
                      <span className="ml-auto text-xs text-white/40">{currentMonthName} {currentCalendarYear}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {leoOfMonth.member.photoUrl ? (
                        <img src={leoOfMonth.member.photoUrl} alt={leoOfMonth.member.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#002147] shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 ring-2 ring-[#D4AF37]/40 flex items-center justify-center shrink-0">
                          <span className="text-2xl font-bold text-[#D4AF37]">{leoOfMonth.member.name[0]}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold truncate">{leoOfMonth.member.name}</div>
                        <div className="text-white/55 text-xs truncate">{leoOfMonth.member.currentRole || "Leo Member"}</div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="bg-gradient-to-r from-[#F0D77A] to-[#D4AF37] text-[#002147] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            {leoOfMonth.count} activit{leoOfMonth.count === 1 ? "y" : "ies"} this month
                          </span>
                          <Link href={`/members/${leoOfMonth.member.memberId}`}
                            className="text-xs text-white/60 hover:text-white transition-colors underline underline-offset-2">
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {leoOfYear && (
                <div className="relative rounded-3xl overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F0D77A] via-[#D4AF37] to-[#B8912A]" />
                  <div className="relative p-5 sm:p-6 text-[#002147]">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy size={15} className="text-[#002147]" />
                      <span className="font-bold text-xs uppercase tracking-[0.16em]">Leo of the Year</span>
                      <span className="ml-auto text-xs text-[#002147]/60">Leo Year {currentLeoYear}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {leoOfYear.member.photoUrl ? (
                        <img src={leoOfYear.member.photoUrl} alt={leoOfYear.member.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#002147] ring-offset-2 ring-offset-[#D4AF37] shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#002147]/15 ring-2 ring-[#002147]/30 flex items-center justify-center shrink-0">
                          <span className="text-2xl font-bold text-[#002147]">{leoOfYear.member.name[0]}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold truncate">{leoOfYear.member.name}</div>
                        <div className="text-[#002147]/70 text-xs truncate">{leoOfYear.member.currentRole || "Leo Member"}</div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="bg-[#002147] text-[#F0D77A] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            {leoOfYear.count} activit{leoOfYear.count === 1 ? "y" : "ies"} this year
                          </span>
                          <Link href={`/members/${leoOfYear.member.memberId}`}
                            className="text-xs text-[#002147]/70 hover:text-[#002147] transition-colors underline underline-offset-2">
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              BOD members are excluded from these recognitions to give regular members a chance to shine.
            </p>
          </section>
        )}

        {/* ── Members by Faculty ── */}
        {facultyRows.length > 0 && (
          <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeading icon={Users} title="Members by Faculty" />
            <div className="space-y-3">
              {facultyRows.map((r, idx) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-gray-700 font-medium shrink-0 truncate">{r.label}</div>
                  <Bar
                    pct={r.count / maxFaculty}
                    tone={idx === 0 ? "gold" : r.label === "Unspecified" ? "muted" : "navy"}
                  />
                  <div className="w-10 text-right text-sm font-bold text-[#002147] shrink-0 tabular-nums">{r.count}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400 flex gap-4">
              <span>Active: <span className="text-[#002147] font-semibold">{activeMembers.length}</span></span>
              <span>Past: <span className="text-[#002147] font-semibold">{pastMembers.length}</span></span>
            </div>
          </section>
        )}

        {/* ── Activities per Year + Busiest Months ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actYearRows.length > 0 && (
            <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <SectionHeading icon={Calendar} title="Activities per Leo Year" />
              <div className="space-y-3">
                {actYearRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-gray-600 font-mono shrink-0">{r.label}</div>
                    <Bar pct={r.count / maxActYear} tone="navy" />
                    <div className="w-8 text-right text-sm font-bold text-[#002147] shrink-0 tabular-nums">{r.count}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {busiestMonthRows.length > 0 && (
            <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002147] to-[#003575] flex items-center justify-center shadow-md ring-1 ring-[#D4AF37]/25">
                    <AwardIcon size={17} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#002147] tracking-[-0.01em]">Busiest Months</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Across activities in {viewYear}</p>
                  </div>
                </div>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-semibold text-[#002147] bg-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                {busiestMonthRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-gray-600 shrink-0">{r.label}</div>
                    <Bar pct={r.count / maxBusiestMonth} tone="gold" />
                    <div className="w-8 text-right text-sm font-bold text-[#002147] shrink-0 tabular-nums">{r.count}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Club Intelligence ── */}
        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <SectionHeading icon={Zap} title="Club Intelligence" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mostProductiveYear.year && (
              <div className="group relative rounded-2xl border border-gray-100 bg-gradient-to-br from-[#F8FAFC] to-white p-4 hover:border-[#D4AF37]/40 hover:shadow-md transition-all">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Most Productive Year</div>
                <div className="font-bold text-[#002147] mt-1 text-lg">Leo Year {mostProductiveYear.year}</div>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-2xl font-bold text-[#D4AF37] tabular-nums">{mostProductiveYear.count}</span>
                  <span className="text-xs text-gray-400 mb-1">activities</span>
                </div>
              </div>
            )}
            {mostActiveMonth.month && (
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-[#F8FAFC] to-white p-4 hover:border-[#D4AF37]/40 hover:shadow-md transition-all">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Most Active Month</div>
                <div className="font-bold text-[#002147] mt-1 text-lg">{mostActiveMonth.month}</div>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-2xl font-bold text-[#D4AF37] tabular-nums">{mostActiveMonth.count}</span>
                  <span className="text-xs text-gray-400 mb-1">across all years</span>
                </div>
              </div>
            )}
            {mostAwardedMember && (
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-[#F8FAFC] to-white p-4 hover:border-[#D4AF37]/40 hover:shadow-md transition-all">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Most Recognized Leo</div>
                <div className="font-bold text-[#002147] mt-1 text-lg truncate">{mostAwardedMember.member.name}</div>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-2xl font-bold text-[#D4AF37] tabular-nums">{mostAwardedMember.count}</span>
                  <span className="text-xs text-gray-400 mb-1">awards</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Top Contributors ── */}
        {topMembers.length > 0 && (
          <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeading icon={Star} title="Top Contributors" subtitle="Ranked by all-time activity count" />
            <div className="space-y-3">
              {topMembers.map((m, i) => {
                const count = m.activities?.length ?? 0;
                const maxCount = topMembers[0].activities?.length ?? 1;
                const medal =
                  i === 0 ? "bg-gradient-to-br from-[#F0D77A] to-[#D4AF37] text-[#002147] shadow-md" :
                  i === 1 ? "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800" :
                  i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white" :
                            "bg-gray-100 text-gray-500";
                return (
                  <div key={m.memberId} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${medal}`}>
                      {i + 1}
                    </div>
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#002147] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#002147] truncate">{m.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{m.faculty ?? "—"} · {m.batch || "—"}</span>
                      </div>
                      <Bar pct={count / maxCount} tone={i === 0 ? "gold" : "navy"} />
                    </div>
                    <div className="w-10 text-right text-sm font-bold text-[#002147] shrink-0 tabular-nums">{count}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Membership Growth ── */}
        {growthRows.length > 0 && (
          <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeading
              icon={TrendingUp}
              title="Membership Growth"
              subtitle={`${totalJoined} member${totalJoined === 1 ? "" : "s"} joined across ${growthRows.length} Leo Year${growthRows.length === 1 ? "" : "s"}.`}
            />
            <div className="space-y-3">
              {growthRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-600 font-mono shrink-0">{r.label}</div>
                  <Bar pct={r.count / maxGrowth} tone="gold" />
                  <div className="w-10 text-right text-sm font-bold text-[#002147] shrink-0 tabular-nums">{r.count}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100">
              Counts members whose joined Leo Year matches each year. Members without a joined year are not shown.
            </p>
          </section>
        )}

        {members.length === 0 && activities.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
            <p>Statistics will appear once members and activities are added.</p>
          </div>
        )}
      </div>
    </div>
  );
}
