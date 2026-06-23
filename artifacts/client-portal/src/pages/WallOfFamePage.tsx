import { useEffect, useState } from "react";
import { getAwards, getMembers, getBodMembers } from "@/lib/firestore";
import type { Award, Member, BodMember } from "@/lib/types";
import { Link } from "wouter";
import {
  Trophy, Star, Sparkles, Users, Crown, Award as AwardIcon,
  Building, Medal, ChevronRight, Shield,
} from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────

function getLeoYear(year: string) {
  const y = parseInt(year, 10);
  if (isNaN(y)) return year;
  return `${y}/${String(y + 1).slice(2)}`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 56 }: { url?: string; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover shrink-0 ring-2 ring-[#D4AF37]/40"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#002147] text-[#D4AF37] font-bold flex items-center justify-center shrink-0 ring-2 ring-[#D4AF37]/40"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  );
}

function FeaturedCard({ award }: { award: Award }) {
  return (
    <div className="relative bg-gradient-to-br from-[#002147] to-[#003575] rounded-2xl p-6 text-white overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5">
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Featured badge */}
      <div className="flex items-center justify-between mb-4 relative">
        <span className="inline-flex items-center gap-1 bg-[#D4AF37] text-[#002147] text-xs font-bold px-2.5 py-1 rounded-full">
          <Sparkles size={10} /> Featured
        </span>
        <span className="text-white/40 text-xs">{award.year}</span>
      </div>

      {/* Photo or icon */}
      <div className="flex items-center gap-4 mb-4 relative">
        {award.photoUrl ? (
          <img src={award.photoUrl} alt={award.recipientName}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-[#D4AF37]/60" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 flex items-center justify-center ring-2 ring-[#D4AF37]/40">
            {award.type === "club"
              ? <Building size={22} className="text-[#D4AF37]" />
              : <Star size={22} className="text-[#D4AF37]" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg leading-tight truncate">{award.title}</div>
          <div className="text-[#D4AF37] text-sm font-medium mt-0.5 truncate">{award.recipientName}</div>
        </div>
      </div>

      {award.description && (
        <p className="text-white/60 text-sm leading-relaxed line-clamp-3 relative">
          {award.description}
        </p>
      )}

      {award.awardedBy && (
        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40 relative">
          Awarded by {award.awardedBy}
        </div>
      )}
    </div>
  );
}

function AwardRow({ award }: { award: Award }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#002147]/20 hover:shadow-sm transition-all group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${award.type === "club" ? "bg-[#002147]" : "bg-[#D4AF37]/10"}`}>
        {award.type === "club"
          ? <Building size={16} className="text-[#D4AF37]" />
          : <Star size={16} className="text-[#D4AF37]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#002147] text-sm truncate">{award.title}</div>
        <div className="text-gray-500 text-xs truncate">{award.recipientName}</div>
      </div>
      {award.awardedBy && (
        <div className="text-xs text-gray-400 shrink-0 hidden sm:block">{award.awardedBy}</div>
      )}
      <div className="text-xs text-[#D4AF37] font-bold shrink-0 bg-[#002147] px-2.5 py-0.5 rounded-lg">
        {award.year}
      </div>
    </div>
  );
}

function TopContributorCard({ member, rank }: { member: Member & { activityCount: number }; rank: number }) {
  const RANK_STYLES = [
    "from-[#D4AF37] to-[#b8912d] text-[#002147]",
    "from-gray-300 to-gray-400 text-gray-700",
    "from-amber-600 to-amber-700 text-white",
  ];
  const RANK_ICONS = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-[#002147]/20 hover:shadow-md transition-all p-5 flex items-center gap-4 group">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${RANK_STYLES[rank] || "from-gray-100 to-gray-200 text-gray-600"} flex items-center justify-center font-bold text-sm shrink-0`}>
        {rank < 3 ? RANK_ICONS[rank] : `#${rank + 1}`}
      </div>
      <Avatar url={member.photoUrl} name={member.name} size={44} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[#002147] truncate group-hover:text-[#003575] transition-colors">
          {member.name}
        </div>
        <div className="text-gray-500 text-xs truncate">{member.currentRole} · {member.faculty ?? member.batch}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xl font-black text-[#002147]">{member.activityCount}</div>
        <div className="text-xs text-gray-400">activities</div>
      </div>
    </div>
  );
}

function BodCard({ bod }: { bod: BodMember }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-[#002147]/20 hover:shadow-md transition-all p-5 flex flex-col items-center text-center group">
      <Avatar url={bod.photoUrl} name={bod.name} size={64} />
      <div className="mt-3 font-bold text-[#002147] group-hover:text-[#003575] transition-colors">{bod.name}</div>
      <div className="text-[#D4AF37] text-xs font-bold mt-0.5 uppercase tracking-wide">{bod.role}</div>
      {bod.bio && (
        <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed">{bod.bio}</p>
      )}
    </div>
  );
}

// ── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, children, count, accent = false }: {
  icon: React.ElementType; title: string; subtitle?: string;
  children: React.ReactNode; count?: number; accent?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? "bg-[#D4AF37]" : "bg-[#002147]"}`}>
            <Icon size={18} className={accent ? "text-[#002147]" : "text-[#D4AF37]"} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#002147]">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {count !== undefined && (
          <span className="text-xs text-gray-400 font-semibold">{count} entries</span>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WallOfFamePage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [bod, setBod] = useState<BodMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAwards(), getMembers(), getBodMembers()])
      .then(([a, m, b]) => {
        setAwards(a);
        setMembers(m);
        setBod(b.sort((x, y) => x.priority - y.priority));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featuredAwards = awards.filter((a) => a.featured);
  const memberAwards = awards.filter((a) => a.type === "member");
  const clubAwards = awards.filter((a) => a.type === "club");

  const topContributors = members
    .map((m) => ({ ...m, activityCount: m.activities?.length ?? 0 }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10);

  // Stats
  const stats = [
    { label: "Total Awards", value: awards.length, icon: Trophy },
    { label: "Member Honours", value: memberAwards.length, icon: Star },
    { label: "Club Trophies", value: clubAwards.length, icon: Building },
    { label: "Leo Members", value: members.length, icon: Users },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isEmpty = awards.length === 0 && members.length === 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Hero ── */}
      <div className="bg-[#002147] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-[#D4AF37]/5" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-white/3" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center shrink-0">
              <Trophy size={24} className="text-[#002147]" />
            </div>
            <div>
              <div className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase">Leo Club of KUSMS</div>
              <div className="text-white/40 text-xs">Hall of Excellence</div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Wall of Fame</h1>
          <p className="text-white/60 text-lg max-w-xl">
            Celebrating our outstanding Leos, exceptional achievements, and the milestones that define our club's legacy.
          </p>

          {/* Stats bar */}
          {!isEmpty && (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/8 rounded-2xl p-4 border border-white/10 text-center">
                  <Icon size={16} className="text-[#D4AF37] mx-auto mb-1.5" />
                  <div className="text-2xl font-black text-white">{value}</div>
                  <div className="text-white/50 text-xs">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {isEmpty ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Trophy size={28} className="opacity-40" />
            </div>
            <h2 className="text-xl font-bold text-gray-500 mb-2">No Records Yet</h2>
            <p className="text-sm">Awards and achievements will appear here as the admin adds them.</p>
            <Link href="/awards" className="inline-flex items-center gap-1.5 mt-6 text-sm text-[#002147] border border-[#002147]/20 px-4 py-2 rounded-xl hover:bg-[#002147] hover:text-white transition-all">
              Browse Awards Page <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            {/* ── Featured Achievements ── */}
            {featuredAwards.length > 0 && (
              <Section icon={Sparkles} title="Featured Achievements" subtitle="Highlighted honours of our club" count={featuredAwards.length} accent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredAwards.map((a) => <FeaturedCard key={a.id} award={a} />)}
                </div>
              </Section>
            )}

            {/* ── Top Contributors ── */}
            {topContributors.filter((m) => m.activityCount > 0).length > 0 && (
              <Section icon={Medal} title="Top Contributors" subtitle="Members with the most recorded service activities">
                <div className="space-y-3">
                  {topContributors
                    .filter((m) => m.activityCount > 0)
                    .map((m, i) => <TopContributorCard key={m.memberId} member={m} rank={i} />)}
                </div>
                <div className="text-center pt-2">
                  <Link href="/members" className="inline-flex items-center gap-1.5 text-sm text-[#002147] hover:text-[#003575] transition-colors font-medium">
                    View all members <ChevronRight size={14} />
                  </Link>
                </div>
              </Section>
            )}

            {/* ── Member Awards ── */}
            {memberAwards.length > 0 && (
              <Section icon={Star} title="Member Honours" subtitle="Individual recognitions awarded to our Leos" count={memberAwards.length}>
                <div className="space-y-2">
                  {[...memberAwards].reverse().map((a) => <AwardRow key={a.id} award={a} />)}
                </div>
                <div className="text-center pt-2">
                  <Link href="/awards" className="inline-flex items-center gap-1.5 text-sm text-[#002147] hover:text-[#003575] transition-colors font-medium">
                    See full awards list <ChevronRight size={14} />
                  </Link>
                </div>
              </Section>
            )}

            {/* ── Club Trophies ── */}
            {clubAwards.length > 0 && (
              <Section icon={Trophy} title="Club Trophies & Recognition" subtitle="Achievements earned by Leo Club of KUSMS as a whole" count={clubAwards.length}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...clubAwards].reverse().map((a) => (
                    <div key={a.id} className="bg-gradient-to-br from-[#002147] to-[#003575] rounded-2xl p-5 text-white group hover:shadow-lg transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Trophy size={16} className="text-[#D4AF37]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold leading-tight">{a.title}</div>
                          {a.awardedBy && <div className="text-[#D4AF37] text-xs mt-0.5">by {a.awardedBy}</div>}
                          {a.description && <p className="text-white/60 text-sm mt-2 leading-relaxed">{a.description}</p>}
                        </div>
                        <span className="text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded-lg shrink-0">{a.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Board of Directors ── */}
            {bod.length > 0 && (
              <Section icon={Crown} title="Board of Directors" subtitle="The leadership team driving our mission forward" count={bod.length}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {bod.map((b) => <BodCard key={b.id} bod={b} />)}
                </div>
              </Section>
            )}

            {/* Footer stamp */}
            <div className="border-t border-gray-200 pt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-[#D4AF37]" />
                Leo Club of KUSMS — Lions Clubs International, District 325L
              </div>
              <div>· Serving with pride since {new Date().getFullYear()}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
