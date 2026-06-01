"use client";
import { useState } from "react";
import { OEM_PROGRAMS, FUND_RECORDS, fmt, type Claim } from "@/app/data/mockData";

interface Props {
  claims: Claim[];
  onClose: () => void;
  onSubmit: (claimIds: string[], ref: string) => void;
}

export default function BulkSubmitModal({ claims, onClose, onSubmit }: Props) {
  const [ref,       setRef]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  const total   = claims.reduce((s, c) => s + c.eligibleAmount, 0);
  const program = OEM_PROGRAMS.find((p) => p.id === claims[0]?.programId);

  // Derive unique fund periods — bulk selection may span multiple periods (e.g. Q1 + H2).
  const seenFundIds = new Set<string>();
  const involvedFunds = claims.reduce<{ id: string; periodLabel: string }[]>((acc, c) => {
    if (seenFundIds.has(c.fundRecordId)) return acc;
    seenFundIds.add(c.fundRecordId);
    const f = FUND_RECORDS.find((fr) => fr.id === c.fundRecordId);
    if (f) acc.push(f);
    return acc;
  }, []);
  const fundLabel = involvedFunds.length === 1
    ? involvedFunds[0].periodLabel
    : involvedFunds.map((f) => f.periodLabel).join(" + ");

  function handleSubmit() {
    setSubmitted(true);
    onSubmit(claims.map((c) => c.id), ref);
  }

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div className="text-base font-bold text-white mb-0.5">
            {claims.length} Claims Filed in {program?.portal}
          </div>
          <div className="text-sm text-slate-400 mb-5">{fmt(total)} total submitted</div>
          {ref && (
            <div className="text-xs text-slate-500 mb-4">
              Batch ref: <span className="font-mono text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">{ref}</span>
            </div>
          )}
          {/* Filed claims */}
          <div className="w-full bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none divide-y divide-white/5 mb-5">
            {claims.map((c) => (
              <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 truncate">{c.activity}</span>
                <span className="text-xs font-mono text-slate-300 shrink-0">{fmt(c.eligibleAmount)}</span>
              </div>
            ))}
            <div className="px-4 py-2.5 flex items-center justify-between bg-white/[0.02]">
              <span className="text-xs font-semibold text-slate-400">Total</span>
              <span className="text-sm font-bold text-white">{fmt(total)}</span>
            </div>
          </div>
          {/* What's next */}
          <div className="w-full text-left space-y-1.5 mb-6">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">What&rsquo;s next</div>
            {[
              <>{program?.portal} will review — typically <span className="text-slate-400">5–10 business days</span></>,
              <>All {claims.length} claims move to <span className="text-slate-400">At OEM</span> tab</>,
              <>Status syncs automatically when the portal export is refreshed</>,
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                <span className="text-amber-400 shrink-0 font-bold">{i + 1}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/8 hover:bg-white/12 border border-white/10 text-sm font-semibold text-slate-300 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ── Pre-submit state ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white">Submit {claims.length} Claims to {program?.portal}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{fundLabel} · {fmt(total)} total</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

          {/* Claims list */}
          <div className="bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none divide-y divide-white/5">
            {claims.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-slate-200 font-medium truncate">{c.activity}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Recon {c.reconciliationDate} · Deadline {c.submissionDeadline}
                  </div>
                </div>
                <div className="text-sm font-bold text-white shrink-0">{fmt(c.eligibleAmount)}</div>
              </div>
            ))}
            <div className="px-4 py-3 flex items-center justify-between bg-white/[0.02]">
              <span className="text-xs font-semibold text-slate-400">Total</span>
              <span className="text-base font-bold text-white">{fmt(total)}</span>
            </div>
          </div>

          {/* Portal guide */}
          <div className="bg-white/[0.03] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-4">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              What you&rsquo;ll do in {program?.portal}
            </div>
            <ol className="space-y-2">
              {[
                <>Log in → Co-op → Claims → <span className="text-slate-300">Bulk Submit</span></>,
                <><span className="text-slate-300">Select period:</span> <span className="text-blue-300 font-mono text-[11px]">{fundLabel}</span></>,
                <>Upload or paste the {claims.length} activity lines from the media buyer report</>,
                <>Portal assigns a batch reference — copy and paste it below</>,
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed">{t}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Batch reference */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Batch Reference # <span className="text-slate-600 normal-case font-normal">(paste after filing)</span>
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={`e.g. ${(program?.portal ?? "OEM").toUpperCase().replace(/\s+/g, "")}-BATCH-2026-05`}
              className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <p className="text-xs text-slate-600 mt-1">Optional — claims move to At OEM either way</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-5 py-4 flex items-center justify-between bg-[#1a1c23] shrink-0">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Mark All as Submitted
          </button>
        </div>
      </div>
    </div>
  );
}
