import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getActivities, deleteActivity, toggleActivityFeatured } from "@/lib/firestore";
import type { Activity } from "@/lib/types";
import { LEO_YEARS, MONTHS } from "@/lib/types";
import { Calendar, Trash2, Eye, ChevronDown, ChevronRight, Users, Pin, PinOff } from "lucide-react";

export default function ActivityList({
  refreshKey,
  onActivityUpdated,
}: {
  refreshKey: number;
  onActivityUpdated?: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const acts = await getActivities();
      setActivities(acts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function handleDelete(act: Activity) {
    try {
      await deleteActivity(act.id, act.participants);
      setActivities((prev) => prev.filter((a) => a.id !== act.id));
      setDeleteConfirm(null);
      onActivityUpdated?.();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleFeatured(act: Activity) {
    setToggling(act.id);
    try {
      const next = !act.featured;
      await toggleActivityFeatured(act.id, next);
      setActivities((prev) =>
        prev.map((a) => (a.id === act.id ? { ...a, featured: next } : a))
      );
      onActivityUpdated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  }

  const grouped: Record<string, Record<string, Activity[]>> = {};
  activities.forEach((act) => {
    if (!grouped[act.year]) grouped[act.year] = {};
    if (!grouped[act.year][act.month]) grouped[act.year][act.month] = [];
    grouped[act.year][act.month].push(act);
  });

  const sortedYears = LEO_YEARS.filter((y) => grouped[y]);
  const sortedMonths = (year: string) =>
    MONTHS.filter((m) => grouped[year]?.[m]);

  const featuredCount = activities.filter((a) => a.featured).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">All Activities</h3>
          <p className="text-sm text-gray-500">{activities.length} total · {featuredCount} pinned to home page</p>
        </div>
      </div>

      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl px-4 py-3 mb-5 flex items-start gap-3 text-sm text-[#002147]">
        <Pin size={15} className="mt-0.5 shrink-0 text-[#D4AF37]" />
        <span>Click the <strong>pin icon</strong> on any activity to feature it on the home page with an animated carousel. Pinned activities are shown with a gold highlight.</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>No activities yet. Create your first activity using the form above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedYears.map((year) => (
            <div key={year} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [year]: !prev[year] }))}
                className="w-full flex items-center justify-between px-5 py-4 bg-[#002147] text-white hover:bg-[#003575] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-[#D4AF37]" />
                  <span className="font-semibold">Leo Year {year}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/60">
                    {Object.values(grouped[year]).flat().length} activities
                  </span>
                  {expanded[year] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {(expanded[year] !== false) && (
                <div className="divide-y divide-gray-50">
                  {sortedMonths(year).map((month) => (
                    <div key={month}>
                      <div className="px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {month}
                      </div>
                      {grouped[year][month].map((act) => (
                        <div
                          key={act.id}
                          className={`px-5 py-4 hover:bg-gray-50 transition-colors ${act.featured ? "bg-[#D4AF37]/5 border-l-4 border-l-[#D4AF37]" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-[#002147] truncate">{act.title}</h4>
                                {act.featured && (
                                  <span className="shrink-0 inline-flex items-center gap-1 bg-[#D4AF37] text-[#002147] text-xs font-bold px-2 py-0.5 rounded-full">
                                    <Pin size={9} /> Pinned
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                {act.description}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Users size={11} /> {act.participants.length} participants
                                </span>
                                {act.photos.length > 0 && (
                                  <span>{act.photos.length} photos</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleToggleFeatured(act)}
                                disabled={toggling === act.id}
                                title={act.featured ? "Unpin from home page" : "Pin to home page"}
                                className={`p-2 rounded-lg transition-colors ${
                                  act.featured
                                    ? "text-[#D4AF37] hover:text-[#D4AF37]/70 hover:bg-[#D4AF37]/10"
                                    : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                } ${toggling === act.id ? "opacity-50" : ""}`}
                              >
                                {act.featured ? <PinOff size={15} /> : <Pin size={15} />}
                              </button>
                              <Link
                                href={`/archive/${year.replace("/", "-")}/${month.toLowerCase()}`}
                                className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"
                                title="View public page"
                              >
                                <Eye size={15} />
                              </Link>
                              {deleteConfirm === act.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(act)}
                                    className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-red-600 transition-colors"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(act.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
