import { useState, useEffect } from "react";
import { getClubEvents, getApplicationsByEvent, deleteEventApplication } from "@/lib/firestore";
import type { ClubEvent, EventApplication } from "@/lib/types";
import {
  Users, Download, Trash2, Phone, Loader2, Inbox, Filter, Clock,
} from "lucide-react";

export default function EventApplicationsManager() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    getClubEvents()
      .catch(() => [] as ClubEvent[])
      .then((evs) => {
        const withApps = evs.filter((e) => e.applicationsEnabled);
        setEvents(withApps);
        if (withApps.length > 0) setSelectedEventId(withApps[0].id);
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setApplications([]);
      return;
    }
    setLoadingApps(true);
    getApplicationsByEvent(selectedEventId)
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoadingApps(false));
  }, [selectedEventId]);

  async function handleDelete(id: string) {
    try {
      await deleteEventApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
    }
  }

  function collectCustomQuestionLabels(): string[] {
    const labels = new Set<string>();
    applications.forEach((a) => a.customAnswers?.forEach((c) => labels.add(c.question)));
    return Array.from(labels);
  }

  function exportCSV() {
    if (applications.length === 0) return;
    const event = events.find((e) => e.id === selectedEventId);
    const customLabels = collectCustomQuestionLabels();
    const headers = [
      "Name", "Faculty/Batch", "Phone", "Member Type",
      "Membership ID", "Transaction ID", "Fee Paid", "Submitted At",
      ...customLabels,
    ];
    const rows = applications.map((a) => [
      a.name,
      a.facultyBatch,
      a.phone,
      a.memberType,
      a.membershipId ?? "",
      a.transactionId ?? "",
      a.feeAmount != null ? String(a.feeAmount) : "",
      new Date(a.submittedAt).toLocaleString("en-GB"),
      ...customLabels.map((label) => {
        const match = a.customAnswers?.find((c) => c.question === label);
        return match?.answer ?? "";
      }),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(event?.title ?? "applications").replace(/[^\w]/g, "-")}-applications.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loadingEvents) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Event Applications</h3>
          <p className="text-sm text-gray-500">
            View volunteer, participant, and sponsor applications per event.
          </p>
        </div>
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Inbox size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">No events have applications enabled yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Enable applications in the Events tab to see submissions here.
          </p>
        </div>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-[#002147]">Event Applications</h3>
        <p className="text-sm text-gray-500">
          View volunteer, participant, and sponsor applications per event.
        </p>
      </div>

      {/* Event selector + Export */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <Filter size={15} className="text-[#D4AF37]" />
        <label className="text-sm font-medium text-gray-600">Event:</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-[#002147] bg-white focus:outline-none focus:border-[#002147]"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.applicationType || "Applications"})
            </option>
          ))}
        </select>
        {applications.length > 0 && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 border border-[#002147]/20 text-[#002147] hover:bg-[#002147] hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {/* Event summary */}
      {selectedEvent && (
        <div className="bg-[#002147]/5 border border-[#002147]/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-[#002147]" />
            <span className="text-sm font-bold text-[#002147]">
              {selectedEvent.applicationType || "Applications"}
            </span>
            <span className="text-xs bg-[#D4AF37] text-[#002147] font-bold px-2 py-0.5 rounded-full ml-auto">
              {applications.length} total
            </span>
          </div>
          {selectedEvent.applicationPrompt && (
            <p className="text-xs text-gray-600 italic mb-1">{selectedEvent.applicationPrompt}</p>
          )}
          {selectedEvent.applicationDeadline && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={10} /> Deadline: {selectedEvent.applicationDeadline}
            </p>
          )}
        </div>
      )}

      {/* Applications list */}
      {loadingApps ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Inbox size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">No applications yet for this event.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold shrink-0">
                  {app.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#002147]">{app.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      app.memberType === "leo"
                        ? "bg-[#D4AF37]/20 text-[#002147]"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {app.memberType === "leo" ? "Leo Member" : "Non-Leo"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span>{app.facultyBatch}</span>
                    <span className="flex items-center gap-1">
                      <Phone size={10} /> {app.phone}
                    </span>
                    {app.membershipId && (
                      <span className="font-mono text-[#002147]">
                        ID: {app.membershipId}
                      </span>
                    )}
                  </div>
                  {(app.transactionId || app.feeAmount != null) && (
                    <div className="mt-2 flex items-center gap-3 text-xs flex-wrap">
                      {app.feeAmount != null && (
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          NPR {app.feeAmount}
                        </span>
                      )}
                      {app.transactionId && (
                        <span className="text-gray-500">
                          Txn: <span className="font-mono font-semibold">{app.transactionId}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {app.customAnswers && app.customAnswers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {app.customAnswers.map((c, i) => (
                        <div key={i} className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-700">{c.question}:</span>{" "}
                          {c.answer || <em className="text-gray-400">—</em>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(app.submittedAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="shrink-0">
                  {deleteConfirm === app.id ? (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-medium"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(app.id)}
                      title="Delete application"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}