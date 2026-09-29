import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LEO_YEARS, MONTHS } from "@/lib/types";
import {
  Menu, X, ChevronDown, Info, CalendarDays, Award, Clock,
  BookOpen, Trophy, BarChart3, FolderOpen,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [location] = useLocation();
  const { isAdmin, isOperator, signOut } = useAuth();
  const isLoggedIn = isAdmin || isOperator;

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
    setArchiveOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  const linkClass = (path: string) =>
    `relative py-1.5 text-sm font-medium transition-colors ${
      isActive(path)
        ? "text-[#D4AF37]"
        : "text-white/90 hover:text-[#D4AF37]"
    }`;

  return (
    <nav className="bg-[#002147] text-white shadow-lg sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center shrink-0">
            <BrandMark size="md" />
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            <Link href="/" className={linkClass("/")}>
              Home
              {isActive("/") && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />}
            </Link>
            <Link href="/about" className={linkClass("/about")}>
              About
              {isActive("/about") && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />}
            </Link>

            {/* Members dropdown */}
            <div className="relative group">
              <button className={`flex items-center gap-1 py-1.5 text-sm font-medium transition-colors ${
                isActive("/members") || isActive("/past-members")
                  ? "text-[#D4AF37]"
                  : "text-white/90 hover:text-[#D4AF37]"
              }`}>
                Members
                <ChevronDown size={13} className="group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150">
                <div className="bg-white text-[#002147] rounded-xl shadow-xl border border-gray-100 w-52 py-1.5 overflow-hidden">
                  <Link href="/members" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[#002147] hover:text-white transition-colors">
                    <Award size={14} className="text-[#D4AF37]" /> Active Members
                  </Link>
                  <Link href="/past-members" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[#002147] hover:text-white transition-colors">
                    <Clock size={14} className="text-[#D4AF37]" /> Past Members
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/events" className={linkClass("/events")}>
              Events
              {isActive("/events") && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />}
            </Link>
            <Link href="/awards" className={linkClass("/awards")}>
              Awards
              {isActive("/awards") && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />}
            </Link>
            <Link href="/wall-of-fame" className={linkClass("/wall-of-fame")}>
              Wall of Fame
              {isActive("/wall-of-fame") && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />}
            </Link>
            <Link href="/constitution" className={linkClass("/constitution")}>
              Constitution
              {isActive("/constitution") && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />}
            </Link>
            <Link href="/stats" className={linkClass("/stats")}>
              Stats
              {isActive("/stats") && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />}
            </Link>

            {/* Archive dropdown */}
            <div className="relative">
              <button
                onClick={() => setArchiveOpen(!archiveOpen)}
                onBlur={() => setTimeout(() => setArchiveOpen(false), 200)}
                className={`flex items-center gap-1 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/archive") ? "text-[#D4AF37]" : "text-white/90 hover:text-[#D4AF37]"
                }`}
              >
                Archive
                <ChevronDown size={13} className={`transition-transform duration-200 ${archiveOpen ? "rotate-180" : ""}`} />
              </button>
              {archiveOpen && (
                <div className="absolute top-full right-0 mt-3 bg-white text-[#002147] rounded-xl shadow-xl border border-gray-100 w-56 py-1.5 z-50 max-h-[70vh] overflow-y-auto">
                  <Link
                    href="/archive"
                    onClick={() => setArchiveOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold border-b border-gray-100 hover:bg-[#002147] hover:text-white transition-colors"
                  >
                    <FolderOpen size={14} className="text-[#D4AF37]" /> Browse All
                  </Link>
                  {LEO_YEARS.map((y) => (
                    <div key={y}>
                      <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Leo Year {y}
                      </div>
                      <div className="grid grid-cols-3 gap-1 px-3 pb-2">
                        {MONTHS.map((m) => (
                          <Link
                            key={m}
                            href={`/archive/${y.replace("/", "-")}/${m.toLowerCase()}`}
                            onClick={() => setArchiveOpen(false)}
                            className="text-center text-xs py-1.5 rounded-md hover:bg-[#002147] hover:text-white transition-colors"
                          >
                            {m.slice(0, 3)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop right side: auth only ── */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {isLoggedIn ? (
              <>
                <Link
                  href="/admin"
                  className="bg-[#D4AF37] text-[#002147] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#c9a432] transition-colors"
                >
                  {isAdmin ? "Admin" : "Operator"}
                </Link>
                <button
                  onClick={signOut}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/admin/login"
                className="border border-[#D4AF37]/60 text-[#D4AF37] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#D4AF37] hover:text-[#002147] transition-colors"
              >
                Admin Login
              </Link>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu — full-screen overlay ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-16 bg-[#002147] z-40 overflow-y-auto">
          <div className="px-5 py-6 space-y-1">

            <Link href="/" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              Home
            </Link>
            <Link href="/about" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/about") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <Info size={16} /> About
            </Link>
            <Link href="/members" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/members") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <Award size={16} /> Active Members
            </Link>
            <Link href="/past-members" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/past-members") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <Clock size={16} /> Past Members
            </Link>
            <Link href="/events" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/events") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <CalendarDays size={16} /> Events
            </Link>
            <Link href="/awards" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/awards") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <Award size={16} /> Awards
            </Link>
            <Link href="/wall-of-fame" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/wall-of-fame") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <Trophy size={16} /> Wall of Fame
            </Link>
            <Link href="/constitution" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/constitution") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <BookOpen size={16} /> Constitution
            </Link>
            <Link href="/stats" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${isActive("/stats") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
              <BarChart3 size={16} /> Stats
            </Link>

            {/* Archive expandable */}
            <div className="border-t border-white/10 pt-2 mt-2">
              <Link href="/archive" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors mb-2 ${isActive("/archive") ? "bg-[#D4AF37] text-[#002147]" : "hover:bg-white/10"}`}>
                <FolderOpen size={16} /> Archive
              </Link>
              <div className="px-2 space-y-3 pb-2">
                {LEO_YEARS.slice(0, 4).map((y) => (
                  <div key={y}>
                    <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 px-2">
                      Leo Year {y}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MONTHS.map((m) => (
                        <Link
                          key={m}
                          href={`/archive/${y.replace("/", "-")}/${m.toLowerCase()}`}
                          onClick={() => setOpen(false)}
                          className="text-xs bg-white/5 hover:bg-[#D4AF37] hover:text-[#002147] rounded-lg px-2 py-2 transition-colors text-center font-medium"
                        >
                          {m.slice(0, 3)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auth section */}
            <div className="border-t border-white/10 pt-4 mt-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center bg-[#D4AF37] text-[#002147] px-4 py-3.5 rounded-xl text-sm font-bold mb-2"
                  >
                    {isAdmin ? "Admin Dashboard" : "Operator Dashboard"}
                  </Link>
                  <button
                    onClick={() => { signOut(); setOpen(false); }}
                    className="w-full text-center text-sm text-white/60 hover:text-white py-2 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center border border-[#D4AF37]/60 text-[#D4AF37] px-4 py-3.5 rounded-xl text-sm font-semibold"
                >
                  Admin Login
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}
