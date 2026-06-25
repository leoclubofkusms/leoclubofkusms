import { useState, useEffect } from "react";
import { getMembers, updateMember } from "@/lib/firestore";
import type { Member } from "@/lib/types";
import { BATCH_YEARS } from "@/lib/types";
import {
  AlertTriangle, Check, Loader2, X, RefreshCw,
  ChevronDown, ChevronUp, Search, Users, ArrowRight,
} from "lucide-react";

interface BatchGroup {
  raw: string;
  members: Member[];
  isValid: boolean; // is it a known BATCH_YEARS value
}

export default function BatchEditor() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQ, setSearchQ] = useState("");

  async function reload() {
    setLoading(true);
    try {
      const all = await getMembers();
      setMembers(all.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, []);

  const groups: BatchGroup[] = (() => {
    const map: Record<string, Member[]> = {};
    members.forEach((m) => {
      const key = m.batch.trim();
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return Object.entries(map)
      .map(([raw, mems]) => ({
        raw,
        members: mems,
        isValid: BATCH_YEARS.includes(raw),
      }))
      .sort((a, b) => a.raw.localeCompare(b.raw, undefined, { numeric: true }));
  })();

  const filtered = groups.filter(
    (g) =>
      !searchQ ||
      g.raw.toLowerCase().includes(searchQ.toLowerCase()) ||
      g.members.some((m) => m.name.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const invalid = groups.filter((g) => !g.isValid);

  function flash(msg: string, isErr = false) {
    if (isErr) { setError(msg); setTimeout(() => setError(""), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
  }

  async function applyRename(group: BatchGroup) {
    const newBatch = (edits[group.raw] ?? group.raw).trim();
    if (!newBatch || newBatch === group.raw) return;
    setSaving(group.raw);
    try {
      await Promise.all(group.members.map((m) => updateMember(m.memberId, { batch: newBatch })));
      flash(`Moved ${group.members.length} member(s) from "${group.raw}" → "${newBatch}"`);
      await reload();
      setEdits((e) => { const next = { ...e }; delete next[group.raw]; return next; });
    } catch (e) {
      flash(e instanceof Error ? e.message : "Save failed.", true);
    } finally { setSaving(null); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-7 h-7 border-2 border-[#002147] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-[#002147]">Batch Year Editor</h3>
        <p className="text-sm text-gray-500">
          Batch is stored as an admission year (e.g. <code className="bg-gray-100 px-1 rounded">2026</code>).
          Use this tool to migrate any legacy values (like "MBBS 2026") to the correct year-only format.
          All members in a group update at once.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <Check size={14} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Non-standard values banner */}
      {invalid.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-800">
                {invalid.length} non-standard batch value{invalid.length !== 1 ? "s" : ""} detected
              </div>
              <div className="text-xs text-amber-600 mt-0.5">
                These aren't plain years — use the dropdowns below to migrate them:{" "}
                {invalid.map((g) => `"${g.raw}"`).join(", ")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={14} className="text-[#002147]" />
          <span>
            <strong className="text-[#002147]">{groups.length}</strong> batch groups ·{" "}
            <strong className="text-[#002147]">{members.length}</strong> total members
          </span>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Filter groups…"
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#002147] w-44"
          />
        </div>
        <button
          onClick={reload}
          className="p-2 text-gray-400 hover:text-[#002147] border border-gray-200 rounded-xl transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Groups */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No batch groups found.</div>
        )}

        {filtered.map((group) => {
          const editVal = edits[group.raw] ?? "";
          const isDirty = editVal !== "" && editVal !== group.raw;
          const isSaving = saving === group.raw;
          const isExpanded = !!expanded[group.raw];

          return (
            <div
              key={group.raw}
              className={`border rounded-xl overflow-hidden transition-all ${
                !group.isValid
                  ? "border-amber-200 bg-amber-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {!group.isValid && (
                  <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                )}

                {/* Current value (read-only label) */}
                <span className="font-mono text-sm font-semibold text-[#002147] shrink-0 w-28 truncate">
                  {group.raw}
                </span>

                {/* Arrow + target dropdown */}
                <ArrowRight size={13} className="text-gray-300 shrink-0" />

                <select
                  value={editVal}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [group.raw]: e.target.value }))
                  }
                  className={`flex-1 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#002147] bg-white transition-colors ${
                    isDirty ? "border-[#D4AF37]" : "border-gray-200 text-gray-400"
                  }`}
                >
                  <option value="">— rename to… —</option>
                  {BATCH_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-gray-400 shrink-0">
                  {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDirty && (
                    <>
                      <button
                        onClick={() => applyRename(group)}
                        disabled={!!saving}
                        className="inline-flex items-center gap-1 bg-[#002147] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#003575] disabled:opacity-60 transition-colors"
                      >
                        {isSaving ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Check size={11} />
                        )}
                        Apply
                      </button>
                      <button
                        onClick={() =>
                          setEdits((prev) => {
                            const n = { ...prev };
                            delete n[group.raw];
                            return n;
                          })
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [group.raw]: !e[group.raw] }))
                    }
                    className="p-1.5 text-gray-400 hover:text-[#002147] border border-gray-200 rounded-lg transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>
              </div>

              {/* Member list when expanded */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-1">
                  {group.members.map((m) => (
                    <div key={m.memberId} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs text-gray-400 w-20 shrink-0">
                        {m.memberId}
                      </span>
                      <span className="text-gray-700 flex-1 truncate">{m.name}</span>
                      <span className="text-xs text-gray-400">{m.faculty ?? "—"}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          m.isActive !== false
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {m.isActive !== false ? "Active" : "Past"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        Changes apply immediately to Firestore. The Members and Past Members pages refresh their
        filter pills automatically on next load.
      </div>
    </div>
  );
}
