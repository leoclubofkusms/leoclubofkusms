import { useState } from "react";
import { submitEventApplication, findMemberByMembershipId } from "@/lib/firestore";
import type { ClubEvent } from "@/lib/types";
import { X, Loader2, Check, QrCode } from "lucide-react";

export default function ApplicationFormModal({
  event,
  onClose,
}: {
  event: ClubEvent;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    facultyBatch: "",
    phone: "",
    memberType: "" as "" | "leo" | "non-leo",
    membershipId: "",
    transactionId: "",
    custom: [] as { question: string; answer: string }[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isLeo = form.memberType === "leo";
  const fee = isLeo
    ? (event.feeLeo ?? 0)
    : form.memberType === "non-leo"
    ? (event.feeNonLeo ?? 0)
    : 0;
  const requiresPayment = fee > 0;

  function updateCustom(question: string, answer: string) {
    setForm((f) => {
      const existing = f.custom.find((c) => c.question === question);
      return {
        ...f,
        custom: existing
          ? f.custom.map((c) => (c.question === question ? { ...c, answer } : c))
          : [...f.custom, { question, answer }],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.facultyBatch.trim() || !form.phone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!form.memberType) {
      setError("Please select whether you are a Leo member or not.");
      return;
    }
    if (isLeo && !form.membershipId.trim()) {
      setError("Membership ID is required for Leo members.");
      return;
    }
    if (requiresPayment) {
      if (!/^[a-zA-Z0-9]{6}$/.test(form.transactionId.trim())) {
        setError(
          "Please enter the last 6 characters of your transaction code (letters and numbers)."
        );
        return;
      }
    }
    for (const q of event.customQuestions ?? []) {
      if (q.required) {
        const ans = form.custom.find((c) => c.question === q.label)?.answer ?? "";
        if (!ans.trim()) {
          setError(`Please answer: ${q.label}`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      // Build payload defensively — never send `undefined` to Firestore.
      const payload: Parameters<typeof submitEventApplication>[0] = {
        eventId: event.id,
        eventTitle: event.title,
        name: form.name.trim(),
        facultyBatch: form.facultyBatch.trim(),
        phone: form.phone.trim(),
        memberType: form.memberType,
        feeAmount: requiresPayment ? fee : 0,
        customAnswers: form.custom.filter((c) => c.answer.trim()),
        submittedAt: new Date().toISOString(),
      };
      if (requiresPayment && form.transactionId.trim()) {
        payload.transactionId = form.transactionId.trim();
      }

      // ── Membership ID verification ──
      if (isLeo) {
        const typedId = form.membershipId.trim();
        payload.membershipId = typedId;
        // Look up the ID against the real members collection.
        // If it matches → verified. If not → unverified (still allowed, admin will review).
        let matched = null;
        try {
          matched = await findMemberByMembershipId(typedId);
        } catch {
          matched = null;
        }
        if (matched) {
          payload.membershipStatus = "verified";
          payload.matchedMemberId = matched.memberId;
          payload.matchedMemberName = matched.name;
        } else {
          payload.membershipStatus = "unverified";
        }
      } else {
        payload.membershipStatus = "non-leo";
      }

      await submitEventApplication(payload);
      setSuccess(true);
      setTimeout(() => onClose(), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-3 py-1 text-xs font-bold text-[#002147] mb-2">
            {event.applicationType || "Application"}
          </div>
          <h2 className="text-xl font-bold text-[#002147]">{event.title}</h2>
          {event.applicationPrompt && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {event.applicationPrompt}
            </p>
          )}
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#002147] mb-1">Application Submitted!</h3>
            <p className="text-sm text-gray-500">
              We've received your application. The team will contact you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
              />
            </div>

            {/* Faculty / Batch */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Faculty & Batch <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.facultyBatch}
                onChange={(e) => setForm((f) => ({ ...f, facultyBatch: e.target.value }))}
                placeholder="e.g. 21st MBBS, 22nd BDS"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Contact Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="98XXXXXXXX"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
              />
            </div>

            {/* Member type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Are you a Leo member? <span className="text-red-400">*</span>
              </label>
              <select
                value={form.memberType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    memberType: e.target.value as "" | "leo" | "non-leo",
                    membershipId: e.target.value === "leo" ? f.membershipId : "",
                  }))
                }
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#002147]"
              >
                <option value="">Select…</option>
                <option value="leo">Yes — Leo Member</option>
                <option value="non-leo">No — Non-Leo</option>
              </select>
            </div>

            {/* Leo: membership ID */}
            {isLeo && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Membership ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.membershipId}
                  onChange={(e) => setForm((f) => ({ ...f, membershipId: e.target.value }))}
                  placeholder="Your Leo Club membership ID"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the exact ID shown on your Leo Club ID card.
                </p>
              </div>
            )}

            {/* Fee / Payment */}
            {requiresPayment && (
              <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode size={15} className="text-[#D4AF37]" />
                  <span className="text-sm font-bold text-[#002147]">
                    Payment Required: NPR {fee}
                  </span>
                </div>
                {event.paymentQrUrl && (
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <img
                      src={event.paymentQrUrl}
                      alt="Payment QR"
                      className="w-full max-w-[200px] mx-auto object-contain"
                    />
                  </div>
                )}
                {event.paymentNote && (
                  <p className="text-xs text-gray-600 italic">{event.paymentNote}</p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Last 6 characters of Transaction Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="text"
                    maxLength={6}
                    value={form.transactionId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        transactionId: e.target.value
                          .replace(/[^a-zA-Z0-9]/g, "")
                          .slice(0, 6)
                          .toUpperCase(),
                      }))
                    }
                    placeholder="e.g. AB1234"
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-[#002147]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Letters and numbers are allowed. Not case-sensitive.
                  </p>
                </div>
              </div>
            )}

            {/* Custom questions */}
            {(event.customQuestions ?? []).map((q) => (
              <div key={q.id}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {q.label} {q.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={form.custom.find((c) => c.question === q.label)?.answer ?? ""}
                  onChange={(e) => updateCustom(q.label, e.target.value)}
                  required={q.required}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#002147] text-white py-3 rounded-xl font-bold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting…
                </>
              ) : (
                <>Submit Application</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
