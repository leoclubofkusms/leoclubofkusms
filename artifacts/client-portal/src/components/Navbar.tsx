import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LEO_YEARS, MONTHS } from "@/lib/types";
import { Menu, X, ChevronDown, Search, Info, CalendarDays, Award } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [verifyId, setVerifyId] = useState("");
  const [, navigate] = useLocation();
  const { isAdmin, isOperator, signOut } = useAuth();
  const isLoggedIn = isAdmin || isOperator;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyId.trim()) {
      navigate(`/verify/member/${verifyId.trim()}`);
      setVerifyId("");
      setOpen(false);
    }
  };

  return (
    <nav className="bg-[#002147] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center font-bold text-[#002147] text-sm shrink-0">
              LC
            </div>
            <span className="font-bold text-lg tracking-wide group-hover:text-[#D4AF37] transition-colors">
              Leo Club of KUSMS
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/" className="hover:text-[#D4AF37] transition-colors text-sm font-medium">
              Home
            </Link>

            <Link href="/about" className="hover:text-[#D4AF37] transition-colors text-sm font-medium flex items-center gap-1">
              <Info size={14} /> About
            </Link>

            <Link href="/members" className="hover:text-[#D4AF37] transition-colors text-sm font-medium">
              Members
            </Link>

            <Link href="/events" className="hover:text-[#D4AF37] transition-colors text-sm font-medium flex items-center gap-1">
              <CalendarDays size={14} /> Events
            </Link>

            <Link href="/awards" className="hover:text-[#D4AF37] transition-colors text-sm font-medium flex items-center gap-1">
              <Award size={14} /> Awards
            </Link>

            {/* Archive dropdown */}
            <div className="relative">
              <button
                onClick={() => setArchiveOpen(!archiveOpen)}
                className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors text-sm font-medium"
              >
                Archive <ChevronDown size={14} />
              </button>
              {archiveOpen && (
                <div className="absolute top-8 left-0 bg-white text-[#002147] rounded-lg shadow-xl border border-gray-100 w-48 py-2 z-50 max-h-80 overflow-y-auto">
                  {LEO_YEARS.map((y) => (
                    <div key={y} className="group/year">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
                        {y}
                      </div>
                      {MONTHS.map((m) => (
                        <Link
                          key={m}
                          href={`/archive/${y.replace("/", "-")}/${m.toLowerCase()}`}
                          className="block px-6 py-1.5 text-sm hover:bg-[#002147] hover:text-white transition-colors"
                          onClick={() => setArchiveOpen(false)}
                        >
                          {m}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verify search */}
            <form onSubmit={handleVerify} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Verify Member ID..."
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm placeholder-white/50 focus:outline-none focus:border-[#D4AF37] w-40"
              />
              <button type="submit" className="hover:text-[#D4AF37] transition-colors">
                <Search size={16} />
              </button>
            </form>

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="bg-[#D4AF37] text-[#002147] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#c9a432] transition-colors"
                >
                  {isAdmin ? "Admin" : "Operator"}
                </Link>
                <button
                  onClick={signOut}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="border border-[#D4AF37] text-[#D4AF37] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#D4AF37] hover:text-[#002147] transition-colors"
              >
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#001a38] border-t border-white/10 px-4 py-4 flex flex-col gap-4">
          <Link href="/" onClick={() => setOpen(false)} className="hover:text-[#D4AF37] font-medium">Home</Link>
          <Link href="/about" onClick={() => setOpen(false)} className="hover:text-[#D4AF37] font-medium flex items-center gap-1">
            <Info size={15} /> About
          </Link>
          <Link href="/members" onClick={() => setOpen(false)} className="hover:text-[#D4AF37] font-medium">Members</Link>
          <Link href="/events" onClick={() => setOpen(false)} className="hover:text-[#D4AF37] font-medium flex items-center gap-1">
            <CalendarDays size={15} /> Events
          </Link>
          <Link href="/awards" onClick={() => setOpen(false)} className="hover:text-[#D4AF37] font-medium flex items-center gap-1">
            <Award size={15} /> Awards
          </Link>
          <div>
            <div className="text-sm font-semibold text-white/60 mb-2">Archive</div>
            {LEO_YEARS.map((y) => (
              <div key={y} className="mb-2">
                <div className="text-xs text-white/40 mb-1">{y}</div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTHS.map((m) => (
                    <Link
                      key={m}
                      href={`/archive/${y.replace("/", "-")}/${m.toLowerCase()}`}
                      onClick={() => setOpen(false)}
                      className="text-xs bg-white/10 rounded px-2 py-1 hover:bg-[#D4AF37] hover:text-[#002147] transition-colors text-center"
                    >
                      {m.slice(0, 3)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="text"
              placeholder="Verify Member ID..."
              value={verifyId}
              onChange={(e) => setVerifyId(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder-white/50 focus:outline-none"
            />
            <button type="submit" className="bg-[#D4AF37] text-[#002147] px-3 rounded-lg font-semibold text-sm">Go</button>
          </form>
          {isLoggedIn ? (
            <div className="flex flex-col gap-2">
              <Link href="/admin" onClick={() => setOpen(false)}
                className="bg-[#D4AF37] text-[#002147] px-4 py-2 rounded-lg text-sm font-semibold text-center">
                {isAdmin ? "Admin Dashboard" : "Operator Dashboard"}
              </Link>
              <button onClick={signOut} className="text-sm text-white/60 text-left">Logout</button>
            </div>
          ) : (
            <Link href="/admin/login" onClick={() => setOpen(false)}
              className="border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-sm font-semibold text-center">
              Admin Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
