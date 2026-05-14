import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-secondary">KUSMS Leo Club</h3>
            <p className="text-white/70 text-sm">
              Leadership Through Service - Empowering future medical professionals through community service and leadership development.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-secondary">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/70 hover:text-secondary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/archive/2026/january" className="text-white/70 hover:text-secondary transition">
                  Archives
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-white/70 hover:text-secondary transition">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-secondary">Legacy System</h3>
            <p className="text-white/70 text-sm">
              This system preserves the legacy of every Leo member. Your service record remains verifiable forever.
            </p>
            <div className="mt-4 text-white/50 text-xs">
              <p>© {currentYear} KUSMS Leo Club</p>
              <p>Built with Next.js & Firebase</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-6 pt-6 text-center text-white/50 text-xs">
          <p>Future-Proof Legacy System - Your contributions will be remembered for generations</p>
        </div>
      </div>
    </footer>
  )
}
