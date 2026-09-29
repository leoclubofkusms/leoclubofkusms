export interface MemberActivity {
  activityId: string;
  year: string;
  month: string;
  title: string;
  awardTitle: string;
}

export type MemberRoleSource = "manual" | "bod";

export interface MemberRole {
  leoYear: string;
  role: string;
  source?: MemberRoleSource;
  bodId?: string;
}

export interface Member {
  memberId: string;
  name: string;
  rollNo: string;
  batch: string;
  faculty?: string;
  currentRole: string;
  role?: string;
  photoUrl: string;
  email?: string;
  activities: MemberActivity[];
  roleHistory?: MemberRole[];
  isActive?: boolean;
  joinedLeoYear?: string;
  leftLeoYear?: string;
  bio?: string;
}

export interface ActivityParticipant {
  memberId: string;
  awardTitle: string;
}

export interface Activity {
  id: string;
  year: string;
  month: string;
  title: string;
  description: string;
  photos: string[];
  participants: ActivityParticipant[];
  featured?: boolean;
  manual?: boolean;
  createdAt?: string;
}

export interface ActivityFormData {
  year: string;
  month: string;
  title: string;
  description: string;
  photos: string[];
  participants: ActivityParticipant[];
}

export interface BodMember {
  id: string;
  name: string;
  role: string;
  memberId?: string;
  leoYear?: string;
  priority: number;
  photoUrl: string;
  email: string;
  phone: string;
  bio: string;
}

// Auto-generates Leo Years from the club's founding (2024) through current year + 5
export const LEO_YEARS: string[] = (() => {
  const START_YEAR = 2024;
  const today = new Date();
  const currentCalendarYear = today.getFullYear();
  const month = today.getMonth();
  const currentLeoStart = month >= 6 ? currentCalendarYear : currentCalendarYear - 1;
  const END_YEAR = currentLeoStart + 5;

  const years: string[] = [];
  for (let y = START_YEAR; y <= END_YEAR; y++) {
    years.push(`${y}/${(y + 1).toString().slice(-2)}`);
  }
  return years;
})();

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const ADMIN_EMAIL = "leoclubofkusms@gmail.com";

export const FACULTIES = [
  "MBBS", "BDS", "B.Sc. Nursing", "BPT", "BMIT", "BNS", "Other",
];

export const BATCH_YEARS: string[] = [];
for (let y = 2018; y <= 2035; y++) BATCH_YEARS.push(String(y));

export interface ClubSettings {
  charteredCertificateUrl?: string;
  charteredCertificateType?: "image" | "pdf";
  presidentSlogan?: string;
  presidentSloganPhotoUrl?: string;
  presidentSloganName?: string;
  presidentSloganRole?: string;
  presidentWhatsApp?: string;
  presidentWhatsAppMessage?: string;
  membershipChairWhatsApp?: string;
  membershipChairWhatsAppMessage?: string;
  donationQrUrl?: string;
  donationBankName?: string;
  donationAccountName?: string;
  donationAccountNumber?: string;
  donationNote?: string;
  usdToNprRate?: number;
}

export interface LeaderQuote {
  id: string;
  name: string;
  role: string;
  quote: string;
  introduction?: string;
  photoUrl?: string;
  audioUrl?: string;
  priority: number;
  leoYear?: string;
}

export interface PastLeader {
  id: string;
  name: string;
  role: string;
  leoYear: string;
  photoUrl?: string;
  note?: string;
  order: number;
  quote?: string;
  audioUrl?: string;
}

export interface Award {
  id: string;
  type: "member" | "club";
  title: string;
  recipientName: string;
  memberId?: string;
  description: string;
  month: string;
  year: string;
  photoUrl?: string;
  awardedBy?: string;
  featured?: boolean;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  status: "planned" | "completed" | "cancelled";
  photoUrl?: string;
  eventType?: string;
  pinned?: boolean;
  applicationsEnabled?: boolean;
  applicationType?: string;
  applicationPrompt?: string;
  applicationDeadline?: string;
  feeLeo?: number;
  feeNonLeo?: number;
  paymentQrUrl?: string;
  paymentNote?: string;
  customQuestions?: CustomQuestion[];
}

export interface CustomQuestion {
  id: string;
  label: string;
  required: boolean;
}

