import { useEffect, useState } from "react";
import { getMembers } from "@/lib/firestore";
import type { Member } from "@/lib/types";
import { LEO_YEARS } from "@/lib/types";
import { Link } from "wouter";
import { ArrowLeft, Clock, Award, Calendar, Shield, Search, User } from "lucide-react";

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

  useEffect(() => {
    getMembers()
      .then((all) => setMembers(all.filter((m) => m.isActive === false)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.memberId.toLowerCase().includes(search.toLowerCase()) ||
    (m.faculty ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Group by joined Leo year for display
  const grouped: Record<string, Member[]> = {};
  filtered.forEach((m) => {
    const y = m.joinedLeoYear ?? "Unknown";
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(m);
  });
  const sortedGroups = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/members" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Active Members
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center">
              <Clock size={20} className="text-[#002147]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Past Members</h1>
          </div>
          <p className="text-white/70">Alumni who served the Leo Club of KUSMS with dedication.</p>
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">{members.length}</div>
              <div className="text-white/60 text-xs">Past Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">
                {members.reduce((s, m) => s + m.activities.length, 0)}
              </div>
              <div className="text-white/60 text-xs">Total Activities</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search */}
        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past members by name, ID, or faculty…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#002147] shadow-sm" />
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-gray-500 mb-1">{search ? "No results" : "No past members yet"}</h3>
            <p className="text-sm">{search ? "Try a different name or ID." : "Members marked as inactive will appear here."}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedGroups.map((yearGroup) => (
              <div key={yearGroup}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-gray-200 text-gray-600 font-bold text-sm px-4 py-1.5 rounded-full">
                    Joined Leo Year {yearGroup}
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">{grouped[yearGroup].length} member{grouped[yearGroup].length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {grouped[yearGroup].map((m) => (
                    <Link key={m.memberId} href={`/members/${m.memberId}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 group">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200 shrink-0 group-hover:border-[#D4AF37]/40 transition-colors" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                          <User size={22} className="text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#002147] group-hover:text-[#003575] transition-colors">{m.name}</h3>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Past Member</span>
                        </div>
                        {m.currentRole && <div className="text-sm text-gray-500 mt-0.5">{m.currentRole}</div>}
                        {m.faculty && <div className="text-xs text-gray-400">{m.faculty}</div>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-[#002147]" />
                            Service: {serviceYears(m)} ({yearsServed(m)} year{yearsServed(m) !== 1 ? "s" : ""})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-[#D4AF37]" />
                            {m.activities.length} activit{m.activities.length !== 1 ? "ies" : "y"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info note */}
        <div className="mt-10 bg-[#002147]/5 border border-[#002147]/10 rounded-2xl p-5 flex items-start gap-3">
          <Shield size={18} className="text-[#002147] shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <strong className="text-[#002147]">All past member achievements are fully preserved.</strong> Scanning a past member's QR code will show their complete profile, activity timeline, and awards — just like active members.
          </div>
        </div>
      </div>
    </div>
  );
}
