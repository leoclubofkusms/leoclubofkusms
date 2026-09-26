import { useState, useEffect } from "react";
import { getPastLeaders, addPastLeader, updatePastLeader, deletePastLeader } from "@/lib/firestore";
import type { PastLeader } from "@/lib/types";
import { LEO_YEARS } from "@/lib/types";
import { Plus, Trash2, Pencil, Check, X, Loader2, Crown, Play, Pause, Quote } from "lucide-react";

const EMPTY: Omit<PastLeader, "id"> = {
  name: "",
  role: "President",
  leoYear: LEO_YEARS[0],
  photoUrl: "",
  note: "",
  order: 0,
  quote: "",
  audioUrl: "",
};

export default function PastLeadersManager() {
  const [items, setItems] = useState<PastLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<PastLeader, "id">>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    getPastLeaders().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  function startEdit(item: PastLeader) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      role: item.role,
      leoYear: item.leoYear,
      photoUrl: item.photoUrl ?? "",
      note: item.note ?? "",
      order: item.order,
      quote: item.quote ?? "",
      audioUrl: item.audioUrl ?? "",
    });
    setShowForm(true);
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY, order: items.length });
    setShowForm(false);
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim() || !form.leoYear.trim()) {
      setError("Name and Leo Year are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = {
        name: form.name.trim(),
        role: form.role.trim(),
        leoYear: form.leoYear,
        photoUrl: form.photoUrl.trim(),
        note: form.note.trim(),
        order: form.order,
        quote: form.quote.trim(),
        audioUrl: form.audioUrl.trim(),
      };

      if (editingId) {
        await updatePastLeader(editingId, data);
        setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...data } : i)));
      } else {
        const id = await addPastLeader({ ...data, order: items.length });
        setItems((prev) => [...prev, { id, ...data, order: items.length }]);
      }
      setSuccess(editingId ? "Updated!" : "Added!");
      setTimeout(() => setSuccess(""), 2500);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this past leader?")) return;
    try {
      await deletePastLeader(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function toggleAudio(item: PastLeader) {
    if (!item.audioUrl) return;
    if (playingId === item.id) {
      audio?.pause();
      setPlayingId(null);
      setAudio(null);
    } else {
      audio?.pause();
      const a = new Audio(item.audioUrl);
      a.play();
      a.onended = () => { setPlayingId(null); setAudio(null); };
      setPlayingId(item.id);
      setAudio(a);
    }
  }

  const sorted = [...items].sort((a, b) => {
    return LEO_YEARS.indexOf(a.leoYear) - LEO_YEARS.indexOf(b.leoYear) || a.order - b.order;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Past Leaders</h3>
          <p className="text-sm text-gray-500">
            Add past presidents and office-bearers. You can optionally add a quote and voice note for each leader.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setForm({ ...EMPTY, order: items.length }); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
          >
            <Plus size={15} /> Add Leader
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm flex items-center gap-2">
          <Check size={14} /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{error}</div>
      )}

      {showForm && (
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-6 space-y-4">
          <h4 className="font-semibold text-[#002147]">
            {editingId ? "Edit Past Leader" : "Add Past Leader"}
          </h4>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ram Prasad Sharma"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role / Title</label>
              <input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Chartered President"
                className                   ="w-full border border-gray-200 rounded className-xl px-3 py-2 text-sm focus={`:outline-none focus:borderp-[#002147]"
              />
            </-div>
          </div2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Leo Year *</label>
              <select
                value={form.leoYear}
                onChange={(e) => setForm((f) => ({ ...f, leoYear: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] bg-white"
              >
                {LEO_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Short note (optional)</label>
              <input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Founding member"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Photo URL (optional)</label>
            {form.photoUrl && (
              <img src={form.photoUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover mb-2 border border-gray-200" />
            )}
            <input
              type="url"
              value={form.photoUrl}
              onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
              placeholder="https://example.com/past-leader.jpg"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#002147]"
            />
            {form.photoUrl && (
              <button
                onClick={() => setForm((f) => ({ ...f, photoUrl: "" }))}
                className="ml-2 text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>

          {/* Quote + voice */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Quote size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Optional: Quote & Voice Message
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Add a quote or voice recording from this past leader. These will appear on the About page under "Past Leaders".
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quote / Message</label>
                <textarea
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Service above self is not just our motto — it is our way of life."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Voice / Audio clip URL (optional)</label>
                <input
                  type="url"
                  value={form.audioUrl}
                  onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))}
                  placeholder="https://example.com/leader-voice.mp3"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#002147]"
                />
                {form.audioUrl && (
                  <button
                    onClick={() => setForm((f) => ({ ...f, audioUrl: "" }))}
                    className="mt-1 text-xs text-red-400 hover:text-red-600"
                  >
                    Remove audio
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#002147] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 size={13} className="animate-spin" /> Saving…</>
              ) : (
                <><Check size={13} /> {editingId ? "Update" : "Add"}</>
              )}
            </button>
            <button
              onClick={resetForm}
              className="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Crown size={36} className="mx-auto mb-3 opacity-20" />
          <p>No past leaders added yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="w-7 h-7 rounded-full bg-[#002147]/10 text-[#002147] flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </div>
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
                  <Crown size={16} className="text-[#D4AF37]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-[#002147] text-sm">{item.name}</span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-[#D4AF37] font-medium">{item.role}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{item.leoYear}</span>
                  {item.note && <span className="text-xs text-gray-400 italic">{item.note}</span>}
                  {item.quote && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Quote size={10} /> has quote
                    </span>
                  )}
                  {item.audioUrl && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Play size={10} /> has audio
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.audioUrl && (
                  <button
                    onClick={() => toggleAudio(item)}
 rounded-lg transition-colors ${
                      playingId === item.id
                        ? "bg-green-100 text-green-600"
                        : "text-gray-400 hover:bg-gray-100 hover:text-[#002147]"
                    }`}
                    title={playingId === item.id ? "Pause" : "Play audio"}
                  >
                    {playingId === item.id ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                )}
                <button
                  onClick={() => startEdit(item)}
                  className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}