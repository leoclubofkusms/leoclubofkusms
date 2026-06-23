import { useState, useEffect, useRef } from "react";
import { getMembers } from "@/lib/firestore";
import type { Member } from "@/lib/types";
import { LEO_YEARS } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import {
  Download, CreditCard, Search, CheckCircle, Clock,
  ChevronDown, Loader2, Users,
} from "lucide-react";

function serviceYears(member: Member): string {
  const joined = member.joinedLeoYear ?? "";
  const left = member.leftLeoYear ?? "";
  if (joined && left) return `${joined} – ${left}`;
  if (joined) return `${joined} – Present`;
  return "";
}

function yearsCount(member: Member): number {
  const joined = member.joinedLeoYear ?? "";
  const left = member.leftLeoYear ?? "";
  if (!joined) return 0;
  const jIdx = LEO_YEARS.indexOf(joined);
  const lIdx = left ? LEO_YEARS.indexOf(left) : LEO_YEARS.length - 1;
  if (jIdx === -1) return 1;
  return Math.max(1, (lIdx === -1 ? LEO_YEARS.length - 1 : lIdx) - jIdx + 1);
}

function IDCard({
  member,
  verifyUrl,
}: {
  member: Member;
  verifyUrl: string;
}) {
  const isActive = member.isActive !== false;
  const svc = serviceYears(member);
  const yrs = yearsCount(member);

  return (
    <div
      style={{
        width: "340px",
        height: "214px",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 4px 24px rgba(0,33,71,0.18)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Navy header bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #002147 0%, #003575 100%)",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px 0 14px",
          position: "relative",
        }}
      >
        {/* Gold accent strip */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "#D4AF37" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          {/* LC badge */}
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "#D4AF37", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: "900", fontSize: "13px",
            color: "#002147", flexShrink: 0, letterSpacing: "-0.5px",
          }}>LC</div>
          <div>
            <div style={{ color: "#fff", fontWeight: "700", fontSize: "11px", lineHeight: 1.2 }}>
              Leo Club of KUSMS
            </div>
            <div style={{ color: "#D4AF37", fontSize: "8.5px", letterSpacing: "0.8px", marginTop: "2px" }}>
              LIONS CLUBS INTERNATIONAL · D325L
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          padding: "3px 9px", borderRadius: "20px", fontSize: "9px",
          fontWeight: "700", letterSpacing: "0.8px",
          background: isActive ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.12)",
          color: isActive ? "#4ade80" : "rgba(255,255,255,0.5)",
          border: `1px solid ${isActive ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.18)"}`,
        }}>
          {isActive ? "● ACTIVE" : "◌ PAST"}
        </div>
      </div>

      {/* Body */}
      <div style={{
        display: "flex", alignItems: "flex-start", padding: "12px 14px", gap: "12px",
      }}>
        {/* Photo */}
        <div style={{ flexShrink: 0 }}>
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              style={{
                width: "64px", height: "64px", borderRadius: "10px",
                objectFit: "cover",
                border: "2px solid #002147",
              }}
            />
          ) : (
            <div style={{
              width: "64px", height: "64px", borderRadius: "10px",
              background: "#002147", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "24px", fontWeight: "700",
              color: "#D4AF37", border: "2px solid #002147",
            }}>
              {member.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: "800", fontSize: "14px", color: "#002147",
            lineHeight: 1.2, marginBottom: "3px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {member.name}
          </div>
          <div style={{ fontSize: "9.5px", color: "#D4AF37", fontWeight: "700", letterSpacing: "0.5px", marginBottom: "6px" }}>
            {member.currentRole || "Leo Member"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}>
              <span style={{ color: "#002147", fontWeight: "600" }}>ID</span>
              <span style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>{member.memberId}</span>
            </div>
            {member.faculty && (
              <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}>
                <span style={{ color: "#002147", fontWeight: "600" }}>Faculty</span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "110px" }}>{member.faculty}</span>
              </div>
            )}
            <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}>
              <span style={{ color: "#002147", fontWeight: "600" }}>Batch</span>
              <span>{member.batch}</span>
            </div>
            {svc && (
              <div style={{ fontSize: "8.5px", color: "#555", display: "flex", gap: "5px" }}>
                <span style={{ color: "#002147", fontWeight: "600" }}>Leo Year</span>
                <span>{svc}{yrs > 0 ? ` (${yrs} yr${yrs !== 1 ? "s" : ""})` : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
          <div style={{
            padding: "5px", background: "#fff",
            borderRadius: "8px", border: "1.5px solid #002147",
          }}>
            <QRCodeSVG value={verifyUrl} size={56} fgColor="#002147" level="M" />
          </div>
          <div style={{ fontSize: "7px", color: "#aaa", textAlign: "center", letterSpacing: "0.3px" }}>
            Scan to verify
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "#F8FAFC", borderTop: "1px solid #eee",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 14px",
      }}>
        <div style={{ fontSize: "7.5px", color: "#aaa" }}>
          Roll No: {member.rollNo}
        </div>
        <div style={{ fontSize: "7.5px", color: "#aaa" }}>
          leoclubofkusms.org
        </div>
        <div style={{ fontSize: "7.5px", color: "#D4AF37", fontWeight: "700" }}>
          VERIFIED ✓
        </div>
      </div>
    </div>
  );
}

