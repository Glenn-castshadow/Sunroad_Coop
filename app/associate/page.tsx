"use client";
import { useEffect, useState } from "react";
import {
  FUND_RECORDS, ROOFTOPS, OEM_PROGRAMS,
  expiryUrgency, URGENCY_META, fmt, MOCK_TODAY, NAV_ROOFTOPS,
  type ClaimStatus, type Claim,
} from "@/app/data/mockData";
import { useClaims } from "@/app/data/sessionStore";
import StatusBadge from "@/app/components/StatusBadge";
import BrandMark from "@/app/components/BrandMark";
import NewReconModal from "@/app/components/NewReconModal";
import SubmitClaimModal from "@/app/components/SubmitClaimModal";
import ClaimDetailModal from "@/app/components/ClaimDetailModal";
import BulkSubmitModal from "@/app/components/BulkSubmitModal";
import DeadlineCalendar from "@/app/components/DeadlineCalendar";
import { READINESS_META, getClaimReadiness } from "@/app/data/claimInsights";

const STATUS_TABS: { key: ClaimStatus | "all" | "prior"; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "unsubmitted", label: "Ready to Submit" },
  { key: "pending",     label: "At OEM" },
  { key: "approved",    label: "Approved" },
  { key: "paid",        label: "Paid" },
  { key: "prior",       label: "Prior Periods" },
];

const TODAY = MOCK_TODAY;

function daysUntilDeadline(dateStr: string) {
  return Math.ceil((new Date(dateStr + "T00:00:00").getTime() - TODAY.getTime()) / 86400000);
}