export interface EventApplication {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  facultyBatch: string;
  phone: string;
  memberType: "leo" | "non-leo";
  membershipId?: string;
  transactionId?: string;
  feeAmount?: number;
  customAnswers?: { question: string; answer: string }[];
  submittedAt: string;
  membershipStatus?: "verified" | "unverified" | "non-leo";
  matchedMemberId?: string;
  matchedMemberName?: string;
}

export interface ConstitutionSection {
  id: string;
  number: string;
  title: string;
  content: string;
}

export interface Constitution {
  title?: string;
  adoptedDate?: string;
  lastAmended?: string;
  pdfUrl?: string;
  sections: ConstitutionSection[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  pinned: boolean;
  type: "info" | "update" | "event";
  imageUrl?: string;
  linkLabel?: string;
  linkUrl?: string;
  expiresAt?: string;
}

export interface ServiceImpact {
  leoYear: string;
  peopleServed: number;
  volunteerHours: number;
  fundsDonatedUsd?: number;
  fundsDonatedNpr?: number;
  fundsRaisedUsd?: number;
  fundsRaisedNpr?: number;
  note?: string;
  updatedAt: string;
}

export const CLUB_ID = "172194";
export const CLUB_ESTABLISHED = "June 11, 2024";
export const CLUB_FACEBOOK = "https://www.facebook.com/share/1B5inBvASe/?mibextid=wwXIfr";
export const CLUB_TIKTOK = "https://www.tiktok.com/@leoclub.kusms";

// ── Currency / Exchange Rate ─────────────────────────────────────────────────
export const DEFAULT_USD_TO_NPR_RATE = 133;

export function convertUsdToNpr(usd: number, rate?: number): number {
  const r = rate && rate > 0 ? rate : DEFAULT_USD_TO_NPR_RATE;
  return Math.round(usd * r * 100) / 100;
}

export function convertNprToUsd(npr: number, rate?: number): number {
  const r = rate && rate > 0 ? rate : DEFAULT_USD_TO_NPR_RATE;
  return Math.round((npr / r) * 100) / 100;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function activitySortKey(year: string, month: string): number {
  return LEO_YEARS.indexOf(year) * 12 + MONTHS.indexOf(month);
}

export function getCurrentLeoYear(): string {
  const now = new Date();
  const calendarYear = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 6 ? calendarYear : calendarYear - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  return `${startYear}/${endYear}`;
}

export function getCurrentLeoYearLabel(): string {
  return `Leo Year ${getCurrentLeoYear()}`;
}

export function leoMonthToCalendarYear(leoYear: string, month: string): number {
  const startYear = parseInt(leoYear.split("/")[0], 10);
  if (isNaN(startYear)) return new Date().getFullYear();
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1) return startYear;
  return monthIdx >= 6 ? startYear : startYear + 1;
}

export function leoMonthYearLabel(leoYear: string, month: string): string {
  const year = leoMonthToCalendarYear(leoYear, month);
  return `${month.slice(0, 3)} ${year}`;
}

export function getMonthsInLeoOrder(): string[] {
  return [
    "July", "August", "September", "October", "November", "December",
    "January", "February", "March", "April", "May", "June",
  ];
}

export function leoMonthPosition(month: string): number {
  return getMonthsInLeoOrder().indexOf(month) + 1;
}

export function isAnnouncementExpired(a: Announcement): boolean {
  if (!a.expiresAt) return false;
  const today = new Date().toISOString().split("T")[0];
  return a.expiresAt < today;
}

/** Format a number with thousand separators, handling decimals. */
export function formatImpactNumber(n: number): string {
  if (!isFinite(n)) return "0";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (Number.isInteger(n)) {
    if (abs >= 1_000_000) {
      const m = n / 1_000_000;
      return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
    }
    if (abs >= 10_000) {
      const k = n / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return n.toLocaleString("en-US");
  }
  if (abs < 100) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

/** Format a currency value. */
export function formatCurrency(n: number, currency: "USD" | "NPR"): string {
  const prefix = currency === "USD" ? "$" : "Rs. ";
  if (!isFinite(n)) return `${prefix}0`;
  if (n === 0) return `${prefix}0`;
  const abs = Math.abs(n);

  if (abs >= 1_000_000) {
    const m = n / 1_000_000;
    return `${prefix}${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (abs >= 100_000) {
    const k = n / 1000;
    return `${prefix}${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }

  const formatted = Number.isInteger(n)
    ? n.toLocaleString("en-US")
    : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${prefix}${formatted}`;
}
