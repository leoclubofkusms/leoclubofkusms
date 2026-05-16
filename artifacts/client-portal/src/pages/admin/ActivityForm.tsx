import { useState, useEffect } from "react";
import { getMembers, createActivity } from "@/lib/firestore";
import type { Member, ActivityParticipant } from "@/lib/types";
import { LEO_YEARS, MONTHS } from "@/lib/types";
import { Plus, X, Search, Check, ChevronDown } from "lucide-react";

export default function ActivityForm({ onSuccess }: { onSuccess: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({
    year: LEO_YEARS[0],
    month: MONTHS[0],
    title: "",
    description: "",
    photosRaw: "",
  });
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMembers().then(setMembers).catch(console.error);
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      !participants.some((p) => p.memberId === m.memberId) &&
      (m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.rollNo.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.batch.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  function addParticipant(member: Member) {
    setParticipants((prev) => [...prev, { memberId: member.memberId, awardTitle: "" }]);
    setMemberSearch("");
    setDropdownOpen(false);
  }

  function removeParticipant(memberId: string) {
    setParticipants((prev) => prev.filter((p) => p.memberId !== memberId));
  }

  function updateAward(memberId: string, awardTitle: string) {
    setParticipants((prev) =>
      prev.map((p) => (p.memberId === memberId ? { ...p, awardTitle } : p))
    );
  }

  function getMemberName(memberId: string) {
    return members.find((m) => m.memberId === memberId)?.name ?? memberId;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const photos = form.photosRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await createActivity({
        year: form.year,
        month: form.month,
        title: form.title,
        description: form.description,
        photos,
        participants,
      });
      setSuccess(true);
      setForm({ year: LEO_YEARS[0], month: MONTHS[0], title: "", description: "", photosRaw: "" });
      setParticipants([]);
      onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save activity.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Leo Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Leo Year</label>
          <select
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10"
          >
            {LEO_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {/* Month */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
          <select
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Blood Donation Camp 2026"
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the activity..."
          rows={4}
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10 resize-none"
        />
      </div>

      {/* Image URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Image URLs <span className="text-gray-400 font-normal">(comma separated)</span>
        </label>
        <input
          type="text"
          value={form.photosRaw}
          onChange={(e) => setForm({ ...form, photosRaw: e.target.value })}
          placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10"
        />
      </div>

      {/* Member Tagging */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tag Members
        </label>
        {/* Search dropdown */}
        <div className="relative mb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => { setMemberSearch(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search member by name, roll no, batch..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10"
            />
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          {dropdownOpen && filteredMembers.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 max-h-52 overflow-y-auto">
              {filteredMembers.map((m) => (
                <button
                  key={m.memberId}
                  type="button"
                  onClick={() => addParticipant(m)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#002147]/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.rollNo} · {m.batch}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {dropdownOpen && memberSearch && filteredMembers.length === 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 p-4 text-sm text-gray-400 text-center">
              No matching members found
            </div>
          )}
        </div>

        {/* Selected participants */}
        {participants.length > 0 && (
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.memberId} className="flex items-center gap-2 bg-[#F8FAFC] border border-gray-100 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-[#002147] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {getMemberName(p.memberId).charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">
                  {getMemberName(p.memberId)}
                </span>
                <input
                  type="text"
                  value={p.awardTitle}
                  onChange={(e) => updateAward(p.memberId, e.target.value)}
                  placeholder="Award title (e.g. Coordinator)"
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#D4AF37] w-40"
                />
                <button
                  type="button"
                  onClick={() => removeParticipant(p.memberId)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <Check size={15} /> Activity saved successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#002147] text-white py-3 rounded-xl font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving Activity...
          </>
        ) : (
          <>
            <Plus size={18} /> Save Activity
          </>
        )}
      </button>
    </form>
  );
}
