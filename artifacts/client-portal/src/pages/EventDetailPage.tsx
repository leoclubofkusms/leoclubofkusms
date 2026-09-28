import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getClubEvents } from "@/lib/firestore";
import type { ClubEvent } from "@/lib/types";
import {
  ArrowLeft, CalendarDays, MapPin, Clock, CheckCircle, XCircle,
  Users, QrCode, Pin, Share2,
} from "lucide-react";
import ShareButton from "@/components/ShareButton";
import ApplicationFormModal from "@/components/ApplicationFormModal";

const STATUS_CONFIG = {
  planned: { label: "Upcoming", color: "bg-blue-100 text-blue-700", icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600", icon: XCircle },
};

function formatEventDate(ev: ClubEvent): string {
  if (ev.endDate && ev.endDate !== ev.date) {
    const start = new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    const end = new Date(ev.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    return `${start} – ${end}`;
  }
  return new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatEventDateShort(ev: ClubEvent): string {
  if (ev.endDate && ev.endDate !== ev.date) {
    const start = new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const end = new Date(ev.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${start} – ${end}`;
  }
  return new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function EventDetailPage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}${import.meta.env.BASE_URL}event/${eventId}`
    : "";

  useEffect(() => {
    setLoading(true);
    getClubEvents()
      .then((events) => {
        const found = events.find((e) => e.id === eventId) ?? null;
        setEvent(found);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl font-bold text-[#002147]/10 mb-4">404</div>
        <h2 className="text-2xl font-bold text-[#002147] mb-2">Event Not Found</h2>
        <p className="text-gray-500 mb-6">This event may have been removed or the link is invalid.</p>
        <Link href="/events" className="inline-flex items-center gap-2 bg-[#002147] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#003575] transition-colors">
          <ArrowLeft size={16} /> View All Events
        </Link>
      </div>
    </div>
  );

  const cfg = STATUS_CONFIG[event.status];
  const StatusIcon = cfg.icon;
  const dateStr = formatEventDate(event);
  const dateShort = formatEventDateShort(event);
  const today = new Date().toISOString().split("T")[0];
  const isPast = (event.endDate || event.date) < today;
  const canApply =
    event.applicationsEnabled &&
    event.status !== "cancelled" &&
    (!event.applicationDeadline || event.applicationDeadline >= today);
  const isMultiDay = event.endDate && event.endDate !== event.date;
  const feeShown = (event.feeLeo || event.feeNonLeo || 0) > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-[#002147] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/events" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> All Events
          </Link>

          <div className="flex items-start gap-4 flex-wrap justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                  <StatusIcon size={11} /> {cfg.label}
                </span>
                {event.eventType && (
                  <span className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full font-medium">
                    {event.eventType}
                  </span>
                )}
                {event.pinned && (
                  <span className="text-xs bg-[#D4AF37] text-[#002147] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Pin size={10} /> Featured
                  </span>
                )}
                {isMultiDay && (
                  <span className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded-full font-medium">
                    Multi-day
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{event.title}</h1>
              {event.description && (
                <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-2xl">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap gap-5 mt-5 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-[#D4AF37]" /> {dateStr}
                </span>
                {event.location && (
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#D4AF37]" /> {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap gap-3 mt-7">
            {canApply && (
              <button
                onClick={() => setApplying(true)}
                className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-3 rounded-xl font-bold hover:bg-[#c9a432] transition-colors shadow-lg"
              >
                <Users size={16} />
                Apply as {event.applicationType || "Applicant"}
              </button>
            )}
            <ShareButton
              url={pageUrl}
              title={event.title}
              description={event.description}
              meta={dateShort + (event.location ? ` · ${event.location}` : "")}
              variant="full"
              label="Share Event"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Photo */}
        {event.photoUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={event.photoUrl} alt={event.title} className="w-full h-auto object-cover max-h-[420px]" />
          </div>
        )}

        {/* Details card */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#002147] mb-4">Event Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CalendarDays size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-[#002147]">{isMultiDay ? "Duration" : "Date"}</div>
                <div className="text-gray-500">{dateStr}</div>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-[#002147]">Location</div>
                  <div className="text-gray-500">{event.location}</div>
                </div>
              </div>
            )}
            {event.applicationDeadline && (
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-[#002147]">Application Deadline</div>
                  <div className="text-gray-500">
                    {new Date(event.applicationDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Application section */}
        {event.applicationsEnabled && (
          <section className="bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-[#002147]">
                {event.applicationType || "Applications"} Open
              </h2>
            </div>
            {event.applicationPrompt && (
              <p className="text-sm text-gray-600 italic mb-4">{event.applicationPrompt}</p>
            )}

            {feeShown && (
              <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 mb-4 space-y-2">
                <div className="text-xs font-bold text-[#002147] uppercase tracking-wider mb-1">
                  Fee
                </div>
                {event.feeLeo !== undefined && event.feeLeo !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Leo Members</span>
                    <span className="font-semibold text-[#002147]">
                      {event.feeLeo === 0 ? "Free" : `NPR ${event.feeLeo}`}
                    </span>
                  </div>
                )}
                {event.feeNonLeo !== undefined && event.feeNonLeo !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Non-Leo Members</span>
                    <span className="font-semibold text-[#002147]">
                      {event.feeNonLeo === 0 ? "Free" : `NPR ${event.feeNonLeo}`}
                    </span>
                  </div>
                )}
                {event.paymentNote && (
                  <p className="text-xs text-gray-400 italic pt-2 border-t border-[#D4AF37]/20">
                    {event.paymentNote}
                  </p>
                )}
              </div>
            )}

            {canApply ? (
              <button
                onClick={() => setApplying(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#002147] hover:bg-[#003575] text-white text-sm font-bold py-3 rounded-xl transition-colors"
              >
                <Users size={15} />
                Apply as {event.applicationType || "Applicant"}
              </button>
            ) : (
              <div className="text-sm text-center text-gray-400 bg-gray-100 rounded-xl py-3">
                {isPast ? "This event has passed." : "Applications closed."}
              </div>
            )}

            {event.paymentQrUrl && canApply && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <QrCode size={11} className="text-[#D4AF37]" /> Payment QR shown after tapping Apply
                </div>
              </div>
            )}
          </section>
        )}

        {/* Share again — bottom */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <h3 className="font-bold text-[#002147] text-lg mb-1 flex items-center gap-2">
                <Share2 size={16} className="text-[#D4AF37]" /> Share this event
              </h3>
              <p className="text-sm text-gray-500">
                Send this event to friends via WhatsApp, Facebook, or copy the link.
              </p>
            </div>
            <ShareButton
              url={pageUrl}
              title={event.title}
              description={event.description}
              meta={dateShort + (event.location ? ` · ${event.location}` : "")}
              variant="full"
              label="Share"
              className="!bg-[#002147] !border-[#002147] hover:!bg-[#003575]"
            />
          </div>
        </section>

        {/* Back link */}
        <div className="pt-4 border-t border-gray-100">
          <Link href="/events" className="inline-flex items-center gap-2 text-[#002147] font-semibold hover:text-[#D4AF37] transition-colors text-sm">
            <ArrowLeft size={14} /> View all events
          </Link>
        </div>
      </div>

      {/* Application modal */}
      {applying && (
        <ApplicationFormModal event={event} onClose={() => setApplying(false)} />
      )}
    </div>
  );
}
