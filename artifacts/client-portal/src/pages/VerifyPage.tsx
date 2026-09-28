import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getMember, getActivity, getBodMembers } from "@/lib/firestore";
import type { Member, Activity, MemberActivity, BodMember } from "@/lib/types";
import { MONTHS, LEO_YEARS, activitySortKey, leoMonthToCalendarYear } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { User, Calendar, Award, ExternalLink, ArrowLeft, CheckCircle, Clock, Shield, ArrowRight } from "lucide-react";

interface ActivityRecord {
  activity: Activity;
  memberActivity: MemberActivity;
}

function serviceYears(member: Member): string {
  const joined = member.joinedLeoYear ?? "";
  const left = member.leftLeoYear ?? "";
  if (joined && left) return `Leo Year ${joined} – ${left}`;
  if (joined) return `Leo Year ${joined} – Present`;
  return "";
}

function yearsServed(member: Member): number {
  const joined = member.joinedLeoYear ?? "";
  const left = member.leftLeoYear ?? "";
  if (!joined) return 0;
  const jIdx = LEO_YEARS.indexOf(joined);
  if (jIdx === -1) return 1;
  if (left) {
    const lIdx = LEO_YEARS.indexOf(left);
    if (lIdx === -1) return 1;
    return Math.max(1, lIdx - jIdx + 1);
  }
  const now = new Date();
  const currentLeoStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const currentLeoYear = `${currentLeoStart}/${String(currentLeoStart + 1).slice(-2)}`;
  const cIdx = LEO_YEARS.indexOf(currentLeoYear);
  if (cIdx === -1) return 1;
  return Math.max(1, cIdx - jIdx + 1);
}

/**
 * A role counts as "President" only when it's the actual top office —
 * not "Vice President", "Chartered Vice President", "Past President", etc.
 */
function isActualPresidentRole(roleName: string): boolean {
  const r = (roleName ?? "").trim().toLowerCase();
  if (!r) return false;
  if (/vice|past|elect|chartered|deputy|assistant|co-?president/.test(r)) return false;
  return r === "president" || r === "club president" || r.endsWith(" president");
}

