import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getBodMembers, getLeaderQuotes, getPastLeaders, getClubSettings } from "@/lib/firestore";
import type { BodMember, LeaderQuote, PastLeader, ClubSettings } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK } from "@/lib/types";
import { Mail, Phone, ArrowLeft, Award, Heart, Target, Users, Calendar, Facebook, ExternalLink, Quote, Crown, Play, Pause } from "lucide-react";

export default function AboutPage() {
  const [bod, setBod] = useState<BodMember[]>([]);
  const [quotes, setQuotes] = useState<LeaderQuote[]>([]);
  const [pastLeaders, setPastLeaders] = useState<PastLeader[]>([]);
  const [clubSettings, setClubSettings] = useState<ClubSettings>({});
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    Promise.allSettled([
      getBodMembers(),
      getLeaderQuotes(),
      getPastLeaders(),
      getClubSettings(),
    ]).then(([b, q, p, s]) => {
      // Keep each public section independent: a missing/locked new collection
      // must not hide existing BOD information.
      if (b.status === "fulfilled") setBod(b.value);
      if (q.status === "fulfilled") setQuotes(q.value);
      if (p.status === "fulfilled") setPastLeaders(p.value);
      if (s.status === "fulfilled") setClubSettings(s.value);
    }).finally(() => setLoading(false));
  }, []);

  const president = bod[0] ?? null;
  const others = bod.slice(1);

  // Sort past leaders by Leo Year
  const sortedPast = [...pastLeaders].sort((a, b) => {
    const ay = a.leoYear ?? ""; const by = b.leoYear ?? "";
    return ay.localeCompare(by) || (a.order - b.order);
  });

  function toggleAudio(item: LeaderQuote) {
    if (!item.audioUrl) return;
    if (playingId === item.id) {
      audio?.pause();
      setPlayingId(null);
      setAudio(null);
    } else {
      audio?.pause();
      const a = new Audio(item.audioUrl);
      a.play();
      a.onended = () => { setPlayingId(null); setAudio(null); };
      setPlayingId(item.id);
      setAudio(a);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-4">
            <Award size={14} /> Lions Clubs International — District 325L · Club #172194
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">About Our Club</h1>
          <p className="text-white/70 text-lg max-w-2xl mb-6">
            Leo Club of Kathmandu University School of Medical Sciences (KUSMS) —
            a community of future healthcare leaders united by the spirit of service.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm">
            <Calendar size={14} className="text-[#D4AF37]" />
            <span className="text-white/80">Officially chartered on</span>
            <span className="font-bold text-white">{CLUB_ESTABLISHED}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Mission & Values */}
        <section>
          <h2 className="text-2xl font-bold text-[#002147] mb-8 text-center">Our Mission & Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Service", desc: "We believe in putting community first — volunteering, health camps, blood drives, and outreach that makes a real difference." },
              { icon: Target, title: "Leadership", desc: "We develop tomorrow's leaders through real responsibility, decision-making, and hands-on management of meaningful projects." },
              { icon: Users, title: "Fellowship", desc: "We build lifelong bonds between medical students across batches, united by shared values and a passion for service." },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-[#002147] flex items-center justify-center mx-auto mb-4">
                  <v.icon size={24} className="text-[#D4AF37]" />
                </div>
                <h3 className="font-bold text-[#002147] text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Board of Directors */}
        <section>
          <h2 className="text-2xl font-bold text-[#002147] mb-8 text-center">Board of Directors</h2>
          {loading ? (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 animate-pulse h-52" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-36" />)}
              </div>
            </div>
          ) : bod.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>BOD information coming soon.</p>
            </div>
          ) : (
            <>
              {president && (
                <div className="bg-gradient-to-r from-[#002147] to-[#003575] text-white rounded-3xl overflow-hidden shadow-xl mb-6">
                  <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                    {president.photoUrl ? (
                      <img src={president.photoUrl} alt={president.name}
                        className="w-32 h-32 rounded-2xl object-cover border-4 border-[#D4AF37] shrink-0" />
                    ) : (
                      <div className="w-32 h-32 rounded-2xl bg-[#D4AF37] flex items-center justify-center shrink-0">
                        <span className="text-4xl font-bold text-[#002147]">{president.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="text-center md:text-left flex-1">
                      <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-3">
                        <Award size={12} /> {president.role}
                      </div>
                      <h3 className="text-3xl font-bold mb-1">{president.name}</h3>
                      {president.bio && <p className="text-white/70 mb-4">{president.bio}</p>}
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        {president.email && (
                          <a href={`mailto:${president.email}`}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors">
                            <Mail size={14} className="text-[#D4AF37]" /> {president.email}
                          </a>
                        )}
                        {president.phone && (
                          <a href={`tel:${president.phone}`}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors">
                            <Phone size={14} className="text-[#D4AF37]" /> {president.phone}
                          </a>
                        )}
                        {clubSettings.presidentWhatsApp && (
                          <a
                            href={`https://wa.me/${clubSettings.presidentWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(clubSettings.presidentWhatsAppMessage || "Hello President, I would like to connect with Leo Club of KUSMS.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                          >
                            WhatsApp President
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {others.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {others.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow text-center">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="w-16 h-16 rounded-xl object-cover border-2 border-[#D4AF37]/30 mx-auto mb-3" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div className="font-bold text-[#002147]">{m.name}</div>
                      <div className="text-xs text-[#D4AF37] font-semibold mt-0.5 mb-2">{m.role}</div>
                      {m.bio && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{m.bio}</p>}
                      <div className="flex justify-center gap-2">
                        {m.email && (
                          <a href={`mailto:${m.email}`} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                            <Mail size={14} />
                          </a>
                        )}
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* What Our Leaders Say */}
        {(loading || quotes.length > 0) && (
          <section>
            <h2 className="text-2xl font-bold text-[#002147] mb-2 text-center">What Our Leaders Say</h2>
            <p className="text-gray-500 text-center text-sm mb-8">Voices from our current and past leadership.</p>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {quotes.map((q) => (
                  <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                    {/* decorative quote mark */}
                    <Quote size={64} className="absolute -top-2 -right-2 text-[#D4AF37]/10 rotate-180" />
                    <div className="flex items-start gap-4">
                      {q.photoUrl ? (
                        <img src={q.photoUrl} alt={q.name} className="w-14 h-14 rounded-xl object-cover border-2 border-[#D4AF37]/30 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-xl shrink-0">
                          {q.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#002147]">{q.name}</div>
                        <div className="text-xs text-[#D4AF37] font-semibold mb-3">
                          {q.role}{q.leoYear ? ` · ${q.leoYear}` : ""}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed italic">"{q.quote}"</p>
                        {q.introduction && <p className="text-gray-400 text-xs leading-relaxed mt-2">{q.introduction}</p>}
                        {q.audioUrl && (
                          <button
                            onClick={() => toggleAudio(q)}
                            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              playingId === q.id
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-[#002147]/8 text-[#002147] border border-[#002147]/10 hover:bg-[#002147]/15"
                            }`}
                          >
                            {playingId === q.id ? <><Pause size={12} /> Stop audio</> : <><Play size={12} /> Listen</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Past Leaders */}
        {(loading || sortedPast.length > 0) && (
          <section>
            <h2 className="text-2xl font-bold text-[#002147] mb-2 text-center">Past Leaders</h2>
            <p className="text-gray-500 text-center text-sm mb-8">Honoring those who led our journey from chartered year to present.</p>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-14 animate-pulse" />)}</div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[2.35rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/40 to-transparent hidden sm:block" />
                <div className="space-y-3">
                  {sortedPast.map((leader, idx) => (
                    <div key={leader.id} className="flex items-center gap-4 relative">
                      {/* Timeline dot */}
                      <div className="hidden sm:flex w-[4.7rem] shrink-0 items-center justify-center">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 ${idx === sortedPast.length - 1 ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-white border-[#D4AF37]"}`} />
                      </div>
                      <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                        {leader.photoUrl ? (
                          <img src={leader.photoUrl} alt={leader.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center shrink-0">
                            <Crown size={16} className="text-[#D4AF37]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[#002147]">{leader.name}</span>
                          <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            <span className="text-xs text-[#D4AF37] font-medium">{leader.role}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{leader.leoYear}</span>
                            {leader.note && <span className="text-xs text-gray-400 italic">{leader.note}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Social Media */}
        <section>
          <h2 className="text-2xl font-bold text-[#002147] mb-6 text-center">Follow Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#1877F2]/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Facebook size={22} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-[#002147]">Facebook</div>
                <div className="text-xs text-gray-400">Official Page</div>
              </div>
              <ExternalLink size={14} className="text-gray-400 ml-auto" />
            </a>
            <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-lg">TT</span>
              </div>
              <div>
                <div className="font-bold text-[#002147]">TikTok</div>
                <div className="text-xs text-gray-400">@leoclub.kusms</div>
              </div>
              <ExternalLink size={14} className="text-gray-400 ml-auto" />
            </a>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-[#002147] text-white rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Get In Touch</h2>
          <p className="text-white/60 mb-6">Have a question or want to collaborate on a service project?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:leoclubofkusms@gmail.com"
              className="flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#c9a432] transition-colors">
              <Mail size={16} /> leoclubofkusms@gmail.com
            </a>
            <Link href="/members"
              className="flex items-center gap-2 border border-white/30 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors">
              <Users size={16} /> Browse Members
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
