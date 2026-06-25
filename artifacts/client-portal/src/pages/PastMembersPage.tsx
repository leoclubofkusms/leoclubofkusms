import { useEffect, useState } from "react";
import { getMembers } from "@/lib/firestore";
import type { Member } from "@/lib/types";
import { LEO_YEARS } from "@/lib/types";
import { Link } from "wouter";
import {
  Clock, Calendar, Shield, Search, User, Users, ChevronRight, Filter, X,
} from "lucide-react";

// Stable sort key: faculty-year (same as MembersPage)
function batchSortKey(batch: string) {
  const parts = batch.trim().split(/\s+/);
  const year = parts.find((p) => /^\d{4}$/.test(p)) ?? "0000";
  const faculty = parts.find((p) => !/^\d/.test(p)) ?? "";
  return `${faculty.toLowerCase()}-${year}`;
}

function serviceYears(member: Member): string {
  const joined = member.joinedLeoYear ?? LEO_YEARS[0];
  const left = member.leftLeoYear ?? "";
  if (joined && left) return `${joined} – ${left}`;
  if (joined) return `${joined} – Present`;
  return "—";
}

function yearsServed(member: Member): number {
  const joined = member.joinedLeoYear ?? "";
  const left = member.leftLeoYear ?? "";
  if (!joined) return 1;
  const jIdx = LEO_YEARS.indexOf(joined);
  const lIdx = left ? LEO_YEARS.indexOf(left) : LEO_YEARS.length - 1;
  if (jIdx === -1) return 1;
  return Math.max(1, (lIdx === -1 ? LEO_YEARS.length - 1 : lIdx) - jIdx + 1);
}

