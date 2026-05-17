import { useEffect, useState } from "react";
import { getClubEvents } from "@/lib/firestore";
import type { ClubEvent } from "@/lib/types";
import { CalendarDays, MapPin, Clock, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";

const STATUS_CONFIG = {
  planned: { label: "Upcoming", color: "bg-blue-100 text-blue-700", icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600", icon: XCircle },
};

export default function EventsPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    getClubEvents().then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.date >= today && e.status !== "cancelled");
  const past = events.filter((e) => e.date < today || e.status === "completed" || e.status === "cancelled");

  const displayed =
    filter === "upcoming" ? upcoming :
    filter === "past" ? [...past].reverse() :
    events;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center">
              <CalendarDays size={20} className="text-[#002147]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Club Events</h1>
          </div>
          <p className="text-white/70">Upcoming service activities, health camps, meetings, and more.</p>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">{upcoming.length}</div>
              <div className="text-white/60 text-xs">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">{past.length}</div>
              <div className="text-white/60 text-xs">Past Events</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-8 shadow-sm w-fit">
          {(["upcoming", "past", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? "bg-[#002147] text-white shadow-sm" : "text-gray-500 hover:text-[#002147]"}`}>
              {f === "all" ? "All Events" : f === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-gray-500 mb-1">No events found</h3>
            <p className="text-sm">{filter === "upcoming" ? "No upcoming events scheduled yet." : "No past events recorded."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayed.map((ev) => {
              const cfg = STATUS_CONFIG[ev.status];
              const StatusIcon = cfg.icon;
              const dateStr = new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
              const isPast = ev.date < today;
              return (
                <div key={ev.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isPast ? "border-gray-100 opacity-80" : "border-[#D4AF37]/20"}`}>
                  {ev.photoUrl && (
                    <img src={ev.photoUrl} alt={ev.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        <StatusIcon size={11} /> {cfg.label}
                      </span>
                      {ev.eventType && (
                        <span className="text-xs bg-[#002147]/10 text-[#002147] px-2.5 py-1 rounded-full font-medium">{ev.eventType}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-[#002147] text-lg mb-2">{ev.title}</h3>
                    {ev.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ev.description}</p>}
                    <div className="flex flex-col gap-1.5 text-sm text-gray-400">
                      <span className="flex items-center gap-2"><Clock size={13} className="text-[#D4AF37]" /> {dateStr}</span>
                      {ev.location && <span className="flex items-center gap-2"><MapPin size={13} className="text-[#D4AF37]" /> {ev.location}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
