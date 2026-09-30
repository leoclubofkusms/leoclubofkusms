import { useState, useEffect } from "react";
import { getMembers, getActivities, getAwards, getClubSettings } from "@/lib/firestore";
import type { Member, Activity, Award, ClubSettings } from "@/lib/types";
import { activitySortKey } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
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
  issuedDate: string;
  serial: string;
  sloganPhotoUrl?: string;
  signatureUrl?: string;
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

// ── Safe image: hides itself if src is empty or fails to load ─────────────────
function Img({ src, style }: { src?: string; style: React.CSSProperties }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={style}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// ── Ornament geometry ─────────────────────────────────────────────────────────
function starPoints(cx: number, cy: number, outer: number, inner: number, n: number) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function Seal({ size, dark }: { size: number; dark: boolean }) {
  const id = `sg-${dark ? "d" : "l"}-${Math.round(size)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#8a6d12" />
        </linearGradient>
      </defs>
      <polygon points={starPoints(50, 50, 48, 43, 32)} fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={dark ? "#1a1200" : NAVY} strokeWidth="1.2" />
      <circle cx="50" cy="50" r="33" fill={dark ? "#1a1200" : NAVY} />
      <circle cx="50" cy="50" r="30" fill="none" stroke={GOLD_LIGHT} strokeWidth="0.8" strokeDasharray="2 2" />
      <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="700" fill={GOLD_LIGHT} fontFamily="Cinzel, Georgia, serif">LEO</text>
      <text x="50" y="59" textAnchor="middle" fontSize="6" letterSpacing="1.2" fill={GOLD_LIGHT} fontFamily="Georgia, serif">KUSMS</text>
      <text x="50" y="68" textAnchor="middle" fontSize="5" letterSpacing="1" fill="#fff" fontFamily="Georgia, serif">OFFICIAL</text>
    </svg>
  );
}

function CornerFlourish({ x, y, rot, color }: { x: number; y: number; rot: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} fill="none" stroke={color} strokeWidth="1.4">
      <path d="M0 0 H46 M0 0 V46" strokeWidth="2.4" />
      <path d="M8 8 H34 M8 8 V34" />
      <path d="M14 14 Q30 14 30 30" />
      <path d="M0 0 Q26 4 26 26 Q4 26 0 0Z" strokeWidth="1" opacity="0.7" />
      <rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill={color} stroke="none" />
    </g>
  );
}

// ── Background artwork ────────────────────────────────────────────────────────
function Artwork({ template, W, H }: { template: Template; W: number; H: number }) {
  const dark = template !== "classic";
  const base = template === "gold" ? "#140e00" : template === "modern" ? "#0a1a33" : "#fffdf8";
  const line = dark ? GOLD : NAVY;
  const id = `art-${template}`;
  const rings = Array.from({ length: 14 }, (_, i) => 60 + i * 16);
  return (
    <svg width={W} height={H} viewBox="0 0 794 562" style={{ position: "absolute", inset: 0 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GOLD} />
          <stop offset="50%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={dark ? "#ffffff" : GOLD} stopOpacity={dark ? 0.07 : 0.1} />
          <stop offset="100%" stopColor={dark ? "#ffffff" : GOLD} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-lat`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 H14 M0 0 V14" stroke={line} strokeWidth="0.3" opacity={dark ? 0.12 : 0.07} fill="none" />
        </pattern>
      </defs>
      <rect width="794" height="562" fill={base} />
      <rect width="794" height="562" fill={`url(#${id}-lat)`} />
      <rect width="794" height="562" fill={`url(#${id}-glow)`} />
      <g fill="none" stroke={line} strokeWidth="0.5" opacity={dark ? 0.1 : 0.06}>
        {rings.map((r) => <circle key={r} cx="397" cy="290" r={r} />)}
        {rings.map((r) => <ellipse key={`e${r}`} cx="397" cy="290" rx={r * 1.5} ry={r * 0.55} />)}
      </g>
      <rect x="14" y="14" width="766" height="534" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="5" />
      <rect x="24" y="24" width="746" height="514" fill="none" stroke={dark ? GOLD : NAVY} strokeWidth="1.6" />
      <rect x="30" y="30" width="734" height="502" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="0.8" strokeDasharray="1.5 3" />
      <CornerFlourish x={34} y={34} rot={0} color={GOLD} />
      <CornerFlourish x={760} y={34} rot={90} color={GOLD} />
      <CornerFlourish x={760} y={528} rot={180} color={GOLD} />
      <CornerFlourish x={34} y={528} rot={270} color={GOLD} />
      <rect x="0" y="0" width="794" height="6" fill={`url(#${id}-gold)`} />
      <rect x="0" y="556" width="794" height="6" fill={`url(#${id}-gold)`} />
    </svg>
  );
}

