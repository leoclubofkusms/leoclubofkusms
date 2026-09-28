import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Check, X, MessageCircle, Facebook, QrCode, Download } from "lucide-react";

interface ShareButtonProps {
  /** URL to share. Usually window.location.href of the page. */
  url: string;
  /** Title of the event/activity being shared. */
  title: string;
  /** Short description (optional). Shown in the shared message. */
  description?: string;
  /** Extra line shown in the message — e.g. "Oct 2–4, 2026 · KUSMS" */
  meta?: string;
  /** "icon" for compact card-level button, "full" for prominent button. */
  variant?: "icon" | "full";
  /** Full button label. Defaults to "Share". */
  label?: string;
  /** Optional className passthrough for wrapper positioning. */
  className?: string;
}

export default function ShareButton({
  url, title, description, meta,
  variant = "full",
  label = "Share",
  className = "",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Build the pre-filled share message
  const shareText = (() => {
    const lines: string[] = [];
    lines.push(`🎉 ${title}`);
    if (meta) lines.push(`📅 ${meta}`);
    if (description) lines.push(description.slice(0, 200));
    lines.push("");
    lines.push(`Leo Club of KUSMS`);
    lines.push(url);
    return lines.join("\n");
  })();

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const whatsappUrl = `https://wa.me/?text=${encodedText}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleNativeShare() {
    try {
      await navigator.share({
        title,
        text: shareText,
        url,
      });
      setOpen(false);
    } catch {
      // User cancelled or share failed — no action needed
    }
  }

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older iOS / non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleOpenQr() {
    setQrOpen(true);
    setOpen(false);
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `qr-${title.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(objUrl);
  }

  return (
    <>
      {/* Trigger button */}
      {variant === "icon" ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          title="Share"
          aria-label="Share"
          className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ${className}`}
        >
          <Share2 size={15} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${className}`}
        >
          <Share2 size={15} /> {label}
        </button>
      )}

      {/* Share sheet */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="p-6 pt-8 sm:pt-6">
              <h3 className="text-lg font-bold text-[#002147] mb-1 pr-10">
                Share this
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-5 pr-10">
                {title}
              </p>

              <div className="space-y-2">
                {/* Native share (mobile only) */}
                {canNativeShare && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#002147] hover:bg-[#003575] text-white font-semibold transition-colors text-left"
                  >
                    <Share2 size={18} className="shrink-0" />
                    <span>Share via device</span>
                  </button>
                )}

                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-semibold transition-colors"
                >
                  <MessageCircle size={18} className="shrink-0" />
                  <span>WhatsApp</span>
                </a>

                {/* Facebook */}
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#1877F2] hover:bg-[#1565c0] text-white font-semibold transition-colors"
                >
                  <Facebook size={18} className="shrink-0" />
                  <span>Facebook</span>
                </a>

                {/* Copy link */}
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-[#002147]/30 hover:bg-gray-50 text-[#002147] font-semibold transition-colors text-left"
                >
                  {copied ? <Check size={18} className="text-green-600 shrink-0" /> : <Copy size={18} className="shrink-0" />}
                  <span>{copied ? "Link copied!" : "Copy link"}</span>
                </button>

                {/* QR code */}
                <button
                  onClick={handleOpenQr}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-[#002147]/30 hover:bg-gray-50 text-[#002147] font-semibold transition-colors text-left"
                >
                  <QrCode size={18} className="shrink-0" />
                  <span>Show QR code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR modal */}
      {qrOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="w-10 h-10 bg-[#002147] rounded-xl flex items-center justify-center mx-auto mb-3">
              <QrCode size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="font-bold text-[#002147] text-lg mb-1">Share via QR</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{title}</p>
            <div ref={qrRef} className="flex justify-center mb-4">
              <div className="p-3 border-2 border-[#002147] rounded-xl">
                <QRCodeSVG value={url} size={180} fgColor="#002147" />
              </div>
            </div>
            <p className="text-xs text-gray-400 break-all mb-4">{url}</p>
            <button
              onClick={downloadQr}
              className="w-full flex items-center justify-center gap-2 bg-[#002147] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
            >
              <Download size={14} /> Download QR
            </button>
          </div>
        </div>
      )}
    </>
  );
}
