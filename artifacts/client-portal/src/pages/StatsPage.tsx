import { useEffect, useState } from "react";
import { getMembers, getActivities } from "@/lib/firestore";
import type { Member, Activity } from "@/lib/types";
import { FACULTIES, LEO_YEARS, MONTHS } from "@/lib/types";
import { Users, Calendar, Award, BarChart3, TrendingUp, Star } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMembers(), getActivities()])
      .then(([m, a]) => { setMembers(m); setActivities(a); })
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
  const facultyCounts: Record<string, number> = {};
  members.forEach((m) => {
    const f = m.faculty ?? "Other";
    facultyCounts[f] = (facultyCounts[f] ?? 0) + 1;
  });
  const maxFaculty = Math.max(1, ...Object.values(facultyCounts));
  const facultyRows = FACULTIES
    .map((f) => ({ label: f, count: facultyCounts[f] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  // ── Batch year distribution ────────────────────────────────────────────────
  const batchCounts: Record<string, number> = {};
  members.forEach((m) => {
    const b = m.batch.trim() || "Unknown";
    batchCounts[b] = (batchCounts[b] ?? 0) + 1;
  });
  const maxBatch = Math.max(1, ...Object.values(batchCounts));
  const batchRows = Object.entries(batchCounts)
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([label, count]) => ({ label, count }));

  // ── Activities per Leo year ─────────────────────────────────────────────────
  const actsByYear: Record<string, number> = {};
  activities.forEach((a) => { actsByYear[a.year] = (actsByYear[a.year] ?? 0) + 1; });
  const maxActYear = Math.max(1, ...Object.values(actsByYear));
  const actYearRows = LEO_YEARS.map((y) => ({ label: y, count: actsByYear[y] ?? 0 }))
    .filter((r) => r.count > 0);

  // ── Busiest months ─────────────────────────────────────────────────────────
  const actsByMonth: Record<string, number> = {};
  activities.forEach((a) => { actsByMonth[a.month] = (actsByMonth[a.month] ?? 0) + 1; });
  const maxActMonth = Math.max(1, ...Object.values(actsByMonth));
  const monthRows = MONTHS.map((m) => ({ label: m, count: actsByMonth[m] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // ── Top contributors ───────────────────────────────────────────────────────
  const topMembers = [...members]
    .sort((a, b) => (b.activities?.length ?? 0) - (a.activities?.length ?? 0))
    .slice(0, 10);

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
                  <Bar pct={r.count / maxFaculty} color="#002147" />
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
                  <Bar pct={r.count / maxBatch} color="#D4AF37" />
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
