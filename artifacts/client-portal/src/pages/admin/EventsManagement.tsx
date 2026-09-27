import { useState, useEffect } from "react";
import { getClubEvents, addClubEvent, updateClubEvent, deleteClubEvent } from "@/lib/firestore";
import type { ClubEvent, CustomQuestion } from "@/lib/types";
import { CalendarDays, Plus, Trash2, Edit2, Check, X, Loader2, MapPin, Clock, Users, HelpCircle, Pin } from "lucide-react";

const EVENT_TYPE_SUGGESTIONS = [
  "Service",
  "Meeting",
  "Social",
  "Health Camp",
  "Blood Drive",
  "Training",
  "Competition",
  "Workshop",
  "Fundraiser",
  "Awareness",
  "Other",
];

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

  const blankForm: Omit<ClubEvent, "id"> = {
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    status: "planned",
    photoUrl: "",
    eventType: "",
    pinned: false,
    applicationsEnabled: false,
    applicationType: "",
    applicationPrompt: "",
    applicationDeadline: "",
    feeLeo: 0,
    feeNonLeo: 0,
    paymentQrUrl: "",
    paymentNote: "",
    customQuestions: [],
  };

  const [form, setForm] = useState<Omit<ClubEvent, "id">>(blankForm);

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
      endDate: ev.endDate ?? "",
      location: ev.location,
      status: ev.status,
      photoUrl: ev.photoUrl ?? "",
      eventType: ev.eventType ?? "",
      pinned: ev.pinned ?? false,
      applicationsEnabled: ev.applicationsEnabled ?? false,
      applicationType: ev.applicationType ?? "",
      applicationPrompt: ev.applicationPrompt ?? "",
      applicationDeadline: ev.applicationDeadline ?? "",
      feeLeo: ev.feeLeo ?? 0,
      feeNonLeo: ev.feeNonLeo ?? 0,
      paymentQrUrl: ev.paymentQrUrl ?? "",
      paymentNote: ev.paymentNote ?? "",
      customQuestions: ev.customQuestions ?? [],
    });
    setEditId(ev.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    if (!form.title.trim() || !form.date) {
      setError("Title and Start Date are required.");
      setSaving(false);
      return;
    }
    // If end date is provided, make sure it's on/after start date
    if (form.endDate && form.endDate < form.date) {
      setError("End Date cannot be earlier than Start Date.");
      setSaving(false);
      return;
    }
    if (form.applicationsEnabled) {
      if (!form.applicationType?.trim()) {
        setError("Application type is required when applications are enabled.");
        setSaving(false);
        return;
      }
      if ((form.feeLeo ?? 0) > 0 || (form.feeNonLeo ?? 0) > 0) {
        if (!form.paymentQrUrl?.trim()) {
          setError("Payment QR URL is required when any fee is above 0.");
          setSaving(false);
          return;
        }
      }
    }

    const data: Omit<ClubEvent, "id"> = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      endDate: (form.endDate ?? "").trim(),
      location: form.location.trim(),
      status: form.status,
      photoUrl: (form.photoUrl ?? "").trim(),
      eventType: (form.eventType ?? "").trim(),
      pinned: form.pinned ?? false,
      applicationsEnabled: form.applicationsEnabled ?? false,
      applicationType: (form.applicationType ?? "").trim(),
      applicationPrompt: (form.applicationPrompt ?? "").trim(),
      applicationDeadline: (form.applicationDeadline ?? "").trim(),
      feeLeo: form.feeLeo ?? 0,
      feeNonLeo: form.feeNonLeo ?? 0,
      paymentQrUrl: (form.paymentQrUrl ?? "").trim(),
      paymentNote: (form.paymentNote ?? "").trim(),
      customQuestions: form.customQuestions ?? [],
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

  async function handleTogglePinned(ev: ClubEvent) {
    try {
      const next = !ev.pinned;
      await updateClubEvent(ev.id, { pinned: next });
      setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, pinned: next } : e));
    } catch (e) {
      console.error(e);
    }
  }

  function addCustomQuestion() {
    const q: CustomQuestion = {
      id: `q_${Date.now()}`,
      label: "",
      required: false,
    };
    setForm((f) => ({ ...f, customQuestions: [...(f.customQuestions ?? []), q] }));
  }

  function updateCustomQuestion(id: string, patch: Partial<CustomQuestion>) {
    setForm((f) => ({
      ...f,
      customQuestions: (f.customQuestions ?? []).map((q) =>
        q.id === id ? { ...q, ...patch } : q
      ),
    }));
  }

  function removeCustomQuestion(id: string) {
    setForm((f) => ({
      ...f,
      customQuestions: (f.customQuestions ?? []).filter((q) => q.id !== id),
    }));
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => (e.endDate || e.date) >= today && e.status !== "cancelled");
  const past = events.filter((e) => (e.endDate || e.date) < today || e.status === "completed" || e.status === "cancelled");

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
        <form onSubmit={handleSave} className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-[#002147]">{editId ? "Edit Event" : "Add Event"}</h4>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Event Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Blood Donation Camp, Health Fair…" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            {/* Event Type — free text with suggestions */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Event Type
              </label>
              <input
                type="text"
                list="event-type-suggestions"
                value={form.eventType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                placeholder="Type anything, or pick a suggestion (e.g. Service, Competition, Workshop)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
              />
              <datalist id="event-type-suggestions">
                {EVENT_TYPE_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <p className="text-xs text-gray-400 mt-1">
                Type any label you want, or choose from common types.
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Start Date *
              </label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            {/* End Date (optional) */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                End Date (leave empty for 1-day events)
              </label>
              <input type="date" value={form.endDate ?? ""}
                min={form.date || undefined}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="KUSMS Campus, Dhulikhel…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClubEvent["status"] }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                <option value="planned">Planned / Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Photo URL */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Photo URL (optional)</label>
              <input type="url" value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                placeholder="https://…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Brief description of the event…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none" />
            </div>

            {/* Pin to homepage */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Pin size={14} className="text-[#D4AF37]" />
                  Pin to homepage (shows in the "Upcoming Events" section)
                </span>
              </label>
            </div>
          </div>

          {/* Applications section */}
          <div className="border-t border-gray-200 pt-5">
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={form.applicationsEnabled ?? false}
                onChange={(e) => setForm((f) => ({ ...f, applicationsEnabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[#002147] focus:ring-[#002147]"
              />
              <span className="text-sm font-semibold text-[#002147] flex items-center gap-2">
                <Users size={15} className="text-[#D4AF37]" />
                Enable Applications (Volunteers / Participants / Donors)
              </span>
            </label>

            {form.applicationsEnabled && (
              <div className="space-y-4 pl-6 border-l-2 border-[#D4AF37]/30">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    What are you asking for? <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.applicationType ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, applicationType: e.target.value }))}
                    placeholder='e.g. "Volunteers", "Blood Donors", "Sponsors", "Participants"'
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This label appears on the Apply button.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Message shown above Apply button (optional)
                  </label>
                  <textarea
                    value={form.applicationPrompt ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, applicationPrompt: e.target.value }))}
                    rows={2}
                    placeholder="e.g. We need 15 volunteers for this camp. Please apply by 10 August."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Application Deadline (optional)
                  </label>
                  <input
                    type="date"
                    value={form.applicationDeadline ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, applicationDeadline: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    After this date, the Apply button disappears from the public page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Fee for Leo Members (NPR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.feeLeo ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, feeLeo: Number(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Enter 0 if free.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Fee for Non-Leo Members (NPR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.feeNonLeo ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, feeNonLeo: Number(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Enter 0 if free.</p>
                  </div>
                </div>

                {((form.feeLeo ?? 0) > 0 || (form.feeNonLeo ?? 0) > 0) && (
                  <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-semibold text-[#002147] uppercase tracking-wider">
                      Payment QR (required since a fee is set)
                    </div>
                    {form.paymentQrUrl && (
                      <img
                        src={form.paymentQrUrl}
                        alt="Payment QR preview"
                        className="max-h-32 rounded-lg object-contain border border-gray-200 bg-white p-2"
                      />
                    )}
                    <input
                      type="url"
                      value={form.paymentQrUrl ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, paymentQrUrl: e.target.value }))}
                      placeholder="https://example.com/payment-qr.png"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
                    />
                    <input
                      type="text"
                      value={form.paymentNote ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, paymentNote: e.target.value }))}
                      placeholder='Note (e.g. "Send to eSewa 98XXXXXXXX · A/C name")'
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle size={13} className="text-[#D4AF37]" />
                      Custom Questions (optional)
                    </label>
                    <button
                      type="button"
                      onClick={addCustomQuestion}
                      className="text-xs font-semibold text-[#002147] hover:text-[#D4AF37] flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Question
                    </button>
                  </div>
                  {(form.customQuestions ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      No custom questions. Applicants only fill the standard fields.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(form.customQuestions ?? []).map((q) => (
                        <div key={q.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                          <input
                            type="text"
                            value={q.label}
                            onChange={(e) => updateCustomQuestion(q.id, { label: e.target.value })}
                            placeholder="e.g. Why do you want to volunteer?"
                            className="flex-1 border-0 text-sm focus:outline-none bg-transparent"
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => updateCustomQuestion(q.id, { required: e.target.checked })}
                              className="w-3.5 h-3.5"
                            />
                            Required
                          </label>
                          <button
                            type="button"
                            onClick={() => removeCustomQuestion(q.id)}
                            className="text-gray-400 hover:text-red-500 shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
                {upcoming.map((ev) => <EventRow key={ev.id} ev={ev} onEdit={startEdit} onDelete={handleDelete} onTogglePin={handleTogglePinned} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays size={12} /> Past / Completed ({past.length})
              </div>
              <div className="space-y-3">
                {[...past].reverse().map((ev) => <EventRow key={ev.id} ev={ev} onEdit={startEdit} onDelete={handleDelete} onTogglePin={handleTogglePinned} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({
  ev,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  ev: ClubEvent;
  onEdit: (e: ClubEvent) => void;
  onDelete: (id: string) => void;
  onTogglePin: (e: ClubEvent) => void;
}) {
  const dateLabel = ev.endDate && ev.endDate !== ev.date
    ? `${new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(ev.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

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
          {ev.pinned && (
            <span className="text-xs bg-[#D4AF37] text-[#002147] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Pin size={10} /> Pinned
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ev.status]}`}>{ev.status}</span>
          {ev.eventType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ev.eventType}</span>}
          {ev.applicationsEnabled && (
            <span className="text-xs bg-[#D4AF37]/20 text-[#002147] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Users size={10} /> {ev.applicationType || "Applications open"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1"><Clock size={11} /> {dateLabel}</span>
          {ev.location && <span className="flex items-center gap-1"><MapPin size={11} /> {ev.location}</span>}
        </div>
        {ev.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ev.description}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onTogglePin(ev)}
          title={ev.pinned ? "Unpin from homepage" : "Pin to homepage"}
          className={`p-2 rounded-lg transition-colors ${ev.pinned ? "text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20" : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"}`}
        >
          <Pin size={14} />
        </button>
        <button onClick={() => onEdit(ev)} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(ev.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}