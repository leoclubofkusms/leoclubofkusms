import { useRef } from "react";
import { X, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Award } from "@/lib/types";

interface Props {
  award: Award;
  onClose: () => void;
}

export default function AwardCertificateModal({ award, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const verifyUrl = award.memberId
    ? `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${award.memberId}`
    : "";

  async function downloadPDF() {
    if (!certRef.current) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas").catch(() => ({
      default: null,
    })) as { default: ((el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>) | null };
    if (!html2canvas) { window.print(); return; }
    const canvas = await html2canvas(certRef.current, {
      scale: 2.5,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pw, ph);
    pdf.save(`${award.title.replace(/\s+/g, "-")}-${award.recipientName.replace(/\s+/g, "-")}-${award.month}-${award.year}.pdf`);
  }

  function printCert() {
    if (!certRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${award.title} — ${award.recipientName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@300;400;500;600&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; }
            @page { size: A4 landscape; margin: 0; }
          </style>
        </head>
        <body>${certRef.current.outerHTML}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#002147]">Award Certificate Preview</h3>
          <div className="flex items-center gap-2">
            <button onClick={printCert}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Printer size={15} /> Print
            </button>
            <button onClick={downloadPDF}
              className="flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors">
              <Download size={15} /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div className="p-6">
          <div
            ref={certRef}
            style={{
              width: "297mm",
              height: "210mm",
              maxWidth: "100%",
              background: "linear-gradient(135deg, #002147 0%, #001530 100%)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20mm 18mm",
              fontFamily: "'Inter', sans-serif",
              overflow: "hidden",
            }}
          >
            {/* Decorative corners */}
            <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: 80, borderTop: "4px solid #D4AF37", borderLeft: "4px solid #D4AF37" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderTop: "4px solid #D4AF37", borderRight: "4px solid #D4AF37" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 80, height: 80, borderBottom: "4px solid #D4AF37", borderLeft: "4px solid #D4AF37" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 80, height: 80, borderBottom: "4px solid #D4AF37", borderRight: "4px solid #D4AF37" }} />

            {/* Gold top line */}
            <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 1, background: "rgba(212,175,55,0.4)" }} />
            <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, height: 1, background: "rgba(212,175,55,0.4)" }} />

            {/* Background orb */}
            <div style={{ position: "absolute", top: "-15%", right: "-10%", width: 260, height: 260, borderRadius: "50%", background: "rgba(212,175,55,0.05)" }} />
            <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(212,175,55,0.04)" }} />

            {/* Main content layout */}
            <div style={{ display: "flex", alignItems: "center", gap: 40, width: "100%", zIndex: 1 }}>

              {/* Left: photo or icon */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, minWidth: 100 }}>
                {award.photoUrl ? (
                  <img src={award.photoUrl} alt={award.recipientName}
                    style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid #D4AF37" }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: "50%", background: "rgba(212,175,55,0.2)", border: "3px solid #D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, color: "#D4AF37" }}>★</span>
                  </div>
                )}
                {verifyUrl && (
                  <div style={{ background: "white", padding: 6, borderRadius: 6 }}>
                    <QRCodeSVG value={verifyUrl} size={56} bgColor="#ffffff" fgColor="#002147" />
                  </div>
                )}
              </div>

              {/* Center: main text */}
              <div style={{ flex: 1, textAlign: "center" }}>
                {/* Lions header */}
                <div style={{ color: "rgba(212,175,55,0.7)", fontSize: 9, letterSpacing: 4, textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>
                  Lions Clubs International — District 325L
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
                  Leo Club of Kathmandu University School of Medical Sciences (KUSMS)
                </div>

                {/* Certificate title */}
                <div style={{ color: "#D4AF37", fontSize: 11, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
                  Certificate of Recognition
                </div>
                <div style={{ height: 1, background: "rgba(212,175,55,0.4)", marginBottom: 10 }} />

                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginBottom: 6, fontStyle: "italic" }}>
                  This certificate is proudly presented to
                </div>

                {/* Recipient name */}
                <div style={{ color: "#ffffff", fontSize: 30, fontWeight: 700, letterSpacing: 1, lineHeight: 1.2, marginBottom: 8 }}>
                  {award.recipientName}
                </div>

                {/* Award title banner */}
                <div style={{
                  background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), rgba(212,175,55,0.35), rgba(212,175,55,0.2), transparent)",
                  border: "1px solid rgba(212,175,55,0.4)",
                  borderRadius: 4,
                  padding: "6px 20px",
                  display: "inline-block",
                  marginBottom: 10,
                }}>
                  <div style={{ color: "#D4AF37", fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                    {award.title}
                  </div>
                </div>

                {/* Period */}
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginBottom: award.description ? 8 : 14 }}>
                  {award.month} · Leo Year {award.year}
                  {award.awardedBy ? ` · Awarded by ${award.awardedBy}` : ""}
                </div>

                {award.description && (
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontStyle: "italic", maxWidth: 380, margin: "0 auto 14px" }}>
                    "{award.description}"
                  </div>
                )}

                <div style={{ height: 1, background: "rgba(212,175,55,0.3)", marginBottom: 10 }} />

                {/* Signature row */}
                <div style={{ display: "flex", justifyContent: "space-around", color: "rgba(255,255,255,0.5)", fontSize: 8 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid rgba(212,175,55,0.4)", paddingTop: 4, width: 100, margin: "8px auto 0" }}>Club President</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, marginBottom: 0 }}>🦁</div>
                    <div style={{ fontSize: 9, color: "rgba(212,175,55,0.8)" }}>Leo Club of KUSMS</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid rgba(212,175,55,0.4)", paddingTop: 4, width: 100, margin: "8px auto 0" }}>Zone Chairperson</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
