import { useState, useEffect } from "react";
import { getMembers, getActivities, getAwards, getClubSettings } from "@/lib/firestore";
import type { Member, Activity, Award, ClubSettings } from "@/lib/types";
import { activitySortKey, leoMonthToCalendarYear } from "@/lib/types";
import { QRCodeCanvas } from "qrcode.react";
import {
  Award as AwardIcon, FileText, Download, Loader2, Star,
  Search, CheckCircle, Eye, Layers, Sparkles,
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
  customMessage?: string;
  verifyUrl: string;
  sloganPhotoUrl?: string;
  sloganText?: string;
  signatureUrl?: string;
  presidentName?: string;
}

const BASE = import.meta.env.BASE_URL ?? "/";
const ASSET = {
  leo: `${BASE}leo.png`,
  lion: `${BASE}lion.png`,
  logo: `${BASE}logo.png`,
};
const NAVY = "#002147";
const GOLD = "#C9A227";
const GOLD_LIGHT = "#F0D77A";
const GOLD_DEEP = "#9C7A14";

const PALETTE: Record<Template, { frame: string; paper: string; ink: string; sub: string; band: number }> = {
  classic: { frame: NAVY,      paper: "#fcfaf3", ink: NAVY,      sub: "#55524a", band: 16 },
  modern:  { frame: "#0a1a33", paper: "#fbf9f2", ink: "#0a1a33", sub: "#4f5563", band: 30 },
  gold:    { frame: "#17110a", paper: "#f8f1dd", ink: "#1b1408", sub: "#5c4f33", band: 22 },
};

