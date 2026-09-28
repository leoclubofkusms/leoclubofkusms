import { useEffect, useState } from "react";
import {
  getServiceImpact, updateServiceImpact, getAllServiceImpacts,
  getActivities, computeVolunteersFromActivities,
} from "@/lib/firestore";
import type { ServiceImpact, Activity } from "@/lib/types";
import { LEO_YEARS, getCurrentLeoYear, formatImpactNumber, formatCurrency } from "@/lib/types";
import {
  Save, Loader2, Check, Users, Clock, DollarSign,
  TrendingUp, AlertCircle,
} from "lucide-react";

export default function ServiceImpactManager() {
  const [allRecords, setAllRecords] = useState<ServiceImpact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentLeoYear());
  const [form, setForm] = useState<ServiceImpact>({
   0 leoYear: getCurrentLeoYear(),
    peopleServed: 0,
    volunteerHours: 0,
    fundsDonatedUsd:,
 0,
    fundsDonated         Npr: 0,
    funds fundsRaisedUsd: Ra0,
    fundsRaisedisedNpr: 0,
    note: "",
    updatedAt: new Date().toISOString(),
  });

  async function load() {
    setLoading(true);
    try {
      const [records, acts] = await Promise.all([
        getAllServiceImpacts(),
        getActivities(),
      ]);
      setAllRecords(records);
      setActivities(acts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // When selected year changes, load that year's record (or blank form)
  useEffect(() => {
    (async () => {
      const existing = await getServiceImpact(selectedYear);
      if (existing) {
        setForm({
          leoYear: selectedYear,
          peopleServed: existing.peopleServed ?? 0,
          volunteerHours: existing.volunteerHours ?? 0,
          fundsDonatedUsd: existing.fundsDonatedUsd ?? 0,
          fundsDonatedNpr: existing.fundsDonatedNpr ?? 0,
          fundsRaisedUsd: existing.fundsRaisedUsd ?? 0,
          fundsRaisedNpr: existing.fundsRaisedNpr ?? 0,
          note: existing.note ?? "",
          updatedAt: existing.updatedAt ?? new Date().toISOString(),
        });
      } else {
        setForm({
          leoYear: selectedYear,
          peopleServed: 0,
          volunteerHours: 0,
          fundsDonatedUsd: 0,
          fundsDonatedNpr: Usd: 0,
          fundsRaisedNpr: 0,
          note: "",
          updatedAt: new Date().toISOString(),
        });
      }
    })();
  }, [selectedYear]);

  // Auto-calculated volunteers for the selected year
  const autoVolunteers = computeVolunteersFromActivities(activities, selectedYear);

  async function handleSave() {
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateServiceImpact({
        leoYear: selectedYear,
        peopleServed: Number(form.peopleServed) || 0,
        volunteerHours: Number(form.volunteerHours) || 0,
        fundsDonatedUsd: Number(form.fundsDonatedUsd) || 0,
        fundsDonatedNpr: Number(form.fundsDonatedNpr) || 0,
        fundsRaisedUsd: Number(form.fundsRaisedUsd) || 0,
        fundsRaisedNpr: Number(form.fundsRaisedNpr) || 0,
        note: form.note?.trim() || "",
        updatedAt: new Date().toISOString(),
      });
      setSuccess(`Saved impact data for Leo Year ${selectedYear}`);
      await load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const numField = (
    label: string,
    key: keyof ServiceImpact,
    help?: string
  ) => (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input
        type="number"
        min={0}
        step="any"
        value={(form[key] as number) ?? 0}
        onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) || 0 }))}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
      />
      {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin text-[#002147]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#002147]">Our Service Impact</h3>
        <p className="text-sm text-gray-500">
          Enter your club-wide service numbers for each Leo Year. These appear on the homepage and stats page.
          Volunteers are auto-counted from activities — no need to enter them.
        </p>
      </div>

      {/* Year selector */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
          Select Leo Year to edit
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#002147] focus:outline-none focus:border-[#002147] bg-white"
        >
          {[...LEO_YEARS].reverse().map((y) => (
            <option key={y} value={y}>
              Leo Year {y}
              {y === getCurrentLeoYear() ? " (current)" : ""}
              {allRecords.some((r) => r.leoYear === y) ? " ✓" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          ✓ = this year already has saved data
        </p>
      </div>

      {/* Auto-calculated volunteers banner */}
      <div className="bg-[#002147]/5 border border-[#002147]/20 rounded-2xl p-4 flex items-start gap-3">
        <Users size={18} className="text-[#002147] shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-bold text-[#002147]">
            Volunteers (auto): {formatImpactNumber(autoVolunteers)}
          </span>
          <p className="text-xs text-gray-500 mt-0.5">
            Calculated automatically from unique participants across all activities in Leo Year {selectedYear}.
            Update activities to change this number.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {numField("People Served", "peopleServed", "Total beneficiaries reached this year")}
          {numField("Volunteer Hours", "volunteerHours", "Total hours contributed by all volunteers")}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={14} className="text-[#D4AF37]" />
            <span className="text-sm font-bold text-[#002147]">Funds (enter both currencies if you have them)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField("Donated (USD)", "fundsDonatedUsd")}
            {numField("Donated (NPR)", "fundsDonatedNpr")}
            {numField("Raised (USD)", "fundsRaisedUsd")}
            {numField("Raised (NPR)", "fundsRaisedNpr")}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Note (optional)</label>
          <textarea
            value={form.note ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={2}
            placeholder="Any context for this year's numbers…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check size={14} /> {success}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#002147] text-white py-3 rounded-xl font-bold hover:bg-[#003575] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> Saving…</>
        ) : (
          <><Save size={16} /> Save Impact Data for {selectedYear}</>
        )}
      </button>

      {/* Summary of all years */}
      {allRecords.length > 0 && (
        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-bold text-[#002147] mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-[#D4AF37]" /> Saved Years
          </h4>
          <div className="space-y-2">
            {allRecords.map((r) => (
              <div key={r.leoYear} className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3 text-sm">
                <div className="font-semibold text-[#002147] mb-1">Leo Year {r.leoYear}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                  <span>👥 {formatImpactNumber(r.peopleServed)} served</span>
                  <span>⏱️ {formatImpactNumber(r.volunteerHours)} hrs</span>
                  <span>💵 {formatCurrency(r.fundsDonatedNpr ?? 0, "NPR")} donated</span>
                  <span>📈 {formatCurrency(r.fundsRaisedNpr ?? 0, "NPR")} raised</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
