"use client";
import { useState } from "react";
import { ROOFTOPS, OEM_PROGRAMS, FUND_RECORDS, fmt, MOCK_TODAY_STR } from "@/app/data/mockData";

interface Props {
  onClose: () => void;
  onSave: (data: ReconEntry) => void;
  initialFundId?: string;
  initialRooftopId?: string;
}

export interface ReconEntry {
  rooftopId: string;
  programId: string;
  fundRecordId: string;
  activity: string;
  eligibleAmount: string;
  reconciliationDate: string;
  submissionDeadline: string;
  notes: string;
}

const BLANK: ReconEntry = {
  rooftopId: "SR-KIA-KM",
  programId: "KIA-COOP-2025",
  fundRecordId: "F-KIA-KM-Q1",
  activity: "",
  eligibleAmount: "",
  reconciliationDate: MOCK_TODAY_STR,
  submissionDeadline: "2026-07-31",
  notes: "",
};


export default function NewReconModal({ onClose, onSave, initialFundId, initialRooftopId }: Props) {
  const [form,         setForm]         = useState<ReconEntry>(() => {
    if (!initialFundId && !initialRooftopId) return BLANK;
    const fund = initialFundId ? FUND_RECORDS.find(f => f.id === initialFundId) : undefined;
    return {
      ...BLANK,
      rooftopId: initialRooftopId ?? fund?.rooftopId ?? BLANK.rooftopId,
      programId: fund?.programId ?? BLANK.programId,
      fundRecordId: initialFundId ?? BLANK.fundRecordId,
      submissionDeadline: fund?.expiryDate ?? BLANK.submissionDeadline,
    };
  });
  const [step,         setStep]         = useState<1 | 2>(1);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [dragOver,     setDragOver]     = useState(false);

  const kiaRooftops = ROOFTOPS.filter((r) => r.pilot || r.brand === "Kia");
  const kiaPrograms = OEM_PROGRAMS.filter((p) => p.pilot);

  const activeFunds = FUND_RECORDS.filter(
    (f) => f.rooftopId === form.rooftopId && f.programId === form.programId && f.daysUntilExpiry > 0
  );

  const selectedFund = FUND_RECORDS.find((f) => f.id === form.fundRecordId);
  const selectedProgram = OEM_PROGRAMS.find((p) => p.id === form.programId);

  function set(key: keyof ReconEntry, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const amount      = Number(form.eligibleAmount);
  const amountValid = form.eligibleAmount !== "" && Number.isFinite(amount) && amount > 0;
  const overBalance = !!selectedFund && amount > selectedFund.availableBalance;
  const canProceed  = !!form.activity.trim() && amountValid && !overBalance && !!form.fundRecordId && !!selectedFund;

  // Step-2 fund bar percentages
  const s2ClaimedPct = selectedFund ? Math.round((selectedFund.claimedYTD / selectedFund.accruedBalance) * 100) : 0;
  const s2PendingPct = selectedFund ? Math.min(100 - s2ClaimedPct, Math.round((selectedFund.pendingClaims / selectedFund.accruedBalance) * 100)) : 0;
  const s2NewPct     = (selectedFund && amountValid && !overBalance)
    ? Math.min(100 - s2ClaimedPct - s2PendingPct, Math.round((amount / selectedFund.accruedBalance) * 100))
    : 0;
  const balanceAfter = (selectedFund && amountValid && !overBalance) ? selectedFund.availableBalance - amount : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">New Reconciliation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn a media buyer report into a claimable line item
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none mt-0.5">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-white/8 shrink-0">
          {["Rooftop & Fund", "Activity & Amount"].map((label, i) => (
            <div key={label} className={`flex-1 px-6 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              step === i + 1 ? "border-blue-500 text-blue-400" : "border-transparent text-slate-600"
            }`}>
              <span className={`mr-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-blue-500 text-white" : "bg-white/10 text-slate-500"
              }`}>{step > i + 1 ? "✓" : i + 1}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              {/* File upload zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Import from Reconciliation File <span className="text-slate-600 normal-case font-normal">(optional)</span>
                </label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/25 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 py-3">
                    <svg className="w-8 h-8 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-emerald-300 truncate">{uploadedFile}</div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">1 activity line parsed — fill in details below or edit manually</div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-slate-500 hover:text-slate-300 transition-colors text-sm shrink-0"
                    >✕</button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 py-6 cursor-pointer transition-colors ${
                      dragOver
                        ? "border-blue-500/60 bg-blue-500/8"
                        : "border-white/12 bg-white/[0.02] hover:border-white/25 hover:bg-white/5"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) setUploadedFile(file.name);
                    }}
                  >
                    <input
                      type="file"
                      accept=".csv,.pdf,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadedFile(file.name);
                      }}
                    />
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 font-medium">Drop reconciliation PDF or CSV, or click to browse</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">Media buyer report · invoice export · campaign summary</div>
                    </div>
                  </label>
                )}
              </div>

              {/* Rooftop */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Rooftop</label>
                <select
                  value={form.rooftopId}
                  onChange={(e) => set("rooftopId", e.target.value)}
                  className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  {kiaRooftops.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Program */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">OEM Program</label>
                <select
                  value={form.programId}
                  onChange={(e) => set("programId", e.target.value)}
                  className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  {kiaPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.portal}</option>
                  ))}
                </select>
              </div>

              {/* Fund period — rich cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Apply to Fund Period</label>
                {activeFunds.length === 0 ? (
                  <div className="text-xs text-slate-600 py-2">No active fund periods for this rooftop.</div>
                ) : (
                  <div className="space-y-2">
                    {activeFunds.map((f) => {
                      const clPct  = Math.round((f.claimedYTD / f.accruedBalance) * 100);
                      const pnPct  = Math.min(100 - clPct, Math.round((f.pendingClaims / f.accruedBalance) * 100));
                      const avPct  = Math.max(0, 100 - clPct - pnPct);
                      const utilPct = clPct + pnPct;
                      const isUrgent = f.daysUntilExpiry <= 30;
                      const selected = form.fundRecordId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => { set("fundRecordId", f.id); set("submissionDeadline", f.expiryDate); }}
                          className={`w-full text-left rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border p-3.5 transition-colors ${
                            selected ? "border-blue-500/50 bg-blue-500/10" : "border-white/8 bg-[#22242c] hover:border-white/20"
                          }`}
                        >
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-200">{f.periodLabel}</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  isUrgent ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" : "bg-white/6 text-slate-400"
                                }`}>{f.daysUntilExpiry}d left</span>
                                {selected && <span className="text-[10px] text-blue-400">✓ Selected</span>}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {fmt(f.accrualRate)}/unit &nbsp;·&nbsp; submit by {f.expiryDate}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold text-blue-400">{fmt(f.availableBalance)}</div>
                              <div className="text-[10px] text-slate-500">Available</div>
                            </div>
                          </div>

                          {/* 3-segment utilization bar */}
                          <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="h-full" style={{ width: `${clPct}%`, backgroundColor: "#eab308" }}/>
                            <div className="h-full" style={{ width: `${pnPct}%`, backgroundColor: "#a69f95" }}/>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex gap-3 text-[10px] text-slate-600">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#eab308" }}/>Claimed {fmt(f.claimedYTD)}</span>
                              {f.pendingClaims > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#a69f95" }}/>At OEM {fmt(f.pendingClaims)}</span>}
                            </div>
                            <span className="text-[10px] text-slate-600">{utilPct}% utilized · {avPct}% open</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recon received date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Reconciliation Received</label>
                <input
                  type="date"
                  value={form.reconciliationDate}
                  onChange={(e) => set("reconciliationDate", e.target.value)}
                  className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
                <p className="text-xs text-slate-600 mt-1">Date the media buyer delivered this reconciliation</p>
              </div>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              {/* Fund context card with live impact bar */}
              {selectedFund && (
                <div className="bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">{selectedFund.periodLabel} &nbsp;·&nbsp; {selectedProgram?.portal}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Submit by {selectedFund.expiryDate} &nbsp;·&nbsp; {selectedFund.daysUntilExpiry}d remaining
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-400">{fmt(selectedFund.availableBalance)}</div>
                      <div className="text-[10px] text-slate-500">Available</div>
                    </div>
                  </div>
                  {/* Live impact bar: claimed + at OEM + this claim + remaining */}
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                    <div className="h-full transition-all" style={{ width: `${s2ClaimedPct}%`, backgroundColor: "#eab308" }}/>
                    <div className="h-full transition-all" style={{ width: `${s2PendingPct}%`, backgroundColor: "#a69f95" }}/>
                    {s2NewPct > 0 && (
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${s2NewPct}%` }}/>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px]">
                    <div className="flex gap-3 text-slate-600">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#eab308" }}/>Claimed</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#a69f95" }}/>At OEM</span>
                      {s2NewPct > 0 && <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>This claim</span>}
                    </div>
                    {balanceAfter !== null && (
                      <span className="text-emerald-400 font-semibold">{fmt(balanceAfter)} remaining after</span>
                    )}
                  </div>
                </div>
              )}

              {/* Activity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Activity Description</label>
                <input
                  type="text"
                  value={form.activity}
                  onChange={(e) => set("activity", e.target.value)}
                  placeholder="e.g. Google PMax — June, Radio Spots Memorial Day"
                  className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Match the activity name exactly as it appears in the media buyer&rsquo;s report — this becomes your claim description in {selectedProgram?.portal ?? "the portal"}
                </p>
              </div>

              {/* Amount + live balance impact */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Eligible Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.eligibleAmount}
                    onChange={(e) => set("eligibleAmount", e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none pl-6 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                {form.eligibleAmount !== "" && !amountValid && (
                  <p className="text-xs text-amber-400 mt-1">Enter an amount greater than zero</p>
                )}
                {amountValid && overBalance && selectedFund && (
                  <p className="text-xs text-amber-400 mt-1">Exceeds available balance of {fmt(selectedFund.availableBalance)}</p>
                )}
              </div>

              {/* Submission deadline */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Submission Deadline</label>
                <input
                  type="date"
                  value={form.submissionDeadline}
                  onChange={(e) => set("submissionDeadline", e.target.value)}
                  className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
                <p className="text-xs text-slate-600 mt-1">Pre-filled from the fund period — adjust if the OEM deadline differs</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Notes <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  placeholder="Any context from the media buyer — invoice #, campaign flight dates, etc."
                  className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                />
              </div>

              {/* What happens next hint */}
              {canProceed && (
                <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2.5">
                  <div className="text-xs font-semibold text-emerald-400 mb-1">Ready to add to queue</div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>→ Claim added to <span className="text-slate-400">Ready to Submit</span> queue</div>
                    <div>→ Open it to file directly in <span className="text-slate-400">{selectedProgram?.portal ?? "the portal"}</span></div>
                    <div>→ Status tracked from submission through payment</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-6 py-4 flex items-center justify-between bg-[#1a1c23] shrink-0">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step === 1 ? (
            <button
              disabled={!form.fundRecordId}
              onClick={() => setStep(2)}
              className="px-5 py-2 bg-green-800 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              disabled={!canProceed}
              onClick={() => onSave(form)}
              className="px-5 py-2 bg-green-800 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors"
            >
              Add to Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