// ── Certificate ───────────────────────────────────────────────────────────────
function CertificateCanvas({ data, scale = 1 }: { data: CertData; scale?: number }) {
  const W = 794 * scale;
  const H = 562 * scale;
  const s = (n: number) => n * scale;
  const dark = data.template !== "classic";
  const main = dark ? "#ffffff" : NAVY;
  const sub = dark ? "rgba(255,255,255,0.72)" : "#4a4a4a";
  const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const DISPLAY = "Cinzel, Georgia, serif";
  const SCRIPT = "'Great Vibes', 'Brush Script MT', cursive";

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

  const rule = (w: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: s(8), width: w }}>
      <div style={{ flex: 1, height: s(1), background: GOLD, opacity: 0.6 }} />
      <div style={{ width: s(6), height: s(6), background: GOLD, transform: "rotate(45deg)" }} />
      <div style={{ flex: 1, height: s(1), background: GOLD, opacity: 0.6 }} />
    </div>
  );

  const hasSlogan = !!data.sloganPhotoUrl;
  const hasSignature = !!data.signatureUrl;

  return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden", fontFamily: SERIF, flexShrink: 0 }}>
      <Artwork template={data.template} W={W} H={H} />

      <Img src={ASSET.lion} style={{
        position: "absolute", left: "50%", top: "50%", width: s(300), height: s(300),
        transform: "translate(-50%,-50%)", objectFit: "contain", opacity: dark ? 0.07 : 0.06,
      }} />

      <div style={{
        position: "absolute", left: s(58), right: s(58), top: s(38), bottom: s(hasSlogan ? 78 : 44),
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: s(14), width: "100%" }}>
          <Img src={ASSET.leo} style={{ height: s(44), width: s(44), objectFit: "contain" }} />
          <div style={{ flex: "0 0 auto", width: s(70), height: s(1), background: GOLD, opacity: 0.6 }} />
          <Img src={ASSET.logo} style={{ height: s(58), width: s(58), objectFit: "contain" }} />
          <div style={{ flex: "0 0 auto", width: s(70), height: s(1), background: GOLD, opacity: 0.6 }} />
          <Img src={ASSET.lion} style={{ height: s(44), width: s(44), objectFit: "contain" }} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: s(11.5), fontWeight: 700, color: main, letterSpacing: s(2), marginTop: s(5) }}>
          LEO CLUB OF KATHMANDU UNIVERSITY SCHOOL OF MEDICAL SCIENCES
        </div>
        <div style={{ fontSize: s(9), color: GOLD, letterSpacing: s(1.5), marginTop: s(2), fontStyle: "italic" }}>
          Lions Clubs International · District 325L Nepal · Club No. 172194
        </div>

        <div style={{ marginTop: s(9) }}>{rule(`${s(300)}px`)}</div>

        <div style={{ fontFamily: DISPLAY, fontSize: s(25), fontWeight: 700, color: GOLD, letterSpacing: s(5), marginTop: s(8), textTransform: "uppercase" }}>
          {titles[data.certType]}
        </div>
        <div style={{ fontSize: s(11.5), color: sub, fontStyle: "italic", marginTop: s(6) }}>
          This certificate is proudly presented to
        </div>

        <div style={{ fontFamily: SCRIPT, fontSize: s(44), color: main, lineHeight: 1.1, marginTop: s(2), maxWidth: s(640) }}>
          {data.recipientName}
        </div>
        <div style={{ width: s(360), height: s(1), background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, marginTop: s(1) }} />

        {data.recipientRole && (
          <div style={{ fontFamily: DISPLAY, fontSize: s(9), color: GOLD, letterSpacing: s(2.5), fontWeight: 700, marginTop: s(5) }}>
            {data.recipientRole.toUpperCase()}  ·  ID {data.recipientId}
          </div>
        )}

        <div style={{ fontSize: s(12), color: sub, lineHeight: 1.45, maxWidth: s(560), marginTop: s(7) }}>
          {bodies[data.certType]}
        </div>
        <div style={{ fontSize: s(17), fontWeight: 700, color: main, lineHeight: 1.2, maxWidth: s(600), marginTop: s(4), fontStyle: data.certType === "participation" ? "italic" : "normal" }}>
          "{subject}"
        </div>

        {data.certType === "participation" && data.activityMonth && (
          <div style={{ fontSize: s(10.5), color: sub, marginTop: s(3), letterSpacing: s(1) }}>
            {data.activityMonth} · Leo Year {data.activityYear}
          </div>
        )}
        {data.certType === "service" && (
          <div style={{ display: "flex", gap: s(26), marginTop: s(4) }}>
            {!!data.activitiesCount && (
              <div><span style={{ fontFamily: DISPLAY, fontSize: s(17), fontWeight: 700, color: GOLD }}>{data.activitiesCount}</span>
                <span style={{ fontSize: s(10), color: sub }}> activities served</span></div>
            )}
            {data.joinedYear && (
              <div><span style={{ fontSize: s(10), color: sub }}>member since </span>
                <span style={{ fontFamily: DISPLAY, fontSize: s(13), fontWeight: 700, color: GOLD }}>{data.joinedYear}</span></div>
            )}
          </div>
        )}
        {data.customMessage && (
          <div style={{ fontSize: s(11), color: sub, fontStyle: "italic", maxWidth: s(520), lineHeight: 1.4, marginTop: s(4) }}>
            {data.customMessage}
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", left: s(58), right: s(58), bottom: s(hasSlogan ? 76 : 42),
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      }}>
        <div style={{ width: s(150), textAlign: "left", fontSize: s(9), color: sub, lineHeight: 1.5 }}>
          <div>Issued on {data.issuedDate}</div>
          <div style={{ fontFamily: "monospace", fontSize: s(8), opacity: 0.85 }}>Serial No. {data.serial}</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: s(22) }}>
          {/* PRESIDENT column — signature image above the line, text below */}
          <div style={{ textAlign: "center", position: "relative" }}>
            {hasSignature && (
              <div style={{
                height: s(38), display: "flex", alignItems: "flex-end", justifyContent: "center",
                marginBottom: s(3),
              }}>
                <Img src={data.signatureUrl} style={{ height: "100%", maxWidth: s(140), objectFit: "contain" }} />
              </div>
            )}
            <div style={{ width: s(120), borderTop: `${s(1)}px solid ${dark ? GOLD : NAVY}`, marginBottom: s(3) }} />
            <div style={{ fontFamily: DISPLAY, fontSize: s(9), color: main, fontWeight: 700, letterSpacing: s(1.5) }}>PRESIDENT</div>
            <div style={{ fontSize: s(8.5), color: sub }}>Leo Club of KUSMS</div>
          </div>

          <div style={{ marginBottom: s(2) }}><Seal size={s(64)} dark={data.template === "gold"} /></div>

          <div style={{ textAlign: "center" }}>
            <div style={{ width: s(120), borderTop: `${s(1)}px solid ${dark ? GOLD : NAVY}`, marginBottom: s(3) }} />
            <div style={{ fontFamily: DISPLAY, fontSize: s(9), color: main, fontWeight: 700, letterSpacing: s(1.5) }}>SECRETARY</div>
            <div style={{ fontSize: s(8.5), color: sub }}>Leo Club of KUSMS</div>
          </div>
        </div>

        <div style={{ width: s(150), display: "flex", justifyContent: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ padding: s(4), background: "#fff", border: `${s(1.5)}px solid ${GOLD}`, borderRadius: s(4), display: "inline-block", lineHeight: 0 }}>
              <QRCodeSVG value={data.verifyUrl} size={s(46)} fgColor={NAVY} level="M" />
            </div>
            <div style={{ fontSize: s(7.5), color: sub, marginTop: s(2) }}>Scan to verify</div>
          </div>
        </div>
      </div>

      {hasSlogan && (
        <div style={{
          position: "absolute", left: "50%", bottom: s(38), transform: "translateX(-50%)",
          height: s(30), padding: `${s(3)}px ${s(18)}px`, background: dark ? "rgba(255,255,255,0.96)" : "transparent",
          borderRadius: s(15), display: "flex", alignItems: "center", justifyContent: "center", maxWidth: s(520),
        }}>
          <Img src={data.sloganPhotoUrl} style={{ height: "100%", maxWidth: s(480), objectFit: "contain" }} />
        </div>
      )}
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
        anyDoc.fonts.load('44px "Great Vibes"'),
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
  const [signatureUrl, setSignatureUrl] = useState("");
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
    if (document.getElementById("cert-fonts")) return;
    const l = document.createElement("link");
    l.id = "cert-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500&family=Great+Vibes&display=swap";
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
        setSignatureUrl(cfg.presidentSignatureUrl ?? "");
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
    const now = new Date();
    const code = { participation: "PA", service: "SV", award: "RC", appreciation: "AP" }[certType];
    const base: CertData = {
      recipientName: member.name,
      recipientRole: member.currentRole || "Leo Member",
      recipientId: member.memberId,
      certType, template, customMessage,
      sloganPhotoUrl,
      signatureUrl,
      verifyUrl: verifyUrl(member.memberId),
      issuedDate: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      serial: `LEO172194-${code}-${now.getFullYear()}-${member.memberId}`,
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
    }
  }

  const CERT_TYPES: { id: CertType; label: string; icon: typeof AwardIcon; desc: string }[] = [
    { id: "participation", label: "Participation", icon: CheckCircle, desc: "For attending an activity" },
    { id: "service", label: "Service", icon: Star, desc: "For overall Leo service" },
    { id: "award", label: "Recognition", icon: AwardIcon, desc: "For an award received" },
    { id: "appreciation", label: "Appreciation", icon: Sparkles, desc: "General appreciation" },
  ];
  const TEMPLATES: { id: Template; label: string; bg: string; desc: string }[] = [
    { id: "classic", label: "Classic", bg: "from-white to-gray-50", desc: "Ivory with navy & gold frame" },
    { id: "modern", label: "Modern", bg: "from-[#0d1f3c] to-[#002147]", desc: "Deep navy with gold accents" },
    { id: "gold", label: "Prestige", bg: "from-[#1a1200] to-[#2a1f00]", desc: "Black-gold luxury style" },
  ];

  const stepLabel = certType === "participation" || certType === "award" ? "4" : "3";

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#002147]">Certificate Generator</h3>
        <p className="text-sm text-gray-500">
          Generate certificates with Leo, Lion and club logos, plus slogan and President's signature from Club Settings.
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
        {certType === "participation" && selectedActivity && activityParticipants.map((m) => (
          <div key={m.memberId} id={`batch-cert-${m.memberId}`}>
            <CertificateCanvas data={buildCertData(m)} scale={1} />
          </div>
        ))}
      </div>
    </div>
  );
}
