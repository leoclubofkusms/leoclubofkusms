import { useState, useEffect } from "react";
import { getBodMembers, setBodMember, deleteBodMember } from "@/lib/firestore";
import type { BodMember } from "@/lib/types";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  Plus, Pencil, Trash2, X, Check, User, Upload, Link as LinkIcon,
  GripVertical, Loader2, Crown,
} from "lucide-react";

const EMPTY: BodMember = {
  id: "",
  name: "",
  role: "",
  priority: 10,
  photoUrl: "",
  email: "",
  phone: "",
  bio: "",
};

export default function BodManagement() {
  const [members, setMembers] = useState<BodMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BodMember | null>(null);
  const [form, setForm] = useState<BodMember>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function load() {
    setLoading(true);
    try { setMembers(await getBodMembers()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, priority: (members.length + 1) * 10 });
    setError(""); setUploadError("");
    setShowForm(true);
  }

  function openEdit(m: BodMember) {
    setEditing(m); setForm({ ...m });
    setError(""); setUploadError("");
    setShowForm(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(""); setUploading(true);
    try {
      const path = `bod-photos/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) { setError("Name and role are required."); return; }
    setError(""); setSubmitting(true);
    try {
      const id = editing?.id || `bod_${Date.now()}`;
      await setBodMember({ ...form, id });
      setSuccess(editing ? "Member updated!" : "Member added!");
      setShowForm(false); load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteBodMember(id); load(); setDeleteConfirm(null); }
    catch (e) { console.error(e); }
  }

  const president = members.find((m) => m.priority <= 1 || m.role.toLowerCase().includes("president"));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-[#002147]">Board of Directors</h3>
          <p className="text-sm text-gray-500">Manage club leadership shown on the home page</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors"
        >
          <Plus size={16} /> Add BOD Member
        </button>
      </div>

      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl px-4 py-3 mb-5 text-sm text-[#002147]">
        <strong>Priority guide:</strong> Lower number = shown higher up.
        President = <strong>1</strong> (shown large at top), Vice President = 2, Secretary = 3, PVST (Past President) = 4, etc.
        Use the Role field to type any title: President, VP, PVST, Secretary, Treasurer, Joint Secretary, etc.
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 mb-4">
          <Check size={15} /> {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-semibold text-[#002147]">{editing ? "Edit BOD Member" : "Add BOD Member"}</h4>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Saurab Acharya" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role / Title *</label>
                <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="President" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority (1 = President)</label>
                <input type="number" min={1} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="president@leoclubkusms.org"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Short Bio</label>
                <input type="text" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="MBBS 21st Batch · Passionate about service"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
              </div>
            </div>

            {/* Photo picker */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Photo</label>
              <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1 w-fit">
                {(["upload", "url"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setPhotoMode(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${photoMode === m ? "bg-white text-[#002147] shadow-sm" : "text-gray-500"}`}>
                    {m === "upload" ? <><Upload size={12} /> Upload</> : <><LinkIcon size={12} /> URL</>}
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2 border-[#D4AF37]/40" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <User size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {photoMode === "url" ? (
                    <input type="url" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]" />
                  ) : (
                    <>
                      <label className="w-full border-2 border-dashed border-gray-300 hover:border-[#002147] rounded-xl px-4 py-3 text-sm text-gray-500 hover:text-[#002147] transition-all flex items-center justify-center gap-2 cursor-pointer">
                        {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><Upload size={15} /> Click to choose photo</>}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                      </label>
                      {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
                      {form.photoUrl && !uploading && <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Uploaded</p>}
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex-1 bg-[#002147] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update Member" : "Add Member"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Crown size={40} className="mx-auto mb-3 opacity-30" />
          <p>No BOD members yet. Add the President first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              {m.photoUrl ? (
                <img src={m.photoUrl} alt={m.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold shrink-0">
                  {m.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#002147] truncate">{m.name}</span>
                  {m.priority === 1 && <span className="bg-[#D4AF37] text-[#002147] text-xs font-bold px-2 py-0.5 rounded-full">President</span>}
                </div>
                <div className="text-xs text-[#D4AF37] font-medium">{m.role}</div>
                <div className="text-xs text-gray-400 mt-0.5">Priority: {m.priority} {m.email && `· ${m.email}`}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={15} /></button>
                {deleteConfirm === m.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(m.id)} className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-red-600">Confirm</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(m.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