export default function VerifyPage({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [bodRecords, setBodRecords] = useState<BodMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageUrl = window.location.href;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const m = await getMember(memberId);
        if (!m) {
          setError("Member not found. Please check the member ID.");
          return;
        }
        setMember(m);

        // Fetch BOD records filtered to this member (for role-by-year fallback)
        try {
          const allBod = await getBodMembers();
          setBodRecords(allBod.filter((b) => b.memberId === memberId));
        } catch {
          setBodRecords([]);
        }

        const recs: ActivityRecord[] = [];
        for (const ma of m.activities) {
          const act = await getActivity(ma.activityId);
          if (act) recs.push({ activity: act, memberActivity: ma });
        }
        recs.sort((a, b) => {
          const diff =
            activitySortKey(a.memberActivity.year, a.memberActivity.month) -
            activitySortKey(b.memberActivity.year, b.memberActivity.month);
          if (diff !== 0) return diff;
          return MONTHS.indexOf(a.memberActivity.month) - MONTHS.indexOf(b.memberActivity.month);
        });
        setRecords(recs);
      } catch (e) {
        setError("Failed to load member data. Please try again.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [memberId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#002147] border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Member Not Found</h2>
          <p className="text-gray-500 mb-6">
            {error || "No member with this ID exists."}
          </p>
          <Link
            href="/"
            className="text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isActive = member.isActive !== false;
  const byYear: Record<string, ActivityRecord[]> = {};
  records.forEach((r) => {
    const y = r.memberActivity.year;
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(r);
  });

  // ── Role by Leo Year (from roleHistory + BOD fallback) ──
  const roleByYear: Record<string, string> = {};
  bodRecords.forEach((record) => {
    if (record.leoYear) roleByYear[record.leoYear] = record.role;
  });
  (member.roleHistory ?? []).forEach((role) => {
    roleByYear[role.leoYear] = role.role;
  });

  const joinedIndex = LEO_YEARS.indexOf(member.joinedLeoYear ?? "");
  const leftIndex = member.leftLeoYear ? LEO_YEARS.indexOf(member.leftLeoYear) : -1;
  const currentCalendarYear = new Date().getFullYear();
  const currentLeoYear = new Date().getMonth() >= 6
    ? `${currentCalendarYear}/${String(currentCalendarYear + 1).slice(-2)}`
    : `${currentCalendarYear - 1}/${String(currentCalendarYear).slice(-2)}`;
  const currentIndex = Math.max(0, LEO_YEARS.indexOf(currentLeoYear));

  const roleYears = Object.keys(roleByYear).length > 0
    ? [...new Set([
      ...(joinedIndex >= 0 ? LEO_YEARS.slice(joinedIndex, (leftIndex >= 0 ? leftIndex : currentIndex) + 1) : []),
      ...Object.keys(roleByYear),
    ])].sort((a, b) => LEO_YEARS.indexOf(a) - LEO_YEARS.indexOf(b))
    : (joinedIndex >= 0 ? LEO_YEARS.slice(joinedIndex, (leftIndex >= 0 ? leftIndex : currentIndex) + 1) : []);

  roleYears.forEach((year) => {
    if (!roleByYear[year]) roleByYear[year] = "General Member";
  });

  // ── Presidential years (from roleHistory only) ──
  const presidentialYears = [...new Set(
    (member.roleHistory ?? [])
      .filter((rh) => rh.leoYear && isActualPresidentRole(rh.role))
      .map((rh) => rh.leoYear)
  )].sort((a, b) => LEO_YEARS.indexOf(b) - LEO_YEARS.indexOf(a));

  const isPresident = presidentialYears.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#002147] transition-colors text-sm mb-8"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div
            className={`p-6 md:p-8 ${
              isActive
                ? "bg-gradient-to-r from-[#002147] to-[#003575]"
                : "bg-gradient-to-r from-[#3a3a4a] to-[#2a2a38]"
            }`}
          >
            <div className="flex justify-center mb-5">
              {isActive ? (
                <div className="inline-flex items-center gap-2.5 bg-green-500/20 border border-green-400/40 rounded-2xl px-5 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-300 font-bold text-sm tracking-wide">
                    ✓ ACTIVE MEMBER
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-2xl px-5 py-2.5">
                  <Clock size={14} className="text-white/60" />
                  <span className="text-white/70 font-bold text-sm tracking-wide">
                    PAST MEMBER
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className={`w-24 h-24 rounded-2xl object-cover border-4 shrink-0 ${
                    isActive ? "border-[#D4AF37]" : "border-white/30"
                  }`}
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center border-4 shrink-0 ${
                    isActive
                      ? "bg-[#D4AF37] border-[#D4AF37]/50"
                      : "bg-white/10 border-white/20"
                  }`}
                >
                  <User size={36} className={isActive ? "text-[#002147]" : "text-white/60"} />
                </div>
              )}
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Award size={12} className={isActive ? "text-[#D4AF37]" : "text-white/40"} />
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-[#D4AF37]" : "text-white/50"
                    }`}
                  >
                    {isActive ? "Verified Active Member" : "Verified Past Member"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{member.name}</h1>
                {member.currentRole && (
                  <p className="text-white/70 mt-1">{member.currentRole}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start">
                  <span className="text-white/60 text-sm">
                    Roll No: <span className="text-white font-medium">{member.rollNo}</span>
                  </span>
                  <span className="text-white/60 text-sm">
                    Batch: <span className="text-white font-medium">{member.batch}</span>
                  </span>
                  {member.faculty && (
                    <span className="text-white/60 text-sm">
                      Faculty: <span className="text-white font-medium">{member.faculty}</span>
                    </span>
                  )}
                  <span className="text-white/60 text-sm">
                    Member ID: <span className="text-white font-medium">{member.memberId}</span>
                  </span>
                </div>
                {serviceYears(member) && (
                  <div
                    className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl text-xs font-medium ${
                      isActive
                        ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    <Clock size={11} />
                    {serviceYears(member)}
                    {yearsServed(member) > 0 &&
                      ` (${yearsServed(member)} year${yearsServed(member) > 1 ? "s" : ""} of service)`}
                  </div>
                )}
                {isPresident && (
                  <div className="inline-flex items-center gap-2 mt-3 ml-0 md:ml-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#002147]">
                    <Award size={11} />
                    President · Leo Year {presidentialYears.join(", ")}
                  </div>
                )}
                {!isActive && (
                  <div className="mt-2 text-xs text-white/40 italic">
                    This member has completed their service in the Leo Club of KUSMS.
                  </div>
                )}
              </div>
              <div className="bg-white p-3 rounded-2xl shrink-0">
                <QRCodeSVG value={pageUrl} size={100} fgColor={isActive ? "#002147" : "#444"} />
                <p className="text-xs text-gray-500 text-center mt-1.5">Scan to verify</p>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-8 py-4 bg-[#F8FAFC] border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-[#002147]">{records.length}</span> activities recorded
            </div>
            <div className="flex items-center gap-3">
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <CheckCircle size={12} /> Currently active Leo member
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <Clock size={12} /> Past Leo member — achievements preserved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Role by Leo Year (NEW) ── */}
        {roleYears.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <h3 className="font-bold text-[#002147] mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#D4AF37]" /> Role by Leo Year
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roleYears.map((year) => (
                <div
                  key={year}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] border border-gray-100 px-3 py-2.5"
                >
                  <span className="text-xs font-semibold text-gray-500">Leo Year {year}</span>
                  <span className="text-xs font-bold text-[#002147] text-right">
                    {roleByYear[year]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-[#002147] mb-6">Activity Timeline</h2>
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>No activities recorded for this member yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(byYear)
              .sort((a, b) => LEO_YEARS.indexOf(a) - LEO_YEARS.indexOf(b))
              .map((year) => (
                <div key={year}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#002147] text-[#D4AF37] font-bold text-sm px-4 py-1.5 rounded-full">
                      Leo Year {year}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-400">
                      {byYear[year].length} activities
                    </span>
                  </div>
                  <div className="space-y-4 ml-4 border-l-2 border-[#D4AF37]/30 pl-6">
                    {byYear[year].map((r, i) => (
                      <div
                        key={`${r.activity.id}-${i}`}
                        className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="absolute -left-9 top-6 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-white" />
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                              <Calendar size={12} /> {r.memberActivity.month}{" "}
                              {leoMonthToCalendarYear(r.memberActivity.year, r.memberActivity.month)}{" "}
                              · Leo Year {r.memberActivity.year}
                            </div>
                            <h3 className="font-semibold text-[#002147] text-lg mb-1">
                              {r.activity.title}
                            </h3>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                              {r.activity.description}
                            </p>
                            {r.memberActivity.awardTitle && (
                              <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-3 py-1 text-[#002147] text-xs font-semibold">
                                <Award size={11} /> {r.memberActivity.awardTitle}
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/archive/${r.memberActivity.year.replace("/", "-")}/${r.memberActivity.month.toLowerCase()}`}
                            className="inline-flex items-center gap-1.5 text-[#002147] text-sm font-medium hover:text-[#D4AF37] transition-colors shrink-0"
                          >
                            View Full Activity <ExternalLink size={13} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── View Full Profile Link (NEW) ── */}
        <div className="mt-10 bg-gradient-to-r from-[#002147] to-[#003575] rounded-2xl p-6 text-center text-white shadow-lg">
          <p className="text-white/70 text-sm mb-3">
            Want to see awards, bio, president&apos;s service record and more?
          </p>
          <Link
            href={`/members/${member.memberId}`}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-bold hover:bg-[#c9a432] transition-colors"
          >
            View Full Profile <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}