// ── Safe image (CSS-only sizing so the browser never upscales a fixed pixel size) ──
function Img({
  src,
  style,
}: {
  src?: string;
  style: React.CSSProperties;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{
        display: "block",
        imageRendering: "auto",
        flexShrink: 0,
        ...style,
      }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// ── Ornament geometry ─────────────────────────────────────────────────────────
function CornerFlourish({ x, y, rot, color }: { x: number; y: number; rot: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} fill="none" stroke={color} strokeWidth="1.3">
      <path d="M0 0 H50 M0 0 V50" strokeWidth="2.2" />
      <path d="M8 8 H36 M8 8 V36" />
      <path d="M15 15 Q33 15 33 33" />
      <path d="M0 0 Q28 4 28 28 Q4 28 0 0Z" strokeWidth="0.9" opacity="0.7" />
      <circle cx="40" cy="8" r="1.6" fill={color} stroke="none" />
      <circle cx="8" cy="40" r="1.6" fill={color} stroke="none" />
      <rect x="-4.5" y="-4.5" width="9" height="9" transform="rotate(45)" fill={color} stroke="none" />
    </g>
  );
}

// ── Background artwork ────────────────────────────────────────────────────────
function Artwork({ template, W, H }: { template: Template; W: number; H: number }) {
  const { frame, paper, band } = PALETTE[template];
  const id = `art-${template}`;
  const rings = Array.from({ length: 12 }, (_, i) => 50 + i * 18);
  const outer = `M0 0H794V562H0Z`;
  const inner = `M${band} ${band}V${562 - band}H${794 - band}V${band}Z`;
  const bandPath = `${outer} ${inner}`;
  const o = band + 14;

  return (
    <svg width={W} height={H} viewBox="0 0 794 562" style={{ position: "absolute", inset: 0 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD} />
          <stop offset="50%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx="50%" cy="50%" r="75%">
          <stop offset="70%" stopColor={GOLD} stopOpacity="0" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.16" />
        </radialGradient>
        <pattern id={`${id}-dia`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M6 0 L12 6 L6 12 L0 6Z" fill="none" stroke={GOLD} strokeWidth="0.7" opacity="0.55" />
        </pattern>
        <pattern id={`${id}-lat`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 H10 M0 0 V10" stroke={frame} strokeWidth="0.25" opacity="0.07" fill="none" />
        </pattern>
      </defs>

      <rect width="794" height="562" fill={paper} />
      <rect width="794" height="562" fill={`url(#${id}-lat)`} />
      <rect width="794" height="562" fill={`url(#${id}-glow)`} />
      <rect width="794" height="562" fill={`url(#${id}-vig)`} />

      <g fill="none" stroke={frame} strokeWidth="0.5" opacity="0.07">
        {rings.map((r) => <ellipse key={`a${r}`} cx="397" cy="281" rx={r * 1.7} ry={r * 0.62} />)}
        {rings.map((r) => <ellipse key={`b${r}`} cx="397" cy="281" rx={r * 0.62} ry={r * 1.7} />)}
      </g>

      <path d={bandPath} fillRule="evenodd" fill={frame} />
      {template === "modern" && <path d={bandPath} fillRule="evenodd" fill={`url(#${id}-dia)`} />}
      {template === "gold" && <path d={bandPath} fillRule="evenodd" fill={`url(#${id}-gold)`} opacity="0.12" />}

      <rect x={band} y={band} width={794 - band * 2} height={562 - band * 2} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="3" />
      <rect x={band + 7} y={band + 7} width={794 - (band + 7) * 2} height={562 - (band + 7) * 2} fill="none" stroke={GOLD} strokeWidth="0.9" />
      <rect x={band + 11} y={band + 11} width={794 - (band + 11) * 2} height={562 - (band + 11) * 2} fill="none" stroke={GOLD} strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.8" />

      <CornerFlourish x={o} y={o} rot={0} color={GOLD} />
      <CornerFlourish x={794 - o} y={o} rot={90} color={GOLD} />
      <CornerFlourish x={794 - o} y={562 - o} rot={180} color={GOLD} />
      <CornerFlourish x={o} y={562 - o} rot={270} color={GOLD} />
    </svg>
  );
}

// ── QR code ───────────────────────────────────────────────────────────────────
function QrCode({ value, size }: { value: string; size: number }) {
  return (
    <div style={{
      padding: Math.max(3, size * 0.08),
      background: "#ffffff",
      border: `1.5px solid ${GOLD}`,
      borderRadius: size * 0.08,
      lineHeight: 0,
      display: "inline-block",
    }}>
      <QRCodeCanvas
        value={value}
        size={size}
        fgColor={NAVY}
        bgColor="#ffffff"
        level="M"
        style={{ display: "block", width: size, height: size }}
      />
    </div>
  );
}

// ── Certificate ───────────────────────────────────────────────────────────────
function CertificateCanvas({ data, scale = 1 }: { data: CertData; scale?: number }) {
  const W = 794 * scale;
  const H = 562 * scale;
  const s = (n: number) => n * scale;
  const { ink, sub } = PALETTE[data.template];
  const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const DISPLAY = "Cinzel, Georgia, serif";
  const SCRIPT = "'Alex Brush', 'Brush Script MT', cursive";

  const titles: Record<CertType, string> = {
    participation: "Certificate of Participation",
    service: "Certificate of Service",
    award: "Certificate of Recognition",
    appreciation: "Certificate of Appreciation",
  };
  const bodies: Record<CertType, string> = {
    participation: "in grateful recognition of their active participation, commitment and spirit of service in",
    service: "in sincere recognition of their dedicated and selfless service, leadership and commitment to",
    award: "in honour of exceptional excellence in service and leadership, and is proudly conferred with the",
    appreciation: "in heartfelt appreciation of their outstanding contributions and unwavering support to",
  };
  const subject =
    data.certType === "participation" ? data.activityTitle || ""
    : data.certType === "service" ? `Leo Club of KUSMS${data.serviceYears ? `  ·  ${data.serviceYears}` : ""}`
    : data.certType === "award" ? data.awardTitle || ""
    : "Leo Club of Kathmandu University School of Medical Sciences";

  const rule = (w: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: s(8), width: s(w) }}>
      <div style={{ flex: 1, height: s(1), background: `linear-gradient(90deg,transparent,${GOLD})` }} />
      <div style={{ width: s(6), height: s(6), background: GOLD, transform: "rotate(45deg)" }} />
      <div style={{ flex: 1, height: s(1), background: `linear-gradient(270deg,transparent,${GOLD})` }} />
    </div>
  );

  const hasSloganPhoto = !!data.sloganPhotoUrl;
  const hasSloganText = !!data.sloganText;
  const hasSignature = !!data.signatureUrl;
  const hasMonthChip = data.certType === "participation" && !!data.activityMonth && !!data.activityYear;

  // Compute calendar year for the activity month within its Leo Year
  const calendarYear = hasMonthChip && data.activityMonth && data.activityYear
    ? leoMonthToCalendarYear(data.activityYear, data.activityMonth)
    : null;

  return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden", fontFamily: SERIF, flexShrink: 0 }}>
      <Artwork template={data.template} W={W} H={H} />

      <Img src={ASSET.lion} style={{
        position: "absolute", left: "50%", top: "47%", width: s(290), height: s(290),
        transform: "translate(-50%,-50%)", objectFit: "contain", opacity: 0.06,
      }} />

      <div style={{
        position: "absolute", left: s(64), right: s(64), top: s(46), bottom: s(128),
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        {/* Top row — logos with flexShrink:0 so long titles never squeeze them */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: s(16), width: "100%", flexShrink: 0,
        }}>
          <Img src={ASSET.leo} style={{ height: s(56), width: s(56), objectFit: "contain" }} />
          <div style={{ width: s(60), height: s(1), background: `linear-gradient(90deg,transparent,${GOLD})`, flexShrink: 0 }} />
          <Img src={ASSET.logo} style={{ height: s(72), width: s(72), objectFit: "contain" }} />
          <div style={{ width: s(60), height: s(1), background: `linear-gradient(270deg,transparent,${GOLD})`, flexShrink: 0 }} />
          <Img src={ASSET.lion} style={{ height: s(56), width: s(56), objectFit: "contain" }} />
        </div>

        <div style={{ fontFamily: DISPLAY, fontSize: s(10.5), fontWeight: 700, color: ink, letterSpacing: s(2), marginTop: s(6) }}>
          LEO CLUB OF KATHMANDU UNIVERSITY SCHOOL OF MEDICAL SCIENCES
        </div>
        <div style={{ fontSize: s(9), color: GOLD_DEEP, letterSpacing: s(1.2), marginTop: s(2), fontStyle: "italic", fontWeight: 700 }}>
          Lions Clubs International · District 325L Nepal · Club No. 172194
        </div>

        {/* Leo Year chip — participation only */}
        {hasMonthChip && (
          <div style={{
            marginTop: s(5),
            display: "inline-flex",
            alignItems: "center",
            gap: s(6),
            padding: `${s(2)}px ${s(10)}px`,
            borderRadius: s(20),
            border: `${s(0.8)}px solid ${GOLD}`,
            background: "rgba(201,162,39,0.08)",
          }}>
            <span style={{ width: s(4), height: s(4), background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
            <span style={{ fontFamily: DISPLAY, fontSize: s(8.5), color: GOLD_DEEP, letterSpacing: s(1.6), fontWeight: 700, whiteSpace: "nowrap" }}>
              {data.activityMonth!.toUpperCase()} {calendarYear}  ·  LEO YEAR {data.activityYear}
            </span>
            <span style={{ width: s(4), height: s(4), background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
          </div>
        )}

        <div style={{ marginTop: s(6) }}>{rule(300)}</div>

        <div style={{ fontFamily: DISPLAY, fontSize: s(23), fontWeight: 700, color: GOLD_DEEP, letterSpacing: s(4.5), marginTop: s(7), textTransform: "uppercase" }}>
          {titles[data.certType]}
        </div>
        <div style={{ fontSize: s(11.5), color: sub, fontStyle: "italic", marginTop: s(4) }}>
          This certificate is proudly presented to
        </div>

        <div style={{
          fontFamily: SCRIPT, fontSize: s(46), color: ink, lineHeight: 1.15,
          marginTop: s(1), maxWidth: s(640), paddingBottom: s(2),
        }}>
          {data.recipientName}
        </div>
        <div style={{ width: s(360), height: s(1.2), background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />

        {data.recipientRole && (
          <div style={{ fontFamily: DISPLAY, fontSize: s(8.5), color: GOLD_DEEP, letterSpacing: s(2.2), fontWeight: 700, marginTop: s(5) }}>
            {data.recipientRole.toUpperCase()}  ·  ID {data.recipientId}
          </div>
        )}

        <div style={{ fontSize: s(11.5), color: sub, lineHeight: 1.42, maxWidth: s(540), marginTop: s(6), fontWeight: 500 }}>
          {bodies[data.certType]}
        </div>
        <div style={{
          fontSize: s(16.5), fontWeight: 700, color: ink, lineHeight: 1.22, maxWidth: s(600), marginTop: s(3),
          fontStyle: data.certType === "participation" ? "italic" : "normal",
        }}>
          &ldquo;{subject}&rdquo;
        </div>

        {/* NOTE: month/year line removed from middle — now shown in top chip */}

        {data.certType === "service" && (
          <div style={{ display: "flex", gap: s(24), marginTop: s(4) }}>
            {!!data.activitiesCount && (
              <div><span style={{ fontFamily: DISPLAY, fontSize: s(15), fontWeight: 700, color: GOLD_DEEP }}>{data.activitiesCount}</span>
                <span style={{ fontSize: s(10), color: sub }}> activities served</span></div>
            )}
            {data.joinedYear && (
              <div><span style={{ fontSize: s(10), color: sub }}>member since </span>
                <span style={{ fontFamily: DISPLAY, fontSize: s(12), fontWeight: 700, color: GOLD_DEEP }}>{data.joinedYear}</span></div>
            )}
          </div>
        )}
        {data.customMessage && (
          <div style={{ fontSize: s(10.5), color: sub, fontStyle: "italic", maxWidth: s(520), lineHeight: 1.35, marginTop: s(3) }}>
            {data.customMessage}
          </div>
        )}
      </div>

      {/* Bottom row: QR (left) · Slogan photo + slogan text (center) · President (right) */}
      <div style={{ position: "absolute", left: s(76), bottom: s(40), display: "flex", flexDirection: "column", alignItems: "center" }}>
        <QrCode value={data.verifyUrl} size={Math.round(s(58))} />
        <div style={{ fontSize: s(7.5), color: sub, marginTop: s(3), letterSpacing: s(0.5) }}>Scan to verify</div>
      </div>

      {(hasSloganPhoto || hasSloganText) && (
        <div style={{
          position: "absolute", left: "50%", bottom: s(40), transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
          width: s(300), gap: s(4),
        }}>
          {hasSloganPhoto && (
            <Img src={data.sloganPhotoUrl} style={{ maxHeight: s(58), maxWidth: s(300), objectFit: "contain" }} />
          )}
          {hasSloganText && (
            <div style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: s(11),
              color: GOLD_DEEP,
              letterSpacing: s(0.6),
              textAlign: "center",
              fontWeight: 600,
              lineHeight: 1.25,
              maxWidth: s(280),
            }}>
              &ldquo;{data.sloganText}&rdquo;
            </div>
          )}
        </div>
      )}

      <div style={{
        position: "absolute", right: s(70), bottom: s(40),
        display: "flex", flexDirection: "column", alignItems: "center", width: s(190),
      }}>
        <div style={{ height: s(48), width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: s(2) }}>
          {hasSignature && (
            <Img
              src={data.signatureUrl}
              style={{ maxHeight: "100%", maxWidth: s(160), objectFit: "contain", background: "transparent" }}
            />
          )}
        </div>
        <div style={{ width: s(160), height: s(1.4), background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, marginBottom: s(4) }} />
        <div style={{ fontFamily: DISPLAY, fontSize: s(10), color: ink, fontWeight: 700, letterSpacing: s(2.4) }}>PRESIDENT</div>
        {data.presidentName && (
          <div style={{ fontSize: s(9.5), color: ink, letterSpacing: s(0.8), marginTop: s(2), fontStyle: "italic", fontWeight: 600 }}>
            {data.presidentName}
          </div>
        )}
        <div style={{ fontSize: s(8.5), color: sub, letterSpacing: s(0.6), fontStyle: "italic", marginTop: data.presidentName ? s(1) : s(2) }}>
          Leo Club of KUSMS
        </div>
      </div>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────
async function ensureFontsReady() {
  try {
    const anyDoc = document as unknown as { fonts?: { load: (f: string) => Promise<unknown>; ready: Promise<unknown> } };
    if (anyDoc.fonts) {
      await Promise.all([
        anyDoc.fonts.load('700 16px "Cinzel"'),
        anyDoc.fonts.load('500 16px "Cormorant Garamond"'),
        anyDoc.fonts.load('700 16px "Cormorant Garamond"'),
        anyDoc.fonts.load('46px "Alex Brush"'),
      ]).catch(() => {});
      await anyDoc.fonts.ready;
    }
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
async function capture(id: string, scale = 3): Promise<HTMLCanvasElement | null> {
  const { default: html2canvas } = (await import("html2canvas")) as { default: H2C };
  const el = document.getElementById(id);
  if (!el) return null;
  await ensureFontsReady();
  await ensureImagesReady(el);
  return html2canvas(el, { scale, backgroundColor: null, useCORS: true, allowTaint: true });
}

async function downloadPng(id: string, filename: string) {
  const c = await capture(id);
  if (!c) return;
  const a = document.createElement("a");
  a.download = filename;
  a.href = c.toDataURL("image/png");
  a.click();
}

async function downloadPdf(id: string, filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const c = await capture(id);
  if (!c) return;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
  pdf.save(filename);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CertificateGenerator() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [sloganPhotoUrl, setSloganPhotoUrl] = useState("");
  const [sloganText, setSloganText] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [presidentName, setPresidentName] = useState("");
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
  const [batchRenderReady, setBatchRenderReady] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (document.getElementById("cert-fonts")) return;
    const l = document.createElement("link");
    l.id = "cert-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Alex+Brush&display=swap";
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    Promise.all([
      getMembers().catch(() => [] as Member[]),
      getActivities().catch(() => [] as Activity[]),
      getAwards().catch(() => [] as Award[]),
      getClubSettings().catch(() => ({} as ClubSettings)),
    ])
      .then(([m, a, aw, st]) => {
        setMembers(m.sort((x, y) => x.name.localeCompare(y.name)));
        setActivities(a.sort((x, y) => activitySortKey(y.year, y.month) - activitySortKey(x.year, x.month)));
        setAwards(aw);
        const cfg = st as ClubSettings;
        setSloganPhotoUrl(cfg.presidentSloganPhotoUrl ?? "");
        setSloganText(cfg.presidentSlogan ?? "");
        setSignatureUrl(cfg.presidentSignatureUrl ?? "");
        setPresidentName(cfg.presidentSloganName ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verifyUrl = (id: string) => `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${id}`;

  function serviceYears(m: Member) {
    const j = m.joinedLeoYear ?? "", l = m.leftLeoYear ?? "";
    return j && l ? `${j} – ${l}` : j ? `${j} – Present` : "";
  }
  const activitiesForMember = (m: Member) =>
    activities.filter((a) => a.participants.some((p) => p.memberId === m.memberId)).length;

  function buildCertData(member: Member): CertData {
    const base: CertData = {
      recipientName: member.name,
      recipientRole: member.currentRole || "Leo Member",
      recipientId: member.memberId,
      certType, template, customMessage,
      sloganPhotoUrl,
      sloganText,
      signatureUrl,
      presidentName,
      verifyUrl: verifyUrl(member.memberId),
    };
    if (certType === "participation" && selectedActivity) {
      base.activityTitle = selectedActivity.title;
      base.activityMonth = selectedActivity.month;
      base.activityYear = selectedActivity.year;
      const p = selectedActivity.participants.find((x) => x.memberId === member.memberId);
      if (p?.awardTitle) base.recipientRole = p.awardTitle;
    }
    if (certType === "service") {
      base.serviceYears = serviceYears(member);
      base.activitiesCount = activitiesForMember(member);
      base.joinedYear = member.joinedLeoYear ?? "";
    }
    if (certType === "award" && selectedAward) base.awardTitle = selectedAward.title;
    return base;
  }

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q) || m.batch.toLowerCase().includes(q);
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
      if (fmt === "png") await downloadPng("cert-export-single", `${fn}.png`);
      else await downloadPdf("cert-export-single", `${fn}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  async function downloadBatchForActivity() {
    if (!selectedActivity) return;
    setBatchDownloading(true);
    setBatchRenderReady(true);
    await new Promise((r) => setTimeout(r, 400));
    try {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      let page = 0;
      for (let i = 0; i < activityParticipants.length; i++) {
        setBatchProgress(Math.round(((i + 1) / activityParticipants.length) * 100));
        const c = await capture(`batch-cert-${activityParticipants[i].memberId}`, 2);
        if (!c) continue;
        if (page > 0) pdf.addPage();
        pdf.addImage(c.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pw, ph);
        page++;
      }
      pdf.save(`${selectedActivity.title.replace(/\s+/g, "-")}-certificates.pdf`);
    } finally {
      setBatchDownloading(false);
      setBatchProgress(0);
      setBatchRenderReady(false);
    }
  }

  const CERT_TYPES: { id: CertType; label: string; icon: typeof AwardIcon; desc: string }[] = [
    { id: "participation", label: "Participation", icon: CheckCircle, desc: "For attending an activity" },
    { id: "service", label: "Service", icon: Star, desc: "For overall Leo service" },
    { id: "award", label: "Recognition", icon: AwardIcon, desc: "For an award received" },
    { id: "appreciation", label: "Appreciation", icon: Sparkles, desc: "General appreciation" },
  ];
  const TEMPLATES: { id: Template; label: string; bg: string; desc: string }[] = [
    { id: "classic", label: "Classic", bg: "from-[#fcfaf3] via-[#fcfaf3] to-[#002147]", desc: "Ivory paper, navy frame, gold rules" },
    { id: "modern", label: "Royal", bg: "from-[#fbf9f2] via-[#fbf9f2] to-[#0a1a33]", desc: "Wide navy lattice border" },
    { id: "gold", label: "Prestige", bg: "from-[#f8f1dd] via-[#f8f1dd] to-[#17110a]", desc: "Champagne paper, black-gold frame" },
  ];

  const stepLabel = certType === "participation" || certType === "award" ? "4" : "3";

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#002147]">Certificate Generator</h3>
        <p className="text-sm text-gray-500">
          Generate certificates with club logos, the President&apos;s signature, name and slogan — all pulled from Club Settings.
          Download individually or batch-export an activity as one PDF.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-2 space-y-5">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 1 · Certificate Type</div>
              <div className="grid grid-cols-2 gap-2">
                {CERT_TYPES.map(({ id, label, icon: Icon, desc }) => (
                  <button key={id}
                    onClick={() => { setCertType(id); setSelectedActivity(null); setSelectedAward(null); }}
                    className={`text-left p-3 rounded-xl border transition-all ${certType === id ? "border-[#002147] bg-[#002147] text-white" : "border-gray-200 hover:border-[#002147]/30 hover:bg-gray-50"}`}>
                    <Icon size={15} className={certType === id ? "text-[#D4AF37]" : "text-gray-400"} />
                    <div className={`text-sm font-semibold mt-1.5 ${certType === id ? "text-white" : "text-[#002147]"}`}>{label}</div>
                    <div className={`text-xs mt-0.5 ${certType === id ? "text-white/60" : "text-gray-400"}`}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 2 · Design Template</div>
              <div className="space-y-2">
                {TEMPLATES.map(({ id, label, bg, desc }) => (
                  <button key={id} onClick={() => setTemplate(id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${template === id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className={`w-10 h-7 rounded-lg bg-gradient-to-br ${bg} border border-[#D4AF37]/50 shrink-0`} />
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-[#002147]">{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                    {template === id && <CheckCircle size={15} className="text-[#D4AF37] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {certType === "participation" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 3 · Select Activity</div>
                <select
                  value={selectedActivity?.id ?? ""}
                  onChange={(e) => { setSelectedActivity(activities.find((a) => a.id === e.target.value) ?? null); setSelectedMember(null); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                  <option value="">— Choose an activity —</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.title} · {a.month} {a.year} ({a.participants.length} participants)</option>
                  ))}
                </select>
                {selectedActivity && activityParticipants.length > 0 && (
                  <div className="mt-3 p-3 bg-[#002147]/5 rounded-xl">
                    <div className="text-xs text-gray-500 mb-2">{activityParticipants.length} participants — batch download:</div>
                    <button onClick={downloadBatchForActivity} disabled={batchDownloading}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60">
                      {batchDownloading
                        ? <><Loader2 size={14} className="animate-spin" /> Generating… {batchProgress}%</>
                        : <><Layers size={14} /> Download All {activityParticipants.length} Certificates PDF</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {certType === "award" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 3 · Select Award</div>
                <select
                  value={selectedAward?.id ?? ""}
                  onChange={(e) => setSelectedAward(awards.find((a) => a.id === e.target.value) ?? null)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]">
                  <option value="">— Choose an award —</option>
                  {awards.filter((a) => a.type === "member").map((a) => (
                    <option key={a.id} value={a.id}>{a.title} · {a.recipientName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step {stepLabel} · Select Member</div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members…"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147]" />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {(certType === "participation" && selectedActivity
                  ? filteredMembers.filter((m) => selectedActivity.participants.some((p) => p.memberId === m.memberId))
                  : filteredMembers
                ).map((m) => {
                  const on = selectedMember?.memberId === m.memberId;
                  return (
                    <button key={m.memberId} onClick={() => setSelectedMember(m)}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${on ? "bg-[#002147] text-white" : "hover:bg-gray-50 text-[#002147]"}`}>
                      {m.photoUrl
                        ? <img src={m.photoUrl} alt={m.name} className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white/20" />
                        : <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${on ? "bg-white/20 text-white" : "bg-[#002147] text-white"}`}>{m.name[0]}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{m.name}</div>
                        <div className={`text-xs ${on ? "text-white/50" : "text-gray-400"}`}>{m.memberId} · {m.batch}</div>
                      </div>
                      {on && <CheckCircle size={14} className="text-[#D4AF37] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Custom Message (optional)</div>
              <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={2}
                placeholder="Add a personal note to appear on the certificate…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-none" />
            </div>
          </div>

          <div className="xl:col-span-3">
            {!certData ? (
              <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 gap-3">
                <FileText size={40} className="opacity-30" />
                <p className="text-sm">Select a member to preview their certificate</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => downloadSingle("pdf")} disabled={downloading}
                    className="inline-flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#003575] transition-colors disabled:opacity-60">
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download PDF
                  </button>
                  <button onClick={() => downloadSingle("png")} disabled={downloading}
                    className="inline-flex items-center gap-2 bg-white border border-[#002147]/20 text-[#002147] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#002147] hover:text-white transition-colors disabled:opacity-60">
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download PNG
                  </button>
                  <button onClick={() => setShowPreview((v) => !v)}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#002147] px-3 py-2.5 rounded-xl border border-gray-200 hover:border-[#002147]/30 transition-colors ml-auto">
                    <Eye size={14} /> {showPreview ? "Hide" : "Show"} Preview
                  </button>
                </div>

                {showPreview && (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-b border-gray-200 flex items-center gap-2">
                      <Eye size={12} /> Preview · {TEMPLATES.find((t) => t.id === certData.template)?.label} Template
                    </div>
                    <div className="overflow-x-auto p-4 bg-gray-100">
                      <CertificateCanvas data={certData} scale={0.72} />
                    </div>
                  </div>
                )}

                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  {selectedMember?.photoUrl
                    ? <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-[#002147] flex items-center justify-center text-xl font-bold text-[#D4AF37] shrink-0">{selectedMember!.name[0]}</div>}
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

      {/* Hidden full-size copies used for export */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }} aria-hidden>
        {certData && <div id="cert-export-single"><CertificateCanvas data={certData} scale={1} /></div>}
        {batchRenderReady && selectedActivity && activityParticipants.map((m) => (
          <div key={m.memberId} id={`batch-cert-${m.memberId}`}>
            <CertificateCanvas data={buildCertData(m)} scale={1} />
          </div>
        ))}
      </div>
    </div>
  );
}
