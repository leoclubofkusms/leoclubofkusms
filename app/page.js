'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const [stats, setStats] = useState({ members: 0, activities: 0, years: 3 })
  const [latestActivities, setLatestActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch members count
      const membersSnapshot = await getDocs(collection(db, 'members'))
      const membersCount = membersSnapshot.size

      // Fetch activities
      const activitiesQuery = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(3))
      const activitiesSnapshot = await getDocs(activitiesQuery)
      const activitiesList = activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const activitiesCount = activitiesSnapshot.size

      setStats({ members: membersCount, activities: activitiesCount, years: 3 })
      setLatestActivities(activitiesList)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary/90 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            KUSMS Leo Club
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Leadership Through Service - Empowering Future Medical Professionals
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/archive/2026/january" className="btn-gold">
              View Archives
            </Link>
            <Link href="/admin/login" className="bg-white text-primary px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition">
              Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl font-bold text-secondary mb-2">{stats.members}</div>
            <div className="text-gray-600">Active Members</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-secondary mb-2">{stats.activities}</div>
            <div className="text-gray-600">Activities Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-secondary mb-2">{stats.years}+</div>
            <div className="text-gray-600">Years of Service</div>
          </div>
        </div>
      </div>

      {/* Latest Activities */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-center mb-12">Recent Activities</h2>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {latestActivities.map((activity) => (
              <div key={activity.id} className="card">
                {activity.photos && activity.photos[0] && (
                  <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                    <Image 
                      src={activity.photos[0]} 
                      alt={activity.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                <p className="text-gray-600 mb-2">{activity.month} {activity.year}</p>
                <p className="text-gray-500 mb-4 line-clamp-2">{activity.description}</p>
                <Link 
                  href={`/archive/${activity.year.split('/')[0]}/${activity.month.toLowerCase()}`}
                  className="text-secondary font-semibold hover:underline"
                >
                  View Activity →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mission Section */}
      <div className="bg-white py-16 border-t border-medical-border">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-4">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            To empower medical students through leadership development, community service, 
            and professional growth, creating compassionate healthcare leaders of tomorrow.
          </p>
        </div>
      </div>
    </div>
  )
}
