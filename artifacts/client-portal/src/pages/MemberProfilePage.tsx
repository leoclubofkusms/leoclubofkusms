import { useEffect, useState } from "react";
import { getMembers, getActivities, getAwards } from "@/lib/firestore";
import type { Member, Activity, Award } from "@/lib/types";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Star, Shield, Award as AwardIcon, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  memberId: string;
}

export default function MemberProfilePage({ memberId }: Props) {
  const [member, setMember] = useState<Member | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      getMembers(),
      getActivities(),
      getAwards(),
    ]).then(([members, allActivities, allAwards]) => {
      const found = members.find((m) => m.memberId === memberId);
      if (!found) { setNotFound(true); setLoading(false); return; }
      setMember(found);
      const memberActivities = allActivities.filter((a) =>
        a.participants.some((p) => p.memberId === memberId)
      );
      setActivities(memberActivities.reverse());
      setAwards(allAwards.filter((a) => a.memberId === memberId));
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [memberId]);

  const verifyUrl = `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${memberId}`;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full" />
    </div>
  );

  if (notFound || !member) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col gap-4 text-gray-400">
      <AwardIcon size={48} className="opacity-20" />
      <p className="text-lg font-semibold text-gray-500">Member not found</p>
      <Link href="/members" className="text-sm text-[#002147] underline">Back to Members</Link>
    </div>
  );

  const totalParticipations = activities.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero banner */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/members" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> All Members
          </Link>
          <div className="flex items-center gap-6">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D4AF37] shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-[#D4AF37]">{member.name[0]}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">{member.name}</h1>
                {member.role && (
                  <span className="bg-[#D4AF37] text-[#002147] text-xs font-bold px-3 py-1 rounded-full">
                    {member.role}
                  </span>
                )}
                {member.isActive ? (
                  <span className="flex items-center gap-1 bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full">
                    <CheckCircle size={10} /> Active
                  </span>
                ) : (
                  <span className="bg-gray-500/20 text-gray-400 text-xs px-3 py-1 rounded-full">Inactive</span>
                )}
              </div>
              <div className="text-white/60 text-sm">{member.faculty} · Batch {member.batch}</div>
              <div className="text-[#D4AF37]/80 text-sm font-mono mt-1">ID: {member.memberId}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Activities", value: totalParticipations, icon: Calendar },
            { label: "Awards", value: awards.length, icon: AwardIcon },
            { label: "Status", value: member.isActive ? "Active" : "Inactive", icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <Icon size={20} className="text-[#D4AF37] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#002147]">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: about + QR */}
          <div className="space-y-4">
            {member.bio && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-[#002147] mb-2 text-sm">About</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-[#002147] mb-3 text-sm">Verification QR</h3>
              <div className="flex flex-col items-center gap-3">
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                  <QRCodeSVG value={verifyUrl} size={120} bgColor="#F8FAFC" fgColor="#002147" />
                </div>
                <p className="text-xs text-gray-400 text-center">Scan to verify this member's credentials</p>
                <Link href={`/verify/member/${memberId}`}
                  className="text-xs text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                  <Shield size={11} /> Open Verify Page
                </Link>
              </div>
            </div>
          </div>

          {/* Right: activities + awards */}
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

            {/* Activities */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-[#002147] mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-[#D4AF37]" /> Activity Participation
                <span className="ml-auto text-xs text-gray-400 font-normal">{totalParticipations} total</span>
              </h3>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recorded activities yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activities.map((a) => {
                    const participation = a.participants.find((p) => p.memberId === memberId);
                    return (
                      <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-[#002147]/5 flex items-center justify-center shrink-0">
                          <Calendar size={13} className="text-[#002147]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#002147] text-sm truncate">{a.name}</div>
                          <div className="text-xs text-gray-400">{a.month} · {a.year}</div>
                        </div>
                        {participation?.role && (
                          <span className="text-xs bg-[#D4AF37]/10 text-[#002147] px-2 py-0.5 rounded-full font-medium shrink-0">
                            {participation.role}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
