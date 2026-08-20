import { useState, useEffect, useRef } from "react";
import { getMembers, getActivities, getAwards } from "@/lib/firestore";
import type { Member, Activity, Award } from "@/lib/types";
import { LEO_YEARS, MONTHS, activitySortKey } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import {
  Award as AwardIcon, FileText, Users, Star, Download, Loader2,
  Search, ChevronDown, CheckCircle, Eye, Layers, Sparkles,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type CertType = "participation" | "service" | "award" | "appreciation";
type Template = "classic" | "modern" | "gold";

interface CertData {
  recipientName: string;
  recipientRole: string;
  recipientId: string;
  certType: CertType;
  template: Template;
  activityTitle?: string;
  activityMonth?: string;
  activityYear?: string;
  awardTitle?: string;
  serviceYears?: string;
  activitiesCount?: number;
  joinedYear?: string;
  leftYear?: string;
  customMessage?: string;
  verifyUrl: string;
  issuedDate: string;
}

// ── Certificate Canvas ─────────────────────────────────────────────────────────
function CertificateCanvas({ data, scale = 1 }: { data: CertData; scale?: number }) {
  const W = 794 * scale;
  const H = 562 * scale;
  const s = (n: number) => n * scale;

  const isClassic = data.template === "classic";
  const isModern = data.template === "modern";
  const isGold = data.template === "gold";

  const bg = isGold ? "#1a1200" : isModern ? "#0d1f3c" : "#fff";
  const accentColor = "#D4AF37";
  const textMain = isGold || isModern ? "#fff" : "#002147";
  const textSub = isGold || isModern ? "rgba(255,255,255,0.65)" : "#555";
  const borderColor = isGold ? "#D4AF37" : isModern ? "rgba(212,175,55,0.4)" : "#002147";

  function certTitle() {
    switch (data.certType) {
      case "participation": return "Certificate of Participation";
      case "service": return "Certificate of Service";
      case "award": return "Certificate of Recognition";
      case "appreciation": return "Certificate of Appreciation";
    }
  }

  function bodyText() {
    switch (data.certType) {
      case "participation":
        return `is hereby awarded this certificate in recognition of their active participation in`;
      case "service":
        return `is hereby awarded this certificate in recognition of their dedicated service to`;
      case "award":
        return `is hereby recognized and honored for excellence in service, receiving the`;
      case "appreciation":
        return `is hereby presented this certificate in appreciation of their outstanding contributions to`;
    }
  }

  function subjectText() {
    switch (data.certType) {
      case "participation":
        return data.activityTitle || "";
      case "service":
        return `Leo Club of KUSMS${data.serviceYears ? ` · ${data.serviceYears}` : ""}`;
      case "award":
        return data.awardTitle || "";
      case "appreciation":
        return "Leo Club of Kathmandu University School of Medical Sciences (KUSMS)";
    }
  }

  return (
    <div
      style={{
        width: `${W}px`,
        height: `${H}px`,
        background: bg,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Georgia, 'Times New Roman', serif",
        flexShrink: 0,
      }}
    >
      {/* Background decorative elements */}
      {isClassic && (
        <>
          <div style={{ position: "absolute", inset: `${s(18)}px`, border: `${s(3)}px solid #002147`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: `${s(26)}px`, border: `${s(1)}px solid #D4AF37`, pointerEvents: "none" }} />
          {/* Corner ornaments */}
          {[
            { top: s(14), left: s(14) },
            { top: s(14), right: s(14) },
            { bottom: s(14), left: s(14) },
            { bottom: s(14), right: s(14) },
          ].map((pos, i) => (
            <div key={i} style={{
              position: "absolute", ...pos,
              width: s(24), height: s(24),
              background: "#D4AF37",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            }} />
          ))}
        </>
      )}

      {isModern && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${s(8)}px`, background: "linear-gradient(90deg,#D4AF37,#f0d060,#D4AF37)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${s(8)}px`, background: "linear-gradient(90deg,#D4AF37,#f0d060,#D4AF37)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: `${s(8)}px`, bottom: 0, background: "linear-gradient(180deg,#D4AF37,#f0d060,#D4AF37)" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: `${s(8)}px`, bottom: 0, background: "linear-gradient(180deg,#D4AF37,#f0d060,#D4AF37)" }} />
          <div style={{ position: "absolute", top: s(48), right: -s(60), width: s(220), height: s(220), borderRadius: "50%", border: `${s(2)}px solid rgba(212,175,55,0.15)` }} />
          <div style={{ position: "absolute", bottom: s(20), left: -s(40), width: s(180), height: s(180), borderRadius: "50%", border: `${s(2)}px solid rgba(212,175,55,0.1)` }} />
        </>
      )}

      {isGold && (
        <>
          <div style={{ position: "absolute", inset: `${s(20)}px`, border: `${s(2)}px solid rgba(212,175,55,0.5)` }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${s(6)}px`, background: "#D4AF37" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${s(6)}px`, background: "#D4AF37" }} />
          <div style={{ position: "absolute", top: s(60), left: -s(80), width: s(300), height: s(300), borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.08) 0%,transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: s(20), right: -s(60), width: s(260), height: s(260), borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.08) 0%,transparent 70%)" }} />
        </>
      )}

      {/* Main content */}
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: `${s(isModern ? 28 : 50)}px ${s(60)}px ${s(isModern ? 28 : 50)}px`,
        textAlign: "center",
        gap: s(8),
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: s(10), marginBottom: s(6) }}>
          <div style={{
            position: "relative", width: s(36), height: s(36), borderRadius: s(9), background: "#D4AF37",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "900", fontSize: `${s(11)}px`, color: "#002147", flexShrink: 0, overflow: "hidden",
          }}>
            <span>LEO</span>
            <img
              src="/logo.png"
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: textMain, fontWeight: "700", fontSize: `${s(11)}px`, fontFamily: "system-ui,sans-serif" }}>
              Leo Club of KUSMS
            </div>
            <div style={{ color: accentColor, fontSize: `${s(8)}px`, letterSpacing: `${s(1.2)}px`, fontFamily: "system-ui,sans-serif", marginTop: `${s(1)}px` }}>
              LIONS CLUBS INTERNATIONAL · DISTRICT 325L · CLUB #172194
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ display: "flex", alignItems: "center", gap: s(8), width: "60%", marginBottom: s(4) }}>
          <div style={{ flex: 1, height: `${s(1)}px`, background: accentColor, opacity: 0.5 }} />
          <div style={{ width: s(6), height: s(6), background: accentColor, transform: "rotate(45deg)" }} />
          <div style={{ flex: 1, height: `${s(1)}px`, background: accentColor, opacity: 0.5 }} />
        </div>

        {/* Certificate title */}
        <div style={{
          fontSize: `${s(isModern ? 13 : 15)}px`,
          letterSpacing: `${s(4)}px`,
          color: accentColor,
          textTransform: "uppercase",
          fontFamily: "system-ui,sans-serif",
          fontWeight: "600",
          marginBottom: s(2),
        }}>
          {certTitle()}
        </div>

        {/* "This certifies that" */}
        <div style={{ fontSize: `${s(10)}px`, color: textSub, fontFamily: "system-ui,sans-serif", marginBottom: s(4) }}>
          This is to certify that
        </div>

        {/* Recipient name */}
        <div style={{
          fontSize: `${s(28)}px`,
          fontWeight: "700",
          color: textMain,
          lineHeight: 1.15,
          marginBottom: s(4),
          maxWidth: `${s(580)}px`,
        }}>
          {data.recipientName}
        </div>

        {/* Role */}
        {data.recipientRole && (
          <div style={{
            fontSize: `${s(10)}px`, color: accentColor, fontFamily: "system-ui,sans-serif",
            fontWeight: "700", letterSpacing: `${s(1.5)}px`, marginBottom: s(8),
          }}>
            {data.recipientRole.toUpperCase()}
          </div>
        )}

        {/* Body text */}
        <div style={{ fontSize: `${s(10.5)}px`, color: textSub, fontFamily: "system-ui,sans-serif", maxWidth: `${s(520)}px`, lineHeight: 1.7, marginBottom: s(6) }}>
          {bodyText()}
        </div>

        {/* Subject highlight */}
        <div style={{
          fontSize: `${s(13.5)}px`,
          fontWeight: "700",
          color: textMain,
          fontStyle: data.certType === "participation" ? "italic" : "normal",
          maxWidth: `${s(560)}px`,
          lineHeight: 1.3,
          marginBottom: s(8),
        }}>
          "{subjectText()}"
        </div>

        {/* Extra detail for participation */}
        {data.certType === "participation" && data.activityMonth && data.activityYear && (
          <div style={{
            fontSize: `${s(9.5)}px`, color: textSub, fontFamily: "system-ui,sans-serif",
            marginBottom: s(4), letterSpacing: `${s(0.5)}px`,
          }}>
            {data.activityMonth}, Leo Year {data.activityYear}
          </div>
        )}

        {/* Extra detail for service */}
        {data.certType === "service" && data.activitiesCount !== undefined && (
          <div style={{
            display: "flex", gap: s(16), justifyContent: "center",
            marginBottom: s(8),
          }}>
            {data.activitiesCount > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: `${s(20)}px`, fontWeight: "700", color: accentColor }}>{data.activitiesCount}</div>
                <div style={{ fontSize: `${s(8.5)}px`, color: textSub, fontFamily: "system-ui,sans-serif" }}>Activities</div>
              </div>
            )}
            {data.joinedYear && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: `${s(20)}px`, fontWeight: "700", color: accentColor }}>{data.joinedYear}</div>
                <div style={{ fontSize: `${s(8.5)}px`, color: textSub, fontFamily: "system-ui,sans-serif" }}>Joined</div>
              </div>
            )}
          </div>
        )}

        {/* Custom message */}
        {data.customMessage && (
          <div style={{
            fontSize: `${s(10)}px`, color: textSub, fontFamily: "system-ui,sans-serif",
            fontStyle: "italic", maxWidth: `${s(500)}px`, lineHeight: 1.6, marginBottom: s(4),
          }}>
            {data.customMessage}
          </div>
        )}

        {/* Gold divider */}
        <div style={{ display: "flex", alignItems: "center", gap: s(8), width: "50%", margin: `${s(4)}px 0` }}>
          <div style={{ flex: 1, height: `${s(1)}px`, background: accentColor, opacity: 0.4 }} />
          <div style={{ width: s(5), height: s(5), background: accentColor, transform: "rotate(45deg)", opacity: 0.7 }} />
          <div style={{ flex: 1, height: `${s(1)}px`, background: accentColor, opacity: 0.4 }} />
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", marginTop: s(6) }}>
          {/* Issued date + ID */}
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: `${s(8.5)}px`, color: textSub, fontFamily: "system-ui,sans-serif" }}>Issued: {data.issuedDate}</div>
            {data.recipientId && (
              <div style={{ fontSize: `${s(8)}px`, color: textSub, fontFamily: "monospace", marginTop: `${s(1)}px` }}>
                Member ID: {data.recipientId}
              </div>
            )}
          </div>

          {/* President signature line */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: s(100), borderTop: `${s(1)}px solid ${borderColor}`, marginBottom: s(4) }} />
            <div style={{ fontSize: `${s(8.5)}px`, color: textSub, fontFamily: "system-ui,sans-serif" }}>President</div>
            <div style={{ fontSize: `${s(7.5)}px`, color: textSub, fontFamily: "system-ui,sans-serif", opacity: 0.7 }}>Leo Club of KUSMS</div>
          </div>

          {/* QR code */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(3) }}>
            <div style={{
              padding: s(5), background: "#fff", borderRadius: s(6),
              border: `${s(1.5)}px solid ${isClassic ? "#002147" : "rgba(212,175,55,0.6)"}`,
            }}>
              <QRCodeSVG value={data.verifyUrl} size={s(48)} fgColor="#002147" level="M" />
            </div>
            <div style={{ fontSize: `${s(7)}px`, color: textSub, fontFamily: "system-ui,sans-serif" }}>Scan to verify</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Download helper ────────────────────────────────────────────────────────────
