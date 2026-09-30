import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { getActivity, getMembers } from "@/lib/firestore";
import type { Activity, Member } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, Calendar, Users, Image as ImageIcon, QrCode,
  Download, Pin, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import ShareButton from "@/components/ShareButton";

function PhotoLightbox({
  photos, initial, onClose,
}: { photos: string[]; initial: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initial);
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}>
        <X size={28} />
      </button>
      <button
        className="absolute left-4 text-white/70 hover:text-white disabled:opacity-20"
        onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
        disabled={idx === 0}
      >
        <ChevronLeft size={36} />
      </button>
      <img
        src={photos[idx]}
        alt={`Photo ${idx + 1}`}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute right-4 text-white/70 hover:text-white disabled:opacity-20"
        onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
        disabled={idx === photos.length - 1}
      >
        <ChevronRight size={36} />
      </button>
      <div className="absolute bottom-4 text-white/50 text-sm">{idx + 1} / {photos.length}</div>
    </div>
  );
}

export default function ActivityPage({ activityId }: { activityId: string }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}${import.meta.env.BASE_URL}activity/${activityId}`
    : "";

  useEffect(() => {
    setLoading(true);
    Promise.all([getActivity(activityId), getMembers()])
      .then(([act, mems]) => { setActivity(act); setMembers(mems); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activityId]);

  function getMemberName(id: string) {
    return members.find((m) => m.memberId === id)?.name ?? id;
  }

  function downloadQR() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-qr-${activityId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!activity) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl font-bold text-[#002147]/10 mb-4">404</div>
        <h2 className="text-2xl font-bold text-[#002147] mb-2">Activity Not Found</h2>
        <p className="text-gray-500 mb-6">This activity may have been removed.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#002147] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#003575] transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );

  const archiveHref = `/archive/${activity.year.replace("/", "-")}/${activity.month.toLowerCase()}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {lightbox !== null && (
        <PhotoLightbox photos={activity.photos} initial={lightbox} onClose={() => setLightbox(null)} />
      )}

      {showQR && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="w-10 h-10 bg-[#002147] rounded-xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="font-bold text-[#002147] text-lg mb-1">Activity QR Code</h3>
            <p className="text-sm text-gray-500 mb-5">Scan to open this activity page. Attach to certificates for volunteers.</p>
            <div ref={qrRef} className="flex justify-center mb-5">
              <div className="p-3 border-2 border-[#002147] rounded-xl">
                <QRCodeSVG value={pageUrl} size={180} fgColor="#002147" />
              </div>
            </div>
            <p className="text-xs text-gray-400 break-all mb-5">{pageUrl}</p>
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 bg-[#002147] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
            >
              <Download size={14} /> Download SVG
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
              <ArrowLeft size={14} /> Home
            </Link>
            <span className="text-white/30">/</span>
            <Link href={archiveHref} className="text-white/60 hover:text-white text-sm transition-colors">
              {activity.month} {activity.year}
            </Link>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Calendar size={11} /> {activity.month} · {activity.year}
                </span>
                {activity.featured && (
                  <span className="bg-[#D4AF37] text-[#002147] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Pin size={10} /> Featured
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{activity.title}</h1>
              <p className="text-white/70 text-lg leading-relaxed max-w-2xl">{activity.description}</p>
              <div className="flex items-center gap-6 mt-5 text-sm text-white/50 flex-wrap">
                <span className="flex items-center gap-1.5"><Users size={14} className="text-[#D4AF37]" /> {activity.participants.length} participant{activity.participants.length !== 1 ? "s" : ""}</span>
                {activity.photos.length > 0 && (
                  <span className="flex items-center gap-1.5"><ImageIcon size={14} className="text-[#D4AF37]" /> {activity.photos.length} photo{activity.photos.length !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <ShareButton
                url={pageUrl}
                title={activity.title}
                description={activity.description}
                meta={`${activity.month} · Leo Year ${activity.year}`}
                variant="full"
                label="Share Activity"
              />
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <QrCode size={16} /> Activity QR
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {activity.photos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#002147] mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-[#D4AF37]" /> Photos
            </h2>
            <div className={`grid gap-3 ${activity.photos.length === 1 ? "grid-cols-1" : activity.photos.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
              {activity.photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-video focus:outline-none"
                >
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          </section>
        )}

        {activity.participants.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#002147] mb-4 flex items-center gap-2">
              <Users size={18} className="text-[#D4AF37]" /> Participants & Awards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activity.participants.map((p) => {
                const member = members.find((m) => m.memberId === p.memberId);
                return (
                  <Link
                    key={p.memberId}
                    href={`/members/${p.memberId}`}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-[#002147]/20 hover:shadow-sm transition-all group"
                  >
                    {member?.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#002147] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {getMemberName(p.memberId).charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-[#002147] text-sm truncate group-hover:text-[#003575]">
                        {getMemberName(p.memberId)}
                      </div>
                      {p.awardTitle && (
                        <div className="text-xs text-[#D4AF37] font-medium truncate">{p.awardTitle}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Share + QR section */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <h3 className="font-bold text-[#002147] text-lg mb-1">Share this activity</h3>
              <p className="text-sm text-gray-500 mb-3">
                Send it to friends, or download the QR code to attach to participation certificates.
              </p>
              <div className="flex flex-wrap gap-2">
                <ShareButton
                  url={pageUrl}
                  title={activity.title}
                  description={activity.description}
                  meta={`${activity.month} · Leo Year ${activity.year}`}
                  variant="full"
                  label="Share Activity"
                  className="!bg-[#002147] !border-[#002147] hover:!bg-[#003575]"
                />
                <button
                  onClick={() => setShowQR(true)}
                  className="inline-flex items-center gap-2 border border-[#002147]/20 hover:bg-[#002147]/5 text-[#002147] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Download size={14} /> Get QR Code
                </button>
              </div>
            </div>
            <div className="shrink-0 p-3 border-2 border-[#002147]/10 rounded-xl">
              <QRCodeSVG value={pageUrl} size={96} fgColor="#002147" />
            </div>
          </div>
        </section>

        <div className="pt-4 border-t border-gray-100">
          <Link href={archiveHref} className="inline-flex items-center gap-2 text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors text-sm">
            <ArrowLeft size={14} /> View all activities in {activity.month} {activity.year}
          </Link>
        </div>
      </div>
    </div>
  );
}
