import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  arrayUnion,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Member, Activity, ActivityFormData, BodMember, Award, ClubEvent, ClubSettings, Constitution, Announcement, LeaderQuote, PastLeader } from "./types";

// ── Members ──────────────────────────────────────────────────────────────────

export async function getMembers(): Promise<Member[]> {
  const snap = await getDocs(collection(db, "members"));
  return snap.docs.map((d) => d.data() as Member);
}

export async function getMember(memberId: string): Promise<Member | null> {
  const ref = doc(db, "members", memberId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Member) : null;
}

export async function addMember(member: Member): Promise<void> {
  await updateDoc(doc(db, "members", member.memberId), {}).catch(async () => {
    const batchWrite = writeBatch(db);
    batchWrite.set(doc(db, "members", member.memberId), member);
    await batchWrite.commit();
  });
  await updateDoc(doc(db, "members", member.memberId), { ...member }).catch(
    async () => {
      const batchWrite = writeBatch(db);
      batchWrite.set(doc(db, "members", member.memberId), { ...member });
      await batchWrite.commit();
    }
  );
}

export async function setMember(member: Member): Promise<void> {
  const batchWrite = writeBatch(db);
  batchWrite.set(doc(db, "members", member.memberId), member);
  await batchWrite.commit();
}

export async function updateMember(
  memberId: string,
  data: Partial<Member>
): Promise<void> {
  await updateDoc(doc(db, "members", memberId), data as Record<string, unknown>);
}

