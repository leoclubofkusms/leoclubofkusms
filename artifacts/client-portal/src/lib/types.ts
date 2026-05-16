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
}

export interface ActivityFormData {
  year: string;
  month: string;
  title: string;
  description: string;
  photos: string[];
  participants: ActivityParticipant[];
}

export const LEO_YEARS = ["2026/27", "2027/28", "2028/29", "2029/30", "2030/31"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const PROJECT_TYPES = ["logo", "branding", "web_design", "print", "illustration", "other"];
export const ADMIN_EMAIL = "leoclubofkusms@gmail.com";
