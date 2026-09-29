import { useState, useEffect, useMemo } from "react";
import { getClubEvents, getApplicationsByEvent, deleteEventApplication } from "@/lib/firestore";
import type { ClubEvent, EventApplication } from "@/lib/types";
import {
  Users, Download, Trash2, Phone, Loader2, Inbox, Filter, Clock,
  ShieldCheck, AlertTriangle, User,
} from "lucide-react";

type StatusFilter = "all" | "verified" | "unverified" | "non-leo";

export default function EventApplicationsManager() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
    setStatusFilter("all");
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
      "Membership ID", "Membership Status", "Matched Member Name",
      "Transaction ID", "Fee Paid", "Submitted At",
      ...customLabels,
    ];
    const rows = applications.map((a) => [
      a.name,
      a.facultyBatch,
      a.phone,
      a.memberType,
      a.membershipId ?? "",
      a.membershipStatus ?? "",
      a.matchedMemberName ?? "",
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

  // ── Compute counts per status ──
  const counts = useMemo(() => {
    const c = { all: applications.length, verified: 0, unverified: 0, "non-leo": 0 };
    applications.forEach((a) => {
      if (a.membershipStatus === "verified") c.verified++;
      else if (a.membershipStatus === "unverified") c.unverified++;
      else if (a.membershipStatus === "non-leo") c["non-leo"]++;
    });
    return c;
  }, [applications]);

  // ── Filter applications by selected status ──
  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") return applications;
    return applications.filter((a) => a.membershipStatus === statusFilter);
  }, [applications, statusFilter]);

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

  // ── Status badge helper ──
  const StatusBadge = ({ app }: { app: EventApplication }) => {
    if (app.membershipStatus === "verified") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 border border-green-200">
          <ShieldCheck size={10} /> Verified Leo
        </span>
      );
    }
    if (app.membershipStatus === "unverified") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle size={10} /> Unverified Leo
        </span>
      );
    }
    if (app.membershipStatus === "non-leo") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          <User size={10} /> Non-Leo
        </span>
      );
    }
    // legacy applications before verification was added
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600 border border-blue-200">
        <User size={10} /> {app.memberType === "leo" ? "Leo (not verified)" : "Non-Leo"}
      </span>
    );
  };

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

      {/* Status filter tabs */}
      {applications.length > 0 && (
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
          {([
            { key: "all", label: "All", count: counts.all, color: "bg-[#002147] text-white" },
            { key: "verified", label: "Verified", count: counts.verified, color: "bg-green-600 text-white" },
            { key: "unverified", label: "Unverified", count: counts.unverified, color: "bg-amber-500 text-white" },
            { key: "non-leo", label: "Non-Leo", count: counts["non-leo"], color: "bg-gray-600 text-white" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.key ? tab.color : "text-gray-500 hover:text-[#002147] hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.key ? "bg-white/20" : "bg-gray-100"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
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
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Filter size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">
            No applications match the "{statusFilter}" filter.
          </p>
          <button
            onClick={() => setStatusFilter("all")}
            className="mt-3 text-sm text-[#002147] font-semibold hover:underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const isUnverified = app.membershipStatus === "unverified";
            return (
              <div
                key={app.id}
                className={`bg-white border rounded-2xl p-4 shadow-sm ${
                  isUnverified ? "border-amber-300 border-l-4" : "border-gray-100"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold shrink-0">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#002147]">{app.name}</span>
                      <StatusBadge app={app} />
                    </div>

                    {/* Show matched member info for verified */}
                    {app.membershipStatus === "verified" && app.matchedMemberName && (
                      <div className="text-xs text-green-700 mt-1">
                        Matched to: <strong>{app.matchedMemberName}</strong>
                        {app.matchedMemberId && <span className="font-mono"> ({app.matchedMemberId})</span>}
                      </div>
                    )}

                    {/* Warning for unverified */}
                    {isUnverified && (
                      <div className="text-xs text-amber-800 mt-1 flex items-center gap-1">
                        <AlertTriangle size={11} />
                        Typed ID <span className="font-mono font-bold">"{app.membershipId}"</span> doesn't match any member — please verify before approving.
                      </div>
                    )}

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
            );
          })}
        </div>
      )}
    </div>
  );
}
