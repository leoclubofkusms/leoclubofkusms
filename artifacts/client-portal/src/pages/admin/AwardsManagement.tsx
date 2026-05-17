import { useState, useEffect } from "react";
import { getAwards, addAward, deleteAward, updateAward } from "@/lib/firestore";
import { getMembers } from "@/lib/firestore";
import type { Award, Member } from "@/lib/types";
import { MONTHS, LEO_YEARS } from "@/lib/types";
import {
  Plus, Trash2, Edit2, Check, X, Loader2, Award as AwardIcon, Star, Building,
} from "lucide-react";

const AWARD_TITLES = [
  "Leo of the Month",
  "Best Leo Member",
  "Outstanding Service Award",
  "Leadership Award",
  "Community Champion",
  "Custom...",
];

export default function AwardsManagement() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const blankForm = {
    type: "member" as Award["type"],
    title: "Leo of the Month",
    customTitle: "",
    recipientName: "",
    memberId: "",
    description: "",
    month: MONTHS[0],
    year: LEO_YEARS[2],
    photoUrl: "",
    awardedBy: "",
    featured: false,
  };
  const [form, setForm] = useState(blankForm);
  const useCustomTitle = form.title === "Custom...";

  useEffect(() => {
    Promise.all([
      getAwards().catch(() => [] as Award[]),
      getMembers().catch(() => [] as Member[]),
    ]).then(([a, m]) => { setAwards(a); setMembers(m); }).finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(blankForm);
    setEditId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(award: Award) {
    const known = AWARD_TITLES.includes(award.title);
    setForm({
      type: award.type,
      title: known ? award.title : "Custom...",
      customTitle: known ? "" : award.title,
      recipientName: award.recipientName,
      memberId: award.memberId ?? "",
      description: award.description,
      month: award.month,
      year: award.year,
      photoUrl: award.photoUrl ?? "",
      awardedBy: award.awardedBy ?? "",
      featured: award.featured ?? false,
    });
    setEditId(award.id);
    setShowForm(true);
  }

  function handleMemberSelect(memberId: string) {
    const m = members.find((x) => x.memberId === memberId);
    setForm((f) => ({ ...f, memberId, recipientName: m ? m.name : f.recipientName }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    const finalTitle = useCustomTitle ? form.customTitle.trim() : form.title;
    if (!finalTitle || !form.recipientName.trim()) {
      setError("Title and recipient name are required."); setSaving(false); return;
    }
    const data: Omit<Award, "id"> = {
      type: form.type,
      title: finalTitle,
      recipientName: form.recipientName.trim(),
      memberId: form.memberId || undefined,
      description: form.description.trim(),
      month: form.month,
      year: form.year,
      photoUrl: form.photoUrl.trim() || undefined,
      awardedBy: form.awardedBy.trim() || undefined,
      featured: form.featured,
    };
    try {
      if (editId) {
        await updateAward(editId, data);
        setAwards((prev) => prev.map((a) => a.id === editId ? { ...a, ...data } : a));
        setSuccess("Award updated!");
      } else {
        await addAward(data);
        const fresh = await getAwards();
        setAwards(fresh);
        setSuccess("Award added!");
      }
      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this award?")) return;
    try {
      await deleteAward(id);
      setAwards((prev) => prev.filter((a) => a.id !== id));
      setSuccess("Award deleted.");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to delete."); }
  }

  const memberAwards = awards.filter((a) => a.type === "member");
  const clubAwards = awards.filter((a) => a.type === "club");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Awards & Recognition</h3>
          <p className="text-sm text-gray-500">Manage Leo of the Month, member awards, and club-level awards received.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors">
            <Plus size={16} /> Add Award
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <Check size={15} /> {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-[#002147]">{editId ? "Edit Award" : "Add New Award"}</h4>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Award Type</label>
            <div className="flex gap-2">
              {(["member", "club"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${form.type === t ? "bg-[#002147] text-white border-[#002147]" : "bg-white text-gray-600 border-gray-200 hover:border-[#002147]"}`}>
                  {t === "member" ? <><Star size={14} /> Member Award</> : <><Building size={14} /> Club Award</>}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.type === "member" ? "Given to a specific member (e.g. Leo of the Month)" : "Received by the club from an external organization"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Award Title</label>
              <select value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                {AWARD_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {useCustomTitle && (
                <input type="text" value={form.customTitle} onChange={(e) => setForm((f) => ({ ...f, customTitle: e.target.value }))}
                  placeholder="Enter custom title" className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              )}
            </div>

            {/* Recipient */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                {form.type === "member" ? "Recipient Member" : "Received By / Club Name"}
              </label>
              {form.type === "member" ? (
                <select value={form.memberId} onChange={(e) => handleMemberSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                  <option value="">Select member…</option>
                  {members.map((m) => <option key={m.memberId} value={m.memberId}>{m.name}</option>)}
                </select>
              ) : (
                <input type="text" value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                  placeholder="Leo Club of KUSMS" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              )}
            </div>

            {/* Month */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Month</label>
              <select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Leo Year</label>
              <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                {LEO_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Awarded by */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                {form.type === "member" ? "Awarded By (optional)" : "Awarding Organization"}
              </label>
              <input type="text" value={form.awardedBy} onChange={(e) => setForm((f) => ({ ...f, awardedBy: e.target.value }))}
                placeholder={form.type === "member" ? "Leo Club of KUSMS" : "District 325L, Lions Club…"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>

            {/* Photo URL */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Photo URL (optional)</label>
              <input type="url" value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                placeholder="https://…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Brief note about this award…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none" />
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="w-4 h-4 accent-[#002147]" />
            <span className="text-sm font-medium text-gray-700">Feature on home page</span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] disabled:opacity-60 transition-colors">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> {editId ? "Update" : "Save Award"}</>}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Awards List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : awards.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <AwardIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p>No awards yet. Add the first one!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {memberAwards.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Star size={12} className="text-[#D4AF37]" /> Member Awards ({memberAwards.length})
              </div>
              <div className="space-y-3">
                {memberAwards.map((a) => (
                  <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    {a.photoUrl
                      ? <img src={a.photoUrl} alt={a.recipientName} className="w-12 h-12 rounded-xl object-cover border-2 border-[#D4AF37]/30 shrink-0" />
                      : <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0"><Star size={20} className="text-[#D4AF37]" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#002147]">{a.recipientName}</span>
                        {a.featured && <span className="text-xs bg-[#D4AF37]/20 text-[#002147] px-2 py-0.5 rounded-full font-medium">Featured</span>}
                      </div>
                      <div className="text-sm text-[#D4AF37] font-semibold">{a.title}</div>
                      <div className="text-xs text-gray-400">{a.month} · Leo Year {a.year}{a.awardedBy ? ` · By ${a.awardedBy}` : ""}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(a)} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clubAwards.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building size={12} className="text-[#002147]" /> Club Awards ({clubAwards.length})
              </div>
              <div className="space-y-3">
                {clubAwards.map((a) => (
                  <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    {a.photoUrl
                      ? <img src={a.photoUrl} alt={a.title} className="w-12 h-12 rounded-xl object-cover border-2 border-[#002147]/20 shrink-0" />
                      : <div className="w-12 h-12 rounded-xl bg-[#002147]/10 flex items-center justify-center shrink-0"><Building size={20} className="text-[#002147]" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#002147]">{a.title}</span>
                        {a.featured && <span className="text-xs bg-[#D4AF37]/20 text-[#002147] px-2 py-0.5 rounded-full font-medium">Featured</span>}
                      </div>
                      {a.awardedBy && <div className="text-sm text-gray-500">From: {a.awardedBy}</div>}
                      <div className="text-xs text-gray-400">{a.month} · Leo Year {a.year}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(a)} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
