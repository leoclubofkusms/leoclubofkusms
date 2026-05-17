import { useState, useEffect } from "react";
import { getClubSettings, updateClubSettings } from "@/lib/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { ClubSettings } from "@/lib/types";
import { CLUB_ESTABLISHED, CLUB_FACEBOOK, CLUB_TIKTOK } from "@/lib/types";
import {
  Upload, Link as LinkIcon, Check, Loader2, X, ExternalLink,
  Facebook, Settings, Calendar, Award,
} from "lucide-react";

export default function ClubSettingsPanel() {
  const [settings, setSettings] = useState<ClubSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");

  useEffect(() => {
    getClubSettings()
      .then((s) => { setSettings(s); setUrlInput(s.charteredCertificateUrl ?? ""); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setUploading(true);
    try {
      const isPdf = file.type === "application/pdf";
      const path = `club-documents/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      const newSettings: ClubSettings = {
        ...settings,
        charteredCertificateUrl: url,
        charteredCertificateType: isPdf ? "pdf" : "image",
      };
      await updateClubSettings(newSettings);
      setSettings(newSettings);
      setUrlInput(url);
      setSuccess("Certificate uploaded and saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally { setUploading(false); }
  }

  async function handleUrlSave() {
    if (!urlInput.trim()) { setError("Please enter a URL."); return; }
    setError(""); setSaving(true);
    try {
      const isPdf = urlInput.toLowerCase().includes(".pdf");
      const newSettings: ClubSettings = {
        ...settings,
        charteredCertificateUrl: urlInput.trim(),
        charteredCertificateType: isPdf ? "pdf" : "image",
      };
      await updateClubSettings(newSettings);
      setSettings(newSettings);
      setSuccess("Certificate URL saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSaving(false); }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      await updateClubSettings({ charteredCertificateUrl: "", charteredCertificateType: undefined });
      setSettings((s) => ({ ...s, charteredCertificateUrl: "", charteredCertificateType: undefined }));
      setUrlInput("");
      setSuccess("Certificate removed.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-[#002147]">Club Settings</h3>
        <p className="text-sm text-gray-500">Manage chartered certificate and club information shown on the home page.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <Check size={15} /> {success}
        </div>
      )}

      {/* Club Info (read-only) */}
      <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 space-y-4">
        <h4 className="font-semibold text-[#002147] flex items-center gap-2"><Settings size={16} /> Club Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Calendar size={13} /> Established</div>
            <div className="font-bold text-[#002147]">{CLUB_ESTABLISHED}</div>
            <div className="text-xs text-gray-500 mt-0.5">Official handover/charter ceremony</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Award size={13} /> District</div>
            <div className="font-bold text-[#002147]">Lions Clubs International</div>
            <div className="text-xs text-gray-500 mt-0.5">District 325L</div>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Social Media</div>
          <div className="space-y-2">
            <a href={CLUB_FACEBOOK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-[#1877F2]/40 transition-colors text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0">
                <Facebook size={16} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-[#002147]">Facebook Page</div>
                <div className="text-xs text-gray-400 truncate max-w-xs">{CLUB_FACEBOOK}</div>
              </div>
              <ExternalLink size={13} className="text-gray-400 ml-auto shrink-0" />
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

        {/* Current certificate preview */}
        {settings.charteredCertificateUrl && (
          <div className="mb-5 bg-white rounded-xl border border-[#D4AF37]/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#002147]">Current Certificate</span>
              <button onClick={handleRemove} disabled={saving}
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

        {/* Mode toggle */}
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
            {uploading
              ? <><Loader2 size={24} className="animate-spin text-[#002147]" /><span>Uploading…</span></>
              : <><Upload size={24} className="text-gray-300" /><span>Click to upload JPG, PNG, or PDF</span><span className="text-xs text-gray-400">Max 10MB</span></>
            }
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
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
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {loading && (
        <div className="text-center text-gray-400 text-sm py-4">Loading settings…</div>
      )}
    </div>
  );
}
