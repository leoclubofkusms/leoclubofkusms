import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getActivities } from "@/lib/firestore";
import type { Activity } from "@/lib/types";
import { LEO_YEARS, MONTHS, getCurrentLeoYear } from "@/lib/types";
import { Calendar, ArrowRight, FolderOpen, Loader2 } from "lucide-react";

export default function ArchiveIndexPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = getCurrentLeoYear();

  useEffect(() => {
    getActivities()
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const yearsNewestFirst = [...LEO_YEARS].reverse();
  const yearsWithData = yearsNewestFirst.filter((year) =>
    activities.some((a) => a.year === year)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-[#002147] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-4">
            <FolderOpen size={14} /> Activity Archive
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Our Service History</h1>
          <p className="text-white/70 max-w-2xl">
            Browse every activity we've carried out, organized by Leo Year and month.
            Click any month to see the full details.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading archive…
          </div>
        ) : yearsWithData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>No activities have been archived yet.</p>
            <p className="text-sm mt-1">Once activities are added, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {yearsWithData.map((year) => {
              const monthsWithData = MONTHS.filter((month) =>
                activities.some((a) => a.year === year && a.month === month)
              );
              const yearTotal = activities.filter((a) => a.year === year).length;

              return (
                <section key={year}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#002147] text-[#D4AF37] flex items-center justify-center">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#002147]">
                          Leo Year {year}
                          {year === currentYear && (
                            <span className="ml-2 text-xs bg-[#D4AF37] text-[#002147] px-2 py-0.5 rounded-full font-semibold align-middle">
                              Current
                            </span>
                          )}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {yearTotal} {yearTotal === 1 ? "activity" : "activities"} ·{" "}
                          {monthsWithData.length} {monthsWithData.length === 1 ? "month" : "months"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {monthsWithData.map((month) => {
                      const count = activities.filter(
                        (a) => a.year === year && a.month === month
                      ).length;

                      return (
                        <Link
                          key={month}
                          href={`/archive/${year.replace("/", "-")}/${month.toLowerCase()}`}
                          className="group bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D4AF37]/40 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
                              {month.slice(0, 3)}
                            </span>
                            <ArrowRight
                              size={14}
                              className="text-gray-300 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all"
                            />
                          </div>
                          <div className="font-bold text-[#002147] text-sm">{month}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {count} {count === 1 ? "activity" : "activities"}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}