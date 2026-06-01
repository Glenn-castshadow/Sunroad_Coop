"use client";
import { useState } from "react";
import BrandMark from "./BrandMark";
import { MOCK_TODAY, type FundRecord } from "@/app/data/mockData";

const ACTIVITY_TYPES = [
  "Digital — Search/Display",
  "Digital Video",
  "Social Media",
  "TV / Broadcast",
  "Radio",
  "OOH / Billboard",
  "Direct Mail",
  "Print",
  "Events / Sponsorship",
];

const MATCH_OPTIONS: { value: FundRecord["matchRequirement"]; label: string; desc: string }[] = [
  { value: "100",   label: "100% OEM Funded",      desc: "OEM reimburses 100% of eligible spend up to accrued balance" },
  { value: "75-25", label: "75% OEM / 25% Dealer", desc: "Dealer co-funds 25% of each claim — receipts required" },
  { value: "50-50", label: "50/50 Co-op",           desc: "Dealer matches OEM dollar-for-dollar on every submission" },
];

interface Props {
  fund: FundRecord;
  brand: string;
  rooftopName: string;
  programName: string;
  portal: string;
  onClose: () => void;
  onSave: (fundId: string, updates: Partial<FundRecord>) => void;
}

export default function EditAgreementModal({
  fund, brand, rooftopName, programName, portal, onClose, onSave,
}: Props) {
  const [periodLabel, setPeriodLabel]   = useState(fund.periodLabel);
  const [accrualRate, setAccrualRate]   = useState(String(fund.accrualRate));
  const [expiryDate,  setExpiryDate]    = useState(fund.expiryDate);
  const [matchReq,    setMatchReq]      = useState<FundRecord["matchRequirement"]>(fund.matchRequirement ?? "100");
  const [activities,  setActivities]    = useState<string[]>(fund.eligibleActivities ?? []);
  const [notes,       setNotes]         = useState(fund.internalNotes ?? "");

  function toggleActivity(act: string) {
    setActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  }

  function handleSave() {
    const newExpiry  = expiryDate;
    const todayMs    = MOCK_TODAY.getTime();
    const expiryMs   = new Date(newExpiry + "T00:00:00").getTime();
    const newDaysLeft = Math.ceil((expiryMs - todayMs) / 86400000);

    onSave(fund.id, {
      periodLabel,
      accrualRate:        Number(accrualRate) || fund.accrualRate,
      expiryDate:         newExpiry,
      daysUntilExpiry:    newDaysLeft,
      matchRequirement:   matchReq,
      eligibleActivities: activities,
      internalNotes:      notes,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <BrandMark brand={brand} size={28} />
            <div>
              <h2 className="text-sm font-bold text-white">Agreement Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">{rooftopName} · {programName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none mt-0.5">✕</button>
        </div>

        {/* Disclaimer */}
        <div className="mx-5 mt-4 shrink-0 bg-white/[0.03] border border-white/8 rounded px-3 py-2.5 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            These settings configure how this tool interprets the program agreement.
            They don&rsquo;t update {portal} — OEM-authoritative data (accrued balance, claim status)
            always comes from the portal export.
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">

          {/* Program Period + Accrual Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Program Period
              </label>
              <input
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Accrual Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  min={0}
                  value={accrualRate}
                  onChange={(e) => setAccrualRate(e.target.value)}
                  className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none pl-6 pr-10 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs pointer-events-none">/ unit</span>
              </div>
            </div>
          </div>

          {/* Submission Deadline */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Submission Deadline
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <p className="text-[11px] text-slate-600 mt-1">
              OEMs occasionally extend deadlines — update here when that happens.
            </p>
          </div>

          {/* Match Requirement */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Match Requirement
            </label>
            <div className="space-y-1.5">
              {MATCH_OPTIONS.map((opt) => {
                const active = matchReq === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border cursor-pointer transition-colors ${
                      active
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-white/[0.02] border-white/8 hover:border-white/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="matchReq"
                      value={opt.value}
                      checked={active}
                      onChange={() => setMatchReq(opt.value)}
                      className="mt-0.5 accent-blue-500 shrink-0"
                    />
                    <div>
                      <div className={`text-xs font-semibold ${active ? "text-blue-300" : "text-slate-300"}`}>
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Eligible Activity Types */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Eligible Activity Types
              </label>
              <span className="text-[10px] text-slate-600">{activities.length} selected</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ACTIVITY_TYPES.map((act) => {
                const checked = activities.includes(act);
                return (
                  <label
                    key={act}
                    className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors text-xs ${
                      checked
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-white/[0.02] border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleActivity(act)}
                      className="accent-emerald-500 shrink-0"
                    />
                    {act}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Special terms, portal quirks, opportunities, reminders…"
              className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-5 py-4 flex items-center justify-between bg-[#1a1c23] shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7"/>
            </svg>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