export default function PastMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeBatch, setActiveBatch] = useState<string>("all");

  useEffect(() => {
    getMembers()
      .then((all) =>
        setMembers(
          all
            .filter((m) => m.isActive === false)
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Unique batches sorted by faculty then year
  const batches = Array.from(new Set(members.map((m) => m.batch.trim())))
    .filter(Boolean)
    .sort((a, b) => batchSortKey(a).localeCompare(batchSortKey(b)));

  const faculties = Array.from(
    new Set(
      batches.map((b) => {
        const parts = b.trim().split(/\s+/);
        return parts.find((p) => !/^\d/.test(p)) ?? b;
      })
    )
  ).sort();

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      (m.faculty ?? "").toLowerCase().includes(q) ||
      m.batch.toLowerCase().includes(q);

    const matchesBatch =
      activeBatch === "all" ||
      (faculties.includes(activeBatch) && m.batch.trim().startsWith(activeBatch)) ||
      m.batch.trim() === activeBatch;

    return matchesSearch && matchesBatch;
  });

  // Group by the year they LEFT (or joined if no left year recorded)
  const grouped: Record<string, Member[]> = {};
  filtered.forEach((m) => {
    const y = m.leftLeoYear ?? m.joinedLeoYear ?? "Unknown";
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(m);
  });
  const sortedGroups = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalActivities = members.reduce((s, m) => s + (m.activities?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page type indicator */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/members"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              <Users size={11} /> View Active Members
            </Link>
            <div className="flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <Clock size={11} /> Past Members
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0">
              <Clock size={20} className="text-[#002147]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Past Members</h1>
          </div>
          <p className="text-white/70 mb-6">
            Alumni who served Leo Club of KUSMS with dedication and distinction.
          </p>

          {/* Stats */}
          {!loading && (
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{members.length}</div>
                <div className="text-white/50 text-xs">Past Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{totalActivities}</div>
                <div className="text-white/50 text-xs">Total Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">
                  {Math.round(totalActivities / Math.max(1, members.length) * 10) / 10}
                </div>
                <div className="text-white/50 text-xs">Avg Activities / Member</div>
              </div>
            </div>
          )}

          {/* Batch / Faculty filter pills */}
          {!loading && batches.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Filter size={11} /> Filter by batch
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveBatch("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeBatch === "all"
                      ? "bg-[#D4AF37] text-[#002147]"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  All ({members.length})
                </button>

                {faculties.map((faculty) => {
                  const facultyBatches = batches.filter((b) => b.trim().startsWith(faculty));
                  const count = members.filter((m) => m.batch.trim().startsWith(faculty)).length;
                  if (facultyBatches.length <= 1) return null;
                  return (
                    <button
                      key={`fac-${faculty}`}
                      onClick={() => setActiveBatch(activeBatch === faculty ? "all" : faculty)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        activeBatch === faculty
                          ? "bg-[#002147] border-[#D4AF37] text-[#D4AF37]"
                          : "bg-white/5 border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {faculty} <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}

                {batches.map((batch) => {
                  const count = members.filter((m) => m.batch.trim() === batch).length;
                  return (
                    <button
                      key={batch}
                      onClick={() => setActiveBatch(activeBatch === batch ? "all" : batch)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        activeBatch === batch
                          ? "bg-[#D4AF37] text-[#002147]"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {batch} <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search + active filter label */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {activeBatch !== "all" && (
            <div className="flex items-center gap-1.5 bg-[#002147] text-[#D4AF37] text-xs font-bold px-3 py-1.5 rounded-xl">
              {activeBatch}
              <button onClick={() => setActiveBatch("all")} className="ml-1 hover:text-white transition-colors">
                <X size={11} />
              </button>
            </div>
          )}
          <span className="text-sm text-gray-400">
            {filtered.length} of {members.length} past member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past members by name, ID, batch, or faculty…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#002147] shadow-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-gray-500 mb-1">
              {search ? "No results found" : "No past members yet"}
            </h3>
            <p className="text-sm">
              {search
                ? "Try a different name, ID, or batch."
                : "Members marked as inactive in the admin panel will appear here."}
            </p>
            {!search && (
              <Link
                href="/members"
                className="inline-flex items-center gap-1.5 mt-5 text-sm text-[#002147] border border-[#002147]/20 px-4 py-2 rounded-xl hover:bg-[#002147] hover:text-white transition-all"
              >
                <Users size={13} /> View Active Members
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {sortedGroups.map((yearGroup) => (
              <div key={yearGroup}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-[#002147] text-[#D4AF37] font-bold text-sm px-4 py-1.5 rounded-full">
                    Leo Year {yearGroup}
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">
                    {grouped[yearGroup].length} member{grouped[yearGroup].length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {grouped[yearGroup].map((m) => (
                    <Link
                      key={m.memberId}
                      href={`/members/${m.memberId}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 group"
                    >
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={m.name}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200 shrink-0 group-hover:border-[#D4AF37]/40 transition-colors"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                          <User size={22} className="text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#002147] group-hover:text-[#003575] transition-colors truncate">
                            {m.name}
                          </h3>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                            Alumni
                          </span>
                        </div>
                        {m.currentRole && (
                          <div className="text-sm text-gray-500 mt-0.5 truncate">{m.currentRole}</div>
                        )}
                        {m.faculty && (
                          <div className="text-xs text-gray-400 truncate">{m.faculty} · {m.batch}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-[#002147]" />
                            {serviceYears(m)} ({yearsServed(m)} yr{yearsServed(m) !== 1 ? "s" : ""})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-[#D4AF37]" />
                            {m.activities.length} activit{m.activities.length !== 1 ? "ies" : "y"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-[#002147] transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <div className="mt-10 bg-[#002147]/5 border border-[#002147]/10 rounded-2xl p-5 flex items-start gap-3">
          <Shield size={18} className="text-[#002147] shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <strong className="text-[#002147]">All past member achievements are fully preserved.</strong>{" "}
            Scanning a past member's QR code shows their complete profile, activity timeline, and awards — just like active members.{" "}
            <Link href="/members" className="text-[#002147] font-semibold hover:underline underline-offset-2">
              View active members →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
