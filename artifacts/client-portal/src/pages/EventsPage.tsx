import { useEffect, useState } from "react";
import { getClubEvents } from "@/lib/firestore";
import type { ClubEvent } from "@/lib/types";
import { CalendarDays, MapPin, Clock, ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight, LayoutList, Calendar } from "lucide-react";
import { Link } from "wouter";

const STATUS_CONFIG = {
  planned: { label: "Upcoming", color: "bg-blue-100 text-blue-700", icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600", icon: XCircle },
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarView({ events }: { events: ClubEvent[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map date string "YYYY-MM-DD" to events
  const eventsMap: Record<string, ClubEvent[]> = {};
  for (const ev of events) {
    const d = ev.date?.slice(0, 10);
    if (!d) continue;
    const [ey, em] = d.split("-").map(Number);
    if (ey === year && em === month + 1) {
      if (!eventsMap[d]) eventsMap[d] = [];
      eventsMap[d].push(ev);
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const today = now.toISOString().slice(0, 10);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedEvents = selected ? (eventsMap[selected] ?? []) : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-bold text-[#002147] text-lg">{MONTH_NAMES[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsMap[dateStr] ?? [];
          const isToday = dateStr === today;
          const isSelected = dateStr === selected;

          return (
            <button
              key={dateStr}
              onClick={() => setSelected(isSelected ? null : dateStr)}
              className={`relative min-h-[44px] rounded-xl border text-sm font-medium transition-all p-1 text-center ${
                isSelected ? "bg-[#002147] text-white border-[#002147] shadow-md" :
                isToday ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#002147]" :
                dayEvents.length > 0 ? "bg-white border-[#002147]/20 text-[#002147] hover:border-[#002147]/50 hover:shadow-sm" :
                "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
              }`}
            >
              <span className="block">{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-white" :
                      ev.status === "cancelled" ? "bg-red-400" :
                      ev.date >= today ? "bg-blue-500" : "bg-green-500"
                    }`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selected && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <h4 className="font-semibold text-[#002147] mb-3">
            {new Date(selected + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400">No events on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((ev) => {
                const cfg = STATUS_CONFIG[ev.status];
                const StatusIcon = cfg.icon;
                return (
                  <div key={ev.id} className="bg-[#F8FAFC] rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        <StatusIcon size={11} /> {cfg.label}
                      </span>
                      {ev.eventType && <span className="text-xs bg-[#002147]/10 text-[#002147] px-2.5 py-1 rounded-full">{ev.eventType}</span>}
                    </div>
                    <h5 className="font-bold text-[#002147]">{ev.title}</h5>
                    {ev.description && <p className="text-sm text-gray-500 mt-1">{ev.description}</p>}
                    {ev.location && <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2"><MapPin size={11} className="text-[#D4AF37]" /> {ev.location}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Upcoming</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Cancelled</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] inline-block" /> Today</span>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

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
        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
            {(["upcoming", "past", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? "bg-[#002147] text-white shadow-sm" : "text-gray-500 hover:text-[#002147]"}`}>
                {f === "all" ? "All" : f === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
            <button onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === "list" ? "bg-[#002147] text-white shadow-sm" : "text-gray-500 hover:text-[#002147]"}`}>
              <LayoutList size={14} /> List
            </button>
            <button onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === "calendar" ? "bg-[#002147] text-white shadow-sm" : "text-gray-500 hover:text-[#002147]"}`}>
              <Calendar size={14} /> Calendar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
          </div>
        ) : viewMode === "calendar" ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <CalendarView events={events} />
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
