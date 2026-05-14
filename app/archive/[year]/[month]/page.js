'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ArchivePage() {
  const params = useParams()
  const router = useRouter()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHash, setSelectedHash] = useState('')

  const year = params.year
  const month = params.month
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1)

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const currentMonthIndex = months.findIndex(m => m.toLowerCase() === month.toLowerCase())
  
  const prevMonth = currentMonthIndex > 0 ? months[currentMonthIndex - 1].toLowerCase() : null
  const nextMonth = currentMonthIndex < 11 ? months[currentMonthIndex + 1].toLowerCase() : null
  const prevYear = currentMonthIndex === 0 ? (parseInt(year) - 1).toString() : year
  const nextYear = currentMonthIndex === 11 ? (parseInt(year) + 1).toString() : year

  useEffect(() => {
    fetchActivities()
    
    // Handle URL hash for scrolling
    if (window.location.hash) {
      setSelectedHash(window.location.hash.slice(1))
      setTimeout(() => {
        const element = document.getElementById(window.location.hash.slice(1))
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 500)
    }
  }, [year, month])

  async function fetchActivities() {
    setLoading(true)
    try {
      const fullYear = `${year}/${parseInt(year) + 1}`
      const q = query(
        collection(db, 'activities'),
        where('year', '==', fullYear),
        where('month', '==', monthCapitalized)
      )
      const querySnapshot = await getDocs(q)
      const activitiesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setActivities(activitiesList)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }


  const getActivityId = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => prevMonth && router.push(`/archive/${prevYear}/${prevMonth}`)}
            disabled={!prevMonth}
            className={`px-4 py-2 rounded-lg ${prevMonth ? 'btn-secondary' : 'bg-gray-200 cursor-not-allowed'}`}
          >
            ← Previous Month
          </button>
          <h1 className="text-3xl font-bold text-primary">
            {monthCapitalized} {year}
          </h1>
          <button
            onClick={() => nextMonth && router.push(`/archive/${nextYear}/${nextMonth}`)}
            disabled={!nextMonth}
            className={`px-4 py-2 rounded-lg ${nextMonth ? 'btn-secondary' : 'bg-gray-200 cursor-not-allowed'}`}
          >
            Next Month →
          </button>
        </div>

// Add this loading component:
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[1,2,3].map(i => (
        <div key={i} className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

        {loading ? (
          <div className="text-center py-12">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No activities found for {monthCapitalized} {year}.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activities.map((activity) => (
              <div
                key={activity.id}
                id={getActivityId(activity.title)}
                className="card scroll-mt-20"
              >
                <h2 className="text-2xl text-primary mb-4">{activity.title}</h2>
                
                {activity.photos && activity.photos.length > 0 && (
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {activity.photos.map((photo, idx) => (
                      <div key={idx} className="relative h-48 rounded-lg overflow-hidden">
                        <Image src={photo} alt={`${activity.title} - ${idx + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-gray-700 mb-6 leading-relaxed">{activity.description}</p>
                
                {activity.participants && activity.participants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-3">Participants & Achievements</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {activity.participants.map((participant, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                          <span className="font-medium">{participant.memberId}</span>
                          {participant.awardTitle && (
                            <span className="badge badge-gold">{participant.awardTitle}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