export default function IDCardGenerator() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "past">("all");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMembers()
      .then((mems) => {
        const sorted = mems.sort((a, b) => a.name.localeCompare(b.name));
        setMembers(sorted);
        setFiltered(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = members;
    if (filterStatus === "active") list = list.filter((m) => m.isActive !== false);
    if (filterStatus === "past") list = list.filter((m) => m.isActive === false);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.memberId.toLowerCase().includes(q) ||
          m.batch.toLowerCase().includes(q) ||
          (m.faculty ?? "").toLowerCase().includes(q)
      );
    }
    setFiltered(list);
    if (selected && !list.find((m) => m.memberId === selected.memberId)) {
      setSelected(null);
    }
  }, [query, filterStatus, members]);

  function verifyUrl(memberId: string) {
    return `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${memberId}`;
  }

  async function downloadCard(member: Member) {
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas") as {
        default: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
      };
      const el = document.getElementById(`id-card-${member.memberId}`);
      if (!el) return;
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: "#fff",
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `${member.memberId}-id-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  async function downloadAllCards() {
    if (!filtered.length) return;
    setDownloadingAll(true);
    const { default: html2canvas } = await import("html2canvas") as {
      default: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
    };
    const { default: jsPDF } = await import("jspdf");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [85.6, 53.98],
    });

    for (let i = 0; i < filtered.length; i++) {
      const m = filtered[i];
      const el = document.getElementById(`id-card-${m.memberId}`);
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: "#fff", useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage([85.6, 53.98], "landscape");
      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
    }

    pdf.save(`leo-club-id-cards-${new Date().toISOString().slice(0, 10)}.pdf`);
    setDownloadingAll(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#002147]">ID Card Generator</h3>
        <p className="text-sm text-gray-500">
          Generate printable QR-scannable ID cards for members. Each card links to the live verify page.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, batch, faculty…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147]"
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "past")}
            className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147] bg-white"
          >
            <option value="all">All Members</option>
            <option value="active">Active Only</option>
            <option value="past">Past Only</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {filtered.length > 0 && (
          <button
            onClick={downloadAllCards}
            disabled={downloadingAll}
            className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 shrink-0"
          >
            {downloadingAll
              ? <><Loader2 size={14} className="animate-spin" /> Exporting…</>
              : <><Download size={14} /> Download All ({filtered.length}) PDF</>
            }
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p>No members found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="font-medium text-[#002147]">{filtered.length}</span> card{filtered.length !== 1 ? "s" : ""}
            {filtered.filter((m) => m.isActive !== false).length > 0 && (
              <span className="flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle size={12} /> {filtered.filter((m) => m.isActive !== false).length} active
              </span>
            )}
            {filtered.filter((m) => m.isActive === false).length > 0 && (
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                <Clock size={12} /> {filtered.filter((m) => m.isActive === false).length} past
              </span>
            )}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((m) => (
              <div key={m.memberId} className="group">
                {/* Card preview */}
                <div
                  id={`id-card-${m.memberId}`}
                  className="inline-block"
                  style={{ display: "block" }}
                >
                  <IDCard member={m} verifyUrl={verifyUrl(m.memberId)} />
                </div>

                {/* Action row */}
                <div className="flex items-center gap-3 mt-3 px-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#002147] truncate">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.memberId} · {m.batch}</div>
                  </div>
                  <button
                    onClick={() => downloadCard(m)}
                    disabled={downloading}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#002147] border border-[#002147]/20 bg-white hover:bg-[#002147] hover:text-white px-3 py-1.5 rounded-lg transition-all shrink-0 disabled:opacity-50"
                  >
                    {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    PNG
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Print tip */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
            <strong>Print tip:</strong> Standard CR80 ID cards are 85.6 × 53.98 mm. The "Download All PDF" export uses this exact size — send directly to a card printer or print shop. Individual PNG downloads are high-resolution (3× scale) for digital use.
          </div>
        </div>
      )}
    </div>
  );
}
