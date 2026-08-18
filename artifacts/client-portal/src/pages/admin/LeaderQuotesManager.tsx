import { useState, useEffect } from "react";
import { getLeaderQuotes, addLeaderQuote, updateLeaderQuote, deleteLeaderQuote } from "@/lib/firestore";
import type { LeaderQuote } from "@/lib/types";
import { LEO_YEARS } from "@/lib/types";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Plus, Trash2, Pencil, Check, X, Loader2, Upload, Play, Pause, GripVertical, Quote } from "lucide-react";

const EMPTY: Omit<LeaderQuote, "id"> = {
  name: "",
  role: "",
  quote: "",
  introduction: "",
  photoUrl: "",
  audioUrl: "",
  priority: 0,
  leoYear: LEO_YEARS[0],
};

export default function LeaderQuotesManager() {
  const [items, setItems] = useState<LeaderQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<LeaderQuote, "id">>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"photo" | "audio" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    getLeaderQuotes().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  function startEdit(item: LeaderQuote) {
    setEditingId(item.id);
    setForm({ name: item.name, role: item.role, quote: item.quote, introduction: item.introduction ?? "", photoUrl: item.photoUrl ?? "", audioUrl: item.audioUrl ?? "", priority: item.priority, leoYear: item.leoYear ?? LEO_YEARS[0] });
    setShowForm(true);
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(false);
    setError("");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "audio") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try {
      const path = `leader-quotes/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setForm((f) => ({ ...f, [type === "photo" ? "photoUrl" : "audioUrl"]: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(null); }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim() || !form.quote.trim()) {
      setError("Name, role, and quote are required."); return;
    }
    setSaving(true); setError("");
    try {
      if (editingId) {
        await updateLeaderQuote(editingId, form);
        setItems((prev) => prev.map((i) => i.id === editingId ? { ...i, ...form } : i));
      } else {
        const ref = await addLeaderQuote({ ...form, priority: items.length });
        setItems((prev) => [...prev, { id: ref, ...form, priority: items.length }]);
      }
      setSuccess(editingId ? "Updated!" : "Added!");
      setTimeout(() => setSuccess(""), 2500);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this leader quote?")) return;
    try {
      await deleteLeaderQuote(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function toggleAudio(item: LeaderQuote) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">What Our Leaders Say</h3>
          <p className="text-sm text-gray-500">Add quotes from current and past leaders. Photos and audio clips are optional.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors">
            <Plus size={15} /> Add Quote
          </button>
        )}
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Check size={14} /> {success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{error}</div>}

      {showForm && (
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-6 space-y-4">
          <h4 className="font-semibold text-[#002147]">{editingId ? "Edit Quote" : "New Leader Quote"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Leader Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Dr. Sita Rai" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role / Title *</label>
              <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. President 2024/25" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Leo Year</label>
            <select value={form.leoYear} onChange={(e) => setForm((f) => ({ ...f, leoYear: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] bg-white">
              {LEO_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Introduction (optional)</label>
            <textarea value={form.introduction} onChange={(e) => setForm((f) => ({ ...f, introduction: e.target.value }))}
              rows={2} placeholder="Who are they? e.g. Past District President, Lions Clubs International District 325L."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quote *</label>
            <textarea value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              rows={3} placeholder="Enter the leader's quote or message..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Photo upload */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Photo (optional)</label>
              {form.photoUrl && <img src={form.photoUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover mb-2 border border-gray-200" />}
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 hover:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-gray-500 transition-colors">
                {uploading === "photo" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading === "photo" ? "Uploading…" : "Upload photo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "photo")} disabled={uploading !== null} />
              </label>
              {form.photoUrl && (
                <button onClick={() => setForm((f) => ({ ...f, photoUrl: "" }))} className="mt-1 text-xs text-red-400 hover:text-red-600">Remove photo</button>
              )}
            </div>
            {/* Audio upload */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Voice/Audio clip (optional)</label>
              {form.audioUrl && <p className="text-xs text-green-600 mb-2 flex items-center gap-1"><Check size={11} /> Audio uploaded</p>}
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 hover:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-gray-500 transition-colors">
                {uploading === "audio" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading === "audio" ? "Uploading…" : "Upload audio"}
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleUpload(e, "audio")} disabled={uploading !== null} />
              </label>
              {form.audioUrl && (
                <button onClick={() => setForm((f) => ({ ...f, audioUrl: "" }))} className="mt-1 text-xs text-red-400 hover:text-red-600">Remove audio</button>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || uploading !== null}
              className="bg-[#002147] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> {editingId ? "Update" : "Add Quote"}</>}
            </button>
            <button onClick={resetForm} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Quote size={36} className="mx-auto mb-3 opacity-20" />
          <p>No leader quotes yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...items].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
              <GripVertical size={16} className="text-gray-300 mt-1 shrink-0" />
              {item.photoUrl ? (
                <img src={item.photoUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {item.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[#002147] text-sm">{item.name}</span>
                  <span className="text-xs text-[#D4AF37] font-medium">{item.role}</span>
                  {item.leoYear && <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{item.leoYear}</span>}
                </div>
                {item.introduction && <p className="text-xs text-gray-400 mb-1 line-clamp-2">{item.introduction}</p>}
                <p className="text-sm text-gray-500 italic line-clamp-2">"{item.quote}"</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.audioUrl && (
                  <button onClick={() => toggleAudio(item)}
                    className={`p-2 rounded-lg transition-colors ${playingId === item.id ? "bg-green-100 text-green-600" : "text-gray-400 hover:bg-gray-100 hover:text-[#002147]"}`}
                    title={playingId === item.id ? "Pause" : "Play audio"}>
                    {playingId === item.id ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                )}
                <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
