'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchMemberId, setSearchMemberId] = useState('')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleVerifySearch = (e) => {
    e.preventDefault()
    if (searchMemberId.trim()) {
      router.push(`/verify/member/${searchMemberId.trim()}`)
      setSearchMemberId('')
      setIsMenuOpen(false)
    }
  }

  const years = ['2026', '2027', '2028', '2029', '2030']

  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-sm">L</span>
            </div>
            <span className="text-white font-bold text-lg">KUSMS LEO CLUB</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-white/90 hover:text-secondary transition">
              Home
            </Link>
            
            {/* Archive Dropdown */}
            <div className="relative group">
              <button className="text-white/90 hover:text-secondary transition flex items-center gap-1">
                Archive
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-lg mt-2 py-2 w-48">
                {years.map(year => (
                  <Link
                    key={year}
                    href={`/archive/${year}/january`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Year {year}/{parseInt(year)+1}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Verify Form */}
            <form onSubmit={handleVerifySearch} className="flex items-center">
              <input
                type="text"
                placeholder="Verify Member ID"
                value={searchMemberId}
                onChange={(e) => setSearchMemberId(e.target.value)}
                className="px-3 py-1 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                type="submit"
                className="bg-secondary text-primary px-3 py-1 rounded-r-lg text-sm font-medium hover:bg-opacity-90"
              >
                Verify
              </button>
            </form>
            
            {/* Admin Section */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="text-white/90 hover:text-secondary transition">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-secondary text-primary px-4 py-1 rounded-lg text-sm font-medium hover:bg-opacity-90"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="bg-secondary text-primary px-4 py-1 rounded-lg text-sm font-medium hover:bg-opacity-90"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-white/90 hover:text-secondary transition px-2 py-1" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              
              <div className="px-2 py-1">
                <div className="text-white/90 mb-2">Archive by Year</div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  {years.map(year => (
                    <Link
                      key={year}
                      href={`/archive/${year}/january`}
                      className="text-white/70 hover:text-secondary text-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {year}/{parseInt(year)+1}
                    </Link>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleVerifySearch} className="flex px-2">
                <input
                  type="text"
                  placeholder="Member ID to verify"
                  value={searchMemberId}
                  onChange={(e) => setSearchMemberId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-l-lg text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-secondary text-primary px-4 py-2 rounded-r-lg text-sm font-medium"
                >
                  Verify
                </button>
              </form>
              
              {user ? (
                <>
                  <Link href="/admin" className="text-white/90 hover:text-secondary transition px-2 py-1" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="text-white/90 hover:text-secondary transition px-2 py-1 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/admin/login" className="text-white/90 hover:text-secondary transition px-2 py-1" onClick={() => setIsMenuOpen(false)}>
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
