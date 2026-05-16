import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getActivities, getMembers } from "@/lib/firestore";
import type { Activity, Member } from "@/lib/types";
import { ArrowRight, Users, Calendar, Award } from "lucide-react";

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [acts, mems] = await Promise.all([getActivities(), getMembers()]);
        setActivities(acts);
        setMembers(mems);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latest = [...activities]
    .sort((a, b) => b.year.localeCompare(a.year) || b.month.localeCompare(a.month))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="relative bg-[#002147] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle, #D4AF37 1px, transparent 1px)", backgroundSize:"30px 30px"}} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-6">
              <Award size={14} /> Lions Clubs International — District 325 B1
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              KUSMS Leo Club
            </h1>
            <p className="text-2xl md:text-3xl text-[#D4AF37] font-light mb-4">
              Leadership Through Service
            </p>
            <p className="text-white/70 text-lg mb-10 leading-relaxed max-w-xl">
              A community of future medical professionals committed to service,
              leadership, and making a meaningful impact in our community.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/archive/2026-27/january"
                className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-semibold hover:bg-[#c9a432] transition-colors"
              >
                View Archives <ArrowRight size={18} />
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Users,
              label: "Active Members",
              value: loading ? "..." : members.length.toString(),
              color: "text-[#002147]",
            },
            {
              icon: Calendar,
              label: "Total Activities",
              value: loading ? "..." : activities.length.toString(),
              color: "text-[#D4AF37]",
            },
            {
              icon: Award,
              label: "Years Active",
              value: "2026–2031",
              color: "text-[#002147]",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <s.icon size={24} className={s.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#002147]">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Activities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#002147]">Latest Activities</h2>
            <p className="text-gray-500 mt-1">Recent events and service projects</p>
          </div>
          <Link
            href="/archive/2026-27/january"
            className="inline-flex items-center gap-2 text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors text-sm"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : latest.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <p>No activities yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latest.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {act.photos[0] ? (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={act.photos[0]}
                      alt={act.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-[#002147] to-[#003575] flex items-center justify-center">
                    <span className="text-[#D4AF37] text-4xl font-bold opacity-40">LC</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Calendar size={12} />
                    {act.month} · Leo Year {act.year}
                  </div>
                  <h3 className="font-semibold text-[#002147] text-lg mb-2 line-clamp-2">
                    {act.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {act.description}
                  </p>
                  <Link
                    href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`}
                    className="inline-flex items-center gap-1 text-[#002147] font-medium text-sm hover:text-[#D4AF37] transition-colors"
                  >
                    View Activity <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#002147] to-[#003575] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Explore Our Journey</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Browse all our service activities by year and month, or verify a member's
            participation record instantly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/archive/2026-27/january"
              className="bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-semibold hover:bg-[#c9a432] transition-colors inline-flex items-center gap-2"
            >
              Browse Archives <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
