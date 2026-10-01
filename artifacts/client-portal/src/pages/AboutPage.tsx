import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getBodMembers, getLeaderQuotes, getPastLeaders, getClubSettings } from "@/lib/firestore";
import type { BodMember, LeaderQuote, PastLeader, ClubSettings } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK, CLUB_ID } from "@/lib/types";
import { Mail, Phone, ArrowLeft, Award, Heart, Target, Users, Calendar, Facebook, ExternalLink, Quote, Crown, Play, Pause } from "lucide-react";

export default function AboutPage() {
  const [bod, setBod] = useState<BodMember[]>([]);
  const [quotes, setQuotes] = useState<LeaderQuote[]>([]);
  const [pastLeaders, setPastLeaders] = useState<PastLeader[]>([]);
  const [clubSettings, setClubSettings] = useState<ClubSettings>({});
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPastId, setPlayingPastId] = useState<string | null>(null);
  const [pastAudio, setPastAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    Promise.allSettled([
      getBodMembers(),
      getLeaderQuotes(),
      getPastLeaders(),
      getClubSettings(),
    ]).then(([b, q, p, s]) => {
      if (b.status === "fulfilled") setBod(b.value);
      if (q.status === "fulfilled") setQuotes(q.value);
      if (p.status === "fulfilled") setPastLeaders(p.value);
      if (s.status === "fulfilled") setClubSettings(s.value);
    }).finally(() => setLoading(false));
  }, []);

  const president = bod[0] ?? null;
  const others = bod.slice(1);

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

  function togglePastLeaderAudio(item: PastLeader) {
    if (!item.audioUrl) return;
    if (playingPastId === item.id) {
      pastAudio?.pause();
      setPlayingPastId(null);
      setPastAudio(null);
    } else {
      pastAudio?.pause();
      const a = new Audio(item.audioUrl);
      a.play();
      a.onended = () => { setPlayingPastId(null); setPastAudio(null); };
      setPlayingPastId(item.id);
      setPastAudio(a);
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F8FAFC]">
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
            Leo Club of Kathmandu University School of Medical Sciences (KUSMS) — a community of future healthcare leaders united by the spirit of service.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm">
            <Calendar size={14} className="text-[#D4AF37]" />
            <span className="text-white/80">Officially chartered on</span>
            <span className="font-bold text-white">{CLUB_ESTABLISHED}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
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

        <section>
          <h2 className="text-2xl font-bold text-[#002147] mb-8 text-center">Board of Directors</h2>
          {loading ? (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 animate-pulse h-52" />
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
                  <div className="p-4 sm:p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                    {president.photoUrl ? (
                      <img src={president.photoUrl} alt={president.name}
                        className="w-[min(100%,18rem)] sm:w-48 md:w-64 aspect-[3/4] rounded-2xl object-cover object-top border-2 md:border-4 border-[#D4AF37] shrink-0 shadow-2xl" />
                    ) : (
                      <div className="w-[min(100%,18rem)] sm:w-48 md:w-64 aspect-[3/4] rounded-2xl bg-[#D4AF37] flex items-center justify-center shrink-0 shadow-2xl">
                        <span className="text-6xl md:text-8xl font-bold text-[#002147]">{president.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="text-center md:text-left flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-3">
                        <Award size={12} /> {president.role}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-1">{president.name}</h3>
                      {president.bio && <p className="text-white/70 text-sm md:text-base mb-4">{president.bio}</p>}
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {president.email && (
                          <a href={`mailto:${president.email}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-xs md:text-sm transition-colors">
                            <Mail size={13} className="text-[#D4AF37]" /> {president.email}
                          </a>
                        )}
                        {president.phone && (
                          <a href={`tel:${president.phone}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-xs md:text-sm transition-colors">
                            <Phone size={13} className="text-[#D4AF37]" /> {president.phone}
                          </a>
                        )}
                        {clubSettings.presidentWhatsApp && (
                          <a href={`https://wa.me/${clubSettings.presidentWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(clubSettings.presidentWhatsAppMessage || "Hello President, I would like to connect with Leo Club of KUSMS.")}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl px-3 py-2 text-xs md:text-sm font-semibold transition-colors">
                            WhatsApp President
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {others.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      <div className="w-full aspect-[4/3] bg-gray-50 shrink-0">
                        {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full bg-[#002147] flex items-center justify-center">
                            <span className="text-5xl font-bold text-[#D4AF37]">{m.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="font-bold text-[#002147] text-lg">{m.name}</div>
                        <div className="text-sm text-[#D4AF37] font-semibold mt-0.5">{m.role}</div>
                        {m.bio && <p className="text-sm text-gray-500 mt-3 leading-relaxed">{m.bio}</p>}
                        <div className="flex gap-2 mt-4">
                          {m.email && (
                            <a href={`mailto:${m.email}`} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                              <Mail size={15} />
                            </a>
                          )}
                          {m.phone && (
                            <a href={`tel:${m.phone}`} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors">
                              <Phone size={15} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── WHAT OUR LEADERS SAY — premium cards ── */}
        {(loading || quotes.length > 0) && (
          <section>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full px-4 py-1.5 text-[#8d7014] text-xs font-bold uppercase tracking-[0.16em] mb-4">
                <Quote size={12} /> Leadership Voices
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#002147] tracking-[-0.02em]">What Our Leaders Say</h2>
              <p className="text-gray-500 mt-2 text-sm md:text-base">Voices from our current and past leadership.</p>
            </div>

            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {quotes.map((q) => (
                  <article
                    key={q.id}
                    className="group relative bg-white rounded-3xl border border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,33,71,0.15)] hover:shadow-[0_25px_50px_-20px_rgba(0,33,71,0.25)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Gold accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F0D77A] via-[#D4AF37] to-[#B8912A]" />

                    <div className="flex flex-col sm:flex-row">
                      {/* Photo — LARGE */}
                      <div className="sm:w-40 md:w-48 shrink-0 relative">
                        <div className="aspect-[4/5] sm:aspect-auto sm:h-full bg-gradient-to-br from-[#001a38] to-[#003575]">
                          {q.photoUrl ? (
                            <img
                              src={q.photoUrl}
                              alt={q.name}
                              className="w-full h-full object-cover object-center"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-6xl md:text-7xl font-bold text-[#D4AF37]">
                                {q.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Gold frame line */}
                        <div className="absolute inset-0 border-r-0 sm:border-r-2 border-b-2 sm:border-b-0 border-[#D4AF37]/40 pointer-events-none" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 md:p-7 relative">
                        <Quote
                          size={80}
                          className="absolute top-2 right-2 text-[#D4AF37]/8 rotate-180 pointer-events-none"
                        />

                        <div className="relative">
                          <div className="text-lg md:text-xl font-bold text-[#002147] leading-tight">
                            {q.name}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-2 flex-wrap">
                            <span className="text-xs md:text-sm font-bold text-[#8d7014] uppercase tracking-[0.1em]">
                              {q.role}
                            </span>
                            {q.leoYear && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-[#D4AF37]/60" />
                                <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                                  {q.leoYear}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Bigger quote text */}
                          <blockquote className="mt-5 text-gray-700 text-base md:text-lg leading-relaxed italic relative">
                            <span className="text-[#D4AF37] text-2xl leading-none font-serif mr-1">“</span>
                            {q.quote}
                            <span className="text-[#D4AF37] text-2xl leading-none font-serif ml-1">”</span>
                          </blockquote>

                          {q.introduction && (
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed mt-4 pt-4 border-t border-gray-100">
                              {q.introduction}
                            </p>
                          )}

                          {q.audioUrl && (
                            <button
                              onClick={() => toggleAudio(q)}
                              className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                                playingId === q.id
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                                  : "bg-[#002147] text-white hover:bg-[#003575] shadow-sm"
                              }`}
                            >
                              {playingId === q.id ? (
                                <><Pause size={14} /> Stop audio</>
                              ) : (
                                <><Play size={14} /> Listen to {q.name.split(" ")[0]}</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {(loading || sortedPast.length > 0) && (
          <section>
            <h2 className="text-2xl font-bold text-[#002147] mb-2 text-center">Past Leaders</h2>
            <p className="text-gray-500 text-center text-sm mb-8">Honoring those who led our journey from chartered year to present.</p>
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {sortedPast.map((leader) => (
                  <div key={leader.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="w-full aspect-[4/3] bg-gray-50 shrink-0">
                      {leader.photoUrl ? (
                        <img src={leader.photoUrl} alt={leader.name} className="w-full h-full object-cover object-center" />
                      ) : (
                        <div className="w-full h-full bg-[#D4AF37]/15 flex items-center justify-center">
                          <Crown size={40} className="text-[#D4AF37]" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="font-bold text-[#002147] text-lg">{leader.name}</div>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className="text-sm text-[#D4AF37] font-semibold">{leader.role}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{leader.leoYear}</span>
                      </div>
                      {leader.note && <p className="text-sm text-gray-500 italic mt-3 leading-relaxed">{leader.note}</p>}
                      {leader.quote && <p className="text-gray-600 text-sm leading-relaxed italic mt-3">"{leader.quote}"</p>}
                      {leader.audioUrl && (
                        <button onClick={() => togglePastLeaderAudio(leader)}
                          className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${playingPastId === leader.id ? "bg-green-100 text-green-700 border border-green-200" : "bg-[#002147]/8 text-[#002147] border border-[#002147]/10 hover:bg-[#002147]/15"}`}>
                          {playingPastId === leader.id ? <><Pause size={12} /> Stop audio</> : <><Play size={12} /> Listen to voice</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Official Charter ── */}
        <section>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-[#002147]">Official Charter</h2>
            <p className="text-gray-500 text-sm mt-1">Officially established by Lions Clubs International District 325L · Club #{CLUB_ID}</p>
          </div>
          <div className="bg-gradient-to-br from-[#002147] to-[#003575] rounded-3xl overflow-hidden shadow-xl text-white">
            <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] rounded-full px-3 py-1 text-xs font-bold mb-4">
                  <Award size={12} /> Officially Chartered
                </div>
                <h3 className="text-2xl font-bold mb-2">Leo Club of KUSMS</h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  Chartered by Lions Clubs International under District 325L · Club #172194.<br />
                  Handover ceremony held on <span className="text-[#D4AF37] font-semibold">{CLUB_ESTABLISHED}</span>.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <Calendar size={14} className="text-[#D4AF37]" /> <span>Established {CLUB_ESTABLISHED}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <Award size={14} className="text-[#D4AF37]" /> <span>District 325L · Club #{CLUB_ID}</span>
                  </div>
                </div>
              </div>
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

        <section>
          <h2 className="text-2xl font-bold text-[#002147] mb-6 text-center">Follow Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#1877F2]/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Facebook size={22} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-[#002147]">Facebook</div>
                <div className="text-xs text-gray-400">Official Page</div>
              </div>
              <ExternalLink size={14} className="text-gray-400 ml-auto" />
            </a>
            <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all group">
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

        <section className="bg-[#002147] text-white rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Get In Touch</h2>
          <p className="text-white/60 mb-6">Have a question or want to collaborate on a service project?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:leoclubofkusms@gmail.com" className="flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#c9a432] transition-colors">
              <Mail size={16} /> leoclubofkusms@gmail.com
            </a>
            <Link href="/members" className="flex items-center gap-2 border border-white/30 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors">
              <Users size={16} /> Browse Members
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
