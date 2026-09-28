import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getMembers, getActivities, getAllServiceImpacts,
  getBodMembers, getAwards, computeVolunteersFromActivities,
} from "@/lib/firestore";
import type { Member, Activity, ServiceImpact, BodMember, Award } from "@/lib/types";
import {
  FACULTIES, LEO_YEARS, MONTHS, getMonthsInLeoOrder, getCurrentLeoYear,
  leoMonthToCalendarYear, formatImpactNumber, formatCurrency,
} from "@/lib/types";
import {
  Users, Calendar, Award as AwardIcon, BarChart3, TrendingUp,
  Star, Heart, DollarSign, Clock, Flame, Trophy, Zap, Crown,
} from "lucide-react";

function Bar({ pct, color = "#002147" }: { pct: number; color?: string }) {
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(pct * 100, pct > 0 ? 4 : 0)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Helper: pick highest-activity member from a filtered set ─────────────────
// Excludes BOD members, breaks ties alphabetically.
function pickTopMember(
  members: Member[],
  activitiesInScope: Activity[],
  bodMemberIds: Set<string>
): { member: Member; count: number } | null {
  const counts: Record<string, number> = {};
  activitiesInScope.forEach((a) => {
    a.participants.forEach((p) => {
      if (!p.memberId) return;
      if (bodMemberIds.has(p.memberId)) return; // exclude BOD
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

  useEffect(() => {
    Promise.all([
      getMembers(),
      getActivities(),
      getAllServiceImpacts().catch(() => [] as ServiceImpact[]),
      getBodMembers().catch(() => [] as BodMember[]),
      getAwards().catch(() => [] as Award[]),
    ])
      .then(([m, a, imp, bod, aw]) => {
        setMembers(m);
        setActivities(a);
        setImpacts(imp);
        setBodMembers(bod);
        setAwards(aw);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeMembers = members.filter((m) => m.isActive !== false);
  const pastMembers = members.filter((m) => m.isActive === false);
  const totalParticipations = activities.reduce((s, a) => s + a.participants.length, 0);

  // ── BOD member IDs — used to exclude BOD from Leo of Month/Year suggestions ──
  const bodMemberIds = new Set(
    bodMembers.map((b) => b.memberId).filter((id): id is string => Boolean(id))
  );

  // ── Current date info ──
  const currentLeoYear = getCurrentLeoYear();
  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()]; // e.g. "September"
  const currentCalendarYear = now.getFullYear();

  // ── Suggested Leo of the Month ──
  // Activities from the CURRENT calendar month + current Leo Year only.
  const monthActivities = activities.filter(
    (a) => a.month === currentMonthName && a.year === currentLeoYear
  );
  const leoOfMonth = pickTopMember(members, monthActivities, bodMemberIds);

  // ── Suggested Leo of the Year ──
  // Activities from the whole CURRENT Leo Year.
  const yearActivities = activities.filter((a) => a.year === currentLeoYear);
  const leoOfYear = pickTopMember(members, yearActivities, bodMemberIds);

  // ── Faculty distribution ──────────────────────────────────────────────────
  const facultyCounts: Record<string, number> = {};
  members.forEach((m) => {
    const raw = (m.faculty ?? "").trim();
    const f = raw === "" ? "Other" : raw;
    facultyCounts[f] = (facultyCounts[f] ?? 0) + 1;
  });
  const maxFaculty = Math.max(1, ...Object.values(facultyCounts));
  const allFacultyLabels = new Set<string>([...FACULTIES, ...Object.keys(facultyCounts)]);
  const facultyRows = [...allFacultyLabels]
    .map((f) => ({ label: f, count: facultyCounts[f] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => {
      if (a.label === "Other" && b.label !== "Other") return 1;
      if (b.label === "Other" && a.label !== "Other") return -1;
      return b.count - a.count;
    });

  // ── Activities per Leo year ───────────────────────────────────────────────
  const actsByYear: Record<string, number> = {};
  activities.forEach((a) => { actsByYear[a.year] = (actsByYear[a.year] ?? 0) + 1; });
  const maxActYear = Math.max(1, ...Object.values(actsByYear));
  const actYearRows = LEO_YEARS.map((y) => ({ label: y, count: actsByYear[y] ?? 0 }))
    .filter((r) => r.count > 0);

  // ── Busiest months ────────────────────────────────────────────────────────
  const actsByMonth: Record<string, number> = {};
  activities.forEach((a) => { actsByMonth[a.month] = (actsByMonth[a.month] ?? 0) + 1; });
  const maxActMonth = Math.max(1, ...Object.values(actsByMonth));
  const leoMonthOrder = getMonthsInLeoOrder();
  const monthRows = leoMonthOrder
    .map((m) => ({ label: m, count: actsByMonth[m] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return leoMonthOrder.indexOf(a.label) - leoMonthOrder.indexOf(b.label);
    })
    .slice(0, 6);

  // ── Top contributors (all-time, includes everyone) ────────────────────────
  const topMembers = [...members]
    .sort((a, b) => (b.activities?.length ?? 0) - (a.activities?.length ?? 0))
    .slice(0, 10);

  // ── Service Impact by Leo Year ────────────────────────────────────────────
  const allImpactYears = [...new Set([
    ...impacts.map((i) => i.leoYear),
    ...actYearRows.map((r) => r.label),
  ])].sort((a, b) => LEO_YEARS.indexOf(b) - LEO_YEARS.indexOf(a));

  const impactRows = allImpactYears.map((year) => {
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

  const impactTotals = impactRows.reduce(
    (acc, r) => ({
      peopleServed: acc.peopleServed + r.peopleServed,
      volunteers: acc.volunteers + r.volunteers,
      volunteerHours: acc.volunteerHours + r.volunteerHours,
      fundsDonatedNpr: acc.fundsDonatedNpr + r.fundsDonatedNpr,
      fundsRaisedNpr: acc.fundsRaisedNpr + r.fundsRaisedNpr,
    }),
    { peopleServed: 0, volunteers: 0, volunteerHours: 0, fundsDonatedNpr: 0, fundsRaisedNpr: 0 }
  );

  // ── Club Intelligence ─────────────────────────────────────────────────────
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

  // ── Membership Growth ─────────────────────────────────────────────────────
  // Count how many members joined in each Leo Year (using joinedLeoYear).
  const joinedByYear: Record<string, number> = {};
  members.forEach((m) => {
    const y = m.joinedLeoYear ?? "";
    if (!y) return;
    joinedByYear[y] = (joinedByYear[y] ?? 0) + 1;
  });
  const growthRows = LEO_YEARS
    .map((y) => ({ label: y, count: joinedByYear[y] ?? 0 }))
    .filter((r) => r.count > 0);
  const maxGrowth = Math.max(1, ...growthRows.map((r) => r.count));
  const totalJoined = growthRows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Header ── */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0">
              <BarChart3 size={20} className="text-[#002147]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Club Statistics</h1>
          </div>
          <p className="text-white/70">A snapshot of Leo Club of KUSMS — members, activities, and impact.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
            {[
              { label: "Total Members", value: members.length, icon: Users, color: "text-[#D4AF37]" },
              { label: "Active Members", value: activeMembers.length, icon: Star, color: "text-green-400" },
              { label: "Activities", value: activities.length, icon: Calendar, color: "text-[#D4AF37]" },
              { label: "Participations", value: totalParticipations, icon: AwardIcon, color: "text-[#D4AF37]" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-white/50 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Service Impact by Leo Year ── */}
        {impactRows.length > 0 && (
          <section className="bg-gradient-to-br from-[#002147] to-[#003575] rounded-2xl border-2 border-[#D4AF37]/20 p-6 shadow-xl text-white">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={20} className="text-[#D4AF37]" />
              <h2 className="text-xl font-bold">Our Service Impact</h2>
            </div>
            <p className="text-white/60 text-sm mb-6">
              Cumulative impact across all Leo Years — measured in lives touched, hours served, and generosity given.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
              <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-4">
                Cumulative — All Leo Years
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: "People Served", value: formatImpactNumber(impactTotals.peopleServed), icon: Heart },
                  { label: "Volunteers", value: formatImpactNumber(impactTotals.volunteers), icon: Users },
                  { label: "Hours", value: formatImpactNumber(impactTotals.volunteerHours), icon: Clock },
                  { label: "Funds Donated", value: formatCurrency(impactTotals.fundsDonatedNpr, "NPR"), icon: DollarSign },
                  { label: "Funds Raised", value: formatCurrency(impactTotals.fundsRaisedNpr, "NPR"), icon: TrendingUp },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="text-center">
                      <Icon size={16} className="text-[#D4AF37] mx-auto mb-2" />
                      <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">{s.value}</div>
                      <div className="text-white/50 text-[10px] sm:text-xs mt-1 leading-tight">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-white/60 text-xs uppercase tracking-wider border-b border-white/10">
                    <th className="py-3 px-3 font-semibold">Leo Year</th>
                    <th className="py-3 px-3 font-semibold text-right">People Served</th>
                    <th className="py-3 px-3 font-semibold text-right">Volunteers</th>
                    <th className="py-3 px-3 font-semibold text-right">Hours</th>
                    <th className="py-3 px-3 font-semibold text-right">Donated (NPR)</th>
                    <th className="py-3 px-3 font-semibold text-right">Raised (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  {impactRows.map((r) => {
                    const isCurrent = r.leoYear === currentLeoYear;
                    return (
                      <tr key={r.leoYear} className={`border-b border-white/5 ${isCurrent ? "bg-[#D4AF37]/10" : ""}`}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{r.leoYear}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-[#002147] bg-[#D4AF37] px-1.5 py-0.5 rounded-full uppercase">
                                Current
                              </span>
                            )}
                            {!r.hasRecord && <span className="text-[9px] text-white/40 italic">(auto)</span>}
                          </div>
                          <div className="text-xs text-white/40">
                            {r.activityCount} activit{r.activityCount === 1 ? "y" : "ies"}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-white">{formatImpactNumber(r.peopleServed)}</td>
                        <td className="py-3 px-3 text-right tabular-nums text-white">{formatImpactNumber(r.volunteers)}</td>
                        <td className="py-3 px-3 text-right tabular-nums text-white">{formatImpactNumber(r.volunteerHours)}</td>
                        <td className="py-3 px-3 text-right tabular-nums text-white">{formatCurrency(r.fundsDonatedNpr, "NPR")}</td>
                        <td className="py-3 px-3 text-right tabular-nums text-white">{formatCurrency(r.fundsRaisedNpr, "NPR")}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#D4AF37]/30">
                    <td className="py-3 px-3 font-bold text-[#D4AF37]">Total</td>
                    <td className="py-3 px-3 text-right font-bold text-[#D4AF37] tabular-nums">{formatImpactNumber(impactTotals.peopleServed)}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#D4AF37] tabular-nums">{formatImpactNumber(impactTotals.volunteers)}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#D4AF37] tabular-nums">{formatImpactNumber(impactTotals.volunteerHours)}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#D4AF37] tabular-nums">{formatCurrency(impactTotals.fundsDonatedNpr, "NPR")}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#D4AF37] tabular-nums">{formatCurrency(impactTotals.fundsRaisedNpr, "NPR")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-xs text-white/40 mt-4">
              Volunteers are auto-counted from unique participants in each year's activities. Other numbers are entered by admin.
            </p>
          </section>
        )}

        {/* ── Suggested Leo of the Month + Leo of the Year ── */}
        {(leoOfMonth || leoOfYear) && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#002147] flex items-center justify-center">
                <Flame size={15} className="text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#002147]">Suggested Leo of the Month &amp; Year</h2>
                <p className="text-xs text-gray-500">Recognizing outstanding non-BOD contributors</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Leo of the Month */}
              {leoOfMonth && (
                <div className="bg-gradient-to-br from-[#002147] to-[#003575] rounded-2xl p-5 sm:p-6 text-white shadow-lg border-2 border-[#D4AF37]/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame size={15} className="text-[#D4AF37]" />
                    <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider">
                      Leo of the Month
                    </span>
                    <span className="ml-auto text-xs text-white/40">
                      {currentMonthName} {currentCalendarYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {leoOfMonth.member.photoUrl ? (
                      <img src={leoOfMonth.member.photoUrl} alt={leoOfMonth.member.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37] shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                        <span className="text-2xl font-bold text-[#D4AF37]">{leoOfMonth.member.name[0]}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-lg sm:text-xl font-bold truncate">{leoOfMonth.member.name}</div>
                      <div className="text-white/60 text-xs sm:text-sm truncate">
                        {leoOfMonth.member.currentRole || "Leo Member"}
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <div className="bg-[#D4AF37] text-[#002147] text-xs font-bold px-3 py-1 rounded-full">
                          {leoOfMonth.count} activit{leoOfMonth.count === 1 ? "y" : "ies"} this month
                        </div>
                        <Link href={`/members/${leoOfMonth.member.memberId}`}
                          className="text-xs text-white/60 hover:text-white transition-colors underline underline-offset-2">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leo of the Year */}
              {leoOfYear && (
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#c9a432] rounded-2xl p-5 sm:p-6 text-[#002147] shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy size={15} className="text-[#002147]" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Leo of the Year
                    </span>
                    <span className="ml-auto text-xs text-[#002147]/60">
                      Leo Year {currentLeoYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {leoOfYear.member.photoUrl ? (
                      <img src={leoOfYear.member.photoUrl} alt={leoOfYear.member.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#002147] shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#002147]/15 border-2 border-[#002147]/30 flex items-center justify-center shrink-0">
                        <span className="text-2xl font-bold text-[#002147]">{leoOfYear.member.name[0]}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-lg sm:text-xl font-bold truncate">{leoOfYear.member.name}</div>
                      <div className="text-[#002147]/70 text-xs sm:text-sm truncate">
                        {leoOfYear.member.currentRole || "Leo Member"}
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <div className="bg-[#002147] text-[#D4AF37] text-xs font-bold px-3 py-1 rounded-full">
                          {leoOfYear.count} activit{leoOfYear.count === 1 ? "y" : "ies"} this year
                        </div>
                        <Link href={`/members/${leoOfYear.member.memberId}`}
                          className="text-xs text-[#002147]/70 hover:text-[#002147] transition-colors underline underline-offset-2">
                          View Profile
                        </Link>
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
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#002147] mb-5 flex items-center gap-2">
              <Users size={18} className="text-[#D4AF37]" /> Members by Faculty
            </h2>
            <div className="space-y-3">
              {facultyRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-gray-600 font-medium shrink-0 truncate">{r.label}</div>
                  <Bar pct={r.count / maxFaculty} color={r.label === "Other" ? "#94a3b8" : "#002147"} />
                  <div className="w-10 text-right text-sm font-bold text-[#002147] shrink-0">{r.count}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-400 flex gap-4">
              <span>Active: {activeMembers.length}</span>
              <span>Past: {pastMembers.length}</span>
            </div>
          </section>
        )}

        {/* ── Activities per Leo Year + Busiest Months (2-column) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actYearRows.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#002147] mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-[#D4AF37]" /> Activities per Leo Year
              </h2>
              <div className="space-y-3">
                {actYearRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-gray-600 font-mono shrink-0">{r.label}</div>
                    <Bar pct={r.count / maxActYear} color="#002147" />
                    <div className="w-8 text-right text-sm font-bold text-[#002147] shrink-0">{r.count}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {monthRows.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#002147] mb-4 flex items-center gap-2">
                <AwardIcon size={16} className="text-[#D4AF37]" /> Busiest Months
              </h2>
              <div className="space-y-3">
                {monthRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-600 shrink-0">{r.label}</div>
                    <Bar pct={r.count / maxActMonth} color="#D4AF37" />
                    <div className="w-8 text-right text-sm font-bold text-[#002147] shrink-0">{r.count}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Club Intelligence ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#002147] mb-5 flex items-center gap-2">
            <Zap size={18} className="text-[#D4AF37]" /> Club Intelligence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mostProductiveYear.year && (
              <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
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
              <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
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
              <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Most Recognized Leo</div>
                  <div className="font-bold text-[#002147] mt-0.5 truncate">{mostAwardedMember.member.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-[#D4AF37]">{mostAwardedMember.count}</div>
                  <div className="text-xs text-gray-400">awards</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Top Contributors — All Time ── */}
        {topMembers.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#002147] mb-5 flex items-center gap-2">
              <Star size={18} className="text-[#D4AF37]" /> Top Contributors
              <span className="text-sm text-gray-400 font-normal ml-1">by activity count</span>
            </h2>
            <div className="space-y-3">
              {topMembers.map((m, i) => {
                const count = m.activities?.length ?? 0;
                const maxCount = topMembers[0].activities?.length ?? 1;
                return (
                  <div key={m.memberId} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-[#D4AF37] text-[#002147]" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-amber-700/80 text-white" : "bg-gray-100 text-gray-500"}`}>
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
                      <Bar pct={count / maxCount} color={i === 0 ? "#D4AF37" : "#002147"} />
                    </div>
                    <div className="w-10 text-right text-sm font-bold text-[#002147] shrink-0">{count}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Membership Growth ── */}
        {growthRows.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#002147] mb-2 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#D4AF37]" /> Membership Growth
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {totalJoined} member{totalJoined === 1 ? "" : "s"} joined across {growthRows.length} Leo Year{growthRows.length === 1 ? "" : "s"}.
            </p>
            <div className="space-y-3">
              {growthRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-600 font-mono shrink-0">{r.label}</div>
                  <Bar pct={r.count / maxGrowth} color="#D4AF37" />
                  <div className="w-10 text-right text-sm font-bold text-[#002147] shrink-0">{r.count}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
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
