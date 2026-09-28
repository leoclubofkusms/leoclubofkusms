import { useEffect, useState } from "react";
import { getMembers, getActivities, getAllServiceImpacts, computeVolunteersFromActivities } from "@/lib/firestore";
import type { Member, Activity, ServiceImpact } from "@/lib/types";
import { FACULTIES, LEO_YEARS, getMonthsInLeoOrder, getCurrentLeoYear, formatImpactNumber, formatCurrency } from "@/lib/types";
import { Users, Calendar, Award, BarChart3, TrendingUp, Star, Heart, DollarSign, Clock } from "lucide-react";

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

export default function StatsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [impacts, setImpacts] = useState<ServiceImpact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMembers(),
      getActivities(),
      getAllServiceImpacts().catch(() => [] as ServiceImpact[]),
    ])
      .then(([m, a, imp]) => { setMembers(m); setActivities(a); setImpacts(imp); })
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

  // ── Faculty distribution ───────────────────────────────────────────────────
  // Treat null / undefined / empty / whitespace faculty as "Other", and include
  // any custom faculty values that aren't in the FACULTIES list. "Other" is
  // always sorted last.
  const facultyCounts: Record<string, number> = {};
  members.forEach((m) => {
    const raw = (m.faculty ?? "").trim();
    const f = raw === "" ? "Other" : raw;
    facultyCounts[f] = (facultyCounts[f] ?? 0) + 1;
  });
  const maxFaculty = Math.max(1, ...Object.values(facultyCounts));
  const allFacultyLabels = new Set<string>([
    ...FACULTIES,
    ...Object.keys(facultyCounts),
  ]);
  const facultyRows = [...allFacultyLabels]
    .map((f) => ({ label: f, count: facultyCounts[f] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => {
      // "Other" always goes last
      if (a.label === "Other" && b.label !== "Other") return 1;
      if (b.label === "Other" && a.label !== "Other") return -1;
      return b.count - a.count;
    });

  // ── Batch year distribution ────────────────────────────────────────────────
  // Treat null / undefined / empty / whitespace batch as "Unknown". "Unknown"
  // is always sorted last.
  const batchCounts: Record<string, number> = {};
  members.forEach((m) => {
    const raw = (m.batch ?? "").trim();
    const b = raw === "" ? "Unknown" : raw;
    batchCounts[b] = (batchCounts[b] ?? 0) + 1;
  });
  const maxBatch = Math.max(1, ...Object.values(batchCounts));
  const batchRows = Object.entries(batchCounts)
    .sort((a, b) => {
      // "Unknown" always goes last
      if (a[0] === "Unknown" && b[0] !== "Unknown") return 1;
      if (b[0] === "Unknown" && a[0] !== "Unknown") return -1;
      return a[0].localeCompare(b[0], undefined, { numeric: true });
    })
    .map(([label, count]) => ({ label, count }));

  // ── Activities per Leo year ────────────────────────────────────────────────
  const actsByYear: Record<string, number> = {};
  activities.forEach((a) => { actsByYear[a.year] = (actsByYear[a.year] ?? 0) + 1; });
  const maxActYear = Math.max(1, ...Object.values(actsByYear));
  const actYearRows = LEO_YEARS.map((y) => ({ label: y, count: actsByYear[y] ?? 0 }))
    .filter((r) => r.count > 0);

  // ── Busiest months (tie-break using Leo Year order: July → June) ───────────
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

  // ── Top contributors ───────────────────────────────────────────────────────
  const topMembers = [...members]
    .sort((a, b) => (b.activities?.length ?? 0) - (a.activities?.length ?? 0))
    .slice(0, 10);

  // ── Service Impact by Leo Year ─────────────────────────────────────────────
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

  const currentLeoYear = getCurrentLeoYear();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0">
              <BarChart3 size={20} className="text-[#002147]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Club Statistics</h1>
          </div>
          <p className="text-white/70">A snapshot of Leo Club of KUSMS — members, activities, and impact.</p>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
            {[
              { label: "Total Members", value: members.length, icon: Users, color: "text-[#D4AF37]" },
              { label: "Active Members", value: activeMembers.length, icon: Star, color: "text-green-400" },
              { label: "Activities", value: activities.length, icon: Calendar, color: "text-[#D4AF37]" },
              { label: "Participations", value: totalParticipations, icon: Award, color: "text-[#D4AF37]" },
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

            {/* Cumulative totals card */}
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

            {/* Per-year table */}
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
                      <tr
                        key={r.leoYear}
                        className={`border-b border-white/5 ${isCurrent ? "bg-[#D4AF37]/10" : ""}`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{r.leoYear}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-[#002147] bg-[#D4AF37] px-1.5 py-0.5 rounded-full uppercase">
                                Current
                              </span>
                            )}
                            {!r.hasRecord && (
                              <span className="text-[9px] text-white/40 italic">(auto)</span>
                            )}
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

        {/* Members by Faculty */}
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

        {/* Members by Batch Year */}
        {batchRows.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#002147] mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#D4AF37]" /> Members by Admission Year
            </h2>
            <div className="space-y-3">
              {batchRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-600 font-mono font-medium shrink-0">{r.label}</div>
                  <Bar pct={r.count / maxBatch} color={r.label === "Unknown" ? "#94a3b8" : "#D4AF37"} />
                  <div className="w-10 text-right text-sm font-bold text-[#002147] shrink-0">{r.count}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Two column: activities per year + busiest months */}
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
                <Award size={16} className="text-[#D4AF37]" /> Busiest Months
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

        {/* Top Contributors */}
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
