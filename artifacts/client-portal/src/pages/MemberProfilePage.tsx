import { useEffect, useState } from "react";
import { getMembers, getActivities, getAwards } from "@/lib/firestore";
import type { Member, Activity, Award } from "@/lib/types";
import { LEO_YEARS, MONTHS, activitySortKey } from "@/lib/types";
import { Link } from "wouter";
import {
  ArrowLeft, Calendar, Award as AwardIcon, CheckCircle,
  Clock, Shield, Star, User, Download, Loader2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BrandMark from "@/components/BrandMark";

function serviceYears(member: Member): string {
  const joined = member.joinedLeoYear ?? "";
  const left = member.leftLeoYear ?? "";
  if (joined && left) return `${joined} – ${left}`;
  if (joined) return `${joined} – Present`;
  return "";
}

function yearsServed(member: Member): number {
  const joined = member.joinedLeoYear ?? "";
  const left = member.leftLeoYear ?? "";
  if (!joined) return 0;
  const jIdx = LEO_YEARS.indexOf(joined);
  const lIdx = left ? LEO_YEARS.indexOf(left) : LEO_YEARS.length - 1;
  if (jIdx === -1) return 1;
  return Math.max(1, (lIdx === -1 ? LEO_YEARS.length - 1 : lIdx) - jIdx + 1);
}

interface Props { memberId: string; }

export default function MemberProfilePage({ memberId }: Props) {
  const [member, setMember] = useState<Member | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);

  async function downloadIDCard() {
    const el = document.getElementById("member-id-card-capture");
    if (!el || !member) return;
    setDownloadingCard(true);
    try {
      const { default: html2canvas } = await import("html2canvas") as {
        default: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
      };
      const canvas = await html2canvas(el, {
        scale: 3, backgroundColor: "#fff", useCORS: true, allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `${member.memberId}-id-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloadingCard(false);
    }
  }

  useEffect(() => {
    Promise.all([getMembers(), getActivities(), getAwards()])
      .then(([members, allActivities, allAwards]) => {
        const found = members.find((m) => m.memberId === memberId);
        if (!found) { setNotFound(true); return; }
        setMember(found);
        const memberActivities = allActivities
          .filter((a) => a.participants.some((p) => p.memberId === memberId))
          .sort((a, b) => activitySortKey(a.year, a.month) - activitySortKey(b.year, b.month));
        setActivities(memberActivities);
        setAwards(allAwards.filter((a) => a.memberId === memberId));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [memberId]);

  const verifyUrl = `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${memberId}`;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !member) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col gap-4 text-gray-400">
      <AwardIcon size={48} className="opacity-20" />
      <p className="text-lg font-semibold text-gray-500">Member not found</p>
      <Link href="/members" className="text-sm text-[#002147] underline">Back to Members</Link>
    </div>
  );

  const isActive = member.isActive !== false;
  // Group activities by year in chrono order
  const byYear: Record<string, Activity[]> = {};
  activities.forEach((a) => {
    if (!byYear[a.year]) byYear[a.year] = [];
    byYear[a.year].push(a);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className={isActive ? "bg-[#002147]" : "bg-[#3a3a4a]"}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/members" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> All Members
          </Link>

          {/* Status badge */}
          <div className="mb-5">
            {isActive ? (
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/40 rounded-xl px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 font-bold text-xs tracking-widest">ACTIVE MEMBER</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-1.5">
                <Clock size={12} className="text-white/60" />
                <span className="text-white/60 font-bold text-xs tracking-widest">PAST MEMBER</span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-6">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.name}
                className={`w-24 h-24 rounded-2xl object-cover border-2 shrink-0 ${isActive ? "border-[#D4AF37]" : "border-white/30"}`} />
            ) : (
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 ${isActive ? "bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40" : "bg-white/10 border-2 border-white/20"}`}>
                <span className="text-3xl font-bold text-white">{member.name[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{member.name}</h1>
                {member.currentRole && (
                  <span className="bg-[#D4AF37] text-[#002147] text-xs font-bold px-3 py-1 rounded-full">{member.currentRole}</span>
                )}
              </div>
              <div className="text-white/60 text-sm">{member.faculty} · Batch {member.batch}</div>
              <div className={`text-sm font-mono mt-1 ${isActive ? "text-[#D4AF37]/80" : "text-white/40"}`}>ID: {member.memberId}</div>
              {serviceYears(member) && (
                <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                  <Clock size={11} />
                  Service: {serviceYears(member)}
                  {yearsServed(member) > 0 && ` · ${yearsServed(member)} year${yearsServed(member) > 1 ? "s" : ""}`}
                </div>
              )}
              <button
                onClick={downloadIDCard}
                disabled={downloadingCard}
                className="mt-4 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-60"
              >
                {downloadingCard
                  ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                  : <><Download size={13} /> Download ID Card</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden ID card for html2canvas capture */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1 }} aria-hidden>
        <div
          id="member-id-card-capture"
          style={{
            width: "340px", height: "214px", borderRadius: "12px", overflow: "hidden",
            background: "#fff", fontFamily: "system-ui, -apple-system, sans-serif", position: "relative",
          }}
        >
          {/* Navy header */}
          <div style={{ background: "linear-gradient(135deg,#002147 0%,#003575 100%)", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", position: "relative" }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "#D4AF37" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <BrandMark size="sm" className="rounded-lg" />
              <div>
                <div style={{ color: "#fff", fontWeight: "700", fontSize: "11px", lineHeight: 1.2 }}>Leo Club of KUSMS</div>
                <div style={{ color: "#D4AF37", fontSize: "8.5px", letterSpacing: "0.8px", marginTop: "2px" }}>LIONS CLUBS INTERNATIONAL · D325L · CLUB #172194</div>
              </div>
            </div>
            <div style={{ padding: "3px 9px", borderRadius: "20px", fontSize: "9px", fontWeight: "700", letterSpacing: "0.8px", background: isActive ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.12)", color: isActive ? "#4ade80" : "rgba(255,255,255,0.5)", border: `1px solid ${isActive ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.18)"}` }}>
              {isActive ? "● ACTIVE" : "◌ PAST"}
            </div>
          </div>
          {/* Body */}
          <div style={{ display: "flex", alignItems: "flex-start", padding: "12px 14px", gap: "12px" }}>
            {member.photoUrl
              ? <img src={member.photoUrl} alt={member.name} style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover", border: "2px solid #002147", flexShrink: 0 }} />
              : <div style={{ width: "64px", height: "64px", borderRadius: "10px", background: "#002147", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", color: "#D4AF37", flexShrink: 0 }}>{member.name[0]}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: "800", fontSize: "14px", color: "#002147", lineHeight: 1.2, marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</div>
              <div style={{ fontSize: "9.5px", color: "#D4AF37", fontWeight: "700", letterSpacing: "0.5px", marginBottom: "6px" }}>{member.currentRole || "Leo Member"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}><span style={{ color: "#002147", fontWeight: "600" }}>ID</span><span style={{ fontFamily: "monospace" }}>{member.memberId}</span></div>
                {member.faculty && <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}><span style={{ color: "#002147", fontWeight: "600" }}>Faculty</span><span>{member.faculty}</span></div>}
                <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}><span style={{ color: "#002147", fontWeight: "600" }}>Batch</span><span>{member.batch}</span></div>
                {serviceYears(member) && <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}><span style={{ color: "#002147", fontWeight: "600" }}>Leo Year</span><span>{serviceYears(member)}{yearsServed(member) > 0 ? ` (${yearsServed(member)} yr${yearsServed(member) !== 1 ? "s" : ""})` : ""}</span></div>}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
              <div style={{ padding: "5px", background: "#fff", borderRadius: "8px", border: "1.5px solid #002147" }}>
                <QRCodeSVG value={verifyUrl} size={56} fgColor="#002147" level="M" />
              </div>
              <div style={{ fontSize: "7px", color: "#aaa", textAlign: "center" }}>Scan to verify</div>
            </div>
          </div>
          {/* Footer */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#F8FAFC", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px" }}>
            <div style={{ fontSize: "7.5px", color: "#aaa" }}>Roll No: {member.rollNo}</div>
            <div style={{ fontSize: "7.5px", color: "#aaa" }}>leoclubofkusms.org</div>
            <div style={{ fontSize: "7.5px", color: "#D4AF37", fontWeight: "700" }}>VERIFIED ✓</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Activities", value: activities.length, icon: Calendar },
            { label: "Awards", value: awards.length, icon: AwardIcon },
            { label: "Status", value: isActive ? "Active" : "Past", icon: isActive ? CheckCircle : Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <Icon size={20} className={`mx-auto mb-2 ${isActive ? "text-[#D4AF37]" : "text-gray-400"}`} />
              <div className="text-2xl font-bold text-[#002147]">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: bio + QR */}
          <div className="space-y-4">
            {member.bio && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-[#002147] mb-2 text-sm">About</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>
              </div>
            )}

            {/* Service info */}
            {(member.joinedLeoYear || member.leftLeoYear) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-[#002147] mb-3 text-sm flex items-center gap-2">
                  <Clock size={14} className="text-[#D4AF37]" /> Service Period
                </h3>
                <div className="space-y-2">
                  {member.joinedLeoYear && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Joined</span>
                      <span className="font-semibold text-[#002147]">Leo Year {member.joinedLeoYear}</span>
                    </div>
                  )}
                  {member.leftLeoYear && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Left</span>
                      <span className="font-semibold text-gray-500">Leo Year {member.leftLeoYear}</span>
                    </div>
                  )}
                  {yearsServed(member) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Years Served</span>
                      <span className="font-bold text-[#D4AF37]">{yearsServed(member)} year{yearsServed(member) > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-[#002147] mb-3 text-sm">Verification QR</h3>
              <div className="flex flex-col items-center gap-3">
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                  <QRCodeSVG value={verifyUrl} size={120} bgColor="#F8FAFC" fgColor="#002147" />
                </div>
                <p className="text-xs text-gray-400 text-center">Scan to verify credentials</p>
                <Link href={`/verify/member/${memberId}`}
                  className="text-xs text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                  <Shield size={11} /> Open Verify Page
                </Link>
              </div>
            </div>
          </div>

          {/* Right: awards + activities */}
          <div className="md:col-span-2 space-y-6">
            {/* Awards */}
            {awards.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-[#002147] mb-4 flex items-center gap-2">
                  <AwardIcon size={16} className="text-[#D4AF37]" /> Awards & Recognition
                </h3>
                <div className="space-y-3">
                  {awards.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl">
                      <Star size={18} className="text-[#D4AF37] shrink-0" />
                      <div>
                        <div className="font-semibold text-[#002147] text-sm">{a.title}</div>
                        <div className="text-xs text-gray-400">{a.month} · Leo Year {a.year}{a.awardedBy ? ` · By ${a.awardedBy}` : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline — sorted chronologically */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-[#002147] mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-[#D4AF37]" /> Activity Timeline
                <span className="ml-auto text-xs text-gray-400 font-normal">{activities.length} total</span>
              </h3>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recorded activities yet.</p>
              ) : (
                <div className="space-y-6">
                  {Object.keys(byYear)
                    .sort((a, b) => LEO_YEARS.indexOf(a) - LEO_YEARS.indexOf(b))
                    .map((year) => (
                      <div key={year}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold text-[#D4AF37] bg-[#002147] px-3 py-1 rounded-full">Leo Year {year}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-xs text-gray-400">{byYear[year].length}</span>
                        </div>
                        <div className="space-y-2 ml-2 border-l-2 border-[#D4AF37]/20 pl-4">
                          {byYear[year].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)).map((a) => {
                            const participation = a.participants.find((p) => p.memberId === memberId);
                            return (
                              <div key={a.id} className="relative flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-[#D4AF37]/40 border-2 border-white" />
                                <div className="w-7 h-7 rounded-lg bg-[#002147]/5 flex items-center justify-center shrink-0">
                                  <Calendar size={12} className="text-[#002147]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-[#002147] text-sm">{a.title}</div>
                                  <div className="text-xs text-gray-400">{a.month}</div>
                                </div>
                                {participation?.awardTitle && (
                                  <span className="text-xs bg-[#D4AF37]/10 text-[#002147] px-2 py-0.5 rounded-full font-medium shrink-0">
                                    {participation.awardTitle}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