export async function deleteMember(memberId: string): Promise<void> {
  await deleteDoc(doc(db, "members", memberId));
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function getActivities(): Promise<Activity[]> {
  const snap = await getDocs(collection(db, "activities"));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
  // Sort newest first using createdAt if available, else by year+month (oldest = lower index, reverse for newest first)
  return items.sort((a, b) => {
    if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
    const ya = a.year.localeCompare(b.year);
    if (ya !== 0) return -ya;
    const MONTHS_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return -(MONTHS_ORDER.indexOf(b.month) - MONTHS_ORDER.indexOf(a.month));
  });
}

export async function getFeaturedActivities(): Promise<Activity[]> {
  const q = query(collection(db, "activities"), where("featured", "==", true));
  const snap = await getDocs(q).catch(async () => {
    return getDocs(collection(db, "activities"));
  });
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
}

export async function toggleActivityFeatured(
  id: string,
  featured: boolean
): Promise<void> {
  await updateDoc(doc(db, "activities", id), { featured });
}

export async function updateActivityMeta(
  id: string,
  data: { title: string; description: string; photos: string[] }
): Promise<void> {
  await updateDoc(doc(db, "activities", id), data as Record<string, unknown>);
  // Sync title to denormalized member activity records
  const membersSnap = await getDocs(collection(db, "members"));
  const batch = writeBatch(db);
  let hasUpdates = false;
  membersSnap.docs.forEach((memberDoc) => {
    const member = memberDoc.data() as Member;
    const acts = member.activities ?? [];
    const idx = acts.findIndex((a) => a.activityId === id);
    if (idx >= 0) {
      const updated = [...acts];
      updated[idx] = { ...updated[idx], title: data.title };
      batch.update(memberDoc.ref, { activities: updated });
      hasUpdates = true;
    }
  });
  if (hasUpdates) await batch.commit();
}

export async function toggleMemberActive(
  memberId: string,
  isActive: boolean,
  leftLeoYear?: string
): Promise<void> {
  const data: Record<string, unknown> = { isActive };
  if (!isActive && leftLeoYear) data.leftLeoYear = leftLeoYear;
  if (isActive) data.leftLeoYear = "";
  await updateDoc(doc(db, "members", memberId), data);
}

export async function getActivity(id: string): Promise<Activity | null> {
  const snap = await getDoc(doc(db, "activities", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Activity) : null;
}

export async function getActivitiesByMonth(
  year: string,
  month: string
): Promise<Activity[]> {
  const q = query(
    collection(db, "activities"),
    where("year", "==", year),
    where("month", "==", month)
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
  // Newest first within the month
  return items.sort((a, b) =>
    a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0
  );
}

export async function createActivity(data: ActivityFormData): Promise<string> {
  const ref = await addDoc(collection(db, "activities"), {
    ...data,
    id: "",
    featured: false,
    createdAt: new Date().toISOString(),
  });
  await updateDoc(ref, { id: ref.id });

  const batch = writeBatch(db);
  for (const p of data.participants) {
    const memberRef = doc(db, "members", p.memberId);
    batch.update(memberRef, {
      activities: arrayUnion({
        activityId: ref.id,
        year: data.year,
        month: data.month,
        title: data.title,
        awardTitle: p.awardTitle,
      }),
    });
  }
  await batch.commit();

  return ref.id;
}

export async function updateActivity(
  id: string,
  data: Partial<ActivityFormData>,
  oldParticipants: { memberId: string; awardTitle: string }[],
  activityData: ActivityFormData
): Promise<void> {
  await updateDoc(doc(db, "activities", id), data as Record<string, unknown>);

  const removeBatch = writeBatch(db);
  for (const p of oldParticipants) {
    const memberRef = doc(db, "members", p.memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      const member = memberSnap.data() as Member;
      const filtered = member.activities.filter((a) => a.activityId !== id);
      removeBatch.update(memberRef, { activities: filtered });
    }
  }
  await removeBatch.commit();

  if (data.participants) {
    const addBatch = writeBatch(db);
    for (const p of data.participants) {
      const memberRef = doc(db, "members", p.memberId);
      addBatch.update(memberRef, {
        activities: arrayUnion({
          activityId: id,
          year: activityData.year,
          month: activityData.month,
          title: activityData.title,
          awardTitle: p.awardTitle,
        }),
      });
    }
    await addBatch.commit();
  }
}

export async function deleteActivity(
  id: string,
  participants: { memberId: string }[]
): Promise<void> {
  await deleteDoc(doc(db, "activities", id));

  const batch = writeBatch(db);
  for (const p of participants) {
    const memberRef = doc(db, "members", p.memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      const member = memberSnap.data() as Member;
      const filtered = member.activities.filter((a) => a.activityId !== id);
      batch.update(memberRef, { activities: filtered });
    }
  }
  await batch.commit();
}

// ── Manual Achievements ───────────────────────────────────────────────────────

export interface ManualAchievementInput {
  year: string;
  month: string;
  title: string;
  description: string;
  awardTitle: string;
}

export async function addManualAchievement(
  memberId: string,
  data: ManualAchievementInput
): Promise<void> {
  const ref = await addDoc(collection(db, "activities"), {
    year: data.year,
    month: data.month,
    title: data.title,
    description: data.description,
    photos: [],
    participants: [{ memberId, awardTitle: data.awardTitle }],
    manual: true,
    featured: false,
    id: "",
  });
  await updateDoc(ref, { id: ref.id });

  await updateDoc(doc(db, "members", memberId), {
    activities: arrayUnion({
      activityId: ref.id,
      year: data.year,
      month: data.month,
      title: data.title,
      awardTitle: data.awardTitle,
    }),
  });
}

export async function removeManualAchievement(
  memberId: string,
  activityId: string
): Promise<void> {
  const memberSnap = await getDoc(doc(db, "members", memberId));
  if (!memberSnap.exists()) return;
  const member = memberSnap.data() as Member;
  const filtered = member.activities.filter((a) => a.activityId !== activityId);
  await updateDoc(doc(db, "members", memberId), { activities: filtered });
  try {
    const actSnap = await getDoc(doc(db, "activities", activityId));
    if (actSnap.exists() && actSnap.data().manual === true) {
      await deleteDoc(doc(db, "activities", activityId));
    }
  } catch { /* ignore */ }
}

// ── Board of Directors ────────────────────────────────────────────────────────

export async function getBodMembers(): Promise<BodMember[]> {
  const q = query(collection(db, "bod"), orderBy("priority"));
  const snap = await getDocs(q).catch(async () => {
    return getDocs(collection(db, "bod"));
  });
  const members = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BodMember));
  return members.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

export async function setBodMember(member: BodMember): Promise<void> {
  await setDoc(doc(db, "bod", member.id), member);
}

export async function deleteBodMember(id: string): Promise<void> {
  await deleteDoc(doc(db, "bod", id));
}

// ── Awards ────────────────────────────────────────────────────────────────────

export async function getAwards(): Promise<Award[]> {
  const snap = await getDocs(collection(db, "awards"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Award));
}

export async function addAward(data: Omit<Award, "id">): Promise<void> {
  const ref = await addDoc(collection(db, "awards"), data);
  await updateDoc(ref, { id: ref.id });
}

export async function updateAward(id: string, data: Partial<Award>): Promise<void> {
  await updateDoc(doc(db, "awards", id), data);
}

export async function deleteAward(id: string): Promise<void> {
  await deleteDoc(doc(db, "awards", id));
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function getClubEvents(): Promise<ClubEvent[]> {
  const snap = await getDocs(collection(db, "events"));
  const evts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClubEvent));
  return evts.sort((a, b) => a.date.localeCompare(b.date));
}

export async function addClubEvent(data: Omit<ClubEvent, "id">): Promise<void> {
  const ref = await addDoc(collection(db, "events"), data);
  await updateDoc(ref, { id: ref.id });
}

export async function updateClubEvent(id: string, data: Partial<ClubEvent>): Promise<void> {
  await updateDoc(doc(db, "events", id), data);
}

export async function deleteClubEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "events", id));
}

