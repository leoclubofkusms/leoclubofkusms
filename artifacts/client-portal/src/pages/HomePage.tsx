import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { getMembers, getActivities, getBodMembers, getFeaturedActivities, getClubSettings } from "@/lib/firestore";
import type { Member, Activity, BodMember, ClubSettings } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK } from "@/lib/types";
import {
  ArrowRight, Award, Users, Calendar, Shield, Mail, Phone,
  ChevronLeft, ChevronRight, Pin, Info, Facebook, ExternalLink,
} from "lucide-react";

// ── Animated Featured Activities Carousel ─────────────────────────────────────
function FeaturedCarousel({ activities }: { activities: Activity[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current) return;
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setFading(false);
      }, 300);
    },
    [current]
  );

  const prev = () => goTo((current - 1 + activities.length) % activities.length);
  const next = useCallback(() => goTo((current + 1) % activities.length), [current, goTo, activities.length]);

  useEffect(() => {
    if (activities.length <= 1) return;
    const timer = setInterval(() => next(), 4500);
    return () => clearInterval(timer);
  }, [next, activities.length]);

  if (!activities.length) return null;
  const act = activities[current];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002147] to-[#003575] text-white shadow-2xl">
      {/* Background photo */}
      {act.photos[0] && (
        <div className="absolute inset-0">
          <img
            src={act.photos[0]}
            alt={act.title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002147]/95 via-[#002147]/80 to-transparent" />
        </div>
      )}

      <div className="relative px-8 py-10 md:px-12 md:py-14">
        <div
          className="transition-all duration-300"
          style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(8px)" : "translateY(0)" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-5">
            <Pin size={11} /> Featured Activity · {act.month} {act.year}
          </div>

          {/* Content */}
          <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight max-w-xl">
            {act.title}
          </h3>
          <p className="text-white/70 text-base leading-relaxed max-w-lg mb-6 line-clamp-3">
            {act.description}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-8">
            {act.participants.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Users size={15} className="text-[#D4AF37]" />
                {act.participants.length} participants
              </div>
            )}
            {act.photos.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar size={15} className="text-[#D4AF37]" />
                {act.photos.length} photos
              </div>
            )}
          </div>

          {/* Photo strip if multiple */}
          {act.photos.length > 1 && (
            <div className="flex gap-2 mb-8">
              {act.photos.slice(0, 4).map((p, i) => (
                <img key={i} src={p} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white/20" />
              ))}
            </div>
          )}

          <Link
            href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#c9a432] transition-colors"
          >
            View Full Activity <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Controls */}
      {activities.length > 1 && (
        <>
          {/* Arrow buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 right-8 flex gap-2">
            {activities.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "w-6 h-2 bg-[#D4AF37]" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── President Card ────────────────────────────────────────────────────────────
function PresidentCard({ president }: { president: BodMember }) {
  return (
    <div className="bg-gradient-to-br from-[#002147] to-[#003575] text-white rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
        {/* Photo */}
        <div className="shrink-0">
          {president.photoUrl ? (
            <img
              src={president.photoUrl}
              alt={president.name}
              className="w-36 h-36 rounded-2xl object-cover border-4 border-[#D4AF37] shadow-lg"
            />
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-[#D4AF37] flex items-center justify-center shadow-lg">
              <span className="text-5xl font-bold text-[#002147]">{president.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-3">
            <Award size={12} /> {president.role}
          </div>
          <h3 className="text-3xl font-bold mb-1">{president.name}</h3>
          {president.bio && (
            <p className="text-white/70 text-base mb-4">{president.bio}</p>
          )}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {president.email && (
              <a
                href={`mailto:${president.email}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors"
              >
                <Mail size={14} className="text-[#D4AF37]" />
                <span>{president.email}</span>
              </a>
            )}
            {president.phone && (
              <a
                href={`tel:${president.phone}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors"
              >
                <Phone size={14} className="text-[#D4AF37]" />
                <span>{president.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [featuredActivities, setFeaturedActivities] = useState<Activity[]>([]);
  const [bod, setBod] = useState<BodMember[]>([]);
  const [clubSettings, setClubSettings] = useState<ClubSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMembers().catch(() => [] as Member[]),
      getActivities().catch(() => [] as Activity[]),
      getFeaturedActivities().catch(() => [] as Activity[]),
      getBodMembers().catch(() => [] as BodMember[]),
      getClubSettings().catch(() => ({} as ClubSettings)),
    ]).then(([m, a, f, b, s]) => {
      setMembers(m);
      setActivities(a);
      setFeaturedActivities(f);
      setBod(b);
      setClubSettings(s);
    }).finally(() => setLoading(false));
  }, []);

  const president = bod[0] ?? null;
  const otherBod = bod.slice(1);
  const latest = [...activities].reverse().slice(0, 6);

  const stats = [
    { label: "Active Members", value: loading ? "—" : members.length, icon: Users },
    { label: "Activities Completed", value: loading ? "—" : activities.length, icon: Calendar },
    { label: "Service Awards Given", value: loading ? "—" : activities.reduce((s, a) => s + a.participants.length, 0), icon: Award },
    { label: "Years of Service", value: "3+", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div
        className="relative bg-[#002147] text-white overflow-hidden"
        style={{ minHeight: "520px" }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-6">
              <Award size={14} /> Lions Clubs International — District 325L
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2">
              Leo Club of Kathmandu University
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
              School of Medical Sciences (KUSMS)
            </h2>
            <p className="text-xl md:text-2xl text-white/80 font-light mb-2">
              Leadership Through Service
            </p>
            <p className="text-white/60 text-base mb-10 leading-relaxed max-w-xl">
              A community of future medical professionals committed to service,
              leadership, and making a meaningful impact in our community.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-semibold hover:bg-[#c9a432] transition-colors"
              >
                About Us <ArrowRight size={18} />
              </Link>
              <Link
                href="/members"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                <Users size={18} /> Our Members
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#002147]/5 flex items-center justify-center mx-auto mb-2">
                    <Icon size={20} className="text-[#002147]" />
                  </div>
                  <div className="text-3xl font-bold text-[#002147]">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── President & BOD ─────────────────────────────────────────────────── */}
        {(president || bod.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Our Leadership</h2>
                <p className="text-gray-500 text-sm mt-1">The team guiding our club this year</p>
              </div>
              <Link href="/about" className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                Full About Page <ArrowRight size={14} />
              </Link>
            </div>

            {/* President */}
            {president && (
              <div className="mb-6">
                <PresidentCard president={president} />
              </div>
            )}

            {/* Other BOD */}
            {otherBod.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {otherBod.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-[#D4AF37]/30 mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3">
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <div className="font-bold text-[#002147] text-sm leading-tight">{m.name}</div>
                    <div className="text-xs text-[#D4AF37] font-semibold mt-0.5">{m.role}</div>
                    {m.bio && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{m.bio}</p>}
                    <div className="flex justify-center gap-2 mt-3">
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="p-1.5 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                          <Mail size={13} />
                        </a>
                      )}
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="p-1.5 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                          <Phone size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && bod.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">BOD members will appear here once added from the admin dashboard.</p>
              </div>
            )}
          </section>
        )}

        {/* ── Featured Activities Carousel ─────────────────────────────────────── */}
        {featuredActivities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#002147]">Featured Activities</h2>
                <p className="text-gray-500 text-sm mt-1">Highlights from our recent service work</p>
              </div>
              <Link href={`/archive/2026-27/january`} className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                Full Archive <ArrowRight size={14} />
              </Link>
            </div>
            <FeaturedCarousel activities={featuredActivities} />
          </section>
        )}

        {/* ── Latest Activities Grid ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#002147]">Latest Activities</h2>
              <p className="text-gray-500 text-sm mt-1">Our most recent service work</p>
            </div>
            <Link
              href="/archive/2026-27/january"
              className="text-sm text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors flex items-center gap-1"
            >
              View Archive <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-36 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : latest.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p>No activities yet. Admin can add the first one from the dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {latest.map((act) => (
                <Link
                  key={act.id}
                  href={`/archive/${act.year.replace("/", "-")}/${act.month.toLowerCase()}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden block"
                >
                  {act.photos[0] ? (
                    <img
                      src={act.photos[0]}
                      alt={act.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-[#002147] to-[#003575] flex items-center justify-center">
                      <Calendar size={36} className="text-[#D4AF37]/60" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full">
                        {act.month} · {act.year}
                      </span>
                      {act.featured && <Pin size={11} className="text-[#D4AF37]" />}
                    </div>
                    <h3 className="font-bold text-[#002147] group-hover:text-[#003575] transition-colors line-clamp-2">
                      {act.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{act.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                      <Users size={11} /> {act.participants.length} participants
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Chartered Certificate ────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#002147]">Official Charter</h2>
            <p className="text-gray-500 text-sm mt-1">Officially established by Lions Clubs International District 325L</p>
          </div>
          <div className="bg-gradient-to-br from-[#002147] to-[#003575] rounded-3xl overflow-hidden shadow-xl text-white">
            <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
              {/* Left: info */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-4">
                  <Award size={12} /> Officially Chartered
                </div>
                <h3 className="text-2xl font-bold mb-2">Leo Club of KUSMS</h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  Chartered by Lions Clubs International under District 325L.<br />
                  Handover ceremony held on <span className="text-[#D4AF37] font-semibold">{CLUB_ESTABLISHED}</span>.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <Calendar size={14} className="text-[#D4AF37]" />
                    <span>Established {CLUB_ESTABLISHED}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <Award size={14} className="text-[#D4AF37]" />
                    <span>District 325L</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-5 justify-center md:justify-start">
                  <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565c0] rounded-xl px-4 py-2 text-sm font-medium transition-colors">
                    <Facebook size={14} /> Facebook
                  </a>
                  <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/50 hover:bg-black/70 border border-white/20 rounded-xl px-4 py-2 text-sm font-medium transition-colors">
                    <ExternalLink size={14} /> TikTok
                  </a>
                </div>
              </div>
              {/* Right: certificate or placeholder */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                {clubSettings.charteredCertificateUrl ? (
                  <div className="bg-white rounded-2xl p-2 shadow-lg">
                    {clubSettings.charteredCertificateType === "pdf" ? (
                      <a href={clubSettings.charteredCertificateUrl} target="_blank" rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 text-[#002147] p-6 hover:text-[#D4AF37] transition-colors">
                        <Award size={40} />
                        <span className="text-sm font-semibold">View Certificate (PDF)</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <img src={clubSettings.charteredCertificateUrl} alt="Chartered Certificate"
                        className="max-w-[220px] max-h-[280px] rounded-xl object-contain" />
                    )}
                  </div>
                ) : (
                  <div className="bg-white/10 border-2 border-dashed border-white/30 rounded-2xl p-8 flex flex-col items-center gap-3 text-white/50 text-center min-w-[180px]">
                    <Award size={36} className="text-[#D4AF37]/50" />
                    <p className="text-xs leading-relaxed">Chartered certificate will appear here.<br />Upload from Admin → Club Settings.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-[#002147] to-[#003575] text-white rounded-3xl p-10 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] flex items-center justify-center mx-auto mb-5">
            <Shield size={26} className="text-[#002147]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify a Member</h2>
          <p className="text-white/60 mb-6">Scan a QR code or enter a Member ID to verify credentials</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/members" className="flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-6 py-3 rounded-xl font-semibold hover:bg-[#c9a432] transition-colors">
              <Users size={18} /> Member Directory
            </Link>
            <Link href="/about" className="flex items-center gap-2 border border-white/30 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              <Info size={18} /> About Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
