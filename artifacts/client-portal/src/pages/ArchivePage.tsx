import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getActivitiesByMonth, getMembers } from "@/lib/firestore";
import type { Activity, Member } from "@/lib/types";
import { MONTHS, LEO_YEARS } from "@/lib/types";
import { Calendar, Users, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";

interface ArchivePageProps {
  year: string;   // e.g. "2026-27"
  month: string;  // e.g. "january"
}

export default function ArchivePage({ year, month }: ArchivePageProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Normalize year back to "2026/27" format
  const displayYear = year.replace("-", "/");
  const displayMonth = month.charAt(0).toUpperCase() + month.slice(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [acts, mems] = await Promise.all([
          getActivitiesByMonth(displayYear, displayMonth),
          getMembers(),
        ]);
        setActivities(acts);
        setMembers(mems);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [displayYear, displayMonth]);

  // Build prev/next navigation
  const monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === month);
  const yearIdx = LEO_YEARS.findIndex((y) => y.replace("/", "-") === year);

  function prevLink() {
    if (monthIdx > 0) {
      return `/archive/${year}/${MONTHS[monthIdx - 1].toLowerCase()}`;
    } else if (yearIdx > 0) {
      const prevYear = LEO_YEARS[yearIdx - 1].replace("/", "-");
      return `/archive/${prevYear}/${MONTHS[11].toLowerCase()}`;
    }
    return null;
  }

  function nextLink() {
    if (monthIdx < MONTHS.length - 1) {
      return `/archive/${year}/${MONTHS[monthIdx + 1].toLowerCase()}`;
    } else if (yearIdx < LEO_YEARS.length - 1) {
      const nextYear = LEO_YEARS[yearIdx + 1].replace("/", "-");
      return `/archive/${nextYear}/${MONTHS[0].toLowerCase()}`;
    }
    return null;
  }

  function getMemberName(memberId: string) {
    return members.find((m) => m.memberId === memberId)?.name ?? memberId;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[#D4AF37] text-sm font-medium mb-2">
                Leo Year {displayYear}
              </div>
              <h1 className="text-4xl font-bold">{displayMonth}</h1>
              <p className="text-white/60 mt-2">
                {activities.length} activit{activities.length === 1 ? "y" : "ies"} recorded
              </p>
            </div>
            {/* Prev/Next */}
            <div className="flex items-center gap-2 mt-2">
              {prevLink() ? (
                <Link
                  href={prevLink()!}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={15} /> Prev
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-xl text-sm text-white/30 cursor-not-allowed">
                  <ArrowLeft size={15} /> Prev
                </span>
              )}
              {nextLink() ? (
                <Link
                  href={nextLink()!}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Next <ArrowRight size={15} />
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-xl text-sm text-white/30 cursor-not-allowed">
                  Next <ArrowRight size={15} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Month navigation pills */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {MONTHS.map((m) => {
              const isActive = m.toLowerCase() === month;
              return (
                <Link
                  key={m}
                  href={`/archive/${year}/${m.toLowerCase()}`}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#002147] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {m.slice(0, 3)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-24">
            <Calendar size={56} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No Activities This Month</h3>
            <p className="text-gray-400 text-sm">No activities were recorded for {displayMonth} {displayYear}.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activities.map((act) => (
              <div
                key={act.id}
                id={act.title.toLowerCase().replace(/\s+/g, "-")}
                className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden"
              >
                {/* Activity header */}
                <div className="p-6 md:p-8 border-b border-gray-100">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Calendar size={12} /> {displayMonth} · Leo Year {displayYear}
                      </div>
                      <h2 className="text-2xl font-bold text-[#002147] mb-3">{act.title}</h2>
                      <p className="text-gray-600 leading-relaxed">{act.description}</p>
                    </div>
                  </div>
                </div>

                {/* Photos grid */}
                {act.photos.length > 0 && (
                  <div className="p-6 md:p-8 border-b border-gray-100">
                    <div
                      className={`grid gap-3 ${
                        act.photos.length === 1
                          ? "grid-cols-1"
                          : act.photos.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 md:grid-cols-3"
                      }`}
                    >
                      {act.photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`${act.title} photo ${i + 1}`}
                          className="w-full h-52 object-cover rounded-xl"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Participants */}
                {act.participants.length > 0 && (
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 text-[#002147] font-semibold mb-4">
                      <Users size={16} />
                      Participants ({act.participants.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {act.participants.map((p, i) => (
                        <Link
                          key={`${p.memberId}-${i}`}
                          href={`/verify/member/${p.memberId}`}
                          className="flex items-center justify-between bg-[#F8FAFC] hover:bg-[#002147]/5 border border-gray-100 rounded-xl px-4 py-3 transition-colors group"
                        >
                          <div>
                            <div className="font-medium text-[#002147] text-sm group-hover:text-[#D4AF37] transition-colors">
                              {getMemberName(p.memberId)}
                            </div>
                            {p.awardTitle && (
                              <div className="text-xs text-gray-400 mt-0.5">{p.awardTitle}</div>
                            )}
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-[#D4AF37] transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
