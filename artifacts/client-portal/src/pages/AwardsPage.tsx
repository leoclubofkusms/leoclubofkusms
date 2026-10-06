import { useEffect, useState } from "react";
import { getAwards } from "@/lib/firestore";
import type { Award } from "@/lib/types";
import { Award as AwardIcon, Star, Building, ArrowLeft, Calendar, X } from "lucide-react";
import { Link } from "wouter";
import ShareButton from "@/components/ShareButton";

export default function AwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "member" | "club">("all");
  const [lightbox, setLightbox] = useState<Award | null>(null);

  useEffect(() => {
    getAwards().then(setAwards).catch(console.error).finally(() => setLoading(false));
  }, []);

  const memberAwards = awards.filter((a) => a.type === "member");
  const clubAwards = awards.filter((a) => a.type === "club");
  const displayed = filter === "member" ? memberAwards : filter === "club" ? clubAwards : awards;

  // Group by year
  const byYear: Record<string, Award[]> = {};
  [...displayed].reverse().forEach((a) => {
    if (!byYear[a.year]) byYear[a.year] = [];
    byYear[a.year].push(a);
  });

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center">
              <AwardIcon size={20} className="text-[#002147]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Awards &amp; Recognition</h1>
          </div>
          <p className="text-white/70">Celebrating outstanding members and the club's achievements.</p>
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">{memberAwards.length}</div>
              <div className="text-white/60 text-xs">Member Awards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D4AF37]">{clubAwards.length}</div>
              <div className="text-white/60 text-xs">Club Awards</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-8 shadow-sm w-fit">
          {(["all", "member", "club"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-[#002147] text-white shadow-sm" : "text-gray-500 hover:text-[#002147]"}`}>
              {f === "all" ? <><AwardIcon size={13} /> All</> : f === "member" ? <><Star size={13} /> Member Awards</> : <><Building size={13} /> Club Awards</>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <AwardIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>No awards recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.keys(byYear).sort((a, b) => b.localeCompare(a)).map((year) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-[#002147] text-[#D4AF37] font-bold text-sm px-4 py-1.5 rounded-full">Leo Year {year}</div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">{byYear[year].length} award{byYear[year].length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {byYear[year].map((a) => {
                    const awardUrl = typeof window !== "undefined"
                      ? `${window.location.origin}${import.meta.env.BASE_URL}awards#${a.id}`
                      : "";
                    return (
                      <div key={a.id} id={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${a.featured ? "border-[#D4AF37]/40" : "border-gray-100"}`}>
                        {a.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setLightbox(a)}
                            className="relative w-full h-56 sm:h-60 bg-gray-50 overflow-hidden group cursor-zoom-in"
                            aria-label="View full photo"
                          >
                            <img
                              src={a.photoUrl}
                              alt={a.recipientName}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Tap to enlarge
                            </span>
                          </button>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${a.type === "member" ? "bg-[#D4AF37]/20 text-[#002147]" : "bg-[#002147]/10 text-[#002147]"}`}>
                              {a.type === "member" ? <><Star size={11} /> Member Award</> : <><Building size={11} /> Club Award</>}
                            </span>
                            {a.featured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Featured</span>}
                          </div>
                          <div className="text-[#D4AF37] font-bold text-sm mb-1">{a.title}</div>
                          <div className="font-bold text-[#002147] text-lg">{a.recipientName}</div>
                          {a.awardedBy && <div className="text-xs text-gray-400 mt-0.5">By {a.awardedBy}</div>}
                          {a.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{a.description}</p>}
                          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar size={11} /> {a.month} · Leo Year {a.year}
                            </div>
                            <ShareButton
                              url={awardUrl}
                              title={`${a.title} — ${a.recipientName}`}
                              description={a.description || `${a.type === "member" ? "Member" : "Club"} award by Leo Club of KUSMS`}
                              meta={`${a.month} · Leo Year ${a.year}`}
                              variant="icon"
                              className="!bg-[#002147]/5 !text-[#002147] hover:!bg-[#002147]/15"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && lightbox.photoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.photoUrl}
              alt={lightbox.recipientName}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="text-center text-white px-4">
              <div className="text-[#D4AF37] font-bold text-sm">{lightbox.title}</div>
              <div className="font-bold text-lg mt-1">{lightbox.recipientName}</div>
              <div className="text-white/60 text-xs mt-1">
                {lightbox.month} · Leo Year {lightbox.year}
                {lightbox.awardedBy ? ` · By ${lightbox.awardedBy}` : ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
