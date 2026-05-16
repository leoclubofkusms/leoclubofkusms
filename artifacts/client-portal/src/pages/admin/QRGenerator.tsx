import { useState, useEffect, useRef } from "react";
import { getMembers } from "@/lib/firestore";
import type { Member } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, User } from "lucide-react";

export default function QRGenerator() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMembers()
      .then((mems) => setMembers(mems.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verifyUrl = selected
    ? `${window.location.origin}${import.meta.env.BASE_URL}verify/member/${selected.memberId}`
    : "";

  async function downloadCertificate() {
    if (!certRef.current || !selected) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas").catch(() => ({
      default: null,
    })) as { default: ((el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>) | null };

    if (!html2canvas) {
      alert("Certificate download requires html2canvas. Please try printing instead.");
      return;
    }

    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${selected.memberId}-certificate.pdf`);
  }

  function printCertificate() {
    if (!certRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Leo Club Certificate - ${selected?.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, serif; }
        @media print { @page { size: A4 landscape; margin: 0; } }
      </style></head>
      <body>${certRef.current.outerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#002147]">QR Certificate Generator</h3>
        <p className="text-sm text-gray-500">Generate a PDF certificate with QR code for any member</p>
      </div>

      {/* Member selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Member</label>
        {loading ? (
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <select
            value={selected?.memberId ?? ""}
            onChange={(e) => setSelected(members.find((m) => m.memberId === e.target.value) ?? null)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10"
          >
            <option value="">-- Select a member --</option>
            {members.map((m) => (
              <option key={m.memberId} value={m.memberId}>
                {m.name} ({m.memberId}) — {m.batch}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selected && (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <QrCode size={40} className="mx-auto mb-3 opacity-30" />
          <p>Select a member to generate their certificate</p>
        </div>
      )}

      {selected && (
        <>
          {/* Action buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={printCertificate}
              className="inline-flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#003575] transition-colors"
            >
              <Download size={15} /> Print / Save PDF
            </button>
          </div>

          {/* Certificate Preview */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
              Certificate Preview
            </div>
            <div
              ref={certRef}
              className="bg-white p-0"
              style={{ aspectRatio: "1.414" }}
            >
              {/* Certificate content */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "white",
                  border: "12px solid #002147",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px",
                  position: "relative",
                  fontFamily: "Georgia, serif",
                  boxSizing: "border-box",
                }}
              >
                {/* Gold inner border */}
                <div style={{
                  position: "absolute",
                  inset: "20px",
                  border: "2px solid #D4AF37",
                  pointerEvents: "none",
                }} />

                {/* Top badge */}
                <div style={{
                  fontSize: "11px",
                  color: "#D4AF37",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                  fontFamily: "system-ui, sans-serif",
                }}>
                  Lions Clubs International — District 325 B1
                </div>

                {/* Club name */}
                <div style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#002147",
                  marginBottom: "4px",
                }}>
                  KUSMS Leo Club
                </div>
                <div style={{ width: "60px", height: "2px", background: "#D4AF37", margin: "12px 0" }} />

                <div style={{ fontSize: "12px", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "24px", fontFamily: "system-ui, sans-serif" }}>
                  Certificate of Membership
                </div>

                <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px", fontFamily: "system-ui, sans-serif" }}>
                  This certifies that
                </div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#002147", marginBottom: "4px" }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "24px", fontFamily: "system-ui, sans-serif" }}>
                  {selected.currentRole} · {selected.batch} · Roll No. {selected.rollNo}
                </div>

                <div style={{ fontSize: "12px", color: "#555", textAlign: "center", maxWidth: "340px", lineHeight: 1.6, fontFamily: "system-ui, sans-serif", marginBottom: "28px" }}>
                  is a verified member of the KUSMS Leo Club,
                  dedicated to leadership through service.
                </div>

                {/* QR Code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <QRCodeSVG value={verifyUrl} size={90} fgColor="#002147" />
                  <div style={{ fontSize: "9px", color: "#999", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
                    Scan to verify · {selected.memberId}
                  </div>
                </div>

                <div style={{ position: "absolute", bottom: "32px", fontSize: "10px", color: "#aaa", fontFamily: "system-ui, sans-serif" }}>
                  Issue Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
