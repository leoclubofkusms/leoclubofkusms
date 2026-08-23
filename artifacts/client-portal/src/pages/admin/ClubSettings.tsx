import { useState, useEffect } from "react";
import { getClubSettings, updateClubSettings } from "@/lib/firestore";
import type { ClubSettings } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK } from "@/lib/types";
import {
  Link as LinkIcon, Check, Loader2, X, ExternalLink,
  Facebook, Settings, Calendar, Award, Quote, ShieldCheck, Heart, Image,
} from "lucide-react";

export default function ClubSettingsPanel() {
  const [settings, setSettings] = useState<ClubSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sloganSaving, setSloganSaving] = useState(false);
  const [donationSaving, setDonationSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [sloganInput, setSloganInput] = useState("");
  const [presidentContact, setPresidentContact] = useState({
    presidentWhatsApp: "",
    presidentWhatsAppMessage: "",
  });
  const [donationForm, setDonationForm] = useState({
    donationQrUrl: "",
    donationBankName: "",
    donationAccountName: "",
    donationAccountNumber: "",
    donationNote: "",
  });

  useEffect(() => {
    getClubSettings()
      .then((s) => {
        setSettings(s);
        setUrlInput(s.charteredCertificateUrl ?? "");
        setSloganInput(s.presidentSlogan ?? "");
        setPresidentContact({
          presidentWhatsApp: s.presidentWhatsApp ?? "",
          presidentWhatsAppMessage: s.presidentWhatsAppMessage ?? "",
        });
        setDonationForm({
          donationQrUrl: s.donationQrUrl ?? "",
          donationBankName: s.donationBankName ?? "",
          donationAccountName: s.donationAccountName ?? "",
          donationAccountNumber: s.donationAccountNumber ?? "",
          donationNote: s.donationNote ?? "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleCertFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setUploading("cert");
    try {
      const isPdf = file.type === "application/pdf";
      const path = `club-documents/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      const newSettings: ClubSettings = { ...settings, charteredCertificateUrl: url, charteredCertificateType: isPdf ? "pdf" : "image" };
      await updateClubSettings(newSettings);
      setSettings(newSettings);
      setUrlInput(url);
      showSuccess("Certificate uploaded and saved!");
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(null); }
  }

  async function handleUrlSave() {
    if (!urlInput.trim()) { setError("Please enter a URL."); return; }
    setError(""); setSaving(true);
    try {
      const isPdf = urlInput.toLowerCase().includes(".pdf");
      const newSettings: ClubSettings = { ...settings, charteredCertificateUrl: urlInput.trim(), charteredCertificateType: isPdf ? "pdf" : "image" };
      await updateClubSettings(newSettings);
      setSettings(newSettings);
      showSuccess("Certificate URL saved!");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save."); }
    finally { setSaving(false); }
  }

  async function handleRemoveCert() {
    setSaving(true);
    try {
      await updateClubSettings({ charteredCertificateUrl: "", charteredCertificateType: undefined });
      setSettings((s) => ({ ...s, charteredCertificateUrl: "", charteredCertificateType: undefined }));
      setUrlInput("");
      showSuccess("Certificate removed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to remove."); }
    finally { setSaving(false); }
  }

  async function handleSaveSlogan() {
    setSloganSaving(true);
    try {
      await updateClubSettings({ presidentSlogan: sloganInput.trim(), presidentSloganPhotoUrl: settings.presidentSloganPhotoUrl });
      setSettings((s) => ({ ...s, presidentSlogan: sloganInput.trim() }));
      showSuccess("Slogan saved!");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save slogan."); }
    finally { setSloganSaving(false); }
  }

  async function handleSloganPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setUploading("sloganPhoto");
    try {
      const path = `club-documents/slogan-photo-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await updateClubSettings({ presidentSloganPhotoUrl: url });
      setSettings((s) => ({ ...s, presidentSloganPhotoUrl: url }));
      showSuccess("Slogan photo saved!");
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(null); }
  }

  async function handleSavePresidentContact() {
    setSaving(true);
    setError("");
    try {
      await updateClubSettings(presidentContact);
      setSettings((s) => ({ ...s, ...presidentContact }));
      showSuccess("President contact saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save president contact.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSloganPhoto() {
    try {
      await updateClubSettings({ presidentSloganPhotoUrl: "" });
      setSettings((s) => ({ ...s, presidentSloganPhotoUrl: "" }));
      showSuccess("Photo removed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed."); }
  }

  async function handleDonationQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setUploading("donationQr");
    try {
      const path = `club-documents/donation-qr-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setDonationForm((f) => ({ ...f, donationQrUrl: url }));
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(null); }
  }

  async function handleSaveDonation() {
    setDonationSaving(true); setError("");
    try {
      await updateClubSettings({ ...donationForm });
      setSettings((s) => ({ ...s, ...donationForm }));
      showSuccess("Donation info saved!");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save."); }
    finally { setDonationSaving(false); }
  }

  if (loading) return <div className="text-center text-gray-400 text-sm py-8">Loading settings…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-[#002147]">Club Settings</h3>
        <p className="text-sm text-gray-500">Manage the president's slogan, chartered certificate, donation info, and club information.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <Check size={15} /> {success}
        </div>
      )}
      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      {/* President's Slogan */}
      <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
        <h4 className="font-semibold text-[#002147] flex items-center gap-2 mb-1">
          <Quote size={16} className="text-[#D4AF37]" /> President's Slogan (Current Year)
        </h4>
        <p className="text-sm text-gray-500 mb-4">This slogan and optional photo are displayed on the home page under the leadership section.</p>

        {settings.presidentSlogan && (
          <div className="bg-[#002147] text-white rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <Quote size={18} className="text-[#D4AF37] shrink-0" />
            <span className="font-bold italic text-lg">{settings.presidentSlogan}</span>
          </div>
        )}
        <div className="flex gap-3 mb-5">
          <input
            type="text"
            value={sloganInput}
            onChange={(e) => setSloganInput(e.target.value)}
            placeholder='e.g. "Architect The Legacy"'
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
          />
          <button onClick={handleSaveSlogan} disabled={sloganSaving}
            className="bg-[#002147] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center gap-2">
            {sloganSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Slogan"}
          </button>
        </div>

        {/* Slogan photo */}
        <div className="border-t border-gray-100 pt-5">
          <h5 className="text-sm font-semibold text-[#002147] flex items-center gap-2 mb-2">
            <Image size={14} className="text-[#D4AF37]" /> Slogan Photo (optional)
          </h5>
          <p className="text-xs text-gray-500 mb-3">Upload a photo to display alongside the slogan — e.g. a group photo or campaign banner.</p>
          {settings.presidentSloganPhotoUrl && (
            <div className="mb-3">
              <img src={settings.presidentSloganPhotoUrl} alt="Slogan photo"
                className="max-h-40 rounded-xl object-cover border border-gray-200" />
              <button onClick={handleRemoveSloganPhoto} className="mt-1.5 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={11} /> Remove photo
              </button>
            </div>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 hover:border-[#D4AF37] rounded-xl px-4 py-2.5 text-sm text-gray-500 transition-colors">
            {uploading === "sloganPhoto" ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload photo (JPG, PNG)</>}
            <input type="file" accept="image/*" className="hidden" onChange={handleSloganPhotoUpload} disabled={uploading !== null} />
          </label>
        </div>
      </div>

      {/* President Contact */}
      <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
        <h4 className="font-semibold text-[#002147] flex items-center gap-2 mb-1">
          <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] flex items-center justify-center font-bold">WA</span>
          Contact President on WhatsApp
        </h4>
        <p className="text-sm text-gray-500 mb-5">
          Add the current president's WhatsApp number. The public Contact President button will open WhatsApp with the message below.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">President WhatsApp Number</label>
            <input
              type="tel"
              value={presidentContact.presidentWhatsApp}
              onChange={(e) => setPresidentContact((p) => ({ ...p, presidentWhatsApp: e.target.value }))}
              placeholder="+977 98XXXXXXXX"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#25D366]"
            />
            <p className="text-xs text-gray-400 mt-1">Include the country code, for example +977. Spaces and symbols are handled automatically.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Default WhatsApp Message</label>
            <textarea
              value={presidentContact.presidentWhatsAppMessage}
              onChange={(e) => setPresidentContact((p) => ({ ...p, presidentWhatsAppMessage: e.target.value }))}
              rows={2}
              placeholder="Hello President, I would like to connect with Leo Club of KUSMS."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#25D366] resize-none"
            />
          </div>
          <button
            onClick={handleSavePresidentContact}
            disabled={saving}
            className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#20b858] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save President Contact</>}
          </button>
        </div>
      </div>

      {/* Donation / Support Section */}
      <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
        <h4 className="font-semibold text-[#002147] flex items-center gap-2 mb-1">
          <Heart size={16} className="text-[#D4AF37]" /> Donation / Support Section
        </h4>
        <p className="text-sm text-gray-500 mb-5">Upload a QR code photo and enter bank details. These appear on the public Donate page.</p>

        {/* QR Code */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-2">QR Code Photo</label>
          {donationForm.donationQrUrl && (
            <div className="mb-3">
              <img src={donationForm.donationQrUrl} alt="Donation QR"
                className="max-h-48 rounded-xl object-contain border border-gray-200 bg-white p-2" />
              <button onClick={() => setDonationForm((f) => ({ ...f, donationQrUrl: "" }))}
                className="mt-1.5 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={11} /> Remove QR
              </button>
            </div>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 hover:border-[#D4AF37] rounded-xl px-4 py-2.5 text-sm text-gray-500 transition-colors">
            {uploading === "donationQr" ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload QR code image</>}
            <input type="file" accept="image/*" className="hidden" onChange={handleDonationQrUpload} disabled={uploading !== null} />
          </label>
        </div>

        {/* Bank Details */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
            <input value={donationForm.donationBankName}
              onChange={(e) => setDonationForm((f) => ({ ...f, donationBankName: e.target.value }))}
              placeholder="e.g. Nepal Investment Bank Ltd." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
            <input value={donationForm.donationAccountName}
              onChange={(e) => setDonationForm((f) => ({ ...f, donationAccountName: e.target.value }))}
              placeholder="e.g. Leo Club of KUSMS" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
            <input value={donationForm.donationAccountNumber}
              onChange={(e) => setDonationForm((f) => ({ ...f, donationAccountNumber: e.target.value }))}
              placeholder="e.g. 0012345678" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note / Instructions (optional)</label>
            <textarea value={donationForm.donationNote}
              onChange={(e) => setDonationForm((f) => ({ ...f, donationNote: e.target.value }))}
              rows={2} placeholder="e.g. Please include your name in the remarks."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147] resize-none" />
          </div>
        </div>

        <button onClick={handleSaveDonation} disabled={donationSaving || uploading !== null}
          className="bg-[#002147] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center gap-2">
          {donationSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Donation Info</>}
        </button>
      </div>

      {/* Operator Account Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h4 className="font-semibold text-[#002147] flex items-center gap-2 mb-1">
          <ShieldCheck size={16} className="text-blue-500" /> Creating Operator Accounts
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          Operators can add activities, manage events &amp; awards, and generate QR certificates — but cannot manage members, BOD, or club settings.
        </p>
        <div className="bg-white rounded-xl border border-blue-100 p-4 text-sm text-gray-600 space-y-2">
          <div className="font-semibold text-[#002147]">Steps to create an operator account:</div>
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a> → your project → Authentication → Users</li>
            <li>Click <strong>Add user</strong>, enter the operator's email and a password</li>
            <li>Share the email and password with the operator</li>
            <li>Operator logs in at <strong>/admin/login</strong> with their credentials</li>
          </ol>
          <p className="text-xs text-gray-400 pt-1">Any Firebase Auth user who is NOT the admin email automatically gets operator-level access.</p>
        </div>
      </div>

      {/* Club Info (read-only) */}
      <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 space-y-4">
        <h4 className="font-semibold text-[#002147] flex items-center gap-2"><Settings size={16} /> Club Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Calendar size={13} /> Established</div>
            <div className="font-bold text-[#002147]">{CLUB_ESTABLISHED}</div>
            <div className="text-xs text-gray-500 mt-0.5">Official charter ceremony</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Award size={13} /> District</div>
            <div className="font-bold text-[#002147]">Lions Clubs International</div>
            <div className="text-xs text-gray-500 mt-0.5">District 325L</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Social Media</div>
          <div className="space-y-2">
            <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-[#1877F2]/40 transition-colors text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0">
                <Facebook size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#002147]">Facebook Page</div>
                <div className="text-xs text-gray-400 truncate">{CLUB_FACEBOOK}</div>
              </div>
              <ExternalLink size={13} className="text-gray-400 shrink-0" />
            </a>
            <a href={CLUB_TIKTOK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-gray-300 transition-colors text-sm">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">TT</span>
              </div>
              <div>
                <div className="font-medium text-[#002147]">TikTok Page</div>
                <div className="text-xs text-gray-400">@leoclub.kusms</div>
              </div>
              <ExternalLink size={13} className="text-gray-400 ml-auto shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* Chartered Certificate */}
      <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
        <h4 className="font-semibold text-[#002147] flex items-center gap-2 mb-1">
          <Award size={16} className="text-[#D4AF37]" /> Chartered Certificate
        </h4>
        <p className="text-sm text-gray-500 mb-5">Upload the official chartered certificate to display it on the home page.</p>

        {settings.charteredCertificateUrl && (
          <div className="mb-5 bg-white rounded-xl border border-[#D4AF37]/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#002147]">Current Certificate</span>
              <button onClick={handleRemoveCert} disabled={saving}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                <X size={12} /> Remove
              </button>
            </div>
            {settings.charteredCertificateType === "pdf" ? (
              <a href={settings.charteredCertificateUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#002147] hover:text-[#D4AF37] transition-colors">
                <ExternalLink size={14} /> Open PDF Certificate
              </a>
            ) : (
              <img src={settings.charteredCertificateUrl} alt="Chartered Certificate"
                className="max-h-48 rounded-lg object-contain border border-gray-100" />
            )}
          </div>
        )}

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-4">
          {(["upload", "url"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === m ? "bg-white text-[#002147] shadow-sm" : "text-gray-500"}`}>
              {m === "upload" ? <><Upload size={12} /> Upload File</> : <><LinkIcon size={12} /> Paste URL</>}
            </button>
          ))}
        </div>

        {mode === "upload" ? (
          <label className="w-full border-2 border-dashed border-gray-300 hover:border-[#D4AF37] rounded-xl px-6 py-8 text-center text-sm text-gray-500 hover:text-[#002147] transition-all flex flex-col items-center gap-2 cursor-pointer">
            {uploading === "cert"
              ? <><Loader2 size={24} className="animate-spin text-[#002147]" /><span>Uploading…</span></>
              : <><Upload size={24} className="text-gray-300" /><span>Click to upload JPG, PNG, or PDF</span><span className="text-xs text-gray-400">Max 10MB</span></>
            }
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleCertFileUpload} disabled={uploading !== null} />
          </label>
        ) : (
          <div className="flex gap-3">
            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/certificate.jpg"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
            <button onClick={handleUrlSave} disabled={saving}
              className="bg-[#002147] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save URL"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
