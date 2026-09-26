import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getActivitiesByMonth, getMembers } from "@/lib/firestore";
import type { Activity, Member } from "@/lib/types";
import { MONTHS, LEO_YEARS } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  CircleAlert,
  Image as ImageIcon,
  RefreshCw,
  Users,
} from "lucide-react";

interface ArchivePageProps {
  year: string;   // URL format: "YYYY-YY"
  month: string;  // e.g. "january"
}

export default function ArchivePage({ year, month }: ArchivePageProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Normalize year back to "YYYY/YY" format
  const displayYear = year.replace("-", "/");
  const normalizedMonth = month.toLowerCase();
  const displayMonth = normalizedMonth.charAt(0).toUpperCase() + normalizedMonth.slice(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const [acts, mems] = await Promise.all([
          getActivitiesByMonth(displayYear, displayMonth),
          getMembers(),
        ]);
        setActivities(acts);
        setMembers(mems);
      } catch (e) {
        console.error(e);
        setActivities([]);
        setMembers([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [displayYear, displayMonth, reloadToken]);

  // Build prev/next navigation
  const monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === normalizedMonth);
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

  function getMember(memberId: string) {
    return members.find((m) => m.memberId === memberId);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  const previousHref = prevLink();
  const nextHref = nextLink();

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#002147]">
      <header className="relative overflow-hidden bg-[#002147] text-white">
        <div className="absolute right-[-6rem] top-[-8rem] h-64 w-64 rounded-full border border-[#D4AF37]/20" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-[#D4AF37]/60" />
        <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-11">
          <Link
            href="/archive"
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} /> Back to archive
          </Link>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                <Calendar size={14} />
                <span>Leo Year {displayYear}</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">{displayMonth}</h1>
              <p className="mt-4 text-sm text-white/60 sm:text-base">
                A month in the club’s record ·{" "}
                <span className="text-white/85">
                  {activities.length} activit{activities.length === 1 ? "y" : "ies"} recorded
                </span>
              </p>
            </div>
            {/* Prev/Next */}
            <div className="flex items-center gap-2 lg:pb-1">
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white/80 transition-colors hover:border-white/30 hover:bg-white/12 hover:text-white sm:px-4 sm:text-sm"
                >
                  <ArrowLeft size={15} /> Previous
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white/25 sm:px-4 sm:text-sm">
                  <ArrowLeft size={15} /> Previous
                </span>
              )}
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-3.5 py-2.5 text-xs font-bold text-[#002147] transition-colors hover:bg-[#e1c25a] sm:px-4 sm:text-sm"
                >
                  Next month <ArrowRight size={15} />
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white/25 sm:px-4 sm:text-sm">
                  Next month <ArrowRight size={15} />
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Month navigation pills */}
      <div className="sticky top-16 z-40 border-b border-[#dce2e0] bg-[#fffdf8]/95 shadow-[0_4px_14px_rgba(0,33,71,0.04)] backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex items-center gap-4 overflow-x-auto border-b border-[#e5e8e5] py-3 scrollbar-hide">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c898b]">
              Leo Year
            </span>
            {LEO_YEARS.map((leoYear) => (
              <Link
                key={leoYear}
                href={`/archive/${leoYear.replace("/", "-")}/${normalizedMonth}`}
                className={`shrink-0 text-xs font-semibold transition-colors ${
                  leoYear.replace("/", "-") === year
                    ? "text-[#002147]"
                    : "text-[#8b9695] hover:text-[#002147]"
                }`}
              >
                {leoYear}
              </Link>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto py-2.5 scrollbar-hide">
            {MONTHS.map((m) => {
              const isActive = m.toLowerCase() === normalizedMonth;
              return (
                <Link
                  key={m}
                  href={`/archive/${year}/${m.toLowerCase()}`}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm ${
                    isActive
                      ? "bg-[#002147] text-white shadow-sm"
                      : "text-[#687679] hover:bg-[#edf0ee] hover:text-[#002147]"
                  }`}
                >
                  {m.slice(0, 3)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {loading ? (
          <div className="space-y-7" aria-label="Loading activities">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-[1.5rem] border border-[#e1e6e4] bg-[#fffdf8] p-6 sm:p-8">
                <div className="mb-5 h-3 w-28 rounded bg-[#dfe5e3]" />
                <div className="mb-4 h-7 w-2/3 rounded bg-[#dfe5e3]" />
                <div className="h-4 w-full rounded bg-[#e9edeb]" />
                <div className="mt-2 h-4 w-4/5 rounded bg-[#e9edeb]" />
                <div className="mt-7 h-44 rounded-2xl bg-[#e9edeb]" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-[2rem] border border-[#e4c9a9] bg-[#fff8ee] px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#002147] text-[#D4AF37]">
              <CircleAlert size={25} />
            </div>
            <h2 className="text-lg font-semibold text-[#002147]">This record could not be opened</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#697477]">
              There was a problem loading the activities for {displayMonth} {displayYear}.
              Please try again.
            </p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#002147] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#07345e]"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#cbd5d7] bg-[#fffdf8] px-6 py-24 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e9eef0] text-[#66808a]">
              <Calendar size={29} strokeWidth={1.6} />
            </div>
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#002147]">No activities this month</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#758184]">
              No activities were recorded for {displayMonth} {displayYear}.
            </p>
            <Link
              href="/archive"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#a17f15] hover:text-[#002147]"
            >
              Browse the full archive <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-9">
            {activities.map((act, activityIndex) => (
              <div
                key={act.id}
                id={act.title.toLowerCase().replace(/\s+/g, "-")}
                className="overflow-hidden rounded-[1.5rem] border border-[#dfe6e3] bg-[#fffdf8] shadow-[0_12px_30px_rgba(0,33,71,0.06)]"
              >
                {/* Activity header */}
                <div className="border-b border-[#e5e9e6] p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="hidden shrink-0 pt-1 text-3xl font-semibold tracking-[-0.05em] text-[#d5dcd9] sm:block">
                      {String(activityIndex + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b898a]">
                        <span className="inline-flex items-center gap-1.5 text-[#a07f1c]">
                          <Calendar size={12} /> {displayMonth}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-[#cbd3d0]" />
                        <span>Leo Year {displayYear}</span>
                        {act.featured && (
                          <span className="rounded-full bg-[#f2e7bc] px-2 py-1 text-[#806313]">
                            Featured record
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#002147] sm:text-3xl">
                        {act.title}
                      </h2>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e6d70] sm:text-[15px]">
                        {act.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photos grid */}
                {act.photos.length > 0 && (
                  <div className="border-b border-[#e5e9e6] p-4 sm:p-6">
                    <div className="mb-3 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c898b]">
                      <ImageIcon size={13} />
                      <span>{act.photos.length} {act.photos.length === 1 ? "photo" : "photos"}</span>
                    </div>
                    <div className={`grid gap-3 ${act.photos.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[1.35fr_1fr]"}`}>
                      <div className="relative overflow-hidden rounded-2xl bg-[#e8edeb]">
                        <img
                          src={act.photos[0]}
                          alt={`${act.title} photo 1`}
                          className={`w-full object-cover ${act.photos.length === 1 ? "max-h-[34rem] min-h-64" : "h-64 md:h-full md:min-h-[22rem]"}`}
                        />
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#002147]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                          01 / {String(act.photos.length).padStart(2, "0")}
                        </span>
                      </div>
                      {act.photos.length > 1 && (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                          {act.photos.slice(1).map((url, i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-[#e8edeb]">
                              <img
                                src={url}
                                alt={`${act.title} photo ${i + 2}`}
                                className="h-40 w-full object-cover sm:h-52 md:h-full md:min-h-[10rem]"
                              />
                              <span className="absolute bottom-2 left-2 rounded-full bg-[#002147]/75 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur">
                                {String(i + 2).padStart(2, "0")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Participants */}
                {act.participants.length > 0 && (
                  <div className="p-6 sm:p-8">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#002147]">
                        <Users size={16} className="text-[#a17f15]" />
                        Participants
                      </div>
                      <span className="text-xs text-[#7b898a]">{act.participants.length} listed</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {act.participants.map((p, i) => (
                        <Link
                          key={`${p.memberId}-${i}`}
                          href={`/verify/member/${p.memberId}`}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-[#e2e8e5] bg-[#f5f7f5] px-3 py-3 transition-all hover:border-[#D4AF37]/60 hover:bg-[#f0f2ee]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {getMember(p.memberId)?.photoUrl ? (
                              <img
                                src={getMember(p.memberId)?.photoUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#002147] text-[10px] font-bold text-[#D4AF37]">
                                {getInitials(getMemberName(p.memberId))}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-[#002147] transition-colors group-hover:text-[#8d7014]">
                                {getMemberName(p.memberId)}
                              </div>
                            {p.awardTitle && (
                                <div className="mt-0.5 truncate text-xs text-[#7e8a8b]">{p.awardTitle}</div>
                            )}
                            </div>
                          </div>
                          <ChevronRight size={15} className="shrink-0 text-[#b6c0be] transition-colors group-hover:text-[#D4AF37]" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}