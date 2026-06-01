"use client";
import { useState } from "react";
import { ROOFTOPS, OEM_PROGRAMS, FUND_RECORDS, fmt, type Claim } from "@/app/data/mockData";

interface Props {
  claim: Claim;
  onClose: () => void;
  onSubmit: (claimId: string, oemRef: string) => void;
}

export default function SubmitClaimModal({ claim, onClose, onSubmit }: Props) {
  const [oemRef, setOemRef] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rt      = ROOFTOPS.find((r) => r.id === claim.rooftopId)!;
  const program = OEM_PROGRAMS.find((p) => p.id === claim.programId)!;
  const fund    = FUND_RECORDS.find((f) => f.id === claim.fundRecordId);

  const balanceAfter    = fund ? fund.availableBalance - claim.eligibleAmount : null;
  const balanceOverdrawn = balanceAfter !== null && balanceAfter < 0;
  const refPlaceholder  = `e.g. KIA-DAS-2026-05${claim.id.replace(/\D/g, "").padStart(3, "0")}`;

  function handleSubmit() {
    setSubmitted(true);
    // Fire the state update immediately; the success screen stays until dismissed
    onSubmit(claim.id, oemRef);
  }

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
        <div className="relative w-full max-w-md bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden">
          <div className="px-8 py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div className="text-base font-bold text-white mb-0.5">Filed in {program.portal}</div>
            <div className="text-sm text-slate-400 mb-4">{claim.activity}</div>

            {/* Outcome details */}
            <div className="w-full bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-4 text-left space-y-2 mb-5">
              {oemRef && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Reference #</span>
                  <span className="text-xs font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300">{oemRef}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Amount filed</span>
                <span className="text-xs font-bold text-white">{fmt(claim.eligibleAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Claim status</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Unsubmitted</span>
                  <span className="text-slate-600">→</span>
                  <span className="font-semibold text-amber-400">Pending OEM</span>
                </div>
              </div>
              {fund && balanceAfter !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{fund.periodLabel} balance</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">{fmt(fund.availableBalance)}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-semibold text-blue-400">{fmt(balanceAfter)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* What's next */}
            <div className="w-full text-left space-y-1.5 mb-6">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">What&rsquo;s next</div>
              {[
                { n: "1", color: "text-amber-400", t: <>{program.portal} will review — typically <span className="text-slate-400">5–10 business days</span></> },
                { n: "2", color: "text-amber-400", t: <>Status updates here when the portal export syncs — no manual checking</> },
                { n: "3", color: "text-amber-400", t: <>Once approved it moves to <span className="text-slate-400">Approved → Paid</span> and this claim closes out</> },
              ].map(({ n, color, t }) => (
                <div key={n} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className={`${color} shrink-0 font-bold`}>{n}</span>
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
      </div>
    );
  }

  /* ── Pre-submit state ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>

      <div className="relative w-full max-w-md bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Submit to {program.portal}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{rt.name} · {program.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none mt-0.5">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Fund balance impact */}
          {fund && balanceAfter !== null && (
            <div className="bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-3">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Fund Impact &mdash; {fund.periodLabel}
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Available now</span>
                <span className="font-semibold text-slate-300">{fmt(fund.availableBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="text-slate-500">After this submission</span>
                <span className={`font-bold ${balanceOverdrawn ? "text-red-400" : "text-blue-400"}`}>
                  {fmt(balanceAfter!)}
                  {balanceOverdrawn && <span className="ml-1 text-[10px] font-semibold">· exceeds balance</span>}
                </span>
              </div>
              {/* Draw-down bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                <div className="bg-yellow-500 h-full" style={{ width: `${Math.round((fund.claimedYTD / fund.accruedBalance) * 100)}%` }}/>
                <div className="bg-stone-500 h-full" style={{ width: `${Math.round((fund.pendingClaims / fund.accruedBalance) * 100)}%` }}/>
                <div className="bg-green-500 h-full transition-all" style={{ width: `${Math.round((claim.eligibleAmount / fund.accruedBalance) * 100)}%` }}/>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-600">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block"/>Claimed</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-stone-500 inline-block"/>At OEM</span>
                  <span className="flex items-center gap-1 text-green-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>This claim</span>
                </div>
                <span>{fund.daysUntilExpiry}d until deadline</span>
              </div>
            </div>
          )}

          {/* Claim summary */}
          <div className="bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-4">
            <div className="text-sm font-semibold text-slate-200 mb-3">{claim.activity}</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Eligible amount</span>
                <span className="text-base font-bold text-white">{fmt(claim.eligibleAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Recon received</span>
                <span className="text-xs text-slate-400">{claim.reconciliationDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Submission deadline</span>
                <span className="text-xs text-slate-400">{claim.submissionDeadline}</span>
              </div>
            </div>
          </div>

          {/* Portal filing guide */}
          <div className="bg-white/[0.03] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-4">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              What you&rsquo;ll do in {program.portal}
            </div>
            <ol className="space-y-2.5">
              {[
                { t: <><span className="text-slate-300">Log in</span> and go to Co-op → Claims → New Claim</> },
                { t: <><span className="text-slate-300">Select period:</span> <span className="text-blue-300 font-mono text-[11px]">{fund?.periodLabel ?? claim.submissionDeadline.slice(0, 7)}</span></> },
                { t: <><span className="text-slate-300">Activity:</span> <span className="text-blue-300 font-mono text-[11px]">&ldquo;{claim.activity}&rdquo;</span></> },
                { t: <><span className="text-slate-300">Amount:</span> <span className="text-blue-300 font-mono">{fmt(claim.eligibleAmount)}</span> &nbsp;&middot;&nbsp; <span className="text-slate-300">Recon date:</span> <span className="text-blue-300 font-mono">{claim.reconciliationDate}</span></> },
                { t: <>Copy the reference # assigned by the portal, then paste it below</> },
              ].map(({ t }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span className="text-xs text-slate-500 leading-relaxed">{t}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* OEM reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              {program.portal} Reference # <span className="text-slate-600 normal-case font-normal">(paste after filing)</span>
            </label>
            <input
              type="text"
              value={oemRef}
              onChange={(e) => setOemRef(e.target.value)}
              placeholder={refPlaceholder}
              className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <p className="text-xs text-slate-600 mt-1">
              Optional — the claim moves to <span className="text-slate-500">Pending</span> either way; add the reference now or return to update it later
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-6 py-4 flex items-center justify-between bg-[#1a1c23] shrink-0">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={balanceOverdrawn}
            title={balanceOverdrawn ? "Claim amount exceeds available fund balance" : undefined}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Mark as Submitted
          </button>
        </div>
      </div>
    </div>
  );
}
