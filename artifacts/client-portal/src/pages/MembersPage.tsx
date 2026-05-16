import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { getMembers, getActivity } from "@/lib/firestore";
import type { Member, Activity, MemberActivity } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import {
  Search,
  User,
  Award,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";

interface ActivityRecord {
  activity: Activity;
  memberActivity: MemberActivity;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMembers()
      .then((m) => setMembers(m.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error)
      .finally(() => setLoadingMembers(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function selectMember(member: Member) {
    setSelectedMember(member);
    setQuery(member.name);
    setDropdownOpen(false);
    setLoadingActivities(true);
    try {
      const recs: ActivityRecord[] = [];
      for (const ma of member.activities) {
        const act = await getActivity(ma.activityId);
        if (act) recs.push({ activity: act, memberActivity: ma });
      }
      recs.sort((a, b) => {
        const yr = a.memberActivity.year.localeCompare(b.memberActivity.year);
        if (yr !== 0) return yr;
        return a.memberActivity.month.localeCompare(b.memberActivity.month);
      });
      setRecords(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingActivities(false);
    }
  }

  function clearSelection() {
    setSelectedMember(null);
    setQuery("");
    setRecords([]);
    setDropdownOpen(false);
    inputRef.current?.focus();
  }

  const filtered = members.filter(
    (m) =>
      m.memberId.toLowerCase().includes(query.toLowerCase()) ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.rollNo.toLowerCase().includes(query.toLowerCase()) ||
      m.batch.toLowerCase().includes(query.toLowerCase())
  );

  // Group records by year
  const byYear: Record<string, ActivityRecord[]> = {};
  records.forEach((r) => {
    const y = r.memberActivity.year;
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(r);
  });

  const pageUrl = selectedMember
    ? `${window.location.origin}/verify/member/${selectedMember.memberId}`
    : "";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Member Search</h1>
          <p className="text-white/60">
            Search by member ID, name, roll number, or batch to view all activities and achievements.
          </p>

          {/* Search bar */}
          <div className="relative mt-8" ref={dropdownRef}>
            <div
              className={`flex items-center bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                dropdownOpen ? "ring-2 ring-[#D4AF37]" : ""
              }`}
            >
              <Search size={20} className="ml-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setDropdownOpen(true);
                  if (!e.target.value) {
                    setSelectedMember(null);
                    setRecords([]);
                  }
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Type a member ID (e.g. L2026JOHN) or name..."
                className="flex-1 py-4 px-4 text-gray-800 placeholder-gray-400 focus:outline-none text-base"
              />
              {query && (
                <button
                  onClick={clearSelection}
                  className="p-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Dropdown suggestions */}
            {dropdownOpen && !loadingMembers && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 mt-2 z-50 overflow-hidden max-h-72 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-5 py-6 text-center text-gray-400 text-sm">
                    No members match your search
                  </div>
                ) : (
                  filtered.map((m) => (
                    <button
                      key={m.memberId}
                      onClick={() => selectMember(m)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={m.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm">{m.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {m.memberId} · {m.rollNo} · {m.batch}
                        </div>
                      </div>
                      <div className="text-xs text-[#D4AF37] font-medium shrink-0">
                        {m.activities.length} activit{m.activities.length === 1 ? "y" : "ies"}
                      </div>
                      <ChevronRight size={15} className="text-gray-300 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* No selection state — show all members */}
        {!selectedMember && !query && (
          <div>
            <h2 className="text-lg font-bold text-[#002147] mb-4">
              All Members
              {!loadingMembers && (
                <span className="text-gray-400 font-normal text-sm ml-2">
                  ({members.length} registered)
                </span>
              )}
            </h2>
            {loadingMembers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <User size={48} className="mx-auto mb-3 opacity-30" />
                <p>No members registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((m) => (
                  <button
                    key={m.memberId}
                    onClick={() => selectMember(m)}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:border-[#002147]/20 transition-all text-left group"
                  >
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold shrink-0 group-hover:bg-[#D4AF37] group-hover:text-[#002147] transition-colors">
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#002147] truncate text-sm">
                        {m.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {m.memberId} · {m.batch}
                      </div>
                      {m.currentRole && (
                        <div className="text-xs text-[#D4AF37] font-medium mt-0.5 truncate">
                          {m.currentRole}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#002147]">
                        {m.activities.length}
                      </div>
                      <div className="text-xs text-gray-400">acts</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filtered but not selected */}
        {!selectedMember && query && !dropdownOpen && filtered.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((m) => (
                <button
                  key={m.memberId}
                  onClick={() => selectMember(m)}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all text-left"
                >
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold shrink-0">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-[#002147]">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.memberId} · {m.rollNo} · {m.batch}</div>
                  </div>
                  <ChevronRight size={15} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected member profile + activities */}
        {selectedMember && (
          <div>
            {/* Profile card */}
            <div className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-[#002147] to-[#003575] p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {selectedMember.photoUrl ? (
                    <img
                      src={selectedMember.photoUrl}
                      alt={selectedMember.name}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-[#D4AF37] shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-[#D4AF37] flex items-center justify-center border-4 border-[#D4AF37]/50 shrink-0">
                      <User size={36} className="text-[#002147]" />
                    </div>
                  )}
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-3 py-1 text-[#D4AF37] text-xs font-medium mb-2">
                      <Award size={12} /> Verified Member
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      {selectedMember.name}
                    </h2>
                    <p className="text-white/70 mt-1">{selectedMember.currentRole}</p>
                    <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start text-sm">
                      <span className="text-white/60">
                        Roll No:{" "}
                        <span className="text-white font-medium">{selectedMember.rollNo}</span>
                      </span>
                      <span className="text-white/60">
                        Batch:{" "}
                        <span className="text-white font-medium">{selectedMember.batch}</span>
                      </span>
                      <span className="text-white/60">
                        ID:{" "}
                        <span className="text-white font-medium">{selectedMember.memberId}</span>
                      </span>
                    </div>
                  </div>
                  {/* QR + verify link */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="bg-white p-2.5 rounded-xl">
                      <QRCodeSVG value={pageUrl} size={80} fgColor="#002147" />
                    </div>
                    <Link
                      href={`/verify/member/${selectedMember.memberId}`}
                      className="text-[#D4AF37] text-xs hover:underline flex items-center gap-1"
                    >
                      Full Profile <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-[#F8FAFC] border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-bold text-[#002147]">{records.length}</span>{" "}
                  {loadingActivities ? "loading activities..." : `activit${records.length === 1 ? "y" : "ies"} recorded`}
                </div>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-400 hover:text-[#002147] transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              </div>
            </div>

            {/* Activity Timeline */}
            <h3 className="text-xl font-bold text-[#002147] mb-5 flex items-center gap-2">
              <Calendar size={18} className="text-[#D4AF37]" />
              Activities & Achievements
            </h3>

            {loadingActivities ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p>No activities recorded for this member yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.keys(byYear)
                  .sort()
                  .map((year) => (
                    <div key={year}>
                      {/* Year label */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#002147] text-[#D4AF37] font-bold text-sm px-4 py-1.5 rounded-full">
                          Leo Year {year}
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-sm text-gray-400">
                          {byYear[year].length} activit{byYear[year].length === 1 ? "y" : "ies"}
                        </span>
                      </div>

                      {/* Activity cards */}
                      <div className="ml-4 border-l-2 border-[#D4AF37]/30 pl-6 space-y-4">
                        {byYear[year].map((r, i) => (
                          <div
                            key={`${r.activity.id}-${i}`}
                            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                          >
                            {/* Timeline dot */}
                            <div className="absolute -left-9 top-6 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-white" />

                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                                  <Calendar size={11} />
                                  {r.memberActivity.month} · Leo Year {r.memberActivity.year}
                                </div>
                                <h4 className="font-semibold text-[#002147] text-base mb-1">
                                  {r.activity.title}
                                </h4>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                                  {r.activity.description}
                                </p>

                                {/* Award badge */}
                                {r.memberActivity.awardTitle && (
                                  <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-3 py-1 text-[#002147] text-xs font-semibold">
                                    <Award size={11} className="text-[#D4AF37]" />
                                    {r.memberActivity.awardTitle}
                                  </div>
                                )}

                                {/* Participation count */}
                                {r.activity.participants.length > 0 && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    {r.activity.participants.length} total participants in this activity
                                  </div>
                                )}
                              </div>

                              {/* Photos thumbnail */}
                              <div className="flex items-start gap-3 shrink-0">
                                {r.activity.photos[0] && (
                                  <img
                                    src={r.activity.photos[0]}
                                    alt={r.activity.title}
                                    className="w-20 h-20 rounded-xl object-cover hidden sm:block"
                                  />
                                )}
                                <Link
                                  href={`/archive/${r.memberActivity.year.replace("/", "-")}/${r.memberActivity.month.toLowerCase()}`}
                                  className="inline-flex items-center gap-1.5 text-[#002147] text-xs font-medium hover:text-[#D4AF37] transition-colors whitespace-nowrap"
                                >
                                  View Activity <ExternalLink size={12} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
