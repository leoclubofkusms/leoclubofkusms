import { useEffect, useState } from "react";
import {
  getServiceImpact, updateServiceImpact, getAllServiceImpacts,
  getActivities, computeVolunteersFromActivities, getClubSettings,
} from "@/lib/firestore";
import type { ServiceImpact, Activity } from "@/lib/types";
import {
  LEO_YEARS, getCurrentLeoYear, formatImpactNumber, formatCurrency,
  DEFAULT_USD_TO_NPR_RATE, convertNprToUsd, convertUsdToNpr,
} from "@/lib/types";
import {
  Save, Loader2, Check, Users, Clock, DollarSign,
  TrendingUp, AlertCircle, ArrowLeftRight,
} from "lucide-react";

type CurrencyDirection = "npr" | "usd";

export default function ServiceImpactManager() {
  const [allRecords, setAllRecords] = useState<ServiceImpact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentLeoYear());
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rawText, setRawText] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<CurrencyDirection>("npr");
  const [usdToNprRate, setUsdToNprRate] = useState<number>(DEFAULT_USD_TO_NPR_RATE);

  const [form, setForm] = useState<ServiceImpact>({
    leoYear: getCurrentLeoYear(),
    peopleServed: 0,
    volunteerHours: 0,
    fundsDonatedUsd: 0,
    fundsDonatedNpr: 0,
    fundsRaisedUsd: 0,
    fundsRaisedNpr: 0,
    note: "",
    updatedAt: new Date().toISOString(),
  });

  async function load() {
    setLoading(true);
    try {
      const [records, acts, settings] = await Promise.all([
        getAllServiceImpacts(),
        getActivities(),
        getClubSettings().catch(() => ({})),
      ]);
      setAllRecords(records);
      setActivities(acts);
      const rate = settings.usdToNprRate && settings.usdToNprRate > 0
        ? settings.usdToNprRate
        : DEFAULT_USD_TO_NPR_RATE;
      setUsdToNprRate(rate);
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
          fundsDonatedNpr: 0,
          fundsRaisedUsd: 0,
          fundsRaisedNpr: 0,
          note: "",
          updatedAt: new Date().toISOString(),
        });
      }
    })();
  }, [selectedYear]);

  const autoVolunteers = computeVolunteersFromActivities(activities, selectedYear);
  const autoActivities = activities.filter((a) => a.year === selectedYear).length;

  // Map of currency-paired fields — when one is edited, the other is auto-computed
  function currencyPair(key: keyof ServiceImpact): {
    pair: keyof ServiceImpact;
    direction: "npr-to-usd" | "usd-to-npr";
  } | null {
    if (key === "fundsDonatedNpr") return { pair: "fundsDonatedUsd", direction: "npr-to-usd" };
    if (key === "fundsDonatedUsd") return { pair: "fundsDonatedNpr", direction: "usd-to-npr" };
    if (key === "fundsRaisedNpr") return { pair: "fundsRaisedUsd", direction: "npr-to-usd" };
    if (key === "fundsRaisedUsd") return { pair: "fundsRaisedNpr", direction: "usd-to-npr" };
    return null;
  }

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
  ) => {
    const fieldKey = String(key);
    const isFocused = focusedField === fieldKey;
    const displayValue = isFocused
      ? (rawText[fieldKey] ?? "")
      : String((form[key] as number) ?? 0);

    return (
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onFocus={() => {
            setFocusedField(fieldKey);
            const current = (form[key] as number) ?? 0;
            setRawText((prev) => ({
              ...prev,
              [fieldKey]: current === 0 ? "" : String(current),
            }));
          }}
          onBlur={() => {
            setFocusedField(null);
            setRawText((prev) => {
              const copy = { ...prev };
              delete copy[fieldKey];
              return copy;
            });
          }}
          onChange={(e) => {
            const text = e.target.value;
            if (!/^\d*\.?\d*$/.test(text)) return;
            setRawText((prev) => ({ ...prev, [fieldKey]: text }));
            const n = text === "" || text === "." ? 0 : Number(text);
            const safeN = isNaN(n) ? 0 : n;

            setForm((f) => {
              const next: ServiceImpact = { ...f, [key]: safeN };
              const c = currencyPair(key);
              if (c) {
                const computed = c.direction === "npr-to-usd"
                  ? convertNprToUsd(safeN, usdToNprRate)
                  : convertUsdToNpr(safeN, usdToNprRate);
                (next[c.pair] as number) = computed;
              }
              return next;
            });
          }}
          placeholder="0"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002147] bg-white"
        />
        {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
      </div>
    );
  };

  const autoField = (label: string, value: number, currency: "USD" | "NPR") => (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
        {label}
        <span className="text-[10px] uppercase font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
          auto
        </span>
      </label>
      <div className="w-full border border-dashed border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700 tabular-nums font-medium truncate">
        {formatCurrency(value, currency)}
      </div>
      <p className="text-xs text-gray-400 mt-1">Computed from the other field</p>
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
          Volunteers and activities are auto-counted from the database — no need to enter them.
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

      {/* Auto-calculated info banner */}
      <div className="bg-[#002147]/5 border border-[#002147]/20 rounded-2xl p-4 flex items-start gap-3">
        <Users size={18} className="text-[#002147] shrink-0 mt-0.5" />
        <div className="text-sm flex-1">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="font-bold text-[#002147]">
              Volunteers (auto): {formatImpactNumber(autoVolunteers)}
            </span>
            <span className="font-bold text-[#002147]">
              Activities (auto): {formatImpactNumber(autoActivities)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Volunteers = unique participants across all activities in Leo Year {selectedYear}.
            Activities = number of activities recorded for that year. Both update automatically.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {numField("People Served", "peopleServed", "Total beneficiaries reached this year")}
          {numField("Volunteer Hours", "volunteerHours", "Total hours contributed by all volunteers")}
        </div>

        {/* Funds with direction toggle */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#002147]">Funds</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
              {(["npr", "usd"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    direction === d
                      ? "bg-[#002147] text-white shadow-sm"
                      : "text-gray-500 hover:text-[#002147]"
                  }`}
                >
                  Enter in {d}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl px-3 py-2 mb-3 flex items-center gap-2 text-xs text-gray-600">
            <ArrowLeftRight size={12} className="text-[#D4AF37] shrink-0" />
            <span>
              Exchange rate: <strong>1 USD = {usdToNprRate} NPR</strong>. You enter in{" "}
              <strong>{direction.toUpperCase()}</strong>; the other currency is auto-computed and frozen at save.
              Rate can be updated in <strong>Club Settings</strong>.
            </span>
          </div>

          {/* Donated row */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Funds Donated
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {direction === "npr" ? (
                <>
                  {numField("Donated (NPR)", "fundsDonatedNpr")}
                  {autoField("Donated (USD)", form.fundsDonatedUsd ?? 0, "USD")}
                </>
              ) : (
                <>
                  {numField("Donated (USD)", "fundsDonatedUsd")}
                  {autoField("Donated (NPR)", form.fundsDonatedNpr ?? 0, "NPR")}
                </>
              )}
            </div>
          </div>

          {/* Raised row */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Funds Raised
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {direction === "npr" ? (
                <>
                  {numField("Raised (NPR)", "fundsRaisedNpr")}
                  {autoField("Raised (USD)", form.fundsRaisedUsd ?? 0, "USD")}
                </>
              ) : (
                <>
                  {numField("Raised (USD)", "fundsRaisedUsd")}
                  {autoField("Raised (NPR)", form.fundsRaisedNpr ?? 0, "NPR")}
                </>
              )}
            </div>
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
                <div className="font-semibold text-[#002147] mb-1">
                  Leo Year {r.leoYear}
                  {r.leoYear === getCurrentLeoYear() && (
                    <span className="ml-2 text-[10px] font-bold text-[#002147] bg-[#D4AF37] px-1.5 py-0.5 rounded-full uppercase">
                      Current
                    </span>
                  )}
                </div>
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