export default function AssociatePage() {
  const [activeTab,       setActiveTab]       = useState<ClaimStatus | "all" | "prior">("unsubmitted");
  const [showNewRecon,    setShowNewRecon]     = useState(false);
  const [submitClaim,     setSubmitClaim]      = useState<Claim | null>(null);
  const [detailClaim,     setDetailClaim]      = useState<Claim | null>(null);
  const [showBulkSubmit,  setShowBulkSubmit]   = useState(false);
  const [bulkClaims,      setBulkClaims]       = useState<Claim[]>([]);
  const [showCalendar,    setShowCalendar]     = useState(false);
  const [selectedClaims,  setSelectedClaims]   = useState<Set<string>>(new Set());
  const [editingRefId,    setEditingRefId]     = useState<string | null>(null);
  const [editingRefValue, setEditingRefValue]  = useState("");
  const [syncingFundId,   setSyncingFundId]    = useState<string | null>(null);
  const [syncedFundIds,   setSyncedFundIds]    = useState<Set<string>>(new Set());
  const [toastMsg,        setToastMsg]         = useState<string | null>(null);
  const [claims,          setClaims]           = useClaims();

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function toggleClaimSelect(id: string) {
    setSelectedClaims((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSync(fundId: string) {
    if (syncingFundId) return;
    setSyncingFundId(fundId);
    setTimeout(() => {
      setSyncingFundId(null);
      setSyncedFundIds((prev) => new Set([...prev, fundId]));
      showToast("Portal sync complete — data is current");
    }, 1600);
  }

  function handleSaveClaimEdit(claimId: string, updates: { oemReference?: string; notes?: string }) {
    setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, ...updates } : c)));
    showToast("Claim updated");
  }

  function handleBulkSubmit(claimIds: string[], ref: string) {
    setClaims((prev) =>
      prev.map((c) =>
        claimIds.includes(c.id)
          ? { ...c, status: "pending", submittedDate: TODAY.toISOString().slice(0, 10), oemReference: ref || c.oemReference }
          : c
      )
    );
    setActiveTab("pending");
    showToast(`${claimIds.length} claims marked as submitted`);
  }

  function handleExport() {
    const kiaRt = ROOFTOPS.filter((r) => r.pilot || r.brand === "Kia");
    const exportClaims = claims.filter((c) => kiaRt.some((r) => r.id === c.rooftopId));
    const rows = [
      ["Claim ID", "Rooftop", "Activity", "Eligible Amount", "Status", "Recon Date", "Submission Deadline", "OEM Reference"],
      ...exportClaims.map((c) => {
        const rt = ROOFTOPS.find((r) => r.id === c.rooftopId)!;
        return [c.id, rt.name, `"${c.activity}"`, c.eligibleAmount, c.status, c.reconciliationDate, c.submissionDeadline, c.oemReference ?? ""];
      }),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `kia-claims-${TODAY.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Claims exported as CSV");
  }

  useEffect(() => {
    function openCalendar() {
      setShowCalendar(true);
    }

    window.addEventListener("sunroad:open-calendar", openCalendar);
    window.addEventListener("sunroad:export-csv", handleExport);
    return () => {
      window.removeEventListener("sunroad:open-calendar", openCalendar);
      window.removeEventListener("sunroad:export-csv", handleExport);
    };
  });

  const kiaProgram = OEM_PROGRAMS.find((p) => p.pilot)!;
  const kiaFunds   = FUND_RECORDS.filter((f) => f.programId === kiaProgram.id);
  const kiaClaims  = claims.filter((c) => c.programId === kiaProgram.id);

  const filtered = kiaClaims.filter((c) => {
    if (activeTab === "prior") return c.status === "expired";
    if (activeTab === "all")   return c.status !== "expired";
    return c.status === activeTab;
  }).sort((a, b) => new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime());

  const counts = Object.fromEntries(
    STATUS_TABS.map(({ key }) => [
      key,
      key === "prior"
        ? kiaClaims.filter((c) => c.status === "expired").length
        : key === "all"
        ? kiaClaims.filter((c) => c.status !== "expired").length
        : kiaClaims.filter((c) => c.status === key).length,
    ])
  );

  const activeFunds       = kiaFunds.filter((f) => f.daysUntilExpiry > 0).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  const pastDeadlineFunds = kiaFunds.filter((f) => f.daysUntilExpiry <= 0 && f.availableBalance > 0);

  const selectedClaimObjs = filtered.filter((c) => selectedClaims.has(c.id));
  const actionableClaims = kiaClaims.filter((c) => c.status !== "paid" && c.status !== "expired");
  const readinessCounts = actionableClaims.reduce(
    (acc, claim) => {
      const readiness = getClaimReadiness(claim, FUND_RECORDS);
      acc[readiness.state] = (acc[readiness.state] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<ReturnType<typeof getClaimReadiness>["state"], number>>
  );
  const avgReadiness = actionableClaims.length
    ? Math.round(actionableClaims.reduce((sum, claim) => sum + getClaimReadiness(claim, FUND_RECORDS).score, 0) / actionableClaims.length)
    : 100;

  return (
    <div className="flex-1 min-h-0 bg-[#18191f] text-slate-200 flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex w-52 shrink-0 bg-[#15161b] border-r border-white/8 flex-col pt-4 pb-8 overflow-y-auto">
        <div className="px-4 mb-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Rooftops</span>
        </div>
        {NAV_ROOFTOPS.map((rt) => (
          <div
            key={rt.id}
            className={`px-3 py-1.5 text-sm flex items-center justify-between gap-2 transition-colors ${
              rt.pilot
                ? "text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer bg-white/8"
                : "text-slate-500 cursor-default"
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <BrandMark brand={rt.brand} size={22} className={`shrink-0 ${rt.pilot ? "opacity-90" : "opacity-40"}`} />
              <span className="truncate text-xs">{rt.name}</span>
            </span>
            {rt.pilot && (
              <span className="shrink-0 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-medium">Live</span>
            )}
          </div>
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-4 md:px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">Claims Queue</h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">Kia Co-op · DAS Portal · Marketing Associate</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* New Recon */}
              <button
                onClick={() => setShowNewRecon(true)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-green-800 hover:bg-green-700 text-white text-sm font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors"
              >
                <span className="text-base leading-none">+</span>
                <span className="hidden sm:inline">New Reconciliation</span>
                <span className="sm:hidden">New Recon</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-6 space-y-6">

          {/* Fund balance cards */}
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Fund Balances — Kia</h2>
            <div className="space-y-3">
              {activeFunds.map((fund) => {
                const rt         = ROOFTOPS.find((r) => r.id === fund.rooftopId)!;
                const urgency    = expiryUrgency(fund.daysUntilExpiry);
                const meta       = URGENCY_META[urgency];
                const claimedPct = Math.round((fund.claimedYTD / fund.accruedBalance) * 100);
                const pendingPct = Math.min(100 - claimedPct, Math.round((fund.pendingClaims / fund.accruedBalance) * 100));
                const isSyncing  = syncingFundId === fund.id;
                const justSynced = syncedFundIds.has(fund.id);
                return (
                  <div key={fund.id} className="bg-[#22242c] border border-white/8 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex flex-col lg:flex-row overflow-hidden">
                    <div className="hidden lg:flex w-20 shrink-0 bg-black/20 items-center justify-center border-r border-white/8">
                      <BrandMark brand={rt.brand} size={38} />
                    </div>
                    <div className="flex-1 min-w-0 px-4 md:px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5 lg:hidden">
                            <BrandMark brand={rt.brand} size={18} />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{rt.brand}</span>
                          </div>
                          <div className="text-base font-bold text-slate-100">{rt.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{fund.periodLabel} &nbsp;·&nbsp; {fmt(fund.accrualRate)}/unit accrual</div>
                          <div className={`text-xs font-semibold mt-2 ${meta.color}`}>
                            Submit by {fund.expiryDate} &nbsp;·&nbsp; {fund.daysUntilExpiry}d remaining
                          </div>
                          <div className="mt-3 h-1.5 w-full md:w-64 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="bg-blue-500 h-full" style={{ width: `${claimedPct}%` }} />
                            <div className="bg-white/20 h-full" style={{ width: `${pendingPct}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl md:text-2xl font-bold text-white">{fmt(fund.availableBalance)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">available</div>
                        </div>
                      </div>
                    </div>

                    {/* Stats + sync */}
                    <div className="border-t lg:border-t-0 lg:border-l border-white/8 px-4 md:px-5 py-3 lg:py-4 flex flex-col sm:flex-row lg:flex-col gap-3 sm:items-center sm:justify-between lg:items-stretch lg:justify-between lg:w-64">
                      <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:flex lg:gap-5">
                        <div>
                          <div className="text-sm md:text-base font-bold text-slate-200 mb-0.5 lg:mb-1">{fmt(fund.claimedYTD)}</div>
                          <div className="flex items-center gap-1 lg:gap-1.5 text-xs text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />Claimed
                          </div>
                        </div>
                        <div>
                          <div className="text-sm md:text-base font-bold text-slate-200 mb-0.5 lg:mb-1">{fmt(fund.pendingClaims)}</div>
                          <div className="flex items-center gap-1 lg:gap-1.5 text-xs text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/25 inline-block" />At OEM
                          </div>
                        </div>
                        <div>
                          <div className="text-sm md:text-base font-bold text-slate-200 mb-0.5 lg:mb-1">{fmt(fund.accruedBalance)}</div>
                          <div className="flex items-center gap-1 lg:gap-1.5 text-xs text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/15 inline-block" />Accrued
                          </div>
                        </div>
                      </div>
                      {/* Sync row */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-600 lg:mt-3">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                        </svg>
                        <span className="hidden sm:inline">
                          {justSynced ? "Synced just now" : `Last synced ${fund.portalLastSynced}`}
                        </span>
                        <button
                          onClick={() => handleSync(fund.id)}
                          disabled={!!syncingFundId}
                          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 disabled:opacity-40 transition-colors font-medium ml-1"
                        >
                          <svg className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                          {isSyncing ? "Syncing…" : "Sync"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Closed periods */}
              {pastDeadlineFunds.map((fund) => {
                const rt         = ROOFTOPS.find((r) => r.id === fund.rooftopId)!;
                const claimedPct = Math.round((fund.claimedYTD / fund.accruedBalance) * 100);
                const pendingPct = Math.min(100 - claimedPct, Math.round((fund.pendingClaims / fund.accruedBalance) * 100));
                return (
                  <div key={fund.id} className="bg-[#22242c] border border-white/5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex flex-col lg:flex-row overflow-hidden opacity-55">
                    <div className="hidden lg:flex w-20 shrink-0 bg-black/30 items-center justify-center border-r border-white/5">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{rt.brand}</span>
                    </div>
                    <div className="flex-1 min-w-0 px-4 md:px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 lg:hidden">{rt.brand}</div>
                          <div className="flex items-center gap-2">
                            <div className="text-base font-bold text-slate-400">{rt.name}</div>
                            <span className="text-xs bg-slate-500/15 text-slate-500 border border-slate-500/25 px-1.5 py-0.5 rounded font-medium">Closed</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">{fund.periodLabel} &nbsp;·&nbsp; ended {fund.expiryDate} · No carryover</div>
                          <div className="mt-3 h-1.5 w-full md:w-64 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500/50 h-full" style={{ width: `${claimedPct}%` }} />
                            <div className="bg-amber-400/50 h-full" style={{ width: `${pendingPct}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl md:text-2xl font-bold text-slate-500">{fmt(fund.availableBalance)}</div>
                          <div className="text-xs text-slate-600 mt-0.5">unclaimed</div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t lg:border-t-0 lg:border-l border-white/5 px-4 md:px-5 py-3 lg:py-4 flex flex-col sm:flex-row lg:flex-col gap-3 sm:items-center sm:justify-between lg:items-stretch lg:justify-between lg:w-64">
                      <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:flex lg:gap-5">
                        <div>
                          <div className="text-sm md:text-base font-bold text-slate-500 mb-0.5">{fmt(fund.claimedYTD)}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 inline-block" />Claimed</div>
                        </div>
                        <div>
                          <div className="text-sm md:text-base font-bold text-slate-500 mb-0.5">{fmt(fund.pendingClaims)}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-white/20 inline-block" />At OEM</div>
                        </div>
                        <div>
                          <div className="text-sm md:text-base font-bold text-slate-500 mb-0.5">{fmt(fund.accruedBalance)}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-white/12 inline-block" />Accrued</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-700 lg:mt-3">Prior Periods tab</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Claims task queue */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Claims</h2>
              {selectedClaims.size > 0 && (
                <button
                  onClick={() => { setBulkClaims(selectedClaimObjs); setShowBulkSubmit(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                  Submit {selectedClaims.size} selected
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2">
                <div className="text-lg font-bold text-emerald-400 leading-tight">{avgReadiness}%</div>
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">Capture Readiness</div>
              </div>
              {[
                { state: "ready" as const, label: "Ready", value: readinessCounts.ready ?? 0 },
                { state: "review" as const, label: "Needs Review", value: readinessCounts.review ?? 0 },
                { state: "blocked" as const, label: "Needs Prep", value: readinessCounts.blocked ?? 0 },
              ].map(({ state, label, value }) => (
                <div key={state} className="bg-[#22242c] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2">
                  <div className={`text-lg font-bold leading-tight ${
                    state === "ready" ? "text-emerald-400" : state === "review" ? "text-amber-400" : "text-rose-400"
                  }`}>{value}</div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>

            {/* Tab strip */}
            <div className="flex gap-0 border-b border-white/8 mb-4 overflow-x-auto overflow-y-hidden">
              {STATUS_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setSelectedClaims(new Set()); }}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                    activeTab === key
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === key ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-500"
                  }`}>{counts[key]}</span>
                </button>
              ))}
            </div>

            {activeTab === "prior" && pastDeadlineFunds.length > 0 && (
              <div className="mb-3 space-y-2">
                {pastDeadlineFunds.map((f) => {
                  const rt = ROOFTOPS.find((r) => r.id === f.rooftopId)!;
                  return (
                    <div key={f.id} className="bg-[#22242c] border border-white/8 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-3 flex items-center justify-between gap-4 opacity-60">
                      <div>
                        <div className="text-sm text-slate-400 font-medium">Closed — {f.periodLabel} · {rt.name}</div>
                        <div className="text-xs text-slate-600 mt-0.5">Submission period ended {f.expiryDate} · No carryover</div>
                      </div>
                      <div className="text-sm text-slate-500 font-mono shrink-0">{fmt(f.availableBalance)} unsubmitted</div>
                    </div>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && activeTab !== "prior" ? (
              <div className="text-center py-12 text-slate-600 text-sm">No claims match this filter.</div>
            ) : filtered.length === 0 && activeTab === "prior" ? null : (
              <div className="space-y-2">
                {filtered.map((claim) => {
                  const rt           = ROOFTOPS.find((r) => r.id === claim.rooftopId)!;
                  const daysLeft     = daysUntilDeadline(claim.submissionDeadline);
                  const soonDeadline = daysLeft <= 21 && claim.status === "unsubmitted";
                  const isSelected   = selectedClaims.has(claim.id);
                  const isEditingRef = editingRefId === claim.id;
                  const readiness    = getClaimReadiness(claim, FUND_RECORDS);
                  const readinessMeta = READINESS_META[readiness.state];

                  return (
                    <div
                      key={claim.id}
                      className={`bg-[#22242c] rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border p-3 md:p-4 flex gap-3 md:gap-4 items-start hover:bg-[#282b35] transition-colors ${
                        soonDeadline    ? "border-amber-500/40"  :
                        claim.status === "expired" ? "border-slate-500/30" :
                        isSelected      ? "border-blue-500/40"  : "border-white/8"
                      }`}
                    >
                      {/* Checkbox for unsubmitted */}
                      {claim.status === "unsubmitted" && (
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClaimSelect(claim.id)}
                            className="accent-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Clickable title → detail modal */}
                          <button
                            onClick={() => setDetailClaim(claim)}
                            className="font-medium text-slate-200 text-sm hover:text-white text-left transition-colors"
                          >
                            {claim.activity}
                          </button>
                          <StatusBadge status={claim.status} />
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded border ${readinessMeta.className}`}>
                            {readiness.label} · {readiness.score}%
                          </span>
                          {soonDeadline && (
                            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                              Submit within {daysLeft}d
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {rt.name} · Recon {claim.reconciliationDate} · Deadline {claim.submissionDeadline}
                        </div>
                        <div className="mt-2 flex items-center gap-2 min-w-0">
                          <div className="h-1.5 w-24 bg-white/8 rounded-full overflow-hidden shrink-0">
                            <div className={`h-full ${readinessMeta.bar}`} style={{ width: `${readiness.score}%` }} />
                          </div>
                          <span className="text-[11px] text-slate-500 truncate">{readiness.reason}</span>
                        </div>

                        {/* OEM ref — inline edit for pending/approved */}
                        {(claim.status === "pending" || claim.status === "approved") && (
                          isEditingRef ? (
                            <div className="flex items-center gap-2 mt-1.5">
                              <input
                                type="text"
                                value={editingRefValue}
                                onChange={(e) => setEditingRefValue(e.target.value)}
                                placeholder="Paste OEM reference #"
                                autoFocus
                                className="flex-1 bg-[#1e2028] border border-blue-500/40 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                              />
                              <button
                                onClick={() => {
                                  if (editingRefValue.trim()) {
                                    setClaims((prev) => prev.map((c) =>
                                      c.id === claim.id ? { ...c, oemReference: editingRefValue.trim() } : c
                                    ));
                                    showToast("Reference # saved");
                                  }
                                  setEditingRefId(null);
                                  setEditingRefValue("");
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold shrink-0"
                              >Save</button>
                              <button
                                onClick={() => { setEditingRefId(null); setEditingRefValue(""); }}
                                className="text-xs text-slate-500 hover:text-slate-300"
                              >✕</button>
                            </div>
                          ) : (
                            claim.oemReference ? (
                              <button
                                onClick={() => { setEditingRefId(claim.id); setEditingRefValue(claim.oemReference ?? ""); }}
                                className="text-xs font-mono text-slate-500 hover:text-slate-300 mt-1 transition-colors block"
                              >
                                {claim.oemReference}
                              </button>
                            ) : (
                              <button
                                onClick={() => { setEditingRefId(claim.id); setEditingRefValue(""); }}
                                className="text-[10px] text-slate-600 hover:text-blue-400 mt-1 transition-colors flex items-center gap-1"
                              >
                                <span className="text-blue-500/60">+</span> Add ref #
                              </button>
                            )
                          )
                        )}

                        {claim.notes && !isEditingRef && (
                          <p className="text-xs text-slate-400 mt-1">{claim.notes}</p>
                        )}
                      </div>

                      {/* Right column: amount + action button stacked */}
                      <div className="shrink-0 flex flex-col items-end gap-2 min-w-[80px]">
                        <div className="text-right">
                          <div className="text-base font-bold text-white">{fmt(claim.eligibleAmount)}</div>
                          <div className="text-xs text-slate-600 mt-0.5 hidden sm:block">{claim.id}</div>
                        </div>
                        {claim.status === "unsubmitted" && (
                          <button
                            onClick={() => setSubmitClaim(claim)}
                            className="text-xs px-2.5 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                          >
                            Submit to DAS
                          </button>
                        )}
                        {(claim.status === "pending" || claim.status === "approved") && (
                          <button className="text-xs px-2.5 py-1.5 bg-white/5 text-slate-400 border border-white/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium hover:bg-white/10 transition-colors whitespace-nowrap">
                            View in DAS
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Modals ── */}
      {showNewRecon && (
        <NewReconModal
          onClose={() => setShowNewRecon(false)}
          onSave={(data) => {
            const nextNum = claims.reduce((max, c) => {
              const n = parseInt(c.id.replace(/\D/g, ""), 10);
              return isNaN(n) ? max : Math.max(max, n);
            }, 0) + 1;
            const newClaim: Claim = {
              id: `CLM-${String(nextNum).padStart(3, "0")}`,
              rooftopId:           data.rooftopId,
              programId:           data.programId,
              fundRecordId:        data.fundRecordId,
              activity:            data.activity,
              eligibleAmount:      Number(data.eligibleAmount),
              reconciliationDate:  data.reconciliationDate,
              submissionDeadline:  data.submissionDeadline,
              status:              "unsubmitted",
              notes:               data.notes || undefined,
            };
            setClaims((prev) => [newClaim, ...prev]);
            setShowNewRecon(false);
            setActiveTab("unsubmitted");
            showToast(`Reconciliation added — ${data.activity || "new claim"} added to queue`);
          }}
        />
      )}
      {submitClaim && (
        <SubmitClaimModal
          claim={submitClaim}
          onClose={() => setSubmitClaim(null)}
          onSubmit={(claimId, ref) => {
            setClaims((prev) =>
              prev.map((c) =>
                c.id === claimId
                  ? { ...c, status: "pending", submittedDate: TODAY.toISOString().slice(0, 10), oemReference: ref || c.oemReference }
                  : c
              )
            );
            setActiveTab("pending");
            showToast(`Claim marked as submitted${ref ? ` · Ref ${ref}` : ""}`);
          }}
        />
      )}
      {detailClaim && (
        <ClaimDetailModal
          claim={detailClaim}
          onClose={() => setDetailClaim(null)}
          onSave={handleSaveClaimEdit}
        />
      )}
      {showBulkSubmit && bulkClaims.length > 0 && (
        <BulkSubmitModal
          claims={bulkClaims}
          onClose={() => { setShowBulkSubmit(false); setSelectedClaims(new Set()); setBulkClaims([]); }}
          onSubmit={handleBulkSubmit}
        />
      )}
      {showCalendar && (
        <DeadlineCalendar fundRecords={FUND_RECORDS} onClose={() => setShowCalendar(false)} />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#22242c] border border-emerald-500/30 text-emerald-300 text-sm font-medium px-5 py-3 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none shadow-xl">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
