import { useState, useEffect, useRef } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  getMembers,
  setMember,
  deleteMember,
  addManualAchievement,
  removeManualAchievement,
} from "@/lib/firestore";
import type { Member, MemberActivity } from "@/lib/types";
import { LEO_YEARS, MONTHS } from "@/lib/types";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  User,
  Upload,
  Link as LinkIcon,
  Award,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Loader2,
} from "lucide-react";

const EMPTY_MEMBER: Member = {
  memberId: "",
  name: "",
  rollNo: "",
  batch: "",
  currentRole: "",
  photoUrl: "",
  activities: [],
};

const EMPTY_ACHIEVEMENT = {
  year: LEO_YEARS[0],
  month: MONTHS[0],
  title: "",
  description: "",
  awardTitle: "",
};

// ── Photo Picker ──────────────────────────────────────────────────────────────
function PhotoPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const path = `member-photos/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      onChange(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(
        msg.includes("storage/unauthorized")
          ? "Storage permission denied. Enable Firebase Storage and set rules in Firebase Console."
          : msg
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">Photo</label>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === "upload"
              ? "bg-white text-[#002147] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Upload size={12} /> Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === "url"
              ? "bg-white text-[#002147] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <LinkIcon size={12} /> Paste URL
        </button>
      </div>

      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="shrink-0">
          {value ? (
            <img
              src={value}
              alt="Preview"
              className="w-16 h-16 rounded-xl object-cover border-2 border-[#D4AF37]/40"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <User size={20} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {mode === "url" ? (
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
            />
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#002147] rounded-xl px-4 py-3 text-sm text-gray-500 hover:text-[#002147] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={15} /> Click to choose a photo
                  </>
                )}
              </button>
              {uploadError && (
                <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>
              )}
              {value && !uploading && (
                <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                  <Check size={12} /> Uploaded successfully
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Achievement Panel ─────────────────────────────────────────────────────────
function AchievementPanel({
  member,
  onUpdated,
}: {
  member: Member;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ACHIEVEMENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError("");
    setSaving(true);
    try {
      await addManualAchievement(member.memberId, form);
      setShowForm(false);
      setForm(EMPTY_ACHIEVEMENT);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(activityId: string) {
    setRemoveId(activityId);
    try {
      await removeManualAchievement(member.memberId, activityId);
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setRemoveId(null);
    }
  }

  const acts: MemberActivity[] = member.activities ?? [];

  return (
    <div className="border-t border-gray-100 mt-3 pt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs font-semibold text-[#002147] hover:text-[#D4AF37] transition-colors"
      >
        <Award size={13} className="text-[#D4AF37]" />
        Achievements & Activities
        <span className="bg-[#002147]/10 text-[#002147] rounded-full px-2 py-0.5 font-bold">
          {acts.length}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* Existing achievements */}
          {acts.length === 0 && !showForm && (
            <p className="text-xs text-gray-400 italic">No achievements recorded yet.</p>
          )}
          {acts.map((a) => (
            <div
              key={a.activityId}
              className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl px-3 py-2 border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#002147] truncate">{a.title}</div>
                <div className="text-xs text-gray-400">
                  {a.month} · {a.year}
                  {a.awardTitle && (
                    <span className="ml-2 text-[#D4AF37] font-medium">· {a.awardTitle}</span>
                  )}
                </div>
              </div>
              {removeId === a.activityId ? (
                <Loader2 size={13} className="animate-spin text-gray-400 shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => handleRemove(a.activityId)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  title="Remove achievement"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}

          {/* Add achievement form */}
          {showForm ? (
            <div className="bg-[#002147]/5 border border-[#002147]/10 rounded-xl p-4 mt-2">
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Leo Year *</label>
                    <select
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#002147]"
                    >
                      {LEO_YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Month *</label>
                    <select
                      value={form.month}
                      onChange={(e) => setForm({ ...form, month: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#002147]"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Activity / Achievement Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Blood Donation Camp, Leo of the Month"
                    required
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#002147]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the activity or achievement..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#002147] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Role / Award Title</label>
                  <input
                    type="text"
                    value={form.awardTitle}
                    onChange={(e) => setForm({ ...form, awardTitle: e.target.value })}
                    placeholder="e.g. Coordinator, Leo of the Month, Volunteer"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#002147]"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#002147] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <><Loader2 size={12} className="animate-spin" /> Saving…</>
                    ) : (
                      <><Check size={12} /> Save Achievement</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setForm(EMPTY_ACHIEVEMENT); setError(""); }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs text-[#002147] hover:text-[#D4AF37] font-semibold transition-colors mt-1"
            >
              <PlusCircle size={13} /> Add Achievement Manually
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<Member>(EMPTY_MEMBER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const mems = await getMembers();
      setMembers(mems.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_MEMBER);
    setError("");
    setShowForm(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({ ...member });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberId.trim()) { setError("Member ID is required."); return; }
    setError("");
    setSubmitting(true);
    try {
      await setMember({ ...form, activities: editing?.activities ?? [] });
      setSuccess(editing ? "Member updated!" : "Member added!");
      setShowForm(false);
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save member.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(memberId: string) {
    try {
      await deleteMember(memberId);
      setMembers((prev) => prev.filter((m) => m.memberId !== memberId));
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Members</h3>
          <p className="text-sm text-gray-500">{members.length} members registered</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 mb-4">
          <Check size={15} /> {success}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-semibold text-[#002147]">
              {editing ? "Edit Member" : "Add New Member"}
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Member ID *
                </label>
                <input
                  type="text"
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                  placeholder="e.g. L2026JOHN"
                  disabled={!!editing}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Roll No *
                </label>
                <input
                  type="text"
                  value={form.rollNo}
                  onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                  placeholder="2026-B-001"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Batch *
                </label>
                <input
                  type="text"
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  placeholder="MBBS 2026"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Current Role
                </label>
                <input
                  type="text"
                  value={form.currentRole}
                  onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
                  placeholder="e.g. President, Secretary, Member"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>
            </div>

            {/* Photo picker — full width */}
            <PhotoPicker
              value={form.photoUrl}
              onChange={(url) => setForm({ ...form, photoUrl: url })}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#002147] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving…
                  </>
                ) : editing ? (
                  "Update Member"
                ) : (
                  "Add Member"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse flex gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p>No members yet. Add your first member.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.memberId}
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow"
            >
              {/* Member row */}
              <div className="flex items-center gap-4">
                {m.photoUrl ? (
                  <img
                    src={m.photoUrl}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold shrink-0">
                    {m.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#002147] truncate">{m.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {m.memberId} · {m.rollNo} · {m.batch}
                  </div>
                  {m.currentRole && (
                    <div className="text-xs text-[#D4AF37] font-medium mt-0.5">
                      {m.currentRole}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit member"
                  >
                    <Pencil size={15} />
                  </button>

                  {deleteConfirm === m.memberId ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(m.memberId)}
                        className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(m.memberId)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete member"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Achievement panel lives inside each card */}
              <AchievementPanel member={m} onUpdated={load} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
