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
  currentRole: string;
  photoUrl: string;
  activities: MemberActivity[];
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

export const LEO_YEARS = ["2026/27", "2027/28", "2028/29", "2029/30", "2030/31"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const ADMIN_EMAIL = "leoclubofkusms@gmail.com";

export interface ClubSettings {
  charteredCertificateUrl?: string;
  charteredCertificateType?: "image" | "pdf";
}

export const CLUB_ESTABLISHED = "June 11, 2024";
export const CLUB_FACEBOOK = "https://www.facebook.com/share/1B5inBvASe/?mibextid=wwXIfr";
export const CLUB_TIKTOK = "https://www.tiktok.com/@leoclub.kusms";
