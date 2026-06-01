"use client";
import { useState } from "react";
import { ROOFTOPS, OEM_PROGRAMS, FUND_RECORDS, fmt, type Claim, type ClaimStatus } from "@/app/data/mockData";
import { READINESS_META, getClaimReadiness } from "@/app/data/claimInsights";
import StatusBadge from "./StatusBadge";

interface DocItem {
  id: string;
  label: string;
  detail: string;
}

function getDocItems(activity: string, status: string): DocItem[] {
  const lower = activity.toLowerCase();
  const isBroadcast = /radio|tv|broadcast|spot/.test(lower);
  const isDigital   = /digital|search|display|social|pmax|video/.test(lower);
  const items: DocItem[] = [
    { id: "invoice",  label: "Media buyer invoice",       detail: "Itemized invoice showing eligible spend amount" },
    { id: "proof",    label: "Proof of performance",      detail: isDigital ? "Screenshot or impression/click report" : "Tearsheet or placement confirmation" },
    { id: "recon",    label: "Reconciliation sign-off",   detail: "Approved reconciliation document from media buyer" },
    { id: "dates",    label: "Flight dates confirmed",    detail: "Activity dates fall within the fund accrual period" },
  ];
  if (isBroadcast) {
    items.splice(2, 0, { id: "affidavit", label: "Affidavit of performance", detail: "Required by Kia DAS for broadcast & radio placements" });
  }
  if (status !== "unsubmitted") {
    items.push({ id: "portal-ref", label: "Portal reference captured", detail: "OEM batch/claim reference saved in this record" });
  }
  return items;
}

interface Props {
  claim: Claim;
  onClose: () => void;
  onSave: (claimId: string, updates: { oemReference?: string; notes?: string; docChecks?: Record<string, boolean> }) => void;
}

const STATUS_ORDER: ClaimStatus[] = ["unsubmitted", "pending", "approved", "paid"];

