import { useState, useEffect } from "react";
import { getMembers } from "@/lib/firestore";
import type { Member } from "@/lib/types";
import { LEO_YEARS } from "@/lib/types";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download, Search, CheckCircle, Clock,
  ChevronDown, Loader2, Users,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Vertical Premium ID Card ─────────────────────────────────────────────────
// Card size: 340 × 540 px on screen — aspect ratio matches standard CR80
// portrait (53.98 × 85.6 mm). Exports at scale 3 → 1020 × 1620 px (300 DPI).
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

  const CARD_W = 340;
  const CARD_H = 540;
  const GOLD = "#D4AF37";
  const NAVY = "#002147";

  return (
    <div
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        borderRadius: "16px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 8px 32px rgba(0,33,71,0.22)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── TOP: Navy header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #002147 0%, #003575 100%)",
          padding: "16px 16px 14px",
          position: "relative",
        }}
      >
        {/* Gold accent line at bottom of header */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${GOLD}, #F0D77A, ${GOLD})` }} />

        {/* Top-left mini crest + status pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div
            style={{
              position: "relative", width: "32px", height: "32px", borderRadius: "8px",
              overflow: "hidden", background: GOLD, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontWeight: "900", fontSize: "12px", color: NAVY,
              flexShrink: 0, letterSpacing: "-0.5px",
            }}
          >
            <span>LEO</span>
            <img
              src="/logo.png"
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div
            style={{
              padding: "3px 9px",
              borderRadius: "20px",
              fontSize: "8.5px",
              fontWeight: "700",
              letterSpacing: "0.8px",
              background: isActive ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.12)",
              color: isActive ? "#4ade80" : "rgba(255,255,255,0.55)",
              border: `1px solid ${isActive ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.2)"}`,
            }}
          >
            {isActive ? "● ACTIVE" : "◌ PAST"}
          </div>
        </div>

        {/* Club name */}
        <div style={{ color: "#fff", fontWeight: "800", fontSize: "13px", letterSpacing: "0.2px", lineHeight: 1.15 }}>
          Leo Club of KUSMS
        </div>
        <div style={{ color: GOLD, fontSize: "7.5px", letterSpacing: "0.9px", marginTop: "3px", fontWeight: "600" }}>
          LIONS CLUBS INTERNATIONAL · DISTRICT 325L · #172194
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "7.5px", letterSpacing: "0.7px", marginTop: "2px" }}>
          OFFICIAL MEMBER ID
        </div>
      </div>

      {/* ── MIDDLE: Photo ── */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "16px" }}>
        <div
          style={{
            position: "relative",
            width: "132px",
            height: "132px",
            borderRadius: "14px",
            overflow: "hidden",
            border: `3px solid ${GOLD}`,
            background: NAVY,
            boxShadow: "0 4px 16px rgba(0,33,71,0.2)",
          }}
        >
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : null}
          {/* Fallback initial — shown if no photo */}
          {!member.photoUrl && (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: "52px", fontWeight: "800" }}>
              {member.name[0]}
            </div>
          )}
        </div>
      </div>

      {/* ── Name + Role ── */}
      <div style={{ textAlign: "center", padding: "14px 16px 0" }}>
        <div
          style={{
            fontWeight: "800",
            fontSize: "18px",
            color: NAVY,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontSize: "9.5px",
            color: GOLD,
            fontWeight: "700",
            letterSpacing: "1.4px",
            marginTop: "5px",
            textTransform: "uppercase",
          }}
        >
          {member.currentRole || "Leo Member"}
        </div>
      </div>

      {/* ── Gold divider ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", margin: "12px 24px 10px" }}>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
        <div style={{ width: "4px", height: "4px", background: GOLD, transform: "rotate(45deg)" }} />
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
      </div>

      {/* ── Info rows ── */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "7px" }}>
        <InfoRow label="ID" value={member.memberId} mono />
        {member.faculty && <InfoRow label="Faculty" value={member.faculty} />}
        <InfoRow label="Batch" value={member.batch} />
        {svc && (
          <InfoRow
            label="Service"
            value={`${svc}${yrs > 0 ? `  ·  ${yrs} yr${yrs !== 1 ? "s" : ""}` : ""}`}
          />
        )}
      </div>

      {/* ── Spacer ── */}
      <div style={{ flex: 1, minHeight: "8px" }} />

      {/* ── QR code ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "12px" }}>
        <div
          style={{
            padding: "5px",
            background: "#fff",
            borderRadius: "10px",
            border: `1.5px solid ${NAVY}`,
            display: "inline-block",
            lineHeight: 0,
          }}
        >
          <QRCodeCanvas value={verifyUrl} size={64} fgColor={NAVY} bgColor="#ffffff" level="M" style={{ display: "block" }} />
        </div>
        <div style={{ fontSize: "7px", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.5px", fontWeight: "600" }}>
          SCAN TO VERIFY
        </div>
      </div>

      {/* ── FOOTER: Navy strip ── */}
      <div
        style={{
          background: NAVY,
          padding: "7px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `2px solid ${GOLD}`,
        }}
      >
        <div style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.3px" }}>
          Roll {member.rollNo}
        </div>
        <div style={{ fontSize: "7.5px", color: GOLD, fontWeight: "700", letterSpacing: "0.5px" }}>
          leoclubofkusms.org
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ fontSize: "8.5px", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.8px", textTransform: "uppercase", width: "56px", flexShrink: 0 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "#002147",
          fontWeight: "600",
          fontFamily: mono ? "ui-monospace, monospace" : undefined,
          letterSpacing: mono ? "0.5px" : "0.2px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────
