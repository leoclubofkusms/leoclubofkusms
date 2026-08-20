import { Link } from "wouter";
import { CLUB_FACEBOOK, CLUB_TIKTOK, CLUB_ESTABLISHED, CLUB_ID } from "@/lib/types";
import { Facebook, ExternalLink, Mail, MapPin, Calendar } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export default function Footer() {
  return (
    <footer className="bg-[#002147] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <BrandMark />
              <span className="font-bold text-base">Leo Club of KUSMS</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-3">
              Leadership Through Service. Chartered on {CLUB_ESTABLISHED}.
            </p>
            <div className="flex gap-2">
              <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity"
                title="Facebook">
                <Facebook size={15} className="text-white" />
              </a>
              <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center hover:opacity-80 transition-opacity"
                title="TikTok">
                <span className="text-white font-bold text-xs">TT</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-[#D4AF37] mb-3 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/" className="hover:text-[#D4AF37] transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-[#D4AF37] transition-colors">About Us</Link></li>
              <li><Link href="/members" className="hover:text-[#D4AF37] transition-colors">Members</Link></li>
              <li><Link href="/archive/2026-27/january" className="hover:text-[#D4AF37] transition-colors">Activity Archive</Link></li>
              <li><Link href="/admin/login" className="hover:text-[#D4AF37] transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[#D4AF37] mb-3 text-sm uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <Mail size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <a href="mailto:leoclubofkusms@gmail.com" className="hover:text-[#D4AF37] transition-colors break-all">
                  leoclubofkusms@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Kathmandu University School of Medical Sciences, Dhulikhel, Kavre, Nepal</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-[#D4AF37] mb-3 text-sm uppercase tracking-wider">
              Follow Us
            </h3>
            <div className="space-y-3">
              <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors group">
                <div className="w-7 h-7 rounded-md bg-[#1877F2] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Facebook size={13} className="text-white" />
                </div>
                <span>Facebook Page</span>
                <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors group">
                <div className="w-7 h-7 rounded-md bg-black border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xs">TT</span>
                </div>
                <span>TikTok @leoclub.kusms</span>
                <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <div className="flex items-start gap-3 text-sm text-white/50 mt-2">
                <Calendar size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Established {CLUB_ESTABLISHED}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Leo Club of Kathmandu University School of Medical Sciences (KUSMS). All rights reserved.</p>
          <p>Lions Clubs International · District 325L · Club #{CLUB_ID}</p>
        </div>
      </div>
    </footer>
  );
}
