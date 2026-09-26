import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getActivities } from "@/lib/firestore";
import type { Activity } from "@/lib/types";
import { LEO_YEARS, MONTHS, getCurrentLeoYear } from "@/lib/types";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock3,
  FolderOpen,
} from "lucide-react";

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
  const yearsWithData = useMemo(
    () => yearsNewestFirst.filter((year) => activities.some((a) => a.year === year)),
    [activities, yearsNewestFirst]
  );
  const totalMonths = useMemo(
    () =>
      new Set(
        activities.map((activity) => `${activity.year}-${activity.month}`)
      ).size,
    [activities]
  );

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#002147]">
      <header className="relative overflow-hidden bg-[#002147] text-white">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-[#D4AF37]/20" />
        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border border-[#D4AF37]/15" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-[#D4AF37]/60" />
        <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
              <FolderOpen size={15} strokeWidth={1.8} />
              <span>Club records</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/65">
              <Clock3 size={13} />
              <span>{LEO_YEARS[0]?.split("/")[0] ?? "Club founding"} — present</span>
            </div>
          </div>
          <div className="mt-10 max-w-3xl">
            <p className="mb-3 text-sm font-medium text-white/55">Leo Club of KUSMS</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Our service,
              <span className="block text-[#D4AF37]">kept in full.</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
              Browse the people, projects, and moments that have shaped our club,
              arranged by Leo Year and month.
            </p>
          </div>
          {!loading && activities.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 text-xs text-white/70">
              <div className="flex items-center gap-2 border-l border-[#D4AF37] pl-3">
                <span className="font-semibold text-white">{activities.length}</span>
                {activities.length === 1 ? "recorded activity" : "recorded activities"}
              </div>
              <div className="flex items-center gap-2 border-l border-white/20 pl-3">
                <span className="font-semibold text-white">{yearsWithData.length}</span>
                {yearsWithData.length === 1 ? "Leo Year" : "Leo Years"}
              </div>
              <div className="flex items-center gap-2 border-l border-white/20 pl-3">
                <span className="font-semibold text-white">{totalMonths}</span>
                {totalMonths === 1 ? "month" : "months"} of stories
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-14">
        {loading ? (
          <div className="space-y-10" aria-label="Loading archive">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#dce3e5]" />
                  <div>
                    <div className="h-5 w-32 rounded bg-[#dce3e5]" />
                    <div className="mt-2 h-3 w-44 rounded bg-[#e4e9ea]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((card) => (
                    <div key={card} className="h-28 rounded-2xl bg-[#e3e8e8]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : yearsWithData.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#cbd5d7] bg-[#fffdf8] px-6 py-20 text-center text-[#617078] shadow-[0_16px_40px_rgba(0,33,71,0.04)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002147] text-[#D4AF37]">
              <FolderOpen size={27} strokeWidth={1.6} />
            </div>
            <p className="font-semibold text-[#002147]">No activities have been archived yet.</p>
            <p className="mt-2 text-sm">Once activities are added, they’ll appear here.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {yearsWithData.map((year) => {
              const monthsWithData = MONTHS.filter((month) =>
                activities.some((a) => a.year === year && a.month === month)
              );
              const yearTotal = activities.filter((a) => a.year === year).length;

              return (
                <section key={year} aria-labelledby={`archive-year-${year}`}>
                  <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#d9e0df] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#002147] text-[#D4AF37] shadow-[0_8px_16px_rgba(0,33,71,0.12)]">
                        <Calendar size={18} strokeWidth={1.8} />
                      </div>
                      <div>
                        <h2 id={`archive-year-${year}`} className="text-xl font-semibold tracking-[-0.02em] text-[#002147] sm:text-2xl">
                          Leo Year {year}
                          {year === currentYear && (
                            <span className="ml-2 inline-flex translate-y-[-2px] items-center rounded-full bg-[#D4AF37] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#002147] align-middle">
                              Current
                            </span>
                          )}
                        </h2>
                        <p className="mt-1 text-xs text-[#6b797d]">
                          {yearTotal} {yearTotal === 1 ? "activity" : "activities"} ·{" "}
                          {monthsWithData.length} {monthsWithData.length === 1 ? "month" : "months"}
                        </p>
                      </div>
                    </div>
                    <div className="hidden items-center gap-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#849094] sm:flex">
                      <CalendarDays size={13} />
                      Browse by month
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {monthsWithData.map((month) => {
                      const count = activities.filter(
                        (a) => a.year === year && a.month === month
                      ).length;

                      return (
                        <Link
                          key={month}
                          href={`/archive/${year.replace("/", "-")}/${month.toLowerCase()}`}
                          aria-label={`Browse ${month} ${year}`}
                          className="group relative overflow-hidden rounded-2xl border border-[#e0e5e3] bg-[#fffdf8] p-4 shadow-[0_6px_16px_rgba(0,33,71,0.045)] transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/70 hover:shadow-[0_12px_24px_rgba(0,33,71,0.1)] sm:p-5"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b28f1f]">
                              {month.slice(0, 3)}
                            </span>
                            <ArrowRight
                              size={15}
                              className="text-[#b5c0bf] transition-all group-hover:translate-x-0.5 group-hover:text-[#D4AF37]"
                            />
                          </div>
                          <div className="text-sm font-semibold text-[#002147] sm:text-base">{month}</div>
                          <div className="mt-1 text-xs text-[#748084]">
                            {count} {count === 1 ? "activity" : "activities"}
                          </div>
                          <div className="absolute -bottom-5 -right-5 h-16 w-16 rounded-full border border-[#D4AF37]/15 transition-transform group-hover:scale-125" />
                        </Link>
                      );
                    })}
                  </div>
                  <Link
                    href={`/archive/${year.replace("/", "-")}/${monthsWithData[0].toLowerCase()}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#597078] transition-colors hover:text-[#002147] sm:hidden"
                  >
                    Start with {monthsWithData[0]}
                    <ChevronRight size={14} />
                  </Link>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}