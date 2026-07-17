import { useState, useEffect } from "react";
import {
  getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
} from "@/lib/firestore";
import type { Announcement } from "@/lib/types";
import {
  Plus, Pencil, Trash2, Pin, PinOff, Check, X, Loader2,
  Megaphone, Info, Zap, CalendarDays,
} from "lucide-react";

const TYPE_META = {
  info: { label: "Info", icon: Info, color: "bg-blue-50 text-blue-700 border-blue-200" },
  update: { label: "Update", icon: Zap, color: "bg-amber-50 text-amber-700 border-amber-200" },
  event: { label: "Event", icon: CalendarDays, color: "bg-green-50 text-green-700 border-green-200" },
} as const;

const EMPTY: Omit<Announcement, "id"> = {
  title: "",
  body: "",
  createdAt: new Date().toISOString(),
  pinned: false,
  type: "info",
};

export default function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Announcement, "id">>(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setItems(await getAnnouncements()); }
    catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditId(null);
    setForm({ ...EMPTY, createdAt: new Date().toISOString() });
    setShowForm(true);
    setError("");
  }

  function startEdit(a: Announcement) {
    setEditId(a.id);
    setForm({ title: a.title, body: a.body, createdAt: a.createdAt, pinned: a.pinned, type: a.type });
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    try {
      if (editId) {
        await updateAnnouncement(editId, form);
        setItems((prev) => prev.map((a) => a.id === editId ? { ...a, ...form } : a));
      } else {
        await addAnnouncement(form);
        await load();
      }
      setShowForm(false);
      setEditId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed."); }
  }

  async function handleTogglePin(a: Announcement) {
    const next = !a.pinned;
    try {
      await updateAnnouncement(a.id, { pinned: next });
      setItems((prev) => prev.map((x) => x.id === a.id ? { ...x, pinned: next } : x));
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
  }

  const sorted = [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Announcements</h3>
          <p className="text-sm text-gray-500">Post updates and notices — they appear as a banner on the home page.</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-[#002147] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
        >
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
          <h4 className="font-semibold text-[#002147]">{editId ? "Edit Announcement" : "New Announcement"}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${form.type === t ? meta.color : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  <Icon size={13} /> {meta.label}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Announcement headline…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="More details (optional)…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
              className="rounded"
            />
            Pin to top of announcements
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#002147] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#003575] disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {editId ? "Update" : "Post Announcement"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-white transition-colors"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="w-6 h-6 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Megaphone size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No announcements yet. Click "New Announcement" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => {
            const meta = TYPE_META[a.type];
            const Icon = meta.icon;
            return (
              <div
                key={a.id}
                className={`bg-white border rounded-2xl p-4 ${a.pinned ? "border-[#D4AF37]/40 shadow-sm" : "border-gray-100"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${meta.color}`}>
                    <Icon size={11} /> {meta.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-[#002147] text-sm">{a.title}</h4>
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                          <Pin size={8} /> Pinned
                        </span>
                      )}
                    </div>
                    {a.body && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.body}</p>}
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(a.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePin(a)}
                      title={a.pinned ? "Unpin" : "Pin to top"}
                      className={`p-2 rounded-lg transition-colors ${a.pinned ? "text-[#D4AF37] hover:bg-[#D4AF37]/10" : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"}`}
                    >
                      {a.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button
                      onClick={() => startEdit(a)}
                      className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    {deleteConfirm === a.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-red-600"
                        >Delete</button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                        >Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(a.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
