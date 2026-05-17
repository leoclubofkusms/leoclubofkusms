import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { getMember, getActivity } from "@/lib/firestore";
import type { Member, Activity, MemberActivity } from "@/lib/types";
import { MONTHS } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { User, Calendar, Award, ExternalLink, ArrowLeft, Download } from "lucide-react";

interface VerifyPageProps {
  memberId: string;
}

interface ActivityRecord {
  activity: Activity;
  memberActivity: MemberActivity;
}

export default function VerifyPage({ memberId }: VerifyPageProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
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

        // Fetch each activity the member participated in
        const recs: ActivityRecord[] = [];
        for (const ma of m.activities) {
          const act = await getActivity(ma.activityId);
          if (act) {
            recs.push({ activity: act, memberActivity: ma });
          }
        }
        // Sort chronologically by Leo year then calendar month order
        recs.sort((a, b) => {
          const yearCmp = a.memberActivity.year.localeCompare(b.memberActivity.year);
          if (yearCmp !== 0) return yearCmp;
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
          <p className="text-gray-500 mb-6">{error || "No member with this ID exists."}</p>
          <Link href="/" className="text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Group records by year
  const byYear: Record<string, ActivityRecord[]> = {};
  records.forEach((r) => {
    const y = r.memberActivity.year;
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(r);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#002147] transition-colors text-sm mb-8">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Member Profile Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#002147] to-[#003575] p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
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
                <h1 className="text-2xl md:text-3xl font-bold text-white">{member.name}</h1>
                <p className="text-white/70 mt-1">{member.currentRole}</p>
                <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start">
                  <span className="text-white/60 text-sm">Roll No: <span className="text-white font-medium">{member.rollNo}</span></span>
                  <span className="text-white/60 text-sm">Batch: <span className="text-white font-medium">{member.batch}</span></span>
                  <span className="text-white/60 text-sm">Member ID: <span className="text-white font-medium">{member.memberId}</span></span>
                </div>
              </div>
              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl shrink-0">
                <QRCodeSVG value={pageUrl} size={100} fgColor="#002147" />
                <p className="text-xs text-gray-500 text-center mt-1.5">Scan to verify</p>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-8 py-4 bg-[#F8FAFC] border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-[#002147]">{records.length}</span> activities recorded
            </div>
            <div className="text-xs text-gray-400">Leo Club of KUSMS — Official Record</div>
          </div>
        </div>

        {/* Activity Timeline */}
        <h2 className="text-2xl font-bold text-[#002147] mb-6">Activity Timeline</h2>

        {records.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>No activities recorded for this member yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(byYear)
              .sort()
              .map((year) => (
                <div key={year}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#002147] text-[#D4AF37] font-bold text-sm px-4 py-1.5 rounded-full">
                      Leo Year {year}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-400">{byYear[year].length} activities</span>
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
                              <Calendar size={12} />
                              {r.memberActivity.month} · Leo Year {r.memberActivity.year}
                            </div>
                            <h3 className="font-semibold text-[#002147] text-lg mb-1">
                              {r.activity.title}
                            </h3>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                              {r.activity.description}
                            </p>
                            {r.memberActivity.awardTitle && (
                              <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-3 py-1 text-[#002147] text-xs font-semibold">
                                <Award size={11} />
                                {r.memberActivity.awardTitle}
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
      </div>
    </div>
  );
}