async function downloadCertAsPng(elementId: string, filename: string) {
  const { default: html2canvas } = await import("html2canvas") as {
    default: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
  };
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: null, useCORS: true, allowTaint: true });
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function downloadCertAsPdf(elementId: string, filename: string) {
  const { default: html2canvas } = await import("html2canvas") as {
    default: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
  };
  const { default: jsPDF } = await import("jspdf");
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: true });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, "PNG", 0, 0, pw, ph);
  pdf.save(filename);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CertificateGenerator() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  const [certType, setCertType] = useState<CertType>("participation");
  const [template, setTemplate] = useState<Template>("classic");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    Promise.all([getMembers(), getActivities(), getAwards()])
      .then(([m, a, aw]) => {
        setMembers(m.sort((a, b) => a.name.localeCompare(b.name)));
        setActivities(a.sort((x, y) => activitySortKey(y.year, y.month) - activitySortKey(x.year, x.month)));
        setAwards(aw);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function verifyUrl(memberId: string) {
    return `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${memberId}`;
  }

  function serviceYears(member: Member): string {
    const j = member.joinedLeoYear ?? "";
    const l = member.leftLeoYear ?? "";
    if (j && l) return `${j} – ${l}`;
    if (j) return `${j} – Present`;
    return "";
  }

  function activitiesForMember(member: Member): number {
    return activities.filter((a) => a.participants.some((p) => p.memberId === member.memberId)).length;
  }

  function buildCertData(member: Member): CertData {
    const base: CertData = {
      recipientName: member.name,
      recipientRole: member.currentRole || "Leo Member",
      recipientId: member.memberId,
      certType,
      template,
      customMessage,
      verifyUrl: verifyUrl(member.memberId),
      issuedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };
    if (certType === "participation" && selectedActivity) {
      base.activityTitle = selectedActivity.title;
      base.activityMonth = selectedActivity.month;
      base.activityYear = selectedActivity.year;
      const participant = selectedActivity.participants.find((p) => p.memberId === member.memberId);
      if (participant?.awardTitle) base.recipientRole = participant.awardTitle;
    }
    if (certType === "service") {
      base.serviceYears = serviceYears(member);
      base.activitiesCount = activitiesForMember(member);
      base.joinedYear = member.joinedLeoYear ?? "";
      base.leftYear = member.leftLeoYear ?? "";
    }
    if (certType === "award" && selectedAward) {
      base.awardTitle = selectedAward.title;
    }
    return base;
  }

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q) || m.batch.toLowerCase().includes(q);
  });

  const activityParticipants = selectedActivity
    ? members.filter((m) => selectedActivity.participants.some((p) => p.memberId === m.memberId))
    : [];

  const certData = selectedMember ? buildCertData(selectedMember) : null;

  async function downloadSingle(fmt: "png" | "pdf") {
    if (!selectedMember) return;
    setDownloading(true);
    try {
      const fn = `${selectedMember.memberId}-${certType}-certificate`;
      if (fmt === "png") await downloadCertAsPng("cert-preview-capture", `${fn}.png`);
      else await downloadCertAsPdf("cert-preview-capture", `${fn}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  async function downloadBatchForActivity() {
    if (!selectedActivity) return;
    setBatchDownloading(true);
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas") as {
      default: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
    };
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < activityParticipants.length; i++) {
      const m = activityParticipants[i];
      setBatchProgress(Math.round(((i + 1) / activityParticipants.length) * 100));
      const tempId = `batch-cert-${m.memberId}`;
      const tempEl = document.getElementById(tempId);
      if (!tempEl) continue;
      const canvas = await html2canvas(tempEl, { scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage([pw, ph], "landscape");
      pdf.addImage(imgData, "PNG", 0, 0, pw, ph);
    }
    pdf.save(`${selectedActivity.title.replace(/\s+/g, "-")}-certificates.pdf`);
    setBatchDownloading(false);
    setBatchProgress(0);
  }

  const CERT_TYPES: { id: CertType; label: string; icon: typeof AwardIcon; desc: string }[] = [
    { id: "participation", label: "Participation", icon: CheckCircle, desc: "For attending an activity" },
    { id: "service", label: "Service", icon: Star, desc: "For overall Leo service" },
    { id: "award", label: "Recognition", icon: AwardIcon, desc: "For an award received" },
    { id: "appreciation", label: "Appreciation", icon: Sparkles, desc: "General appreciation" },
  ];

  const TEMPLATES: { id: Template; label: string; bg: string; desc: string }[] = [
    { id: "classic", label: "Classic", bg: "from-white to-gray-50", desc: "White with navy & gold border" },
    { id: "modern", label: "Modern", bg: "from-[#0d1f3c] to-[#002147]", desc: "Dark navy with gold accents" },
    { id: "gold", label: "Prestige", bg: "from-[#1a1200] to-[#2a1f00]", desc: "Deep gold luxury style" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#002147]">Certificate Generator</h3>
        <p className="text-sm text-gray-500">
          Generate professional certificates — participation, service, recognition, and appreciation.
          Download individually or batch-export an entire activity's participants as one PDF.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* ── Left panel ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Step 1: Certificate Type */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 1 · Certificate Type</div>
              <div className="grid grid-cols-2 gap-2">
                {CERT_TYPES.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => { setCertType(id); setSelectedActivity(null); setSelectedAward(null); }}
                    className={`text-left p-3 rounded-xl border transition-all ${certType === id ? "border-[#002147] bg-[#002147] text-white" : "border-gray-200 hover:border-[#002147]/30 hover:bg-gray-50"}`}
                  >
                    <Icon size={15} className={certType === id ? "text-[#D4AF37]" : "text-gray-400"} />
                    <div className={`text-sm font-semibold mt-1.5 ${certType === id ? "text-white" : "text-[#002147]"}`}>{label}</div>
                    <div className={`text-xs mt-0.5 ${certType === id ? "text-white/60" : "text-gray-400"}`}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Template */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 2 · Design Template</div>
              <div className="space-y-2">
                {TEMPLATES.map(({ id, label, bg, desc }) => (
                  <button
                    key={id}
                    onClick={() => setTemplate(id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${template === id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className={`w-10 h-7 rounded-lg bg-gradient-to-br ${bg} border border-gray-200 shrink-0`} />
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-[#002147]">{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                    {template === id && <CheckCircle size={15} className="text-[#D4AF37] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Select Activity (for participation/batch) */}
            {certType === "participation" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 3 · Select Activity</div>
                <select
                  value={selectedActivity?.id ?? ""}
                  onChange={(e) => {
                    const act = activities.find((a) => a.id === e.target.value) ?? null;
                    setSelectedActivity(act);
                    setSelectedMember(null);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                >
                  <option value="">— Choose an activity —</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} · {a.month} {a.year} ({a.participants.length} participants)
                    </option>
                  ))}
                </select>

                {selectedActivity && activityParticipants.length > 0 && (
                  <div className="mt-3 p-3 bg-[#002147]/5 rounded-xl">
                    <div className="text-xs text-gray-500 mb-2">{activityParticipants.length} participants — batch download:</div>
                    <button
                      onClick={downloadBatchForActivity}
                      disabled={batchDownloading}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60"
                    >
                      {batchDownloading
                        ? <><Loader2 size={14} className="animate-spin" /> Generating… {batchProgress}%</>
                        : <><Layers size={14} /> Download All {activityParticipants.length} Certificates PDF</>
                      }
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Award */}
            {certType === "award" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 3 · Select Award</div>
                <select
                  value={selectedAward?.id ?? ""}
                  onChange={(e) => setSelectedAward(awards.find((a) => a.id === e.target.value) ?? null)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                >
                  <option value="">— Choose an award —</option>
                  {awards.filter((a) => a.type === "member").map((a) => (
                    <option key={a.id} value={a.id}>{a.title} · {a.recipientName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 4: Select Member */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Step {certType === "participation" || certType === "award" ? "4" : "3"} · Select Member
              </div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members…"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {(certType === "participation" && selectedActivity
                  ? filteredMembers.filter((m) => selectedActivity.participants.some((p) => p.memberId === m.memberId))
                  : filteredMembers
                ).map((m) => (
                  <button
                    key={m.memberId}
                    onClick={() => setSelectedMember(m)}
                    className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${selectedMember?.memberId === m.memberId ? "bg-[#002147] text-white" : "hover:bg-gray-50 text-[#002147]"}`}
                  >
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt={m.name} className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white/20" />
                      : <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${selectedMember?.memberId === m.memberId ? "bg-white/20 text-white" : "bg-[#002147] text-white"}`}>{m.name[0]}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{m.name}</div>
                      <div className={`text-xs ${selectedMember?.memberId === m.memberId ? "text-white/50" : "text-gray-400"}`}>{m.memberId} · {m.batch}</div>
                    </div>
                    {selectedMember?.memberId === m.memberId && <CheckCircle size={14} className="text-[#D4AF37] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom message */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Custom Message (optional)</div>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={2}
                placeholder="Add a personal note to appear on the certificate…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none"
              />
            </div>
          </div>

          {/* ── Right panel: Preview ── */}
          <div className="xl:col-span-3">
            {!certData ? (
              <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 gap-3">
                <FileText size={40} className="opacity-30" />
                <p className="text-sm">Select a member to preview their certificate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Download actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => downloadSingle("pdf")}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#003575] transition-colors disabled:opacity-60"
                  >
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadSingle("png")}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 bg-white border border-[#002147]/20 text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#002147] hover:text-white transition-colors disabled:opacity-60"
                  >
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download PNG
                  </button>
                  <button
                    onClick={() => setShowPreview((v) => !v)}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#002147] px-3 py-2.5 rounded-xl border border-gray-200 hover:border-[#002147]/30 transition-colors ml-auto"
                  >
                    <Eye size={14} /> {showPreview ? "Hide" : "Show"} Preview
                  </button>
                </div>

                {/* Certificate preview */}
                {showPreview && (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-b border-gray-200 flex items-center gap-2">
                      <Eye size={12} />
                      Certificate Preview · {TEMPLATES.find((t) => t.id === certData.template)?.label} Template
                    </div>
                    <div className="overflow-x-auto p-4 bg-gray-100">
                      <div id="cert-preview-capture">
                        <CertificateCanvas data={certData} scale={0.72} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Member summary card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  {selectedMember?.photoUrl
                    ? <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-[#002147] flex items-center justify-center text-xl font-bold text-[#D4AF37] shrink-0">{selectedMember!.name[0]}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#002147]">{selectedMember!.name}</div>
                    <div className="text-xs text-gray-400">{selectedMember!.memberId} · {selectedMember!.batch} · {selectedMember!.faculty}</div>
                    <div className="text-xs text-[#D4AF37] font-medium mt-0.5">{selectedMember!.currentRole || "Leo Member"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-[#002147]">{activitiesForMember(selectedMember!)}</div>
                    <div className="text-xs text-gray-400">activities</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden elements for batch PDF export */}
      {certType === "participation" && selectedActivity && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }} aria-hidden>
          {activityParticipants.map((m) => (
            <div key={m.memberId} id={`batch-cert-${m.memberId}`}>
              <CertificateCanvas data={buildCertData(m)} scale={1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
