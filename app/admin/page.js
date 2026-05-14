'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { useRouter } from 'next/navigation'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  where,
  arrayUnion,
  getDoc
} from 'firebase/firestore'
import { setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import MemberTaggingSystem from '@/components/MemberTaggingSystem'
import QRCertificate from '@/components/QRCertificate'
import Image from 'next/image'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('activity')
  const [members, setMembers] = useState([])
  const [activities, setActivities] = useState([])
  
  // Activity Form State
  const [formData, setFormData] = useState({
    year: '2026/27',
    month: 'January',
    title: '',
    description: '',
    photos: '',
    participants: []
  })
  
  // Member Form State
  const [memberForm, setMemberForm] = useState({
    memberId: '',
    name: '',
    rollNo: '',
    batch: '',
    currentRole: '',
    photoUrl: ''
  })
  
  const [editingMemberId, setEditingMemberId] = useState(null)
  const [selectedMemberForQR, setSelectedMemberForQR] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  
  const router = useRouter()

  const years = ['2026/27', '2027/28', '2028/29', '2029/30', '2030/31']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/admin/login')
      } else {
        setUser(user)
        fetchMembers()
        fetchActivities()
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  async function fetchMembers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'members'))
      const membersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMembers(membersList)
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  async function fetchActivities() {
    try {
      const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const activitiesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Group activities by year and month
      const grouped = {}
      activitiesList.forEach(activity => {
        if (!grouped[activity.year]) grouped[activity.year] = {}
        if (!grouped[activity.year][activity.month]) grouped[activity.year][activity.month] = []
        grouped[activity.year][activity.month].push(activity)
      })
      setActivities(grouped)
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  async function handleSubmitActivity(e) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const photosArray = formData.photos.split(',').map(url => url.trim()).filter(url => url)
      
      const activityData = {
        year: formData.year,
        month: formData.month,
        title: formData.title,
        description: formData.description,
        photos: photosArray,
        participants: formData.participants,
        createdAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, 'activities'), activityData)
      
      // Update each member's activities array
      for (const participant of formData.participants) {
        const memberRef = doc(db, 'members', participant.memberId)
        const memberDoc = await getDoc(memberRef)
        
        if (memberDoc.exists()) {
          const currentActivities = memberDoc.data().activities || []
          currentActivities.push({
            activityId: docRef.id,
            year: formData.year,
            month: formData.month,
            title: formData.title,
            awardTitle: participant.awardTitle
          })
          
          await updateDoc(memberRef, { activities: currentActivities })
        }
      }
      
      alert('Activity added successfully!')
      setFormData({
        year: '2026/27',
        month: 'January',
        title: '',
        description: '',
        photos: '',
        participants: []
      })
      fetchActivities()
    } catch (error) {
      console.error('Error adding activity:', error)
      alert('Error adding activity')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const memberData = {
  memberId: memberForm.memberId,
  name: memberForm.name,
  rollNo: memberForm.rollNo,
  batch: memberForm.batch,
  currentRole: memberForm.currentRole,
  photoUrl: memberForm.photoUrl || 'https://via.placeholder.com/150',
  activities: []
}

if (editingMemberId) {
  const memberRef = doc(db, 'members', editingMemberId)
  await updateDoc(memberRef, memberData)
} else {
  // Use memberId as the document ID for easy lookup
  const memberRef = doc(db, 'members', memberForm.memberId)
  await setDoc(memberRef, memberData)
        alert('Member added successfully!')
      }
      
      setMemberForm({
        memberId: '',
        name: '',
        rollNo: '',
        batch: '',
        currentRole: '',
        photoUrl: ''
      })
      setEditingMemberId(null)
      fetchMembers()
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Error adding member')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteMember(memberId) {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await deleteDoc(doc(db, 'members', memberId))
        fetchMembers()
        alert('Member deleted successfully!')
      } catch (error) {
        console.error('Error deleting member:', error)
        alert('Error deleting member')
      }
    }
  }

  async function handleDeleteActivity(activityId) {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteDoc(doc(db, 'activities', activityId))
        fetchActivities()
        alert('Activity deleted successfully!')
      } catch (error) {
        console.error('Error deleting activity:', error)
        alert('Error deleting activity')
      }
    }
  }

  async function handleLogout() {
    await signOut(auth)
    router.push('/')
  }

  if (loading && !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-medical-bg">
      {/* Header */}
      <div className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-white/80">Welcome back, {user?.email}</p>
            </div>
            <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-medical-border bg-white">
        <div className="container mx-auto px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 font-medium transition ${activeTab === 'activity' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-600 hover:text-primary'}`}
            >
              Add Activity
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 font-medium transition ${activeTab === 'members' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-600 hover:text-primary'}`}
            >
              Manage Members
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-3 font-medium transition ${activeTab === 'list' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-600 hover:text-primary'}`}
            >
              Activity List
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        {/* Activity Form Tab */}
        {activeTab === 'activity' && (
          <div className="card">
            <h2 className="text-2xl mb-6">Add New Activity</h2>
            <form onSubmit={handleSubmitActivity} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Leo Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="input-field"
                    required
                  >
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    className="input-field"
                    required
                  >
                    {months.map(month => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">Activity Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="label">Image URLs (comma separated)</label>
                <input
                  type="text"
                  value={formData.photos}
                  onChange={(e) => setFormData({...formData, photos: e.target.value})}
                  className="input-field"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
              
              <div>
                <label className="label">Tag Members & Assign Awards</label>
                <MemberTaggingSystem
                  members={members}
                  selectedParticipants={formData.participants}
                  onParticipantsChange={(participants) => setFormData({...formData, participants})}
                />
              </div>
              
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Saving...' : 'Save Activity'}
              </button>
            </form>
          </div>
        )}
        
        {/* Members Management Tab */}
        {activeTab === 'members' && (
          <div className="space-y-8">
            <div className="card">
              <h2 className="text-2xl mb-6">{editingMemberId ? 'Edit Member' : 'Add New Member'}</h2>
              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Member ID (e.g., L2026JOHN)</label>
                    <input
                      type="text"
                      value={memberForm.memberId}
                      onChange={(e) => setMemberForm({...memberForm, memberId: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Roll Number</label>
                    <input
                      type="text"
                      value={memberForm.rollNo}
                      onChange={(e) => setMemberForm({...memberForm, rollNo: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Batch</label>
                    <input
                      type="text"
                      value={memberForm.batch}
                      onChange={(e) => setMemberForm({...memberForm, batch: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Current Role</label>
                    <input
                      type="text"
                      value={memberForm.currentRole}
                      onChange={(e) => setMemberForm({...memberForm, currentRole: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Photo URL</label>
                    <input
                      type="text"
                      value={memberForm.photoUrl}
                      onChange={(e) => setMemberForm({...memberForm, photoUrl: e.target.value})}
                      className="input-field"
                      placeholder="https://via.placeholder.com/150"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="btn-primary">
                    {editingMemberId ? 'Update Member' : 'Add Member'}
                  </button>
                  {editingMemberId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemberId(null)
                        setMemberForm({
                          memberId: '',
                          name: '',
                          rollNo: '',
                          batch: '',
                          currentRole: '',
                          photoUrl: ''
                        })
                      }}
                      className="btn-secondary"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="card">
              <h2 className="text-2xl mb-6">All Members</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Photo</th>
                      <th className="px-4 py-3 text-left">Member ID</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Batch</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-t border-medical-border hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{member.memberId}</td>
                        <td className="px-4 py-3 font-medium">{member.name}</td>
                        <td className="px-4 py-3">{member.currentRole}</td>
                        <td className="px-4 py-3">{member.batch}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingMemberId(member.id)
                                setMemberForm(member)
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMemberForQR(member)
                                setShowQRModal(true)
                              }}
                              className="text-secondary hover:text-secondary/80"
                            >
                              QR Cert
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Activity List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-8">
            {Object.entries(activities).map(([year, monthsData]) => (
              <div key={year} className="card">
                <h2 className="text-2xl mb-4 text-secondary">{year}</h2>
                {Object.entries(monthsData).map(([month, monthActivities]) => (
                  <div key={month} className="mb-6">
                    <h3 className="text-xl mb-3 text-primary">{month}</h3>
                    <div className="space-y-4">
                      {monthActivities.map((activity) => (
                        <div key={activity.id} className="border border-medical-border rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{activity.title}</h4>
                              <p className="text-gray-600 mb-2">{activity.description}</p>
                              <p className="text-sm text-gray-500">
                                Participants: {activity.participants?.length || 0} members
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => window.open(`/archive/${year.split('/')[0]}/${month.toLowerCase()}`, '_blank')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(activity.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* QR Modal */}
      {showQRModal && selectedMemberForQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <QRCertificate member={selectedMemberForQR} onClose={() => setShowQRModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
