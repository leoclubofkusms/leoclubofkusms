import { db } from './config'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'

// Member Operations
export async function getAllMembers() {
  const querySnapshot = await getDocs(collection(db, 'members'))
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getMemberById(memberId) {
  const q = query(collection(db, 'members'), where('memberId', '==', memberId))
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
  }
  return null
}

export async function addMember(memberData) {
  const docRef = await addDoc(collection(db, 'members'), memberData)
  return docRef.id
}

export async function updateMember(memberId, memberData) {
  const memberRef = doc(db, 'members', memberId)
  await updateDoc(memberRef, memberData)
}

export async function deleteMember(memberId) {
  await deleteDoc(doc(db, 'members', memberId))
}

// Activity Operations
export async function getAllActivities() {
  const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getActivitiesByYearMonth(year, month) {
  const q = query(
    collection(db, 'activities'),
    where('year', '==', year),
    where('month', '==', month)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getActivitiesForMember(memberId) {
  const member = await getMemberById(memberId)
  if (!member || !member.activities) return []
  
  const activitiesList = []
  for (const activityRef of member.activities) {
    const activityDoc = await getDoc(doc(db, 'activities', activityRef.activityId))
    if (activityDoc.exists()) {
      activitiesList.push({
        id: activityDoc.id,
        ...activityDoc.data(),
        awardTitle: activityRef.awardTitle
      })
    }
  }
  
  // Sort chronologically
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  activitiesList.sort((a, b) => {
    const yearA = parseInt(a.year.split('/')[0])
    const yearB = parseInt(b.year.split('/')[0])
    if (yearA !== yearB) return yearA - yearB
    return months.indexOf(a.month) - months.indexOf(b.month)
  })
  
  return activitiesList
}

export async function addActivity(activityData) {
  const docRef = await addDoc(collection(db, 'activities'), {
    ...activityData,
    createdAt: new Date()
  })
  
  // Update each member's activities array
  for (const participant of activityData.participants) {
    const memberRef = doc(db, 'members', participant.memberId)
    const memberDoc = await getDoc(memberRef)
    
    if (memberDoc.exists()) {
      const currentActivities = memberDoc.data().activities || []
      currentActivities.push({
        activityId: docRef.id,
        year: activityData.year,
        month: activityData.month,
        title: activityData.title,
        awardTitle: participant.awardTitle
      })
      await updateDoc(memberRef, { activities: currentActivities })
    }
  }
  
  return docRef.id
}

export async function deleteActivity(activityId) {
  // First, remove this activity from all members
  const activityDoc = await getDoc(doc(db, 'activities', activityId))
  if (activityDoc.exists()) {
    const activityData = activityDoc.data()
    if (activityData.participants) {
      for (const participant of activityData.participants) {
        const memberRef = doc(db, 'members', participant.memberId)
        const memberDoc = await getDoc(memberRef)
        if (memberDoc.exists()) {
          const updatedActivities = (memberDoc.data().activities || []).filter(
            a => a.activityId !== activityId
          )
          await updateDoc(memberRef, { activities: updatedActivities })
        }
      }
    }
  }
  
  // Then delete the activity
  await deleteDoc(doc(db, 'activities', activityId))
}

// Stats Operations
export async function getStats() {
  const membersSnapshot = await getDocs(collection(db, 'members'))
  const activitiesSnapshot = await getDocs(collection(db, 'activities'))
  
  return {
    totalMembers: membersSnapshot.size,
    totalActivities: activitiesSnapshot.size
  }
}

export async function getLatestActivities(limitCount = 3) {
  const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(limitCount))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
