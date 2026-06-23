import { useState, useEffect } from "react";
import { getConstitution, updateConstitution } from "@/lib/firestore";
import type { Constitution, ConstitutionSection } from "@/lib/types";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  Plus, Trash2, Pencil, Check, X, Upload, Link as LinkIcon,
  GripVertical, Loader2, FileText, AlertCircle, ChevronDown, ChevronUp,
  Save, ExternalLink,
} from "lucide-react";

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

const EMPTY_SECTION: Omit<ConstitutionSection, "id"> = {
  number: "",
  title: "",
  content: "",
};

export default function ConstitutionManager() {
  const [data, setData] = useState<Constitution>({ sections: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Section editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Omit<ConstitutionSection, "id">>(EMPTY_SECTION);
  const [addingNew, setAddingNew] = useState(false);
  const [newBuf, setNewBuf] = useState<Omit<ConstitutionSection, "id">>(EMPTY_SECTION);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // PDF mode
  const [pdfMode, setPdfMode] = useState<"upload" | "url">("upload");
  const [pdfUrlInput, setPdfUrlInput] = useState("");

  useEffect(() => {
    getConstitution()
      .then((c) => {
        setData(c);
        setPdfUrlInput(c.pdfUrl ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function flash(msg: string, isErr = false) {
    if (isErr) { setError(msg); setTimeout(() => setError(""), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
  }

  async function save(updated: Constitution) {
    setSaving(true);
    try {
      await updateConstitution(updated);
      setData(updated);
      flash("Saved successfully!");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Save failed.", true);
    } finally { setSaving(false); }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const path = `club-documents/constitution-${Date.now()}.pdf`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      const updated = { ...data, pdfUrl: url };
      await save(updated);
      setPdfUrlInput(url);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Upload failed.", true);
    } finally { setUploading(false); }
  }

  async function handlePdfUrlSave() {
    const url = pdfUrlInput.trim();
    await save({ ...data, pdfUrl: url || undefined });
  }

  async function handleMetaSave() {
    await save({ ...data });
  }

  function startEdit(s: ConstitutionSection) {
    setEditingId(s.id);
    setEditBuf({ number: s.number, title: s.title, content: s.content });
    setExpandedId(s.id);
  }

  function cancelEdit() { setEditingId(null); }

  async function commitEdit(id: string) {
    const updated = {
      ...data,
      sections: data.sections.map((s) =>
        s.id === id ? { ...s, ...editBuf } : s
      ),
    };
    await save(updated);
    setEditingId(null);
  }

  async function addSection() {
    if (!newBuf.title.trim()) return;
    const section: ConstitutionSection = { id: nanoid(), ...newBuf };
    const updated = { ...data, sections: [...data.sections, section] };
    await save(updated);
    setNewBuf(EMPTY_SECTION);
    setAddingNew(false);
    setExpandedId(section.id);
  }

  async function deleteSection(id: string) {
    if (!confirm("Remove this section?")) return;
    await save({ ...data, sections: data.sections.filter((s) => s.id !== id) });
  }

  function moveSection(id: string, dir: -1 | 1) {
    const idx = data.sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= data.sections.length) return;
    const arr = [...data.sections];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    save({ ...data, sections: arr });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#002147]">Constitution Manager</h3>
        <p className="text-sm text-gray-500">
          Upload a PDF copy and/or define individual sections that display on the public Constitution page.
        </p>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <Check size={15} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* ── Meta info ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h4 className="font-bold text-[#002147] mb-4 flex items-center gap-2">
          <FileText size={16} className="text-[#D4AF37]" /> Document Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Title</label>
            <input
              type="text"
              value={data.title ?? ""}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="e.g. Constitution of Leo Club of KUSMS"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adopted Date</label>
            <input
              type="text"
              value={data.adoptedDate ?? ""}
              onChange={(e) => setData({ ...data, adoptedDate: e.target.value })}
              placeholder="e.g. June 11, 2024"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Amended</label>
            <input
              type="text"
              value={data.lastAmended ?? ""}
              onChange={(e) => setData({ ...data, lastAmended: e.target.value })}
              placeholder="e.g. January 2025"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleMetaSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#002147] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Info
            </button>
          </div>
        </div>
      </div>

      {/* ── PDF Upload ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h4 className="font-bold text-[#002147] mb-4 flex items-center gap-2">
          <Upload size={16} className="text-[#D4AF37]" /> Constitution PDF File
        </h4>

        {data.pdfUrl && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Check size={15} className="text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-green-700">PDF linked</div>
              <div className="text-xs text-green-600 truncate">{data.pdfUrl}</div>
            </div>
            <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 shrink-0">
              <ExternalLink size={14} />
            </a>
            <button
              onClick={() => save({ ...data, pdfUrl: undefined })}
              className="text-red-400 hover:text-red-600 shrink-0"
              title="Remove PDF"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          {(["upload", "url"] as const).map((m) => (
            <button key={m} onClick={() => setPdfMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${pdfMode === m ? "bg-[#002147] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {m === "upload" ? "Upload File" : "Paste URL"}
            </button>
          ))}
        </div>

        {pdfMode === "upload" ? (
          <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${uploading ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-200 hover:border-[#002147]/40 hover:bg-gray-50"}`}>
            <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploading} />
            {uploading
              ? <Loader2 size={28} className="text-[#D4AF37] animate-spin" />
              : <Upload size={28} className="text-gray-400" />
            }
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700">{uploading ? "Uploading…" : "Click to upload PDF"}</div>
              <div className="text-xs text-gray-400 mt-1">PDF files only · Stored in Firebase Storage</div>
            </div>
          </label>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={pdfUrlInput}
                onChange={(e) => setPdfUrlInput(e.target.value)}
                placeholder="https://drive.google.com/…"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147]"
              />
            </div>
            <button
              onClick={handlePdfUrlSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* ── Sections ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-[#002147] flex items-center gap-2">
            <FileText size={16} className="text-[#D4AF37]" />
            Constitution Sections
            <span className="text-xs font-normal text-gray-400">({data.sections.length})</span>
          </h4>
          <button
            onClick={() => { setAddingNew(true); setExpandedId(null); setEditingId(null); }}
            disabled={addingNew}
            className="inline-flex items-center gap-1.5 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60"
          >
            <Plus size={14} /> Add Section
          </button>
        </div>

        {/* New section form */}
        {addingNew && (
          <div className="mb-4 border-2 border-[#D4AF37]/50 rounded-xl p-4 bg-[#D4AF37]/5 space-y-3">
            <div className="text-xs font-bold text-[#002147] uppercase tracking-wide mb-2">New Section</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Section Number</label>
                <input
                  type="text"
                  value={newBuf.number}
                  onChange={(e) => setNewBuf({ ...newBuf, number: e.target.value })}
                  placeholder="e.g. Article I"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]"
                  autoFocus
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Section Title *</label>
                <input
                  type="text"
                  value={newBuf.title}
                  onChange={(e) => setNewBuf({ ...newBuf, title: e.target.value })}
                  placeholder="e.g. Name and Identity"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Content</label>
              <textarea
                rows={5}
                value={newBuf.content}
                onChange={(e) => setNewBuf({ ...newBuf, content: e.target.value })}
                placeholder="Type the full text of this section…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-y"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addSection}
                disabled={saving || !newBuf.title.trim()}
                className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Section
              </button>
              <button
                onClick={() => { setAddingNew(false); setNewBuf(EMPTY_SECTION); }}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm transition-colors"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}

        {data.sections.length === 0 && !addingNew ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No sections yet. Add your first section above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.sections.map((section, idx) => (
              <div
                key={section.id}
                className={`border rounded-xl transition-all ${editingId === section.id ? "border-[#002147] bg-[#002147]/3" : "border-gray-200 hover:border-gray-300 bg-white"}`}
              >
                {/* Section header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveSection(section.id, -1)} disabled={idx === 0}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors">
                      <ChevronUp size={13} />
                    </button>
                    <button onClick={() => moveSection(section.id, 1)} disabled={idx === data.sections.length - 1}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors">
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {section.number && (
                    <span className="text-xs font-bold text-[#D4AF37] bg-[#002147] px-2.5 py-0.5 rounded-lg shrink-0">
                      {section.number}
                    </span>
                  )}

                  <button
                    className="flex-1 text-left font-semibold text-[#002147] text-sm truncate"
                    onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  >
                    {section.title}
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(section)}
                      className="p-1.5 text-gray-400 hover:text-[#002147] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit section"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete section"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                      className="p-1.5 text-gray-400 hover:text-[#002147] rounded-lg transition-colors"
                    >
                      {expandedId === section.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {editingId === section.id && (
                  <div className="border-t border-gray-200 px-4 py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Section Number</label>
                        <input type="text" value={editBuf.number}
                          onChange={(e) => setEditBuf({ ...editBuf, number: e.target.value })}
                          placeholder="e.g. Article I"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Title</label>
                        <input type="text" value={editBuf.title}
                          onChange={(e) => setEditBuf({ ...editBuf, title: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002147]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Content</label>
                      <textarea rows={6} value={editBuf.content}
                        onChange={(e) => setEditBuf({ ...editBuf, content: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] resize-y" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => commitEdit(section.id)} disabled={saving}
                        className="inline-flex items-center gap-2 bg-[#002147] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#003575] disabled:opacity-60 transition-colors">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Changes
                      </button>
                      <button onClick={cancelEdit}
                        className="inline-flex items-center gap-2 text-gray-500 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:text-gray-700 transition-colors">
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded preview (non-editing) */}
                {expandedId === section.id && editingId !== section.id && section.content && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Firestore rules reminder */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <strong>Note:</strong> Constitution data is stored in Firestore at <code className="bg-amber-100 px-1 rounded">settings/constitution</code>.
        Ensure your Firestore rules allow admin writes to <code className="bg-amber-100 px-1 rounded">settings/{"{docId}"}</code>.
      </div>
    </div>
  );
}
