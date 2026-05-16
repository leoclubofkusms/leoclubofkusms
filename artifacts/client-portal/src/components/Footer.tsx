import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#002147] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center font-bold text-[#002147] text-sm">
                LC
              </div>
              <span className="font-bold text-lg">Leo Club of KUSMS</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Leadership Through Service. A Leo Club dedicated to excellence,
              community, and professional growth at KUSMS.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#D4AF37] mb-3 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/" className="hover:text-[#D4AF37] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/archive/2026-27/january"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Activity Archive
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#D4AF37] transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#D4AF37] mb-3 text-sm uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>leoclubofkusms@gmail.com</li>
              <li>Kathmandu University School of Medical Sciences</li>
              <li>Dhulikhel, Kavre, Nepal</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <p>© {new Date().getFullYear()} Leo Club of Kathmandu University School of Medical Sciences (KUSMS). All rights reserved.</p>
          <p>Part of Lions Clubs International District 325 B1</p>
        </div>
      </div>
    </footer>
  );
}
