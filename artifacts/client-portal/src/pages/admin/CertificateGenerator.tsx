import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
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

// Recipient name pre-rendered on a canvas (w/h are CSS px at scale 1)
interface NameImg { url: string; w: number; h: number }

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
  nameImg?: NameImg;
  leoAsset: string;
  lionAsset: string;
  lionMarkAsset: string;
  logoAsset: string;
}

const BASE = import.meta.env.BASE_URL ?? "/";
const NAVY = "#002147";
const GOLD = "#C9A227";
const GOLD_LIGHT = "#F0D77A";
const GOLD_DEEP = "#9C7A14";

const EXPORT_SCALE = 3;
const BATCH_CHUNK = 25;          // certificates per PDF in bulk (keeps phone memory in check)
const BATCH_JPEG_QUALITY = 0.95; // bulk pages are JPEG; single download stays PNG

// Logo box sizes (CSS px at scale 1)
const LOGO_LEO = 72;
const LOGO_LION = 72;
const LOGO_MAIN = 92;
const LOGO_WATERMARK = 290;
const SLOGAN_MAX_H = 96;
const SLOGAN_MAX_W = 380;
const SIG_MAX_H = 52;
const SIG_MAX_W = 170;

// Recipient name image (drawn on a canvas so the export cannot move it)
const NAME_FONT = 46;
const NAME_BOX_H = 62;
const NAME_BASELINE = 42; // distance from top of the name box to the text baseline
const NAME_MAX_W = 640;
const NAME_RATIO = 4;

const PALETTE: Record<Template, { frame: string; paper: string; ink: string; sub: string; band: number }> = {
  classic: { frame: NAVY,      paper: "#fcfaf3", ink: NAVY,      sub: "#55524a", band: 16 },
  modern:  { frame: "#0a1a33", paper: "#fbf9f2", ink: "#0a1a33", sub: "#4f5563", band: 30 },
  gold:    { frame: "#17110a", paper: "#f8f1dd", ink: "#1b1408", sub: "#5c4f33", band: 22 },
};