// ── Club Settings ─────────────────────────────────────────────────────────────

export async function getClubSettings(): Promise<ClubSettings> {
  const snap = await getDoc(doc(db, "settings", "clubSettings"));
  return snap.exists() ? (snap.data() as ClubSettings) : {};
}

export async function updateClubSettings(data: Partial<ClubSettings>): Promise<void> {
  await setDoc(doc(db, "settings", "clubSettings"), data, { merge: true });
}

// ── Constitution ──────────────────────────────────────────────────────────────

export async function getConstitution(): Promise<Constitution> {
  const snap = await getDoc(doc(db, "settings", "constitution"));
  return snap.exists() ? (snap.data() as Constitution) : { sections: [] };
}

export async function updateConstitution(data: Constitution): Promise<void> {
  await setDoc(doc(db, "settings", "constitution"), data, { merge: true });
}

// ── Announcements ──────────────────────────────────────────────────────────────

export async function getAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(collection(db, "announcements"));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function addAnnouncement(data: Omit<Announcement, "id">): Promise<void> {
  const ref = await addDoc(collection(db, "announcements"), data);
  await updateDoc(ref, { id: ref.id });
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
  await updateDoc(doc(db, "announcements", id), data as Record<string, unknown>);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, "announcements", id));
}

// ── Leader Quotes ─────────────────────────────────────────────────────────────

export async function getLeaderQuotes(): Promise<LeaderQuote[]> {
  const snap = await getDocs(collection(db, "leaderQuotes"));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderQuote));
  return items.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}

export async function addLeaderQuote(data: Omit<LeaderQuote, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "leaderQuotes"), data);
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export async function updateLeaderQuote(id: string, data: Partial<LeaderQuote>): Promise<void> {
  await updateDoc(doc(db, "leaderQuotes", id), data as Record<string, unknown>);
}

export async function deleteLeaderQuote(id: string): Promise<void> {
  await deleteDoc(doc(db, "leaderQuotes", id));
}

// ── Past Leaders ──────────────────────────────────────────────────────────────

export async function getPastLeaders(): Promise<PastLeader[]> {
  const snap = await getDocs(collection(db, "pastLeaders"));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PastLeader));
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addPastLeader(data: Omit<PastLeader, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "pastLeaders"), data);
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export async function updatePastLeader(id: string, data: Partial<PastLeader>): Promise<void> {
  await updateDoc(doc(db, "pastLeaders", id), data as Record<string, unknown>);
}

export async function deletePastLeader(id: string): Promise<void> {
  await deleteDoc(doc(db, "pastLeaders", id));
}
