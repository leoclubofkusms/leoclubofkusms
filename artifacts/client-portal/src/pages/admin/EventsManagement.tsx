import { useState, useEffect } from "react";
import { getClubEvents, addClubEvent, updateClubEvent, deleteClubEvent } from "@/lib/firestore";
import type { ClubEvent } from "@/lib/types";
import { CalendarDays, Plus, Trash2, Edit2, Check, X, Loader2, MapPin, Clock } from "lucide-react";

const EVENT_TYPES = ["Service", "Meeting", "Social", "Health Camp", "Blood Drive", "Training", "Competition", "Other"];
const STATUS_COLORS = {
  planned: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function EventsManagement() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const blankForm = {
    title: "",
    description: "",
    date: "",
    location: "",
    status: "planned" as ClubEvent["status"],
    photoUrl: "",
    eventType: "Service",
  };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    getClubEvents().catch(() => [] as ClubEvent[])
      .then(setEvents).finally(() => setLoading(false));
  }, []);

  function resetForm() { setForm(blankForm); setEditId(null); setShowForm(false); setError(""); }

  function startEdit(ev: ClubEvent) {
    setForm({
      title: ev.title,
      description: ev.description,
      date: ev.date,
      location: ev.location,
      status: ev.status,
      photoUrl: ev.photoUrl ?? "",
      eventType: ev.eventType ?? "Service",
    });
    setEditId(ev.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    if (!form.title.trim() || !form.date) { setError("Title and date are required."); setSaving(false); return; }
    const data: Omit<ClubEvent, "id"> = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      location: form.location.trim(),
      status: form.status,
      photoUrl: form.photoUrl.trim() || undefined,
      eventType: form.eventType,
    };
    try {
      if (editId) {
        await updateClubEvent(editId, data);
        setEvents((prev) => prev.map((ev) => ev.id === editId ? { ...ev, ...data } : ev).sort((a, b) => a.date.localeCompare(b.date)));
        setSuccess("Event updated!");
      } else {
        await addClubEvent(data);
        const fresh = await getClubEvents();
        setEvents(fresh);
        setSuccess("Event added!");
      }
      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteClubEvent(id);
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      setSuccess("Event deleted.");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to delete."); }
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.date >= today && e.status !== "cancelled");
  const past = events.filter((e) => e.date < today || e.status === "completed" || e.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Events</h3>
          <p className="text-sm text-gray-500">Manage upcoming and past club events. Past events can also be added manually.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors">
            <Plus size={16} /> Add Event
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <Check size={15} /> {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-[#002147]">{editId ? "Edit Event" : "Add Event"}</h4>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Event Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Blood Donation Camp, Health Fair…" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Event Type</label>
              <select value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="KUSMS Campus, Dhulikhel…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClubEvent["status"] }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                <option value="planned">Planned / Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Photo URL (optional)</label>
              <input type="url" value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                placeholder="https://…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Brief description of the event…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] disabled:opacity-60 transition-colors">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> {editId ? "Update" : "Save Event"}</>}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
          <p>No events yet. Add upcoming or past events!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={12} /> Upcoming ({upcoming.length})
              </div>
              <div className="space-y-3">
                {upcoming.map((ev) => <EventRow key={ev.id} ev={ev} onEdit={startEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays size={12} /> Past / Completed ({past.length})
              </div>
              <div className="space-y-3">
                {[...past].reverse().map((ev) => <EventRow key={ev.id} ev={ev} onEdit={startEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({ ev, onEdit, onDelete }: { ev: ClubEvent; onEdit: (e: ClubEvent) => void; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
      {ev.photoUrl
        ? <img src={ev.photoUrl} alt={ev.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        : <div className="w-14 h-14 rounded-xl bg-[#002147]/10 flex items-center justify-center shrink-0">
            <CalendarDays size={22} className="text-[#002147]" />
          </div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#002147]">{ev.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ev.status]}`}>{ev.status}</span>
          {ev.eventType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ev.eventType}</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1"><Clock size={11} /> {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          {ev.location && <span className="flex items-center gap-1"><MapPin size={11} /> {ev.location}</span>}
        </div>
        {ev.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ev.description}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onEdit(ev)} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={14} /></button>
        <button onClick={() => onDelete(ev.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}