export default function ClaimDetailModal({ claim, onClose, onSave }: Props) {
  const [oemRef,     setOemRef]     = useState(claim.oemReference ?? "");
  const [notes,      setNotes]      = useState(claim.notes ?? "");
  const [saved,      setSaved]      = useState(false);
  const [docChecks,  setDocChecks]  = useState<Record<string, boolean>>(claim.docChecks ?? {});

  const docItems   = getDocItems(claim.activity, claim.status);
  const checkedCount = docItems.filter((d) => docChecks[d.id]).length;

  function toggleDoc(id: string) {
    setDocChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const rt      = ROOFTOPS.find((r) => r.id === claim.rooftopId)!;
  const program = OEM_PROGRAMS.find((p) => p.id === claim.programId)!;
  const fund    = FUND_RECORDS.find((f) => f.id === claim.fundRecordId);

  const isExpired  = claim.status === "expired";
  const statusIdx  = isExpired ? 0 : STATUS_ORDER.indexOf(claim.status as ClaimStatus);
  const readiness = getClaimReadiness(claim, FUND_RECORDS);
  const readinessMeta = READINESS_META[readiness.state];

  const timeline = [
    { key: "unsubmitted", label: "Created",   date: claim.reconciliationDate },
    { key: "pending",     label: "Submitted", date: claim.submittedDate   ?? null },
    { key: "approved",    label: "Approved",  date: claim.approvedDate    ?? null },
    { key: "paid",        label: "Paid",      date: claim.paidDate        ?? null },
  ];

  function handleSave() {
    onSave(claim.id, {
      oemReference: oemRef.trim() || undefined,
      notes:        notes.trim()  || undefined,
      docChecks,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-6 py-4 flex items-start justify-between shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white leading-snug">{claim.activity}</h2>
              <StatusBadge status={claim.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{rt.name} · {program.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none shrink-0">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* Status timeline */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Status Timeline</div>
            <div className="flex items-start">
              {timeline.map(({ key, label, date }, i) => {
                const isPast     = i < statusIdx;
                const isCurrent  = !isExpired && i === statusIdx;
                const isDone     = isPast || (claim.status === "paid" && i <= 3);
                return (
                  <div key={key} className="flex-1 flex flex-col items-center">
                    <div className="flex items-center w-full">
                      <div className={`flex-1 h-px ${i === 0 ? "opacity-0" : isDone || isCurrent ? "bg-blue-500/40" : "bg-white/8"}`} />
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isDone     ? "border-emerald-500 bg-emerald-500/20" :
                        isCurrent  ? "border-blue-500 bg-blue-500/20" :
                        isExpired && i === 0 ? "border-rose-500 bg-rose-500/20" :
                                     "border-white/12 bg-white/4"
                      }`}>
                        {isDone ? (
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                          </svg>
                        ) : isCurrent ? (
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
                        )}
                      </div>
                      <div className={`flex-1 h-px ${isDone ? "bg-blue-500/40" : "bg-white/8"}`} />
                    </div>
                    <div className="text-center mt-1.5">
                      <div className={`text-[10px] font-semibold ${
                        isDone    ? "text-emerald-400" :
                        isCurrent ? "text-blue-400"    :
                                    "text-slate-600"
                      }`}>{label}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">{date ?? "—"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {isExpired && (
              <div className="mt-3 text-center text-xs text-rose-400 bg-rose-500/8 border border-rose-500/20 rounded px-3 py-1.5">
                Submission deadline passed — no carryover
              </div>
            )}
          </div>

          {/* Claim details */}
          <div className={`border rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-4 ${readinessMeta.className}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Capture Readiness</div>
                <div className="text-sm font-bold mt-1">{readiness.label} · {readiness.score}%</div>
                <div className="text-xs mt-1 opacity-80">{readiness.reason}</div>
              </div>
              <div className="w-20 h-1.5 bg-black/15 rounded-full overflow-hidden mt-2 shrink-0">
                <div className={`h-full ${readinessMeta.bar}`} style={{ width: `${readiness.score}%` }} />
              </div>
            </div>
            {(readiness.blockers.length > 0 || readiness.warnings.length > 0) && (
              <div className="mt-3 space-y-1">
                {[...readiness.blockers, ...readiness.warnings].map((item) => (
                  <div key={item} className="text-xs opacity-85">• {item}</div>
                ))}
              </div>
            )}
            {readiness.actions.length > 0 && (
              <div className="mt-2 text-xs opacity-80">Next: {readiness.actions[0]}</div>
            )}
          </div>

          <div className="bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-4">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Claim Details</div>
            <div className="space-y-2">
              {[
                { label: "Eligible Amount",    val: <span className="text-base font-bold text-white">{fmt(claim.eligibleAmount)}</span> },
                { label: "Fund Period",         val: <span className="text-slate-300">{fund?.periodLabel ?? "—"}</span> },
                { label: "Portal",              val: <span className="text-slate-300">{program.portal}</span> },
                { label: "Recon Received",      val: <span className="text-slate-300">{claim.reconciliationDate}</span> },
                { label: "Submission Deadline", val: <span className="text-slate-300">{claim.submissionDeadline}</span> },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Document checklist */}
          <div className="bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Submission Package</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {docItems.map((d, i) => (
                    <div key={d.id} className={`h-1 rounded-full transition-colors ${
                      i < checkedCount ? "bg-emerald-500" : "bg-white/10"
                    }`} style={{ width: 14 }} />
                  ))}
                </div>
                <span className={`text-[10px] font-semibold tabular-nums ${
                  checkedCount === docItems.length ? "text-emerald-400" : "text-slate-500"
                }`}>{checkedCount}/{docItems.length}</span>
              </div>
            </div>
            <div className="space-y-1">
              {docItems.map((doc) => {
                const checked = !!docChecks[doc.id];
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDoc(doc.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded text-left transition-colors ${
                      checked
                        ? "bg-emerald-500/8 hover:bg-emerald-500/12"
                        : "bg-white/[0.02] hover:bg-white/5"
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-white/20 bg-transparent"
                    }`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-medium leading-tight ${checked ? "text-emerald-300 line-through decoration-emerald-500/50" : "text-slate-200"}`}>
                        {doc.label}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">{doc.detail}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {checkedCount === docItems.length && (
              <div className="mt-3 text-[11px] text-emerald-400 font-semibold text-center">
                Package complete — ready to submit to {OEM_PROGRAMS.find(p => p.id === claim.programId)?.portal}
              </div>
            )}
          </div>

          {/* OEM Reference */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {program.portal} Reference #
            </label>
            <input
              type="text"
              value={oemRef}
              onChange={(e) => setOemRef(e.target.value)}
              placeholder={`e.g. ${program.portal.toUpperCase().replace(/\s+/g, "")}-2026-XXXXX`}
              className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Invoice #, campaign flight dates, media buyer correspondence…"
              className="w-full bg-[#22242c] border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-6 py-4 flex items-center justify-between bg-[#1a1c23] shrink-0">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Close</button>
          <button
            onClick={handleSave}
            className={`px-5 py-2 text-sm font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors flex items-center gap-2 ${
              saved ? "bg-emerald-600 text-white" : "bg-green-800 hover:bg-green-700 text-white"
            }`}
          >
            {saved ? (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>Saved</>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
