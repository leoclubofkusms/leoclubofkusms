import { useState, useEffect } from "react";
import {
  getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, getMembers,
} from "@/lib/firestore";
import type { Announcement, Member } from "@/lib/types";
import { ADMIN_EMAIL, isAnnouncementExpired } from "@/lib/types";
import {
  Plus, Pencil, Trash2, Pin, PinOff, Check, X, Loader2,
  Megaphone, Info, Zap, CalendarDays, Mail, Users, Image as ImageIcon,
  Link as LinkIcon, Clock, Copy,
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
  imageUrl: "",
  linkLabel: "",
  linkUrl: "",
  expiresAt: "",
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
  const [copying, setCopying] = useState<string | null>(null);
  const [copyResult, setCopyResult] = useState<{ id: string; count: number } | null>(null);

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
    setForm({
      title: a.title,
      body: a.body,
      createdAt: a.createdAt,
      pinned: a.pinned,
      type: a.type,
      imageUrl: a.imageUrl ?? "",
      linkLabel: a.linkLabel ?? "",
      linkUrl: a.linkUrl ?? "",
      expiresAt: a.expiresAt ?? "",
    });
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (form.linkUrl && !form.linkLabel) {
      setError("Please add a button label for the link (e.g. 'Register Now').");
      return;
    }
    if (form.linkLabel && !form.linkUrl) {
      setError("Please add the URL for the link button.");
      return;
    }
    setSaving(true); setError("");
    try {
      // Strip empty strings so we don't store them (keeps DB clean)
      const clean: Omit<Announcement, "id"> = {
        title: form.title.trim(),
        body: form.body.trim(),
        createdAt: form.createdAt,
        pinned: form.pinned,
        type: form.type,
      };
      if (form.imageUrl?.trim()) clean.imageUrl = form.imageUrl.trim();
      if (form.linkLabel?.trim()) clean.linkLabel = form.linkLabel.trim();
      if (form.linkUrl?.trim()) clean.linkUrl = form.linkUrl.trim();
      if (form.expiresAt?.trim()) clean.expiresAt = form.expiresAt.trim();

      if (editId) {
        await updateAnnouncement(editId, clean);
        setItems((prev) => prev.map((a) => a.id === editId ? { ...a, ...clean } : a));
      } else {
        await addAnnouncement(clean);
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

  async function handleCopyEmails(a: Announcement) {
    setCopying(a.id);
    setCopyResult(null);
    try {
      const members: Member[] = await getMembers();
      const emails = members
        .filter((m) => m.isActive !== false && m.email && m.email.trim())
        .map((m) => m.email!.trim());

      if (emails.length === 0) {
        setError("No member emails stored yet. Add emails in the Members tab first.");
        setCopying(null);
        return;
      }

      const joined = emails.join(", ");
      // Try modern clipboard API first
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(joined);
          copied = true;
        }
      } catch { /* fall through */ }

      // Fallback for older iOS / non-secure contexts
      if (!copied) {
        const ta = document.createElement("textarea");
        ta.value = joined;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand("copy"); copied = true; } catch { copied = false; }
        document.body.removeChild(ta);
      }

      if (copied) {
        setCopyResult({ id: a.id, count: emails.length });
        setTimeout(() => setCopyResult(null), 4000);
      } else {
        setError(`Couldn't auto-copy. Emails (${emails.length}): ${joined.slice(0, 200)}…`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load members.");
    } finally {
      setCopying(null);
    }
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

          {/* Type */}
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

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Announcement headline…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="More details (optional)…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none bg-white"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
              <ImageIcon size={12} /> Image URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.imageUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
            />
            {form.imageUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="text-xs text-gray-400">Preview</span>
              </div>
            )}
          </div>

          {/* Link button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                <LinkIcon size={12} /> Button Label <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.linkLabel ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))}
                placeholder="e.g. Register Now"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Button URL</label>
              <input
                type="url"
                value={form.linkUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
              />
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
              <Clock size={12} /> Expiry Date <span className="text-gray-400 font-normal">(optional — auto-hides after)</span>
            </label>
            <input
              type="date"
              value={form.expiresAt ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
            />
            {form.expiresAt && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, expiresAt: "" }))}
                className="text-xs text-gray-400 hover:text-red-500 mt-1"
              >
                Clear expiry
              </button>
            )}
          </div>

          {/* Pinned */}
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
            const justCopied = copyResult?.id === a.id;
            const expired = isAnnouncementExpired(a);
            return (
              <div
                key={a.id}
                className={`bg-white border rounded-2xl p-4 ${expired ? "opacity-60 border-gray-100 bg-gray-50" : a.pinned ? "border-[#D4AF37]/40 shadow-sm" : "border-gray-100"}`}
              >
                <div className="flex items-start gap-3">
                  {a.imageUrl && (
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
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
                      {expired && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                          <Clock size={8} /> Expired
                        </span>
                      )}
                    </div>
                    {a.body && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.body}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>
                        {new Date(a.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      {a.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> Expires {new Date(a.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      {a.linkLabel && (
                        <span className="flex items-center gap-1 text-[#002147]">
                          <LinkIcon size={10} /> {a.linkLabel}
                        </span>
                      )}
                    </div>
                    {justCopied && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Check size={10} /> Copied {copyResult!.count} email{copyResult!.count === 1 ? "" : "s"} to clipboard — paste into your email app
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    {/* Copy emails */}
                    <button
                      onClick={() => handleCopyEmails(a)}
                      disabled={copying === a.id}
                      title="Copy all member emails"
                      className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:text-[#002147] hover:border-[#002147] hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      {copying === a.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Copy size={12} />}
                      <span className="hidden sm:inline">Copy Emails</span>
                    </button>
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

      {/* Email tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Users size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-600">
          <span className="font-semibold">Copy Emails:</span> Click "Copy Emails" on any announcement to copy all active member email addresses to your clipboard. Then paste them into Gmail/Outlook's BCC field and paste the announcement text. Make sure member email addresses are filled in on the <span className="font-semibold">Members</span> tab.
        </div>
      </div>
    </div>
  );
}