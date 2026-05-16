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
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Member, Activity, ActivityFormData } from "./types";

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
    // doc doesn't exist, create it
    const batchWrite = writeBatch(db);
    batchWrite.set(doc(db, "members", member.memberId), member);
    await batchWrite.commit();
  });
  // Always set the full member data
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
  const q = query(collection(db, "activities"), orderBy("year"), orderBy("month"));
  const snap = await getDocs(q).catch(async () => {
    // fallback without ordering if index not ready
    return getDocs(collection(db, "activities"));
  });
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
}

export async function createActivity(data: ActivityFormData): Promise<string> {
  const ref = await addDoc(collection(db, "activities"), {
    ...data,
    id: "",
  });
  // Update with the auto-generated id
  await updateDoc(ref, { id: ref.id });

  // Update each member's activities array
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

  // Remove old participant entries for this activity from members
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

  // Add new participant entries
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
  // Create a minimal activity document so the verify/archive pages can display it
  const ref = await addDoc(collection(db, "activities"), {
    year: data.year,
    month: data.month,
    title: data.title,
    description: data.description,
    photos: [],
    participants: [{ memberId, awardTitle: data.awardTitle }],
    manual: true,
    id: "",
  });
  await updateDoc(ref, { id: ref.id });

  // Push entry to member's activities array
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
  // Also delete the standalone activity doc if it was manual
  try {
    const actSnap = await getDoc(doc(db, "activities", activityId));
    if (actSnap.exists() && actSnap.data().manual === true) {
      await deleteDoc(doc(db, "activities", activityId));
    }
  } catch { /* ignore */ }
}
