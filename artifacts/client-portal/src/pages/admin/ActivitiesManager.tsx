import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  getActivities,
  getMembers,
  deleteActivity,
  toggleActivityFeatured,
  updateActivity,
} from "@/lib/firestore";
import type { Activity, ActivityParticipant, Member } from "@/lib/types";
import { LEO_YEARS, MONTHS, getCurrentLeoYear } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar, Trash2, Eye, Users, Pin, PinOff,
  Pencil, Check, X, Loader2, QrCode, Download,
  ArrowLeft, Plus, FolderOpen,
} from "lucide-react";
import ActivityForm from "./ActivityForm";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ActivitiesManager() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // ── View state ──
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentLeoYear());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // ── Row actions state ──
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    photoInput: "",
    participants: [] as ActivityParticipant[],
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [qrActivity, setQrActivity] = useState<Activity | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [acts, memberList] = await Promise.all([getActivities(), getMembers()]);
      setActivities(acts);
      setMembers(memberList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ── Derived data ──
  const activitiesInYear = activities.filter((a) => a.year === selectedYear);
  const countForMonth = (month: string) =>
    activitiesInYear.filter((a) => a.month === month).length;

  const activitiesInSelectedMonth = selectedMonth
    ? activities
        .filter((a) => a.year === selectedYear && a.month === selectedMonth)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    : [];

  // ── Row actions ──
  async function handleDelete(act: Activity) {
    try {
      await deleteActivity(act.id, act.participants);
      setActivities((prev) => prev.filter((a) => a.id !== act.id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleFeatured(act: Activity) {
    setToggling(act.id);
    try {
      const next = !act.featured;
      await toggleActivityFeatured(act.id, next);
      setActivities((prev) =>
        prev.map((a) => (a.id === act.id ? { ...a, featured: next } : a))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  }

  async function startEdit(act: Activity) {
    setEditId(act.id);
    setEditForm({
      title: act.title,
      description: act.description,
      photoInput: act.photos.join("\n"),
      participants: [...act.participants],
    });
    setEditError("");
    try {
      setMembers(await getMembers());
    } catch (e) {
      console.error(e);
    }
  }

  async function handleEditSave(act: Activity) {
    if (!editForm.title.trim()) {
      setEditError("Title is required.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    try {
      const photos = editForm.photoInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const updatedTitle = editForm.title.trim();
      const updatedDescription = editForm.description.trim();
      await updateActivity(
        act.id,
        {
          title: updatedTitle,
          description: updatedDescription,
          photos,
          participants: editForm.participants,
        },
        act.participants,
        {
          year: act.year,
          month: act.month,
          title: updatedTitle,
          description: updatedDescription,
          photos,
          participants: editForm.participants,
        }
      );
      setActivities((prev) =>
        prev.map((a) =>
          a.id === act.id
            ? {
                ...a,
                title: updatedTitle,
                description: updatedDescription,
                photos,
                participants: editForm.participants,
              }
            : a
        )
      );
      setEditId(null);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setEditSaving(false);
    }
  }

  function downloadQR() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-qr-${qrActivity?.id ?? "unknown"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const qrUrl = qrActivity
    ? `${window.location.origin}${import.meta.env.BASE_URL}activity/${qrActivity.id}`
    : "";

  // ══════════════════════════════════════════════════════════════════════
  // ADD ACTIVITY VIEW
  // ══════════════════════════════════════════════════════════════════════
  if (showAddForm && selectedMonth) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setShowAddForm(false)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#002147] transition-colors"
        >
          <ArrowLeft size={15} /> Back to {selectedMonth} {selectedYear}
        </button>
        <div>
          <h3 className="text-lg font-bold text-[#002147]">
            Add Activity · {selectedMonth} {selectedYear}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            The year and month are pre-filled. Fill in the rest below.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <ActivityForm
            defaultYear={selectedYear}
            defaultMonth={selectedMonth}
            onSuccess={() => {
              setShowAddForm(false);
              load();
            }}
          />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // MONTH DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════
  if (selectedMonth) {
    return (
      <div className="space-y-5">
        {/* QR modal */}
        {qrActivity && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setQrActivity(null)}
          >
            <div
              className="bg-white rounded-2xl p-7 shadow-2xl max-w-sm w-full text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setQrActivity(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <div className="w-10 h-10 bg-[#002147] rounded-xl flex items-center justify-center mx-auto mb-3">
                <QrCode size={20} className="text-[#D4AF37]" />
              </div>
              <h3 className="font-bold text-[#002147] text-lg mb-1">Activity QR Code</h3>
              <p className="text-xs text-gray-500 mb-1 font-medium truncate">{qrActivity.title}</p>
              <p className="text-sm text-gray-500 mb-5">
                Scan to open the public activity page. Attach to participation certificates.
              </p>
              <div ref={qrRef} className="flex justify-center mb-5">
                <div className="p-3 border-2 border-[#002147] rounded-xl">
                  <QRCodeSVG value={qrUrl} size={160} fgColor="#002147" />
                </div>
              </div>
              <p className="text-xs text-gray-400 break-all mb-5">{qrUrl}</p>
              <div className="flex gap-2">
                <button
                  onClick={downloadQR}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#002147] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
                >
                  <Download size={14} /> Download SVG
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(qrUrl)}
                  className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <button
          onClick={() => {
            setSelectedMonth(null);
            setEditId(null);
          }}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#002147] transition-colors"
        >
          <ArrowLeft size={15} /> Back to {selectedYear}
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#002147]">
              {selectedMonth} · Leo Year {selectedYear}
            </h3>
            <p className="text-sm text-gray-500">
              {activitiesInSelectedMonth.length} activit
              {activitiesInSelectedMonth.length === 1 ? "y" : "ies"} recorded
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
          >
            <Plus size={16} /> Add Activity
          </button>
        </div>

        {/* Activity list */}
        {activitiesInSelectedMonth.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <FolderOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">No activities in {selectedMonth} yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
            >
              <Plus size={15} /> Add the first activity
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activitiesInSelectedMonth.map((act) => (
              <div
                key={act.id}
                className={`bg-white border rounded-2xl p-5 transition-colors ${
                  act.featured
                    ? "border-[#D4AF37]/40 border-l-4 border-l-[#D4AF37]"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {editId === act.id ? (
                  /* ── Inline edit ── */
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Description</label>
                      <textarea
                        value={editForm.description}
                        rows={2}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, description: e.target.value }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">
                        Photo URLs (one per line)
                      </label>
                      <textarea
                        value={editForm.photoInput}
                        rows={2}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, photoInput: e.target.value }))
                        }
                        placeholder="https://…"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] resize-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">
                        Participating members
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          const memberId = e.target.value;
                          if (!memberId) return;
                          setEditForm((f) => ({
                            ...f,
                            participants: f.participants.some((p) => p.memberId === memberId)
                              ? f.participants
                              : [...f.participants, { memberId, awardTitle: "" }],
                          }));
                        }}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] bg-white"
                      >
                        <option value="">Add a member…</option>
                        {members
                          .filter(
                            (m) =>
                              !editForm.participants.some((p) => p.memberId === m.memberId)
                          )
                          .map((m) => (
                            <option key={m.memberId} value={m.memberId}>
                              {m.name} · {m.memberId}
                            </option>
                          ))}
                      </select>
                      {editForm.participants.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {editForm.participants.map((participant) => {
                            const member = members.find(
                              (m) => m.memberId === participant.memberId
                            );
                            return (
                              <div
                                key={participant.memberId}
                                className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5"
                              >
                                <span className="text-xs text-gray-700 flex-1 truncate">
                                  {member?.name ?? participant.memberId}
                                </span>
                                <input
                                  value={participant.awardTitle}
                                  onChange={(e) =>
                                    setEditForm((f) => ({
                                      ...f,
                                      participants: f.participants.map((p) =>
                                        p.memberId === participant.memberId
                                          ? { ...p, awardTitle: e.target.value }
                                          : p
                                      ),
                                    }))
                                  }
                                  placeholder="Role / award"
                                  className="w-32 border border-gray-200 rounded-md px-2 py-1 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditForm((f) => ({
                                      ...f,
                                      participants: f.participants.filter(
                                        (p) => p.memberId !== participant.memberId
                                      ),
                                    }))
                                  }
                                  className="text-gray-400 hover:text-red-500"
                                  title="Remove participant"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {editError && <p className="text-xs text-red-500">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(act)}
                        disabled={editSaving}
                        className="flex items-center gap-1.5 bg-[#002147] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60"
                      >
                        {editSaving ? (
                          <>
                            <Loader2 size={11} className="animate-spin" /> Saving…
                          </>
                        ) : (
                          <>
                            <Check size={11} /> Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <X size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal row ── */
                  <div className="flex items-start gap-4">
                    {act.photos[0] ? (
                      <img
                        src={act.photos[0]}
                        alt={act.title}
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-[#002147]/5 flex items-center justify-center shrink-0">
                        <Calendar size={24} className="text-[#002147]/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-[#002147] truncate">
                          {act.title}
                        </h4>
                        {act.featured && (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-[#D4AF37] text-[#002147] text-xs font-bold px-2 py-0.5 rounded-full">
                            <Pin size={9} /> Pinned
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {act.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {act.participants.length} participants
                        </span>
                        {act.photos.length > 0 && (
                          <span>
                            {act.photos.length} photo{act.photos.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => startEdit(act)}
                        title="Edit activity"
                        className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(act)}
                        disabled={toggling === act.id}
                        title={act.featured ? "Unpin from home" : "Pin to home"}
                        className={`p-2 rounded-lg transition-colors ${
                          act.featured
                            ? "text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        } ${toggling === act.id ? "opacity-50" : ""}`}
                      >
                        {act.featured ? <PinOff size={15} /> : <Pin size={15} />}
                      </button>
                      <button
                        onClick={() => setQrActivity(act)}
                        title="Activity QR code"
                        className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
                      >
                        <QrCode size={15} />
                      </button>
                      <Link
                        href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`}
                        className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"
                        title="View public page"
                      >
                        <Eye size={15} />
                      </Link>
                      {deleteConfirm === act.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(act)}
                            className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(act.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // YEAR → MONTH GRID VIEW
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Activities</h3>
          <p className="text-sm text-gray-500">
            {activities.length} total activities across {LEO_YEARS.length} Leo Years
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Year selector */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-600">Leo Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth(null);
              }}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-[#002147] bg-white focus:outline-none focus:border-[#002147]"
            >
              {[...LEO_YEARS].reverse().map((y) => (
                <option key={y} value={y}>
                  {y} {y === getCurrentLeoYear() ? "(Current)" : ""}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400 ml-auto">
              {activitiesInYear.length} activit{activitiesInYear.length === 1 ? "y" : "ies"} in {selectedYear}
            </span>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MONTHS.map((month, idx) => {
              const count = countForMonth(month);
              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`group relative text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    count > 0
                      ? "bg-white border-gray-100 hover:border-[#D4AF37]/50"
                      : "bg-gray-50/60 border-dashed border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                      {MONTH_SHORT[idx]}
                    </span>
                    {count > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full bg-[#002147] text-white text-xs font-bold">
                        {count}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-semibold ${count > 0 ? "text-[#002147]" : "text-gray-400"}`}>
                    {month}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {count > 0
                      ? `${count} activit${count === 1 ? "y" : "ies"}`
                      : "No activities"}
                  </div>
                </button>
              );
            })}
          </div>

          {activitiesInYear.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
              <FolderOpen size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">
                No activities in Leo Year {selectedYear}. Click any month above to add one.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}