// ── Safe image ────────────────────────────────────────────────────────────────
function Img({ src, style }: { src?: string; style: React.CSSProperties }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      decoding="sync"
      style={{ display: "block", imageRendering: "auto", flexShrink: 0, ...style }}
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
        <linearGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="794" y2="562">
          <stop offset="0%" stopColor="#A98314" />
          <stop offset="22%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="78%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor="#A98314" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx="50%" cy="50%" r="75%">
          <stop offset="68%" stopColor={GOLD} stopOpacity="0" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.2" />
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

      <g fill="none" stroke={frame} strokeWidth="0.5" opacity="0.075">
        {rings.map((r) => <ellipse key={`a${r}`} cx="397" cy="281" rx={r * 1.7} ry={r * 0.62} />)}
        {rings.map((r) => <ellipse key={`b${r}`} cx="397" cy="281" rx={r * 0.62} ry={r * 1.7} />)}
      </g>

      <path d={bandPath} fillRule="evenodd" fill={frame} />
      {template === "modern" && <path d={bandPath} fillRule="evenodd" fill={`url(#${id}-dia)`} />}
      {template === "gold" && <path d={bandPath} fillRule="evenodd" fill={`url(#${id}-gold)`} opacity="0.14" />}

      <rect x={band - 2.5} y={band - 2.5} width={794 - (band - 2.5) * 2} height={562 - (band - 2.5) * 2} fill="none" stroke="#000000" strokeOpacity="0.35" strokeWidth="0.8" />
      <rect x={band} y={band} width={794 - band * 2} height={562 - band * 2} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="3.2" />
      <rect x={band + 2.8} y={band + 2.8} width={794 - (band + 2.8) * 2} height={562 - (band + 2.8) * 2} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.6" />
      <rect x={band + 7} y={band + 7} width={794 - (band + 7) * 2} height={562 - (band + 7) * 2} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1" />
      <rect x={band + 11.5} y={band + 11.5} width={794 - (band + 11.5) * 2} height={562 - (band + 11.5) * 2} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeDasharray="0.01 4.6" opacity="0.9" />

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
      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    }}>
      {/* Canvas is drawn at export resolution so the export maps it 1:1 (no stretching) */}
      <QRCodeCanvas
        value={value}
        size={size * EXPORT_SCALE}
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
    : data.certType === "service" ? `Leo Club of Kathmandu University School of Medical Sciences${data.serviceYears ? `  ·  ${data.serviceYears}` : ""}`
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

  const calendarYear = hasMonthChip && data.activityMonth && data.activityYear
    ? leoMonthToCalendarYear(data.activityYear, data.activityMonth)
    : null;

  return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden", fontFamily: SERIF, flexShrink: 0 }}>
      <Artwork template={data.template} W={W} H={H} />

      <Img src={data.lionMarkAsset} style={{
        position: "absolute", left: "50%", top: "47%", width: s(LOGO_WATERMARK), height: s(LOGO_WATERMARK),
        transform: "translate(-50%,-50%)", objectFit: "contain", opacity: 0.06,
      }} />

      <div style={{
        position: "absolute", left: s(64), right: s(64), top: s(42), bottom: s(128),
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        {/* Logos */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: s(18), width: "100%", flexShrink: 0,
        }}>
          <Img src={data.leoAsset} style={{ height: s(LOGO_LEO), width: s(LOGO_LEO), objectFit: "contain" }} />
          <div style={{ width: s(56), height: s(1), background: `linear-gradient(90deg,transparent,${GOLD})`, flexShrink: 0 }} />
          <Img src={data.logoAsset} style={{ height: s(LOGO_MAIN), width: s(LOGO_MAIN), objectFit: "contain" }} />
          <div style={{ width: s(56), height: s(1), background: `linear-gradient(270deg,transparent,${GOLD})`, flexShrink: 0 }} />
          <Img src={data.lionAsset} style={{ height: s(LOGO_LION), width: s(LOGO_LION), objectFit: "contain" }} />
        </div>

        <div style={{ fontFamily: DISPLAY, fontSize: s(10.5), fontWeight: 700, color: ink, letterSpacing: s(2), marginTop: s(8) }}>
          LEO CLUB OF KATHMANDU UNIVERSITY SCHOOL OF MEDICAL SCIENCES
        </div>
        <div style={{ fontSize: s(9), color: GOLD_DEEP, letterSpacing: s(1.2), marginTop: s(2), fontStyle: "italic", fontWeight: 700 }}>
          Lions Clubs International · District 325L Nepal · Club No. 172194
        </div>

        {/* Month chip */}
        {hasMonthChip && (
          <div style={{
            marginTop: s(5),
            display: "inline-flex",
            alignItems: "center",
            gap: s(6),
            padding: `${s(2)}px ${s(10)}px`,
            borderRadius: s(20),
            border: `${s(0.8)}px solid ${GOLD}`,
            background: "linear-gradient(180deg, rgba(240,215,122,0.22), rgba(201,162,39,0.08))",
          }}>
            <span style={{ width: s(4), height: s(4), background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
            <span style={{ fontFamily: DISPLAY, fontSize: s(8.5), color: GOLD_DEEP, letterSpacing: s(1.6), fontWeight: 700, whiteSpace: "nowrap" }}>
              {data.activityMonth!.toUpperCase()} {calendarYear}  ·  LEO YEAR {data.activityYear}
            </span>
            <span style={{ width: s(4), height: s(4), background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
          </div>
        )}

        <div style={{ marginTop: s(5) }}>{rule(300)}</div>

        <div style={{
          fontFamily: DISPLAY, fontSize: s(23), fontWeight: 700, color: GOLD_DEEP, letterSpacing: s(4.5),
          marginTop: s(6), textTransform: "uppercase",
          textShadow: `0 ${s(1)}px 0 rgba(255,255,255,0.9), 0 ${s(-0.6)}px 0 rgba(120,90,10,0.25)`,
        }}>
          {titles[data.certType]}
        </div>
        <div style={{ fontSize: s(11.5), color: sub, fontStyle: "italic", marginTop: s(3) }}>
          This certificate is proudly presented to
        </div>

        {/* Recipient: pre-rendered on a canvas so the export cannot shift it */}
        {data.nameImg ? (
          <img
            src={data.nameImg.url}
            alt={data.recipientName}
            decoding="sync"
            style={{ display: "block", width: s(data.nameImg.w), height: s(data.nameImg.h), marginTop: s(2), flexShrink: 0 }}
          />
        ) : (
          <div style={{
            fontFamily: SCRIPT, fontSize: s(NAME_FONT), color: ink, lineHeight: 1.15,
            marginTop: s(2), maxWidth: s(NAME_MAX_W), height: s(NAME_BOX_H), flexShrink: 0,
            textShadow: `0 ${s(1)}px ${s(1.5)}px rgba(0,0,0,0.14)`,
          }}>
            {data.recipientName}
          </div>
        )}
        <div style={{ width: s(360), height: s(1.2), background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, marginTop: s(-2) }} />

        {data.recipientRole && (
          <div style={{ fontFamily: DISPLAY, fontSize: s(8.5), color: GOLD_DEEP, letterSpacing: s(2.2), fontWeight: 700, marginTop: s(6) }}>
            {data.recipientRole.toUpperCase()}  ·  ID {data.recipientId}
          </div>
        )}

        <div style={{ fontSize: s(11.5), color: sub, lineHeight: 1.42, maxWidth: s(540), marginTop: s(5), fontWeight: 500 }}>
          {bodies[data.certType]}
        </div>
        <div style={{
          fontSize: s(16.5), fontWeight: 700, color: ink, lineHeight: 1.22, maxWidth: s(600), marginTop: s(3),
          fontStyle: data.certType === "participation" ? "italic" : "normal",
        }}>
          &ldquo;{subject}&rdquo;
        </div>

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

      {/* Bottom-left: QR */}
      <div style={{ position: "absolute", left: s(76), bottom: s(40), display: "flex", flexDirection: "column", alignItems: "center" }}>
        <QrCode value={data.verifyUrl} size={Math.round(s(58))} />
        <div style={{ fontSize: s(7.5), color: sub, marginTop: s(3), letterSpacing: s(0.5) }}>Scan to verify</div>
      </div>

      {/* Bottom-centre: slogan photo + text */}
      {(hasSloganPhoto || hasSloganText) && (
        <div style={{
          position: "absolute", left: "50%", bottom: s(36), transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
          width: s(SLOGAN_MAX_W), gap: s(4),
        }}>
          {hasSloganPhoto && (
            <Img src={data.sloganPhotoUrl} style={{ maxHeight: s(SLOGAN_MAX_H), maxWidth: s(SLOGAN_MAX_W), objectFit: "contain" }} />
          )}
          {hasSloganText && (
            <div style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: s(10.5),
              color: GOLD_DEEP,
              letterSpacing: s(0.5),
              textAlign: "center",
              fontWeight: 600,
              lineHeight: 1.22,
              maxWidth: s(SLOGAN_MAX_W - 20),
            }}>
              &ldquo;{data.sloganText}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Bottom-right: President */}
      <div style={{
        position: "absolute", right: s(70), bottom: s(40),
        display: "flex", flexDirection: "column", alignItems: "center", width: s(190),
      }}>
        <div style={{ height: s(SIG_MAX_H), width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: s(2) }}>
          {hasSignature && (
            <Img
              src={data.signatureUrl}
              style={{ maxHeight: "100%", maxWidth: s(SIG_MAX_W), objectFit: "contain", background: "transparent" }}
            />
          )}
        </div>
        <div style={{ width: s(170), height: s(1.4), background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, marginBottom: s(4) }} />
        <div style={{ fontFamily: DISPLAY, fontSize: s(10), color: ink, fontWeight: 700, letterSpacing: s(2.4) }}>PRESIDENT</div>
        {data.presidentName && (
          <div style={{ fontSize: s(9.5), color: ink, letterSpacing: s(0.8), marginTop: s(2), fontStyle: "italic", fontWeight: 600 }}>
            {data.presidentName}
          </div>
        )}
        <div style={{
          fontSize: s(8), color: sub, letterSpacing: s(0.3), fontStyle: "italic",
          lineHeight: 1.25, textAlign: "center", marginTop: data.presidentName ? s(1) : s(2),
        }}>
          Leo Club of Kathmandu University<br />School of Medical Sciences
        </div>
      </div>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────

// The Google Fonts stylesheet must be loaded before anything measures or draws text.
let fontCssReady: Promise<void> | null = null;
function loadFontCss(): Promise<void> {
  if (fontCssReady) return fontCssReady;
  fontCssReady = new Promise<void>((resolve) => {
    const existing = document.getElementById("cert-fonts") as HTMLLinkElement | null;
    const l = existing ?? document.createElement("link");
    if (!existing) {
      l.id = "cert-fonts";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Alex+Brush&display=swap";
      document.head.appendChild(l);
    }
    if (l.sheet) { resolve(); return; }
    l.addEventListener("load", () => resolve(), { once: true });
    l.addEventListener("error", () => resolve(), { once: true });
    setTimeout(resolve, 6000);
  });
  return fontCssReady;
}

// Scale-aware font loader: matches the pixel sizes html2canvas will render.
async function ensureFontsReady(scale: number = EXPORT_SCALE) {
  try {
    await loadFontCss();
    const anyDoc = document as unknown as { fonts?: { load: (f: string) => Promise<unknown>; ready: Promise<unknown> } };
    if (!anyDoc.fonts) return;
    const px = (n: number) => `${Math.round(n * scale)}px`;
    await Promise.all([
      anyDoc.fonts.load(`700 ${px(10.5)} "Cinzel"`),
      anyDoc.fonts.load(`700 ${px(23)} "Cinzel"`),
      anyDoc.fonts.load(`500 ${px(11.5)} "Cormorant Garamond"`),
      anyDoc.fonts.load(`700 ${px(16.5)} "Cormorant Garamond"`),
      anyDoc.fonts.load(`italic 600 ${px(10.5)} "Cormorant Garamond"`),
      anyDoc.fonts.load(`italic 600 ${px(11.5)} "Cormorant Garamond"`),
    ]).catch(() => {});
    await anyDoc.fonts.ready;
    await new Promise((r) => setTimeout(r, 140));
  } catch { /* ignore */ }
}

async function ensureImagesReady(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(imgs.map(async (img) => {
    if (!img.complete || img.naturalWidth === 0) {
      await new Promise<void>((r) => {
        const done = () => r();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        setTimeout(done, 4000);
      });
    }
    try { await img.decode(); } catch { /* ignore */ }
  }));
  await new Promise((r) => setTimeout(r, 90));
}

const nextFrames = (n = 2) =>
  new Promise<void>((resolve) => {
    const step = (k: number) => (k <= 0 ? resolve() : requestAnimationFrame(() => step(k - 1)));
    step(n);
  });

type H2C = (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>;
async function capture(id: string, scale = EXPORT_SCALE): Promise<HTMLCanvasElement | null> {
  const { default: html2canvas } = (await import("html2canvas")) as { default: H2C };
  const el = document.getElementById(id);
  if (!el) return null;
  await ensureFontsReady(scale);
  await ensureImagesReady(el);
  return html2canvas(el, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 30000,
    scrollX: 0,
    scrollY: 0,
  });
}

// ── Asset pipeline ────────────────────────────────────────────────────────────
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

// Pre-scale an image ONCE to the exact pixel size it will have in the export
// (box size x EXPORT_SCALE), halving step by step with high-quality smoothing.
// html2canvas then draws it 1:1 instead of doing one huge, jagged downscale.
// Never upscales: a source smaller than the target is used as is.
async function loadCrisp(url: string, boxW: number, boxH: number): Promise<string> {
  if (!url) return "";
  const dataUrl = await urlToDataUrl(url);
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return dataUrl;
    const ratio = Math.min(1, (boxW * EXPORT_SCALE) / nw, (boxH * EXPORT_SCALE) / nh);
    if (ratio >= 1) return dataUrl;
    const tw = Math.max(1, Math.round(nw * ratio));
    const th = Math.max(1, Math.round(nh * ratio));
    let src: CanvasImageSource = img;
    let w = nw, h = nh;
    while (w / 2 > tw) {
      w = Math.round(w / 2);
      h = Math.round(h / 2);
      const step = document.createElement("canvas");
      step.width = w; step.height = h;
      const sctx = step.getContext("2d")!;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(src, 0, 0, w, h);
      src = step;
    }
    const out = document.createElement("canvas");
    out.width = tw; out.height = th;
    const octx = out.getContext("2d")!;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(src, 0, 0, tw, th);
    return out.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
}

// ── Recipient name as an image ────────────────────────────────────────────────
// html2canvas places script-font text differently from the browser, which pushed
// the name down in exports. Drawing it on our own canvas puts it at an exact baseline.
const nameCache = new Map<string, NameImg>();
const nameKey = (text: string, ink: string) => `${ink}|${text}`;

async function warmNameImage(text: string, ink: string): Promise<NameImg> {
  const key = nameKey(text, ink);
  const hit = nameCache.get(key);
  if (hit) return hit;

  await loadFontCss();
  const R = NAME_RATIO;
  const face = (px: number) => `${px * R}px "Alex Brush", "Brush Script MT", cursive`;
  try { await document.fonts.load(face(NAME_FONT), text); } catch { /* ignore */ }

  const probe = document.createElement("canvas").getContext("2d")!;
  let size = NAME_FONT;
  probe.font = face(size);
  let tw = probe.measureText(text).width / R;
  if (tw > NAME_MAX_W) {
    size = (size * NAME_MAX_W) / tw;
    probe.font = face(size);
    tw = probe.measureText(text).width / R;
  }

  const w = Math.ceil(tw) + 16;
  const c = document.createElement("canvas");
  c.width = w * R;
  c.height = NAME_BOX_H * R;
  const ctx = c.getContext("2d")!;
  ctx.font = face(size);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.14)";
  ctx.shadowBlur = 1.5 * R;
  ctx.shadowOffsetY = R;
  ctx.fillText(text, c.width / 2, NAME_BASELINE * R);

  const img: NameImg = { url: c.toDataURL("image/png"), w, h: NAME_BOX_H };
  nameCache.set(key, img);
  return img;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CertificateGenerator() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [sloganText, setSloganText] = useState("");
  const [presidentName, setPresidentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assets, setAssets] = useState({
    leo: "", lion: "", lionMark: "", logo: "",
    sloganPhoto: "", signature: "",
  });

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

  // The ONE certificate mounted off-screen for export. Single and bulk both go
  // through renderCertificate(), so they cannot produce different output.
  const [exportMember, setExportMember] = useState<Member | null>(null);
  const [, setNameTick] = useState(0);

  const ink = PALETTE[template].ink;

  useEffect(() => { loadFontCss(); }, []);

  // Pre-render every image at its final export size (see loadCrisp).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const st = await getClubSettings().catch(() => ({} as ClubSettings));
        const cfg = st as ClubSettings;
        if (!cancelled) {
          setSloganText(cfg.presidentSlogan ?? "");
          setPresidentName(cfg.presidentSloganName ?? "");
        }

        const [leo, lion, lionMark, logo, sloganPhoto, signature] = await Promise.all([
          loadCrisp(`${BASE}leo.png`, LOGO_LEO, LOGO_LEO),
          loadCrisp(`${BASE}lion.png`, LOGO_LION, LOGO_LION),
          loadCrisp(`${BASE}lion.png`, LOGO_WATERMARK, LOGO_WATERMARK),
          loadCrisp(`${BASE}logo.png`, LOGO_MAIN, LOGO_MAIN),
          loadCrisp(cfg.presidentSloganPhotoUrl ?? "", SLOGAN_MAX_W, SLOGAN_MAX_H),
          loadCrisp(cfg.presidentSignatureUrl ?? "", SIG_MAX_W, SIG_MAX_H),
        ]);

        if (!cancelled) setAssets({ leo, lion, lionMark, logo, sloganPhoto, signature });
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setAssetsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    Promise.all([
      getMembers().catch(() => [] as Member[]),
      getActivities().catch(() => [] as Activity[]),
      getAwards().catch(() => [] as Award[]),
    ])
      .then(([m, a, aw]) => {
        setMembers(m.sort((x, y) => x.name.localeCompare(y.name)));
        setActivities(a.sort((x, y) => activitySortKey(y.year, y.month) - activitySortKey(x.year, x.month)));
        setAwards(aw);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Preview: draw the selected member's name image, then re-render.
  useEffect(() => {
    if (!selectedMember) return;
    let alive = true;
    warmNameImage(selectedMember.name, ink).then(() => { if (alive) setNameTick((n) => n + 1); });
    return () => { alive = false; };
  }, [selectedMember, ink]);

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
      sloganPhotoUrl: assets.sloganPhoto,
      sloganText,
      signatureUrl: assets.signature,
      presidentName,
      nameImg: nameCache.get(nameKey(member.name, ink)),
      verifyUrl: verifyUrl(member.memberId),
      leoAsset: assets.leo,
      lionAsset: assets.lion,
      lionMarkAsset: assets.lionMark,
      logoAsset: assets.logo,
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

  // ── ONE render path for single AND bulk ─────────────────────────────────────
  async function renderCertificate(member: Member): Promise<HTMLCanvasElement | null> {
    await warmNameImage(member.name, ink);        // name image must exist before mount
    flushSync(() => setExportMember(member));     // DOM now shows exactly this member
    await nextFrames(2);
    return capture("cert-export-stage", EXPORT_SCALE);
  }

  async function downloadSingle(fmt: "png" | "pdf") {
    if (!selectedMember) return;
    setDownloading(true);
    try {
      const c = await renderCertificate(selectedMember);
      if (!c) return;
      const fn = `${selectedMember.memberId}-${certType}-certificate`;
      if (fmt === "png") {
        const a = document.createElement("a");
        a.download = `${fn}.png`;
        a.href = c.toDataURL("image/png");
        a.click();
      } else {
        const { default: jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
        pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        pdf.save(`${fn}.pdf`);
      }
      c.width = 0; c.height = 0;
    } finally {
      setExportMember(null);
      setDownloading(false);
    }
  }

  // Bulk: sequential, JPEG pages, a new PDF every BATCH_CHUNK certificates.
  async function downloadBatchForActivity() {
    if (!selectedActivity || activityParticipants.length === 0 || !assetsReady) return;
    setBatchDownloading(true);
    setBatchProgress(0);
    try {
      const { default: jsPDF } = await import("jspdf");
      const total = activityParticipants.length;
      const base = selectedActivity.title.replace(/\s+/g, "-");
      const newPdf = () => new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      let pdf = newPdf();
      let pagesInPdf = 0;
      let part = 1;
      const save = () =>
        pdf.save(total > BATCH_CHUNK ? `${base}-certificates-part-${part}.pdf` : `${base}-certificates.pdf`);

      for (let i = 0; i < total; i++) {
        const c = await renderCertificate(activityParticipants[i]);
        setBatchProgress(Math.round(((i + 1) / total) * 100));
        if (!c) continue;

        if (pagesInPdf === BATCH_CHUNK) { save(); part++; pdf = newPdf(); pagesInPdf = 0; }
        if (pagesInPdf > 0) pdf.addPage();
        pdf.addImage(
          c.toDataURL("image/jpeg", BATCH_JPEG_QUALITY), "JPEG", 0, 0,
          pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight()
        );
        pagesInPdf++;
        c.width = 0; c.height = 0; // release canvas memory between pages
      }
      if (pagesInPdf > 0) save();
    } finally {
      setExportMember(null);
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

      {loading || !assetsReady ? (
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
                    <button onClick={downloadBatchForActivity} disabled={batchDownloading || !assetsReady}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60">
                      {batchDownloading
                        ? <><Loader2 size={14} className="animate-spin" /> Generating… {batchProgress}%</>
                        : <><Layers size={14} /> Download All {activityParticipants.length} Certificates PDF</>}
                    </button>
                    {activityParticipants.length > BATCH_CHUNK && (
                      <p className="text-[10px] text-gray-400 mt-2 text-center">
                        Large batches are split into PDFs of {BATCH_CHUNK} certificates each.
                      </p>
                    )}
                    {batchDownloading && (
                      <p className="text-[10px] text-gray-400 mt-2 text-center">
                        Rendering each certificate at full quality — please keep this tab open…
                      </p>
                    )}
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
                  <button onClick={() => downloadSingle("pdf")} disabled={downloading || batchDownloading || !assetsReady}
                    className="inline-flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#003575] transition-colors disabled:opacity-60">
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download PDF
                  </button>
                  <button onClick={() => downloadSingle("png")} disabled={downloading || batchDownloading || !assetsReady}
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

      {/* Hidden full-size stage used for every export (single and bulk) */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }} aria-hidden>
        {exportMember && (
          <div id="cert-export-stage" key={exportMember.memberId}>
            <CertificateCanvas data={buildCertData(exportMember)} scale={1} />
          </div>
        )}
      </div>
    </div>
  );
}