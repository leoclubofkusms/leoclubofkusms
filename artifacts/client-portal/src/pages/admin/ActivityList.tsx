import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getActivities, deleteActivity } from "@/lib/firestore";
import type { Activity } from "@/lib/types";
import { LEO_YEARS, MONTHS } from "@/lib/types";
import { Calendar, Trash2, Eye, ChevronDown, ChevronRight, Users } from "lucide-react";

export default function ActivityList({ refreshKey }: { refreshKey: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
    } catch (e) {
      console.error(e);
    }
  }

  // Group by year → month
  const grouped: Record<string, Record<string, Activity[]>> = {};
  activities.forEach((act) => {
    if (!grouped[act.year]) grouped[act.year] = {};
    if (!grouped[act.year][act.month]) grouped[act.year][act.month] = [];
    grouped[act.year][act.month].push(act);
  });

  const sortedYears = LEO_YEARS.filter((y) => grouped[y]);
  const sortedMonths = (year: string) =>
    MONTHS.filter((m) => grouped[year]?.[m]);

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#002147]">All Activities</h3>
        <p className="text-sm text-gray-500">{activities.length} total activities</p>
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
              {/* Year header */}
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
                        <div key={act.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#002147] truncate">{act.title}</h4>
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
