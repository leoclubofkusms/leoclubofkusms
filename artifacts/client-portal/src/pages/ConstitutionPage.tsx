import { useEffect, useState } from "react";
import { getConstitution } from "@/lib/firestore";
import type { Constitution, ConstitutionSection } from "@/lib/types";
import {
  FileText, BookOpen, ChevronDown, ChevronUp, ExternalLink,
  Calendar, Clock, Shield, Download,
} from "lucide-react";

function SectionCard({ section, index }: { section: ConstitutionSection; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl transition-all duration-200 overflow-hidden ${open ? "border-[#002147] shadow-md" : "border-gray-200 hover:border-[#002147]/40 hover:shadow-sm"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left group"
      >
        {/* Number badge */}
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${open ? "bg-[#002147] text-[#D4AF37]" : "bg-[#F8FAFC] text-[#002147] group-hover:bg-[#002147]/5"}`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {section.number && (
            <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-0.5">
              {section.number}
            </div>
          )}
          <div className="font-bold text-[#002147] group-hover:text-[#003575] transition-colors">
            {section.title}
          </div>
          {!open && section.content && (
            <div className="text-sm text-gray-400 mt-0.5 truncate">
              {section.content.slice(0, 100)}{section.content.length > 100 ? "…" : ""}
            </div>
          )}
        </div>

        <div className={`shrink-0 transition-colors ${open ? "text-[#002147]" : "text-gray-400"}`}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-6 py-5 bg-[#F8FAFC]">
          <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
            {section.content || <span className="text-gray-400 italic">No content provided for this section.</span>}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ConstitutionPage() {
  const [constitution, setConstitution] = useState<Constitution | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"sections" | "pdf">("sections");
  const [allOpen, setAllOpen] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getConstitution()
      .then((c) => setConstitution(c))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggleAll() {
    if (allOpen) {
      setOpenMap({});
      setAllOpen(false);
    } else {
      const m: Record<string, boolean> = {};
      constitution?.sections.forEach((s) => { m[s.id] = true; });
      setOpenMap(m);
      setAllOpen(true);
    }
  }

  const hasPdf = !!constitution?.pdfUrl;
  const hasSections = (constitution?.sections?.length ?? 0) > 0;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isEmpty = !hasPdf && !hasSections;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-[#002147]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-[#002147]" />
            </div>
            <div>
              <div className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase">
                Leo Club of KUSMS
              </div>
              <div className="text-white/50 text-xs">Official Document</div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {constitution?.title || "Club Constitution"}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-6">
            {constitution?.adoptedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                Adopted: {constitution.adoptedDate}
              </div>
            )}
            {constitution?.lastAmended && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                Last Amended: {constitution.lastAmended}
              </div>
            )}
            {hasSections && (
              <div className="flex items-center gap-1.5">
                <FileText size={13} />
                {constitution!.sections.length} Section{constitution!.sections.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* View toggle */}
          {hasPdf && hasSections && (
            <div className="flex gap-2">
              {(["sections", "pdf"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === v ? "bg-[#D4AF37] text-[#002147]" : "bg-white/10 text-white hover:bg-white/20"}`}
                >
                  {v === "sections" ? "Read Sections" : "View PDF"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isEmpty ? (
          /* Empty state */
          <div className="text-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <FileText size={28} className="opacity-40" />
            </div>
            <h2 className="text-xl font-bold text-gray-500 mb-2">Constitution Not Published Yet</h2>
            <p className="text-sm">The club constitution will appear here once the admin publishes it.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* PDF-only view */}
            {hasPdf && (!hasSections || view === "pdf") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-[#002147] text-lg flex items-center gap-2">
                    <FileText size={18} className="text-[#D4AF37]" /> PDF Document
                  </h2>
                  <a
                    href={constitution!.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
                  >
                    <Download size={14} /> Download PDF
                  </a>
                </div>

                {/* Embedded PDF viewer */}
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Constitution PDF</span>
                    <a href={constitution!.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#002147] hover:text-[#003575] flex items-center gap-1">
                      Open in new tab <ExternalLink size={10} />
                    </a>
                  </div>
                  <iframe
                    src={`${constitution!.pdfUrl}#toolbar=0`}
                    className="w-full"
                    style={{ height: "75vh", minHeight: "500px" }}
                    title="Club Constitution PDF"
                  />
                </div>
              </div>
            )}

            {/* Sections view */}
            {hasSections && (!hasPdf || view === "sections") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-[#002147] text-lg flex items-center gap-2">
                    <BookOpen size={18} className="text-[#D4AF37]" />
                    {constitution!.sections.length} Section{constitution!.sections.length !== 1 ? "s" : ""}
                  </h2>
                  <div className="flex items-center gap-3">
                    {hasPdf && (
                      <a href={constitution!.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[#002147] border border-[#002147]/20 px-3 py-1.5 rounded-xl hover:bg-[#002147] hover:text-white transition-all">
                        <Download size={13} /> PDF
                      </a>
                    )}
                    <button
                      onClick={toggleAll}
                      className="text-sm text-[#002147] border border-[#002147]/20 px-3 py-1.5 rounded-xl hover:bg-[#002147] hover:text-white transition-all"
                    >
                      {allOpen ? "Collapse All" : "Expand All"}
                    </button>
                  </div>
                </div>

                {/* Table of contents */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Table of Contents</div>
                  <div className="space-y-1">
                    {constitution!.sections.map((s, i) => (
                      <a
                        key={s.id}
                        href={`#section-${s.id}`}
                        className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#002147]/5 transition-colors group"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenMap((m) => ({ ...m, [s.id]: true }));
                          setTimeout(() => {
                            document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 50);
                        }}
                      >
                        <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                        {s.number && <span className="text-xs text-[#D4AF37] font-bold shrink-0">{s.number}</span>}
                        <span className="text-sm text-gray-600 group-hover:text-[#002147] transition-colors truncate">{s.title}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-3">
                  {constitution!.sections.map((section, i) => (
                    <div key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
                      <ExpandableSection
                        section={section}
                        index={i}
                        isOpen={!!openMap[section.id]}
                        onToggle={() => setOpenMap((m) => ({ ...m, [section.id]: !m[section.id] }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer stamp */}
            <div className="border-t border-gray-200 pt-8 flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-[#D4AF37]" />
                Official document of Leo Club of KUSMS
              </div>
              {constitution?.adoptedDate && (
                <div>· Adopted {constitution.adoptedDate}</div>
              )}
              <div>· Lions Clubs International, District 325L</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpandableSection({
  section, index, isOpen, onToggle,
}: {
  section: ConstitutionSection;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`border rounded-2xl transition-all duration-200 overflow-hidden ${isOpen ? "border-[#002147] shadow-md" : "border-gray-200 hover:border-[#002147]/40 hover:shadow-sm"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-6 py-4 text-left group">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${isOpen ? "bg-[#002147] text-[#D4AF37]" : "bg-[#F8FAFC] text-[#002147] group-hover:bg-[#002147]/5"}`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          {section.number && (
            <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-0.5">{section.number}</div>
          )}
          <div className="font-bold text-[#002147] group-hover:text-[#003575] transition-colors">{section.title}</div>
          {!isOpen && section.content && (
            <div className="text-sm text-gray-400 mt-0.5 truncate">
              {section.content.slice(0, 100)}{section.content.length > 100 ? "…" : ""}
            </div>
          )}
        </div>
        <div className={`shrink-0 transition-colors ${isOpen ? "text-[#002147]" : "text-gray-400"}`}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-gray-100 px-6 py-5 bg-[#F8FAFC]">
          <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
            {section.content || <span className="text-gray-400 italic">No content provided for this section.</span>}
          </p>
        </div>
      )}
    </div>
  );
}
