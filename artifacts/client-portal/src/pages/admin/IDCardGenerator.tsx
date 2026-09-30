import { useState, useEffect } from "react";
import { getMembers } from "@/lib/firestore";
import type { Member } from "@/lib/types";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download, Search, CheckCircle, Clock,
  ChevronDown, Loader2, Users,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL ?? "/";

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F0D77A";
const GOLD_DEEP = "#9C7A14";
const NAVY = "#002147";
const IVORY = "#fcfaf3";
const DISPLAY = "Cinzel, Georgia, 'Times New Roman', serif";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";

const EXPORT_SCALE = 3;

// ── Vertical Premium ID Card ─────────────────────────────────────────────────
function IDCard({
  member,
  verifyUrl,
  logoAsset,
  lionAsset,
}: {
  member: Member;
  verifyUrl: string;
  logoAsset: string;
  lionAsset: string;
}) {
  const CARD_W = 340;
  const CARD_H = 540;
  const uid = member.memberId.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        borderRadius: "16px",
        overflow: "hidden",
        background: IVORY,
        boxShadow: "0 12px 40px rgba(0,33,71,0.28)",
        fontFamily: SERIF,
        position: "relative",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Faint lion watermark */}
      <img
        src={lionAsset}
        alt=""
        style={{
          position: "absolute", left: "50%", top: "60%", width: "240px", height: "240px",
          transform: "translate(-50%,-50%)", objectFit: "contain", opacity: 0.05, pointerEvents: "none",
        }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />

      {/* ═══ HEADER — navy arch with lattice + gold foil edge ═══ */}
      <div style={{ position: "relative", height: "146px", flexShrink: 0 }}>
        <svg width="340" height="146" viewBox="0 0 340 146" style={{ position: "absolute", inset: 0 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`hg-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#001a38" />
              <stop offset="50%" stopColor="#003575" />
              <stop offset="100%" stopColor="#001a38" />
            </linearGradient>
            <linearGradient id={`gg-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={GOLD} />
              <stop offset="50%" stopColor={GOLD_LIGHT} />
              <stop offset="100%" stopColor={GOLD} />
            </linearGradient>
            <radialGradient id={`gl-${uid}`} cx="50%" cy="38%" r="60%">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.3" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </radialGradient>
            <pattern id={`lt-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <path d="M0 0H10M0 0V10" stroke={GOLD} strokeWidth="0.35" opacity="0.22" fill="none" />
            </pattern>
          </defs>
          <path d="M0 0H340V122Q170 158 0 122Z" fill={`url(#hg-${uid})`} />
          <path d="M0 0H340V122Q170 158 0 122Z" fill={`url(#lt-${uid})`} />
          <path d="M0 0H340V122Q170 158 0 122Z" fill={`url(#gl-${uid})`} />
          <g fill="none" stroke={GOLD} strokeWidth="0.6" opacity="0.13">
            {[36, 56, 76, 96, 116, 136].map((r) => <circle key={r} cx="170" cy="56" r={r} />)}
          </g>
          <path d="M0 116Q170 152 340 116" fill="none" stroke={GOLD} strokeWidth="0.7" opacity="0.55" />
          <path d="M0 122Q170 158 340 122" fill="none" stroke={`url(#gg-${uid})`} strokeWidth="3" />
          <rect width="340" height="3" fill={`url(#gg-${uid})`} />
          <g fill="none" stroke={GOLD} strokeWidth="1.3" opacity="0.8">
            <path d="M12 26 V12 H26" />
            <path d="M328 26 V12 H314" />
          </g>
        </svg>

        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "13px" }}>
          <div style={{
            width: "54px", height: "54px", borderRadius: "50%",
            border: `1.5px solid ${GOLD}`,
            background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img
              src={logoAsset}
              alt="Leo Club of Kathmandu University School of Medical Sciences"
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div style={{ fontFamily: DISPLAY, color: GOLD_LIGHT, fontSize: "8.5px", letterSpacing: "3.2px", fontWeight: 700, marginTop: "6px" }}>
            LEO CLUB OF
          </div>
          <div style={{ fontFamily: DISPLAY, color: "#ffffff", fontSize: "13.5px", letterSpacing: "1.2px", fontWeight: 700, marginTop: "2px", lineHeight: 1.1 }}>
            KATHMANDU UNIVERSITY
          </div>
          <div style={{ fontFamily: DISPLAY, color: "#ffffff", fontSize: "9.3px", letterSpacing: "1.7px", fontWeight: 700, marginTop: "2px", lineHeight: 1.1 }}>
            SCHOOL OF MEDICAL SCIENCES
          </div>
          <div style={{ fontFamily: DISPLAY, color: GOLD, fontSize: "6.2px", letterSpacing: "1.5px", fontWeight: 700, marginTop: "5px" }}>
            LIONS CLUBS INTERNATIONAL · DISTRICT 325L · CLUB NO. 172194
          </div>
        </div>
      </div>

      {/* ═══ PHOTO — overlaps the arch ═══ */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "-18px", position: "relative", zIndex: 2 }}>
        <div
          style={{
            width: "134px", height: "134px", borderRadius: "16px", padding: "4px",
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 50%, ${GOLD_DEEP} 100%)`,
            boxShadow: "0 8px 22px rgba(0,33,71,0.35)",
          }}
        >
          <div style={{
            width: "100%", height: "100%", borderRadius: "12px", overflow: "hidden",
            background: NAVY, border: "1.5px solid #ffffff",
            display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
          }}>
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span style={{ fontFamily: DISPLAY, fontSize: "48px", fontWeight: 700, color: GOLD }}>{member.name[0]}</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ NAME + ROLE ═══ */}
      <div style={{ textAlign: "center", padding: "10px 18px 0", position: "relative", zIndex: 2 }}>
        <div style={{
          fontFamily: SERIF, fontWeight: 700, fontSize: "23px", color: NAVY, lineHeight: 1.15,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.3px",
        }}>
          {member.name}
        </div>
        <div style={{
          display: "inline-block", marginTop: "6px", padding: "3px 14px",
          border: `1px solid ${GOLD}`, borderRadius: "999px", background: "rgba(212,175,55,0.12)",
          fontFamily: DISPLAY, fontSize: "8px", fontWeight: 700, letterSpacing: "2px",
          color: GOLD_DEEP, textTransform: "uppercase",
        }}>
          {member.currentRole || "Leo Member"}
        </div>
      </div>

      {/* ═══ GOLD DIVIDER ═══ */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", margin: "12px 26px 8px", position: "relative", zIndex: 2 }}>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
        <div style={{ width: "5px", height: "5px", background: GOLD, transform: "rotate(45deg)" }} />
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
      </div>

      {/* ═══ INFO + QR ═══ */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "0 22px", position: "relative", zIndex: 2 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <InfoRow label="Member ID" value={member.memberId} mono />
          {member.faculty && <InfoRow label="Faculty" value={member.faculty} />}
          <InfoRow label="Batch" value={member.batch} />
          {member.joinedLeoYear && <InfoRow label="Joined" value={member.joinedLeoYear} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <div style={{
            padding: "6px", background: "#ffffff", borderRadius: "10px",
            border: `1.5px solid ${GOLD}`, display: "inline-block", lineHeight: 0,
            boxShadow: "0 3px 10px rgba(0,33,71,0.12)",
          }}>
            <QRCodeCanvas value={verifyUrl} size={78 * 2} fgColor={NAVY} bgColor="#ffffff" level="M" style={{ display: "block", width: 78, height: 78 }} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: "6.5px", color: GOLD_DEEP, marginTop: "5px", letterSpacing: "1.4px", fontWeight: 700 }}>
            SCAN TO VERIFY
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: "8px" }} />

      {/* ═══ FOOTER ═══ */}
      <div
        style={{
          background: `linear-gradient(90deg, #001a38, ${NAVY}, #001a38)`,
          padding: "9px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: `2px solid ${GOLD}`, position: "relative", zIndex: 2,
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontSize: "7px", color: "rgba(255,255,255,0.65)", letterSpacing: "1px", fontWeight: 700 }}>
          {member.rollNo ? `ROLL ${member.rollNo}` : "OFFICIAL MEMBER"}
        </div>
        <div style={{ width: "5px", height: "5px", background: GOLD, transform: "rotate(45deg)" }} />
        <div style={{ fontFamily: DISPLAY, fontSize: "7px", color: GOLD_LIGHT, fontWeight: 700, letterSpacing: "0.8px" }}>
          leoclubofkusms.org
        </div>
      </div>

      {/* Inner gold foil border */}
      <div style={{
        position: "absolute", inset: "5px", borderRadius: "12px",
        border: `1px solid rgba(212,175,55,0.5)`, pointerEvents: "none", zIndex: 3,
      }} />
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ padding: "4px 0 5px", borderBottom: "1px solid rgba(201,162,39,0.3)" }}>
      <div style={{ fontFamily: DISPLAY, fontSize: "6.5px", color: GOLD_DEEP, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: mono ? "ui-monospace, monospace" : SERIF,
          fontSize: mono ? "11.5px" : "13.5px", color: NAVY, fontWeight: 700,
          letterSpacing: mono ? "0.6px" : "0.2px", marginTop: "1px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Asset pipeline (same as certificate — pre-size for crisp html2canvas) ────
async function urlToDataUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

async function fitImage(src: string, boxW: number, boxH: number, factor = EXPORT_SCALE): Promise<string> {
  if (!src) return "";
  try {
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return src;

    const ratio = Math.min((boxW * factor) / nw, (boxH * factor) / nh);
    if (ratio >= 1) return src;

    const tw = Math.max(1, Math.round(nw * ratio));
    const th = Math.max(1, Math.round(nh * ratio));

    let cur: CanvasImageSource = img;
    let cw = nw, ch = nh;
    while (cw / 2 > tw) {
      const stepW = Math.round(cw / 2), stepH = Math.round(ch / 2);
      const c = document.createElement("canvas");
      c.width = stepW; c.height = stepH;
      const ctx = c.getContext("2d");
      if (!ctx) return src;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(cur, 0, 0, stepW, stepH);
      cur = c; cw = stepW; ch = stepH;
    }
    const out = document.createElement("canvas");
    out.width = tw; out.height = th;
    const octx = out.getContext("2d");
    if (!octx) return src;
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(cur, 0, 0, tw, th);
    return out.toDataURL("image/png");
  } catch {
    return src;
  }
}

// ── Export helpers ────────────────────────────────────────────────────────────
async function ensureFontsReady() {
  try {
    const anyDoc = document as unknown as { fonts?: { load: (f: string) => Promise<unknown>; ready: Promise<unknown> } };
    if (anyDoc.fonts) {
      await Promise.all([
        anyDoc.fonts.load('700 16px "Cinzel"'),
        anyDoc.fonts.load('700 16px "Cormorant Garamond"'),
      ]).catch(() => {});
      await anyDoc.fonts.ready;
    }
  } catch { /* ignore */ }
}

async function ensureImagesReady(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(imgs.map(async (img) => {
    if (!img.complete) {
      await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });
    }
    try { await img.decode(); } catch { /* ignore */ }
  }));
  await new Promise((r) => setTimeout(r, 60));
}

type H2C = (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
async function captureCard(id: string, scale = EXPORT_SCALE): Promise<HTMLCanvasElement | null> {
  const { default: html2canvas } = (await import("html2canvas")) as { default: H2C };
  const el = document.getElementById(id);
  if (!el) return null;
  await ensureFontsReady();
  await ensureImagesReady(el);
  return html2canvas(el, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 30000,
  });
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
  const [assetsReady, setAssetsReady] = useState(false);
  const [logoAsset, setLogoAsset] = useState("");
  const [lionAsset, setLionAsset] = useState("");

  // Shared font stylesheet (loaded once, reused by the certificate generator too)
  useEffect(() => {
    if (document.getElementById("cert-fonts")) return;
    const l = document.createElement("link");
    l.id = "cert-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Alex+Brush&display=swap";
    document.head.appendChild(l);
  }, []);

  // Pre-size logos to their exact export dimensions (fixes bulk blur)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [logoRaw, lionRaw] = await Promise.all([
          urlToDataUrl(`${BASE}logo.png`),
          urlToDataUrl(`${BASE}lion.png`),
        ]);
        const [logo, lion] = await Promise.all([
          fitImage(logoRaw, 42, 42),
          fitImage(lionRaw, 240, 240),
        ]);
        if (!cancelled) {
          setLogoAsset(logo);
          setLionAsset(lion);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setAssetsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    if (!assetsReady) return;
    setDownloading(member.memberId);
    try {
      const c = await captureCard(`id-card-${member.memberId}`, EXPORT_SCALE);
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
    if (!filtered.length || !assetsReady) return;
    setDownloadingAll(true);
    setBatchProgress(0);
    try {
      const { default: jsPDF } = await import("jspdf");
      // Standard CR80 portrait — 53.98 × 85.6 mm (credit-card size)
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [53.98, 85.6] });
      let page = 0;
      for (let i = 0; i < filtered.length; i++) {
        setBatchProgress(Math.round(((i + 1) / filtered.length) * 100));
        const m = filtered[i];
        const c = await captureCard(`id-card-${m.memberId}`, EXPORT_SCALE);
        if (!c) continue;
        if (page > 0) pdf.addPage([53.98, 85.6], "portrait");
        pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, 53.98, 85.6);
        page++;
        c.width = 0; c.height = 0;
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
            disabled={downloadingAll || !assetsReady}
            className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 shrink-0"
          >
            {downloadingAll
              ? <><Loader2 size={14} className="animate-spin" /> {batchProgress}%</>
              : <><Download size={14} /> Download All ({filtered.length}) PDF</>
            }
          </button>
        )}
      </div>

      {loading || !assetsReady ? (
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

          {/* Vertical cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((m) => (
              <div key={m.memberId} className="group flex flex-col items-center">
                <div id={`id-card-${m.memberId}`} className="mb-3">
                  <IDCard
                    member={m}
                    verifyUrl={verifyUrl(m.memberId)}
                    logoAsset={logoAsset}
                    lionAsset={lionAsset}
                  />
                </div>

                <div className="w-full max-w-[340px] flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#002147] truncate">{m.name}</div>
                    <div className="text-[10px] text-gray-400">{m.memberId} · {m.batch}</div>
                  </div>
                  <button
                    onClick={() => downloadCard(m)}
                    disabled={downloading === m.memberId || !assetsReady}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#002147] border border-[#002147]/20 bg-white hover:bg-[#002147] hover:text-white px-2.5 py-1.5 rounded-lg transition-all shrink-0 disabled:opacity-50"
                  >
                    {downloading === m.memberId
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Download size={12} />}
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
