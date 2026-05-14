'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'react-qr-code'

export default function VerifyMemberPage() {
  const params = useParams()
  const [member, setMember] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const memberId = params.memberId

  useEffect(() => {
    fetchMemberData()
  }, [memberId])

  async function fetchMemberData() {
    setLoading(true)
    try {
      // Fetch member details
      const q = query(collection(db, 'members'), where('memberId', '==', memberId))
      const memberSnapshot = await getDocs(q)
      
      if (memberSnapshot.empty) {
        setLoading(false)
        return
      }
      
      const memberData = { id: memberSnapshot.docs[0].id, ...memberSnapshot.docs[0].data() }
      setMember(memberData)
      
      // Fetch all activities where member participated
      if (memberData.activities && memberData.activities.length > 0) {
        const activityPromises = memberData.activities.map(async (activityRef) => {
          const activityDoc = await getDoc(doc(db, 'activities', activityRef.activityId))
          if (activityDoc.exists()) {
            return { id: activityDoc.id, ...activityDoc.data(), awardTitle: activityRef.awardTitle }
          }
          return null
        })
        
        const activityResults = await Promise.all(activityPromises)
        const validActivities = activityResults.filter(a => a !== null)
        
        // Sort chronologically by year
        validActivities.sort((a, b) => {
          const yearA = parseInt(a.year.split('/')[0])
          const yearB = parseInt(b.year.split('/')[0])
          if (yearA !== yearB) return yearA - yearB
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
          return months.indexOf(a.month) - months.indexOf(b.month)
        })
        
        setActivities(validActivities)
      }
    } catch (error) {
      console.error('Error fetching member data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading member data...</div>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl text-red-600 mb-4">Member Not Found</h2>
          <p className="text-gray-600 mb-6">No member found with ID: {memberId}</p>
          <Link href="/" className="btn-primary inline-block">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  // Group activities by year
  const groupedActivities = activities.reduce((groups, activity) => {
    const year = activity.year
    if (!groups[year]) groups[year] = []
    groups[year].push(activity)
    return groups
  }, {})

  const years = Object.keys(groupedActivities).sort()

  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}/verify/member/${member.memberId}`

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header Card */}
        <div className="card mb-8 text-center">
<div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-secondary">
  {member.photoUrl ? (
    <Image 
      src={member.photoUrl} 
      alt={member.name} 
      fill 
      className="object-cover"
      sizes="(max-width: 768px) 100px, 128px"
      onError={(e) => {
        e.target.src = 'https://via.placeholder.com/150'
      }}
    />
  ) : (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400">
      {member.name.charAt(0)}
    </div>
  )}
</div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-primary mb-2">{member.name}</h1>
          <p className="text-xl text-gray-600 mb-1">{member.currentRole}</p>
          <p className="text-gray-500">Member ID: {member.memberId} | Roll No: {member.rollNo} | Batch: {member.batch}</p>
          
          <div className="mt-6 flex justify-center">
            <div className="bg-white p-3 rounded-lg shadow-md inline-block">
              <QRCode value={verificationUrl} size={100} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Scan to share this CV</p>
        </div>
        
        {/* Timeline */}
        <div className="card">
          <h2 className="text-2xl text-primary mb-6">Leadership Journey Timeline</h2>
          
          {years.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activities recorded yet.</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-secondary hidden md:block"></div>
              
              {years.map((year, yearIndex) => (
                <div key={year} className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-secondary text-primary px-4 py-2 rounded-lg font-bold">
                      {year}
                    </div>
                  </div>
                  
                  <div className="space-y-4 ml-0 md:ml-8">
                    {groupedActivities[year].map((activity, idx) => (
                      <div key={idx} className="border-l-4 border-secondary pl-4 py-2 hover:bg-gray-50 transition">
                        <div className="flex flex-wrap justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-primary">{activity.title}</h3>
                          <span className="text-sm text-gray-500">{activity.month}</span>
                        </div>
                        
                        {activity.awardTitle && (
                          <div className="mb-2">
                            <span className="badge badge-gold text-sm">{activity.awardTitle}</span>
                          </div>
                        )}
                        
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{activity.description}</p>
                        
                        <Link
                          href={`/archive/${activity.year.split('/')[0]}/${activity.month.toLowerCase()}#${activity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                          className="text-secondary text-sm hover:underline inline-flex items-center"
                          target="_blank"
                        >
                          View Full Activity →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Verification Badge */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Verified Leo Club Member - KUSMS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
