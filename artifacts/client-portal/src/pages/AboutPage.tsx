import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getBodMembers } from "@/lib/firestore";
import type { BodMember } from "@/lib/types";
import { Mail, Phone, ArrowLeft, Award, Heart, Target, Users } from "lucide-react";

export default function AboutPage() {
  const [bod, setBod] = useState<BodMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBodMembers().then(setBod).catch(console.error).finally(() => setLoading(false));
  }, []);

  const president = bod[0] ?? null;
  const others = bod.slice(1);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 text-[#D4AF37] text-sm font-medium mb-4">
            <Award size={14} /> Lions Clubs International — District 325 B1
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">About Our Club</h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Leo Club of Kathmandu University School of Medical Sciences (KUSMS) — 
            a community of future healthcare leaders united by the spirit of service.
          </p>
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

        {/* President */}
        <section>
          <h2 className="text-2xl font-bold text-[#002147] mb-8 text-center">Board of Directors</h2>
          {loading ? (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 animate-pulse h-52" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-36" />)}
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
