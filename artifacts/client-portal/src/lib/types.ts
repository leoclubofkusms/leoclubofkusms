export interface MemberActivity {
  activityId: string;
  year: string;
  month: string;
  title: string;
  awardTitle: string;
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
  activities: MemberActivity[];
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
  priority: number;
  photoUrl: string;
  email: string;
  phone: string;
  bio: string;
}

export const LEO_YEARS = [
  "2024/25", "2025/26", "2026/27", "2027/28", "2028/29", "2029/30", "2030/31",
];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const ADMIN_EMAIL = "leoclubofkusms@gmail.com";

export const FACULTIES = [
  "MBBS", "BDS", "B.Sc. Nursing", "BPT", "BASLP", "Pharmacy", "Other",
];

export interface ClubSettings {
  charteredCertificateUrl?: string;
  charteredCertificateType?: "image" | "pdf";
  presidentSlogan?: string;
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

export const CLUB_ESTABLISHED = "June 11, 2024";
export const CLUB_FACEBOOK = "https://www.facebook.com/share/1B5inBvASe/?mibextid=wwXIfr";
export const CLUB_TIKTOK = "https://www.tiktok.com/@leoclub.kusms";

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Sort key for chronological ordering of Leo year + month */
export function activitySortKey(year: string, month: string): number {
  return LEO_YEARS.indexOf(year) * 12 + MONTHS.indexOf(month);
}
