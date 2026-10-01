import type { Activity, ActivityParticipant } from "./types";

function cleanText(v: unknown): string {
  if (v == null) return "";
  if (typeof v !== "string") return String(v);
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uD800-\uDFFF]/g, "");
}

function cleanParticipant(p: ActivityParticipant | null | undefined): ActivityParticipant {
  return {
    memberId: cleanText(p?.memberId),
    awardTitle: cleanText(p?.awardTitle),
  };
}

export function sanitizeActivity(a: Activity): Activity {
  return {
    id: cleanText(a.id),
    year: cleanText(a.year),
    month: cleanText(a.month),
    title: cleanText(a.title),
    description: cleanText(a.description),
    photos: Array.isArray(a.photos)
      ? a.photos.map((u) => cleanText(u)).filter(Boolean)
      : [],
    participants: Array.isArray(a.participants)
      ? a.participants.map(cleanParticipant)
      : [],
    featured: !!a.featured,
    manual: !!a.manual,
    createdAt: a.createdAt ? cleanText(a.createdAt) : undefined,
  };
}

export function sanitizeActivities(list: Activity[] | null | undefined): Activity[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeActivity);
}