async function ensureFontsReady() {
  try {
    const anyDoc = document as unknown as { fonts?: { ready: Promise<unknown> } };
    if (anyDoc.fonts) await anyDoc.fonts.ready;
  } catch { /* ignore */ }
}

async function ensureImagesReady(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(imgs.map((img) =>
    img.complete ? Promise.resolve() : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); })
  ));
  await new Promise((r) => setTimeout(r, 60));
}

type H2C = (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
async function captureCard(id: string, scale = 3): Promise<HTMLCanvasElement | null> {
  const { default: html2canvas } = (await import("html2canvas")) as { default: H2C };
  const el = document.getElementById(id);
  if (!el) return null;
  await ensureFontsReady();
  await ensureImagesReady(el);
  return html2canvas(el, { scale, backgroundColor: "#ffffff", useCORS: true, allowTaint: true });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function IDCardGenerator() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "past">("all");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

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
  }, [query, filterStatus, members]);

  function verifyUrl(memberId: string) {
    return `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${memberId}`;
  }

  async function downloadCard(member: Member) {
    setDownloading(member.memberId);
    try {
      const c = await captureCard(`id-card-${member.memberId}`, 3);
      if (!c) return;
      const a = document.createElement("a");
      a.download = `${member.memberId}-id-card.png`;
      a.href = c.toDataURL("image/png");
      a.click();
    } finally {
      setDownloading(null);
    }
  }

  async function downloadAllCards() {
    if (!filtered.length) return;
    setDownloadingAll(true);
    setBatchProgress(0);
    try {
      const { default: jsPDF } = await import("jspdf");
      // Standard CR80 portrait card — 53.98 × 85.6 mm
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [53.98, 85.6] });
      let page = 0;
      for (let i = 0; i < filtered.length; i++) {
        setBatchProgress(Math.round(((i + 1) / filtered.length) * 100));
        const m = filtered[i];
        const c = await captureCard(`id-card-${m.memberId}`, 3);
        if (!c) continue;
        if (page > 0) pdf.addPage([53.98, 85.6], "portrait");
        pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, 53.98, 85.6);
        page++;
      }
      pdf.save(`leo-club-id-cards-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setDownloadingAll(false);
      setBatchProgress(0);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#002147]">ID Card Generator</h3>
        <p className="text-sm text-gray-500">
          Vertical premium QR-scannable ID cards for members. Each card links to the live verify page.
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
              ? <><Loader2 size={14} className="animate-spin" /> {batchProgress}%</>
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
          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
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

          {/* Cards grid — vertical cards side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((m) => (
              <div key={m.memberId} className="group flex flex-col items-center">
                <div id={`id-card-${m.memberId}`} className="mb-3">
                  <IDCard member={m} verifyUrl={verifyUrl(m.memberId)} />
                </div>

                <div className="w-full max-w-[340px] flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#002147] truncate">{m.name}</div>
                    <div className="text-[10px] text-gray-400">{m.memberId} · {m.batch}</div>
                  </div>
                  <button
                    onClick={() => downloadCard(m)}
                    disabled={downloading === m.memberId}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#002147] border border-[#002147]/20 bg-white hover:bg-[#002147] hover:text-white px-2.5 py-1.5 rounded-lg transition-all shrink-0 disabled:opacity-50"
                  >
                    {downloading === m.memberId ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    PNG
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Print tip */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
            <strong>Print tip:</strong> These are vertical CR80 cards (53.98 × 85.6 mm — the standard credit-card size in portrait).
            The "Download All PDF" export uses this exact size. Send directly to a card printer or print shop.
            Individual PNG downloads are high-resolution (3× scale) for digital use.
          </div>
        </div>
      )}
    </div>
  );
}
