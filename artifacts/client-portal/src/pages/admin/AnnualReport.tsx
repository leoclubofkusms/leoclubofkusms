import { useState, useRef } from "react";
import { getMembers, getActivities, getAwards } from "@/lib/firestore";
import type { Member, Activity, Award } from "@/lib/types";
import { LEO_YEARS, MONTHS, activitySortKey } from "@/lib/types";
import { FileText, Download, Loader2, ChevronDown } from "lucide-react";

export default function AnnualReport() {
  const [year, setYear] = useState(LEO_YEARS[2]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{
    members: Member[]; activities: Activity[]; awards: Award[];
  } | null>(null);
  const [previewYear, setPreviewYear] = useState("");

  async function loadPreview() {
    setGenerating(true); setError("");
    try {
      const [members, allActivities, awards] = await Promise.all([
        getMembers(), getActivities(), getAwards(),
      ]);
      const activities = allActivities
        .filter((a) => a.year === year)
        .sort((a, b) => activitySortKey(a.year, a.month) - activitySortKey(b.year, b.month));
      setPreview({ members, activities, awards: awards.filter((a) => a.year === year) });
      setPreviewYear(year);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally { setGenerating(false); }
  }

  async function downloadPDF() {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas").catch(() => ({ default: null })) as { default: ((el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>) | null };
      if (!html2canvas) { window.print(); return; }
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = (canvas.height / canvas.width) * pw;
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 0;
      while (y < ph) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -y, pw, ph);
        y += pageH;
      }
      pdf.save(`Leo-Club-KUSMS-Annual-Report-${previewYear.replace("/", "-")}.pdf`);
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  }

  const topContributors = (members: Member[], activities: Activity[]) => {
    const yearActs = activities.filter((a) => a.year === previewYear);
    const counts: Record<string, number> = {};
    yearActs.forEach((a) => a.participants.forEach((p) => {
      counts[p.memberId] = (counts[p.memberId] ?? 0) + 1;
    }));
    return members
      .filter((m) => counts[m.memberId])
      .sort((a, b) => (counts[b.memberId] ?? 0) - (counts[a.memberId] ?? 0))
      .slice(0, 10)
      .map((m) => ({ member: m, count: counts[m.memberId] ?? 0 }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#002147]">Annual Report Generator</h3>
        <p className="text-sm text-gray-500">Generate a downloadable PDF report for any Leo Year.</p>
      </div>

      <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Select Leo Year</label>
          <div className="relative">
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-9 focus:outline-none focus:border-[#002147]">
              {LEO_YEARS.map((y) => <option key={y} value={y}>Leo Year {y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button onClick={loadPreview} disabled={generating}
          className="flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] disabled:opacity-60 transition-colors">
          {generating ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : <><FileText size={14} /> Generate Preview</>}
        </button>
        {preview && (
          <button onClick={downloadPDF} disabled={generating}
            className="flex items-center gap-2 bg-[#D4AF37] text-[#002147] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#c9a432] disabled:opacity-60 transition-colors">
            {generating ? <><Loader2 size={14} className="animate-spin" /> Generating PDF…</> : <><Download size={14} /> Download PDF</>}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Report Preview */}
      {preview && (
        <div ref={reportRef} style={{ background: "#fff", fontFamily: "'Inter', sans-serif", padding: 32 }}>
          {/* Header */}
          <div style={{ background: "#002147", color: "#fff", borderRadius: 12, padding: "24px 32px", marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(212,175,55,0.8)", textTransform: "uppercase", marginBottom: 6 }}>
              Lions Clubs International — District 325L
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              Leo Club of KUSMS
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
              Annual Report · Leo Year {previewYear}
            </div>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { label: "Total Members", value: preview.members.length },
                { label: "Active Members", value: preview.members.filter((m) => m.isActive !== false).length },
                { label: "Activities", value: preview.activities.length },
                { label: "Participants", value: preview.activities.reduce((s, a) => s + a.participants.length, 0) },
                { label: "Awards", value: preview.awards.length },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#D4AF37" }}>{value}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities by month */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#002147", borderBottom: "2px solid #D4AF37", paddingBottom: 6, marginBottom: 14 }}>
              Activities — Leo Year {previewYear}
            </div>
            {MONTHS.filter((m) => preview.activities.some((a) => a.month === m)).map((month) => (
              <div key={month} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#D4AF37", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{month}</div>
                {preview.activities.filter((a) => a.month === month).map((a) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#002147" }}>{a.title}</div>
                      {a.description && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{a.description}</div>}
                    </div>
                    <div style={{ fontSize: 10, color: "#999", whiteSpace: "nowrap", marginLeft: 12 }}>
                      {a.participants.length} participant{a.participants.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {preview.activities.length === 0 && (
              <div style={{ fontSize: 12, color: "#999", textAlign: "center", padding: 16 }}>No activities recorded for Leo Year {previewYear}.</div>
            )}
          </div>

          {/* Top Contributors */}
          {topContributors(preview.members, preview.activities).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#002147", borderBottom: "2px solid #D4AF37", paddingBottom: 6, marginBottom: 14 }}>
                Top Contributors — Leo Year {previewYear}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {topContributors(preview.members, preview.activities).map(({ member, count }, i) => (
                  <div key={member.memberId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: i === 0 ? "#002147" : "#F8FAFC", borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? "#D4AF37" : "#002147", minWidth: 20 }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? "#fff" : "#002147" }}>{member.name}</div>
                      <div style={{ fontSize: 10, color: i === 0 ? "rgba(255,255,255,0.6)" : "#999" }}>{member.memberId}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "#D4AF37" : "#002147" }}>{count} acts.</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {preview.awards.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#002147", borderBottom: "2px solid #D4AF37", paddingBottom: 6, marginBottom: 14 }}>
                Awards — Leo Year {previewYear}
              </div>
              {preview.awards.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#002147" }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{a.recipientName} · {a.month}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#D4AF37", fontWeight: 600 }}>{a.type === "member" ? "Member Award" : "Club Award"}</div>
                </div>
              ))}
            </div>
          )}

          {/* All members */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#002147", borderBottom: "2px solid #D4AF37", paddingBottom: 6, marginBottom: 14 }}>
              All Members
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {preview.members.sort((a, b) => a.name.localeCompare(b.name)).map((m) => (
                <div key={m.memberId} style={{ padding: "5px 8px", background: "#F8FAFC", borderRadius: 6, borderLeft: "3px solid", borderLeftColor: m.isActive === false ? "#ccc" : "#D4AF37" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: m.isActive === false ? "#888" : "#002147" }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: "#999" }}>{m.memberId} {m.isActive === false ? "· Past" : ""}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid #eee", textAlign: "center", fontSize: 9, color: "#aaa" }}>
            Leo Club of Kathmandu University School of Medical Sciences (KUSMS) · District 325L ·
            Generated on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}
