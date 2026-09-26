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
  createdAt?: string;  // ISO date string for chronological ordering
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
  const START_YEAR = 2024; // club was chartered in 2024
  const today = new Date();
  const currentCalendarYear = today.getFullYear();
  const month = today.getMonth(); // 0 = Jan, 6 = July
  // The Leo Year that's currently active
  const currentLeoStart = month >= 6 ? currentCalendarYear : currentCalendarYear - 1;
  const END_YEAR = currentLeoStart + 5; // always show 5 years ahead

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

// Admission years available as batch options
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
  leoYear: string;   // e.g. "2024/25"
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
  location: string;
  status: "planned" | "completed" | "cancelled";
  photoUrl?: string;
  eventType?: string;
}

// ── Constitution ──────────────────────────────────────────────────────────────
export interface ConstitutionSection {
  id: string;
  number: string;   // e.g. "Article I", "Section 2.1"
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
  createdAt: string;  // ISO date string
  pinned: boolean;
  type: "info" | "update" | "event";
}

export const CLUB_ID = "172194";
export const CLUB_ESTABLISHED = "June 11, 2024";
export const CLUB_FACEBOOK = "https://www.facebook.com/share/1B5inBvASe/?mibextid=wwXIfr";
export const CLUB_TIKTOK = "https://www.tiktok.com/@leoclub.kusms";

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Sort key for chronological ordering of Leo year + month */
export function activitySortKey(year: string, month: string): number {
  return LEO_YEARS.indexOf(year) * 12 + MONTHS.indexOf(month);
}

/**
 * Returns the current Leo Year as a string, such as "YYYY/YY".
 * The Leo Year runs July 1 – June 30. Auto-updates every July 1st.
 */
export function getCurrentLeoYear(): string {
  const now = new Date();
  const calendarYear = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 6 ? calendarYear : calendarYear - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  return `${startYear}/${endYear}`;
}

/**
 * Returns a display label in the form "Leo Year YYYY/YY".
 */
export function getCurrentLeoYearLabel(): string {
  return `Leo Year ${getCurrentLeoYear()}`;
}