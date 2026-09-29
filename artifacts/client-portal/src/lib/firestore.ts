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
  type WriteBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Member, MemberRole, Activity, ActivityFormData, BodMember, Award, ClubEvent, ClubSettings, Constitution, Announcement, LeaderQuote, PastLeader, EventApplication, ServiceImpact } from "./types";

// ── Utilities ────────────────────────────────────────────────────────────────

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

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
    batchWrite.set(doc(db, "members", member.memberId), stripUndefined(member));
    await batchWrite.commit();
  });
  await updateDoc(doc(db, "members", member.memberId), stripUndefined({ ...member })).catch(
    async () => {
      const batchWrite = writeBatch(db);
      batchWrite.set(doc(db, "members", member.memberId), stripUndefined({ ...member }));
      await batchWrite.commit();
    }
  );
}

export async function setMember(member: Member): Promise<void> {
  const batchWrite = writeBatch(db);
  batchWrite.set(doc(db, "members", member.memberId), stripUndefined(member));
  await batchWrite.commit();
}

export async function changeMemberId(currentId: string, member: Member): Promise<void> {
  const nextId = member.memberId.trim();
  if (!nextId) throw new Error("Member ID is required.");
  if (currentId === nextId) {
    await setMember({ ...member, memberId: nextId });
    return;
  }

  const currentRef = doc(db, "members", currentId);
  const nextRef = doc(db, "members", nextId);
  const [currentSnap, nextSnap, activitiesSnap, awardsSnap, bodSnap] = await Promise.all([
    getDoc(currentRef),
    getDoc(nextRef),
    getDocs(collection(db, "activities")),
    getDocs(collection(db, "awards")),
    getDocs(collection(db, "bod")),
  ]);

  if (!currentSnap.exists()) throw new Error("The original member record no longer exists.");
  if (nextSnap.exists()) throw new Error(`Member ID "${nextId}" is already in use.`);

  const batches: WriteBatch[] = [];
  let batch = writeBatch(db);
  let operationCount = 0;
  const addOperation = (operation: (currentBatch: WriteBatch) => void) => {
    if (operationCount >= 450) {
      batches.push(batch);
      batch = writeBatch(db);
      operationCount = 0;
    }
    operation(batch);
    operationCount += 1;
  };

  addOperation((currentBatch) =>
    currentBatch.set(nextRef, stripUndefined({ ...member, memberId: nextId }))
  );
  addOperation((currentBatch) => currentBatch.delete(currentRef));

  activitiesSnap.docs.forEach((activityDoc) => {
    const activity = activityDoc.data() as Activity;
    const participants = activity.participants ?? [];
    if (!participants.some((participant) => participant.memberId === currentId)) return;
    addOperation((currentBatch) => currentBatch.update(activityDoc.ref, {
      participants: participants.map((participant) =>
        participant.memberId === currentId ? { ...participant, memberId: nextId } : participant
      ),
    }));
  });

  awardsSnap.docs.forEach((awardDoc) => {
    const award = awardDoc.data() as Award;
    if (award.memberId !== currentId) return;
    addOperation((currentBatch) => currentBatch.update(awardDoc.ref, { memberId: nextId }));
  });

  bodSnap.docs.forEach((bodDoc) => {
    const bod = bodDoc.data() as BodMember;
    if (bod.memberId !== currentId) return;
    addOperation((currentBatch) => currentBatch.update(bodDoc.ref, { memberId: nextId }));
  });

  if (operationCount > 0) batches.push(batch);
  await Promise.all(batches.map((currentBatch) => currentBatch.commit()));
}

export async function updateMember(
  memberId: string,
  data: Partial<Member>
): Promise<void> {
  await updateDoc(doc(db, "members", memberId), stripUndefined(data) as Record<string, unknown>);
}

export async function deleteMember(memberId: string): Promise<void> {
  await deleteDoc(doc(db, "members", memberId));
}

export async function upsertMemberRole(memberId: string, role: MemberRole): Promise<void> {
  const memberRef = doc(db, "members", memberId);
  const snap = await getDoc(memberRef);
  if (!snap.exists()) return;
  const member = snap.data() as Member;
  const roles = member.roleHistory ?? [];
  const sameRole = (item: MemberRole) =>
    item.leoYear === role.leoYear &&
    (role.source === "bod" ? item.source === "bod" && item.bodId === role.bodId : item.source !== "bod");
  await updateDoc(memberRef, {
    roleHistory: [...roles.filter((item) => !sameRole(item)), role],
  });
}

