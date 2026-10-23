import { useState, useEffect, useRef, useMemo } from "react";
import { bsToAd } from "nepali-date-picker-converter";
import {
  getMembers,
  setMember,
  changeMemberId,
  deleteMember,
  addManualAchievement,
  removeManualAchievement,
  toggleMemberActive,
} from "@/lib/firestore";
import type { Member, MemberActivity, MemberRole } from "@/lib/types";
import { LEO_YEARS, MONTHS, FACULTIES, BATCH_YEARS, getCurrentLeoMonth, getCurrentLeoYear } from "@/lib/types";
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
  Clock,
  CheckCircle,
  Download,
  Search,
  AlertCircle,
} from "lucide-react";

const EMPTY_MEMBER: Member = {
  memberId: "",
  name: "",
  rollNo: "",
  batch: "",
  faculty: FACULTIES[0],
  currentRole: "",
  photoUrl: "",
  email: "",
  activities: [],
  isActive: true,
  joinedLeoYear: getCurrentLeoYear(),
  leftLeoYear: "",
  nepaliBirthday: "",
  bio: "",
  roleHistory: [],
};

const EMPTY_ACHIEVEMENT = {
  year: getCurrentLeoYear(),
  month: getCurrentLeoMonth(),
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

  function handleFile() {
    setUploadError("File uploads are disabled on the free Firebase plan. Paste a public image URL instead.");
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">Photo</label>

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
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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

// ── CSV Export (safe for missing fields) ──────────────────────────────────────
function exportMembersCsv(list: Member[]) {
  const headers = [
    "Member ID", "Name", "Roll No", "Faculty", "Batch",
    "Current Role", "Joined Leo Year", "Left Leo Year", "Active", "Activities",
  ];
  const rows = list.map((m) => [
    m.memberId ?? "",
    m.name ?? "",
    m.rollNo ?? "",
    m.faculty ?? "",
    m.batch ?? "",
    m.currentRole ?? "",
    m.joinedLeoYear ?? "",
    m.leftLeoYear ?? "",
    m.isActive === false ? "Past" : "Active",
    String(m.activities?.length ?? 0),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leo-club-members-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  const [search, setSearch] = useState("");

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

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay = [
        m.name,
        m.memberId,
        m.rollNo,
        m.faculty ?? "",
        m.batch,
        m.currentRole ?? "",
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [members, search]);

  // ── Duplicate Membership ID check ─────────────────────────────────────────
  const duplicateMemberId = useMemo(() => {
    const typed = form.memberId.trim().toLocaleLowerCase();
    if (!typed) return null;
    const editingId = editing?.memberId.trim().toLocaleLowerCase();
    return members.find((m) =>
      m.memberId.trim().toLocaleLowerCase() === typed &&
      m.memberId.trim().toLocaleLowerCase() !== editingId
    ) ?? null;
  }, [form.memberId, members, editing]);

  const birthdayRequired = !editing || Boolean(editing.nepaliBirthday?.trim());

  // Split the stored "YYYY-MM-DD" into three parts for the UI
  const bdayParts = useMemo(() => {
    const str = form.nepaliBirthday || "";
    if (!str) return { y: "", m: "", d: "" };
    const [y, m, d] = str.split("-");
    return { y: y || "", m: m || "", d: d || "" };
  }, [form.nepaliBirthday]);

  function updateBirthday(part: "y" | "m" | "d", val: string) {
    const clean = val.replace(/\D/g, ""); // only numbers
    const y = part === "y" ? clean : bdayParts.y;
    const m = part === "m" ? clean : bdayParts.m;
    const d = part === "d" ? clean : bdayParts.d;
    
    // Only combine them if we have at least some data
    let combined = "";
    if (y || m || d) {
      const yStr = y || "0000";
      const mStr = m ? m.padStart(2, "0") : "00";
      const dStr = d ? d.padStart(2, "0") : "00";
      combined = `${yStr}-${mStr}-${dStr}`;
    }
    setForm((f) => ({ ...f, nepaliBirthday: combined }));
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_MEMBER);
    setError("");
    setShowForm(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({ ...member, roleHistory: member.roleHistory ?? [] });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberId.trim()) { setError("Member ID is required."); return; }
    if (duplicateMemberId) {
      setError(`Membership ID "${form.memberId.trim()}" is already used by ${duplicateMemberId.name}. Please use a unique ID.`);
      return;
    }
    const nepaliBirthday = (form.nepaliBirthday ?? "").trim().replace(/\//g, "-");
    
    // Validate only if the birthday is actually filled out
    if (nepaliBirthday) {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(nepaliBirthday)) {
        setError("Please enter a complete Nepali birthday (Year, Month, Day).");
        return;
      }
      try {
        if (!bsToAd(nepaliBirthday)) {
          setError("The Nepali date entered is invalid.");
          return;
        }
      } catch {
        setError("The Nepali date entered is invalid.");
        return;
      }
    } else if (birthdayRequired) {
      setError("Nepali birthday is required for new members.");
      return;
    }

    const nextMemberId = form.memberId.trim();
    const changingMemberId = Boolean(editing && editing.memberId !== nextMemberId);
    if (changingMemberId && !window.confirm(
      "Change this membership ID? Existing activities, awards, and leadership links will be moved to the new ID."
    )) return;
    setError("");
    setSubmitting(true);
    try {
      const memberData = { ...form, nepaliBirthday, memberId: nextMemberId, activities: editing?.activities ?? [] };
      if (editing && changingMemberId) {
        await changeMemberId(editing.memberId, memberData);
      } else {
        await setMember(memberData);
      }
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Members</h3>
          <p className="text-sm text-gray-500">
            {search.trim()
              ? `${filteredMembers.length} of ${members.length} members match "${search}"`
              : `${members.length} members registered`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {members.length > 0 && (
            <button
              onClick={() => exportMembersCsv(filteredMembers)}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              title={search.trim() ? "Export filtered members as CSV" : "Export all members as CSV"}
            >
              <Download size={14} /> Export CSV{search.trim() ? " (filtered)" : ""}
            </button>
          )}
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
          >
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 mb-4">
          <Check size={15} /> {success}
        </div>
      )}

      {/* Search bar */}
      {members.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, member ID, roll no, faculty, batch, or role…"
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
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
                  placeholder="e.g. MBBS2101"
                  required
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${
                    duplicateMemberId
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-[#002147]"
                  }`}
                />
                {duplicateMemberId ? (
                  <p className="text-xs text-red-600 mt-1 flex items-start gap-1">
                    <AlertCircle size={11} className="mt-0.5 shrink-0" />
                    <span>
                      This ID already belongs to <strong>{duplicateMemberId.name}</strong> ({duplicateMemberId.memberId}).
                      Use a unique ID.
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    {editing
                      ? "You can change this later. Existing activities, awards, and leadership links will follow the new ID."
                      : "Format: Faculty + Batch + Number (e.g. MBBS2101 = MBBS batch 21, member 01)"}
                  </p>
                )}
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
                  placeholder="YYYY-B-001"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Batch Year *
                </label>
                <select
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
                >
                  <option value="">Select admission year…</option>
                  {BATCH_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
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

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Role by Leo Year</label>
                    <p className="text-xs text-gray-400 mt-0.5">Record General Member, BOD, Chartered Vice President, Chartered Member, or another role.</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      roleHistory: [...(current.roleHistory ?? []), { leoYear: getCurrentLeoYear(), role: "General Member", source: "manual" as const } satisfies MemberRole],
                    }))}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#002147] hover:text-[#D4AF37]">
                    <PlusCircle size={13} /> Add year
                  </button>
                </div>
                {(form.roleHistory ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-400">
                    No yearly roles recorded. The public profile will show General Member for the member&apos;s service years until you add specific roles.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(form.roleHistory ?? []).map((role, index) => (
                      <div key={`${role.leoYear}-${index}`} className="flex gap-2 items-center">
                        <select value={role.leoYear}
                          onChange={(e) => setForm((current) => ({
                            ...current,
                            roleHistory: (current.roleHistory ?? []).map((item, i) => i === index ? { ...item, leoYear: e.target.value } : item),
                          }))}
                          className="w-32 border border-gray-200 rounded-lg px-2.5 py-2 text-xs bg-white">
                          {LEO_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <input type="text" value={role.role}
                          onChange={(e) => setForm((current) => ({
                            ...current,
                            roleHistory: (current.roleHistory ?? []).map((item, i) => i === index ? { ...item, role: e.target.value } : item),
                          }))}
                          list="member-role-options" placeholder="General Member"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs" />
                        <button type="button" onClick={() => setForm((current) => ({
                          ...current,
                          roleHistory: (current.roleHistory ?? []).filter((_, i) => i !== index),
                        }))} className="p-2 text-gray-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <datalist id="member-role-options">
                  <option value="General Member" />
                  <option value="BOD" />
                  <option value="President" />
                  <option value="Chartered Vice President" />
                  <option value="Chartered Member" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Faculty</label>
                <select
                  value={form.faculty ?? FACULTIES[0]}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                >
                  {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Joined Leo Year</label>
                <select
                  value={form.joinedLeoYear ?? LEO_YEARS[0]}
                  onChange={(e) => setForm({ ...form, joinedLeoYear: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                >
                  {LEO_YEARS.map((y) => <option key={y} value={y}>Leo Year {y}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-2">Membership Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive !== false}
                      onChange={() => setForm({ ...form, isActive: true, leftLeoYear: "" })}
                      className="text-[#002147]" />
                    <span className="text-sm text-gray-700 flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Active Member</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === false}
                      onChange={() => setForm({ ...form, isActive: false })}
                      className="text-[#002147]" />
                    <span className="text-sm text-gray-700 flex items-center gap-1"><Clock size={14} className="text-gray-400" /> Past Member</span>
                  </label>
                </div>
              </div>

              {form.isActive === false && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Left Leo Year</label>
                  <select
                    value={form.leftLeoYear ?? ""}
                    onChange={(e) => setForm({ ...form, leftLeoYear: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                  >
                    <option value="">— Select year —</option>
                    {LEO_YEARS.map((y) => <option key={y} value={y}>Leo Year {y}</option>)}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address (optional)</label>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="member@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nepali Birthday (BS){birthdayRequired && <span className="ml-1 text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="YYYY"
                      value={bdayParts.y || ""}
                      onChange={(e) => updateBirthday("y", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-[#002147]"
                    />
                    <p className="text-[10px] text-gray-400 text-center mt-1">Year</p>
                  </div>
                  <span className="text-gray-400 font-bold mb-5">/</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="MM"
                      value={bdayParts.m === "00" ? "" : bdayParts.m}
                      onChange={(e) => updateBirthday("m", e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-[#002147]"
                    />
                    <p className="text-[10px] text-gray-400 text-center mt-1">Month</p>
                  </div>
                  <span className="text-gray-400 font-bold mb-5">/</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="DD"
                      value={bdayParts.d === "00" ? "" : bdayParts.d}
                      onChange={(e) => updateBirthday("d", e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-[#002147]"
                    />
                    <p className="text-[10px] text-gray-400 text-center mt-1">Day</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Required for new members. Enter the BS date using numbers only.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Short Bio (optional)</label>
                <textarea
                  value={form.bio ?? ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={2}
                  placeholder="Brief description about the member..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none"
                />
              </div>
            </div>

            <PhotoPicker
              value={form.photoUrl}
              onChange={(url) => setForm({ ...form, photoUrl: url })}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !!duplicateMemberId}
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
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>No members match &ldquo;{search}&rdquo;.</p>
          <button
            onClick={() => setSearch("")}
            className="mt-4 text-sm text-[#002147] font-semibold hover:text-[#D4AF37] underline underline-offset-2"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((m) => (
            <div
              key={m.memberId}
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow"
            >
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-[#002147] truncate">{m.name}</div>
                    {m.isActive === false ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Clock size={10} /> Past
                      </span>
                    ) : (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle size={10} /> Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {m.memberId} · {m.rollNo} · {m.batch}
                  </div>
                  {m.currentRole && (
                    <div className="text-xs text-[#D4AF37] font-medium mt-0.5">{m.currentRole}</div>
                  )}
                  {(m.joinedLeoYear || m.leftLeoYear) && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {m.joinedLeoYear && `Joined ${m.joinedLeoYear}`}
                      {m.leftLeoYear && ` · Left ${m.leftLeoYear}`}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      const next = m.isActive === false ? true : false;
                      await toggleMemberActive(m.memberId, next);
                      setMembers((prev) => prev.map((x) => x.memberId === m.memberId ? { ...x, isActive: next } : x));
                    }}
                    title={m.isActive === false ? "Mark as active" : "Mark as past member"}
                    className={`p-2 rounded-lg transition-colors ${m.isActive === false ? "text-gray-400 hover:text-green-600 hover:bg-green-50" : "text-green-500 hover:text-gray-400 hover:bg-gray-100"}`}
                  >
                    {m.isActive === false ? <CheckCircle size={15} /> : <Clock size={15} />}
                  </button>
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

              <AchievementPanel member={m} onUpdated={load} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