export async function removeBodMemberRole(memberId: string, bodId: string): Promise<void> {
  const memberRef = doc(db, "members", memberId);
  const snap = await getDoc(memberRef);
  if (!snap.exists()) return;
  const member = snap.data() as Member;
  await updateDoc(memberRef, {
    roleHistory: (member.roleHistory ?? []).filter((role) => !(role.source === "bod" && role.bodId === bodId)),
  });
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function getActivities(): Promise<Activity[]> {
  const snap = await getDocs(collection(db, "activities"));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
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

export async function toggleActivityFeatured(id: string, featured: boolean): Promise<void> {
  await updateDoc(doc(db, "activities", id), { featured });
}

export async function updateActivityMeta(
  id: string,
  data: { title: string; description: string; photos: string[] }
): Promise<void> {
  await updateDoc(doc(db, "activities", id), data as Record<string, unknown>);
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

export async function getActivitiesByMonth(year: string, month: string): Promise<Activity[]> {
  const q = query(
    collection(db, "activities"),
    where("year", "==", year),
    where("month", "==", month)
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
  return items.sort((a, b) =>
    a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0
  );
}

export async function createActivity(data: ActivityFormData): Promise<string> {
  const ref = await addDoc(collection(db, "activities"), stripUndefined({
    ...data,
    id: "",
    featured: false,
    createdAt: new Date().toISOString(),
  }));
  await updateDoc(ref, { id: ref.id });

  const batch = writeBatch(db);
  for (const p of data.participants) {
    const memberRef = doc(db, "members", p.memberId);
    batch.update(memberRef, {
      activities: arrayUnion(stripUndefined({
        activityId: ref.id,
        year: data.year,
        month: data.month,
        title: data.title,
        awardTitle: p.awardTitle,
      })),
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
  await updateDoc(doc(db, "activities", id), stripUndefined(data) as Record<string, unknown>);

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
        activities: arrayUnion(stripUndefined({
          activityId: id,
          year: activityData.year,
          month: activityData.month,
          title: activityData.title,
          awardTitle: p.awardTitle,
        })),
      });
    }
    await addBatch.commit();
  }
}

export async function deleteActivity(id: string, participants: { memberId: string }[]): Promise<void> {
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
  const ref = await addDoc(collection(db, "activities"), stripUndefined({
    year: data.year,
    month: data.month,
    title: data.title,
    description: data.description,
    photos: [],
    participants: [{ memberId, awardTitle: data.awardTitle }],
    manual: true,
    featured: false,
    id: "",
  }));
  await updateDoc(ref, { id: ref.id });

  await updateDoc(doc(db, "members", memberId), {
    activities: arrayUnion(stripUndefined({
      activityId: ref.id,
      year: data.year,
      month: data.month,
      title: data.title,
      awardTitle: data.awardTitle,
    })),
  });
}

export async function removeManualAchievement(memberId: string, activityId: string): Promise<void> {
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
  await setDoc(doc(db, "bod", member.id), stripUndefined(member));
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
  const ref = await addDoc(collection(db, "awards"), stripUndefined(data));
  await updateDoc(ref, { id: ref.id });
}

export async function updateAward(id: string, data: Partial<Award>): Promise<void> {
  await updateDoc(doc(db, "awards", id), stripUndefined(data) as Record<string, unknown>);
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
  const ref = await addDoc(collection(db, "events"), stripUndefined(data));
  await updateDoc(ref, { id: ref.id });
}

export async function updateClubEvent(id: string, data: Partial<ClubEvent>): Promise<void> {
  await updateDoc(doc(db, "events", id), stripUndefined(data) as Record<string, unknown>);
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
  await setDoc(doc(db, "settings", "clubSettings"), stripUndefined(data), { merge: true });
}

// ── Constitution ──────────────────────────────────────────────────────────────

export async function getConstitution(): Promise<Constitution> {
  const snap = await getDoc(doc(db, "settings", "constitution"));
  return snap.exists() ? (snap.data() as Constitution) : { sections: [] };
}

export async function updateConstitution(data: Constitution): Promise<void> {
  await setDoc(doc(db, "settings", "constitution"), stripUndefined(data), { merge: true });
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
  const ref = await addDoc(collection(db, "announcements"), stripUndefined(data));
  await updateDoc(ref, { id: ref.id });
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
  await updateDoc(doc(db, "announcements", id), stripUndefined(data) as Record<string, unknown>);
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
  const ref = await addDoc(collection(db, "leaderQuotes"), stripUndefined(data));
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export async function updateLeaderQuote(id: string, data: Partial<LeaderQuote>): Promise<void> {
  await updateDoc(doc(db, "leaderQuotes", id), stripUndefined(data) as Record<string, unknown>);
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
  const ref = await addDoc(collection(db, "pastLeaders"), stripUndefined(data));
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export async function updatePastLeader(id: string, data: Partial<PastLeader>): Promise<void> {
  await updateDoc(doc(db, "pastLeaders", id), stripUndefined(data) as Record<string, unknown>);
}

export async function deletePastLeader(id: string): Promise<void> {
  await deleteDoc(doc(db, "pastLeaders", id));
}

// ── Event Applications ────────────────────────────────────────────────────────

export async function submitEventApplication(data: Omit<EventApplication, "id">): Promise<string> {
  const q = query(
    collection(db, "eventApplications"),
    where("eventId", "==", data.eventId),
    where("phone", "==", data.phone)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("This phone number has already been used to apply for this event.");
  }

  const clean = stripUndefined(data);
  const ref = await addDoc(collection(db, "eventApplications"), clean);
  // NOTE: we intentionally do NOT call updateDoc(ref, { id: ref.id }) here.
  // Public users are allowed to CREATE event applications but not UPDATE them
  // (see Firestore rules: allow create: if true; allow read, update, delete: if isOperatorOrAdmin()).
  // The document id is available as `d.id` on read — no need to store it.
  return ref.id;
}

export async function getApplicationsByEvent(eventId: string): Promise<EventApplication[]> {
  const q = query(
    collection(db, "eventApplications"),
    where("eventId", "==", eventId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventApplication));
  return list.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
}

export async function getAllEventApplications(): Promise<EventApplication[]> {
  const snap = await getDocs(collection(db, "eventApplications"));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventApplication));
  return list.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
}

export async function deleteEventApplication(id: string): Promise<void> {
  await deleteDoc(doc(db, "eventApplications", id));
}

/**
 * Looks up a member by their public Membership ID.
 * Used to validate Leo Membership IDs at application submission time.
 * Returns the member document, or null if not found.
 */
export async function findMemberByMembershipId(membershipId: string): Promise<Member | null> {
  const trimmed = membershipId.trim();
  if (!trimmed) return null;
  // Try direct doc read first (fastest if IDs are the doc ids)
  try {
    const direct = await getDoc(doc(db, "members", trimmed));
    if (direct.exists()) return direct.data() as Member;
  } catch {
    // ignore, fall through to query
  }
  // Fallback: query by memberId field
  const q = query(collection(db, "members"), where("memberId", "==", trimmed));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Member;
}

// ── Service Impact ────────────────────────────────────────────────────────────
// One Firestore document per Leo Year, stored in the "serviceImpact" collection.
// Leo Year strings contain a "/" (e.g. "2026/27"), which Firestore treats as a
// path separator. We encode it to "2026-27" for the document ID and decode it
// back to "2026/27" when reading.

/** Encode a Leo Year for use as a Firestore document ID. "2026/27" → "2026-27" */
function encodeLeoYear(leoYear: string): string {
  return leoYear.replace(/\//g, "-");
}

/** Decode a Firestore document ID back to a Leo Year. "2026-27" → "2026/27" */
function decodeLeoYear(docId: string): string {
  const m = docId.match(/^(\d{4})-(\d{2})$/);
  return m ? `${m[1]}/${m[2]}` : docId;
}

export async function getServiceImpact(leoYear: string): Promise<ServiceImpact | null> {
  const snap = await getDoc(doc(db, "serviceImpact", encodeLeoYear(leoYear)));
  if (!snap.exists()) return null;
  const data = snap.data() as ServiceImpact;
  return { ...data, leoYear: decodeLeoYear(snap.id) };
}

export async function getAllServiceImpacts(): Promise<ServiceImpact[]> {
  const snap = await getDocs(collection(db, "serviceImpact"));
  const items = snap.docs.map((d) => {
    const data = d.data() as ServiceImpact;
    return { ...data, leoYear: decodeLeoYear(d.id) };
  });
  return items.sort((a, b) => b.leoYear.localeCompare(a.leoYear));
}

export async function updateServiceImpact(data: ServiceImpact): Promise<void> {
  const clean = stripUndefined({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(doc(db, "serviceImpact", encodeLeoYear(data.leoYear)), clean);
}

export async function deleteServiceImpact(leoYear: string): Promise<void> {
  await deleteDoc(doc(db, "serviceImpact", encodeLeoYear(leoYear)));
}

/**
 * Auto-calculates the volunteer count for a Leo Year by counting unique
 * memberId values across all activities in that year.
 */
export function computeVolunteersFromActivities(
  activities: Activity[],
  leoYear: string
): number {
  const ids = new Set<string>();
  activities
    .filter((a) => a.year === leoYear)
    .forEach((a) => {
      (a.participants ?? []).forEach((p) => {
        if (p.memberId) ids.add(p.memberId);
      });
    });
  return ids.size;
}
