"use client";
import { useCallback, useEffect, useState } from "react";
import { FUND_RECORDS, ROOFTOPS, OEM_PROGRAMS, expiryUrgency, URGENCY_META, fmt, MOCK_TODAY, NAV_ROOFTOPS, type FundRecord } from "@/app/data/mockData";
import { useClaims } from "@/app/data/sessionStore";
import StatusBadge from "@/app/components/StatusBadge";
import BrandMark from "@/app/components/BrandMark";
import EditAgreementModal from "@/app/components/EditAgreementModal";
import DeadlineCalendar from "@/app/components/DeadlineCalendar";
import { KIND_META, getExceptionItems } from "@/app/data/claimInsights";

const TODAY = MOCK_TODAY;

// Period-over-period utilization for trend sparkbars (prior periods hardcoded)
const UTILIZATION_TREND: Record<string, { label: string; pct: number; isCurrent?: boolean }[]> = {
  "KIA-COOP-2025": [{ label: "H1 '25", pct: 68 }, { label: "H2 '25", pct: 59 }, { label: "Q1 '26", pct: 43, isCurrent: true }],
  "BMW-COOP-2025": [{ label: "H1 '25", pct: 82 }, { label: "H2 '25", pct: 77 }, { label: "Q1 '26", pct: 54, isCurrent: true }],
  "FOR-COOP-2025": [{ label: "H1 '25", pct: 71 }, { label: "H2 '25", pct: 84 }, { label: "Q1 '26", pct: 46, isCurrent: true }],
  "HYU-COOP-2025": [{ label: "H1 '25", pct: 79 }, { label: "H2 '25", pct: 65 }, { label: "Q1 '26", pct: 70, isCurrent: true }],
  "SUB-COOP-2025": [{ label: "H1 '25", pct: 55 }, { label: "H2 '25", pct: 62 }, { label: "Q1 '26", pct: 30, isCurrent: true }],
  "TOY-COOP-2025": [{ label: "H1 '25", pct: 88 }, { label: "H2 '25", pct: 91 }, { label: "Q1 '26", pct: 96, isCurrent: true }],
  "CHE-COOP-2025": [{ label: "H1 '25", pct: 73 }, { label: "H2 '25", pct: 68 }, { label: "Q1 '26", pct: 62, isCurrent: true }],
  "CDJ-COOP-2025": [{ label: "H1 '25", pct: 44 }, { label: "H2 '25", pct: 58 }, { label: "Q1 '26", pct: 54, isCurrent: true }],
  "HON-COOP-2025": [{ label: "H1 '25", pct: 91 }, { label: "H2 '25", pct: 87 }, { label: "Q1 '26", pct: 79, isCurrent: true }],
};


export default function DirectorPage() {
  const [selectedRooftopId, setSelectedRooftopId] = useState<string | null>(null);
  const [expandedFunds,     setExpandedFunds]     = useState<Set<string>>(new Set());
  const [fundRecords,       setFundRecords]       = useState<FundRecord[]>(FUND_RECORDS);
  const [editFund,          setEditFund]          = useState<FundRecord | null>(null);
  const [showCalendar,      setShowCalendar]      = useState(false);
  const [syncingFundId,     setSyncingFundId]     = useState<string | null>(null);
  const [syncedFundIds,     setSyncedFundIds]     = useState<Set<string>>(new Set());
  const [toastMsg,          setToastMsg]          = useState<string | null>(null);
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [claims] = useClaims();

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleAgreementSave(fundId: string, updates: Partial<FundRecord>) {
    setFundRecords((prev) =>
      prev.map((f) => (f.id === fundId ? { ...f, ...updates } : f))
    );
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

  const handleExport = useCallback(() => {
    const exportRooftops = selectedRooftopId
      ? ROOFTOPS.filter((r) => r.id === selectedRooftopId)
      : ROOFTOPS;
    const rows = [
      ["Rooftop", "Brand", "Period", "Accrued", "Claimed", "Pending", "Available", "Expiry", "Days Left"],
      ...fundRecords
        .filter((f) => exportRooftops.some((r) => r.id === f.rooftopId))
        .map((f) => {
          const rt = ROOFTOPS.find((r) => r.id === f.rooftopId)!;
          return [rt.name, rt.brand, f.periodLabel, f.accruedBalance, f.claimedYTD, f.pendingClaims, f.availableBalance, f.expiryDate, f.daysUntilExpiry];
        }),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `fund-overview-${TODAY.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRooftopId, fundRecords]);

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
  }, [handleExport]);

  function toggleFund(id: string) {
    setExpandedFunds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const visibleRooftops = selectedRooftopId
    ? ROOFTOPS.filter((r) => r.id === selectedRooftopId)
    : ROOFTOPS;
  const visibleFunds = fundRecords.filter((f) =>
    visibleRooftops.some((r) => r.id === f.rooftopId)
  );

  const totalAccrued   = visibleFunds.reduce((s, f) => s + f.accruedBalance, 0);
  const totalClaimed   = visibleFunds.reduce((s, f) => s + f.claimedYTD, 0);
  const totalPending   = visibleFunds.reduce((s, f) => s + f.pendingClaims, 0);
  const totalAvailable = visibleFunds.reduce((s, f) => s + f.availableBalance, 0);

  const upcomingDeadlines = visibleFunds
    .filter((f) => f.daysUntilExpiry > 0 && f.availableBalance > 0)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const pastDeadline = visibleFunds.filter((f) => f.daysUntilExpiry <= 0 && f.availableBalance > 0);
  const opportunityItems = getExceptionItems(claims, fundRecords)
    .filter((item) => visibleRooftops.some((r) => r.name === item.rooftopName));
  const urgentOpportunities  = opportunityItems.filter((item) => item.severity === "critical").length;
  const followUpOpportunities = opportunityItems.filter((item) => item.severity === "warning").length;
  const dueSoonCount = visibleFunds.filter((f) => f.daysUntilExpiry > 0 && f.daysUntilExpiry <= 30 && f.availableBalance > 0).length;

  const rooftopRollup = visibleRooftops.map((rt) => {
    const funds  = fundRecords.filter((f) => f.rooftopId === rt.id);
    const rooftopClaims = claims.filter((c) => c.rooftopId === rt.id);
    const accrued   = funds.reduce((s, f) => s + f.accruedBalance, 0);
    const claimed   = funds.reduce((s, f) => s + f.claimedYTD, 0);
    const available = funds.reduce((s, f) => s + f.availableBalance, 0);
    const soonestDeadline = funds
      .filter((f) => f.daysUntilExpiry > 0)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)[0];
    const readyToSubmit   = rooftopClaims.filter((c) => c.status === "unsubmitted").length;
    const pastDeadlineCount = rooftopClaims.filter((c) => c.status === "expired").length;
    return { rt, accrued, claimed, available, soonestDeadline, readyToSubmit, pastDeadlineCount };
  });

  const selectedName = selectedRooftopId
    ? ROOFTOPS.find((r) => r.id === selectedRooftopId)!.name
    : "All Rooftops";

  return (
    <div className="flex-1 min-h-0 bg-[#18191f] text-slate-200 flex">

      {/* Rooftop sidebar — desktop only */}
      <aside className="hidden lg:flex w-52 shrink-0 bg-[#15161b] border-r border-white/8 flex-col pt-[22px] pb-8 overflow-y-auto">
        <div className="px-4 mb-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Rooftops</span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedRooftopId(null)}
          aria-pressed={selectedRooftopId === null}
          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/60 ${
            selectedRooftopId === null ? "text-white bg-white/8" : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {/* Dealership building icon */}
          <svg className="w-4 h-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M3 21h18M3 10l9-7 9 7M5 21V10M19 21V10M9 21v-6h6v6"/>
          </svg>
          All Rooftops
        </button>
        <div className="mx-4 my-1 border-t border-white/8" />
        {NAV_ROOFTOPS.map((rt) => (
          <button
            key={rt.id}
            type="button"
            disabled={!rt.pilot}
            aria-pressed={rt.pilot ? selectedRooftopId === rt.id : undefined}
            onClick={rt.pilot ? () => setSelectedRooftopId(rt.id === selectedRooftopId ? null : rt.id) : undefined}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/60 ${
              rt.pilot
                ? selectedRooftopId === rt.id
                  ? "text-white bg-white/8"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
                : "text-slate-500 disabled:cursor-default"
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <BrandMark brand={rt.brand} size={22} className="shrink-0 opacity-80" />
              <span className="truncate text-xs">{rt.name}</span>
            </span>
            {rt.pilot && (
              <span className="shrink-0 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-medium">Live</span>
            )}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-4 md:px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">Fund Overview</h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Marketing Director · {selectedName} · {TODAY.getFullYear()}
              </p>
              {/* Mobile rooftop select */}
              <div className="mt-2 lg:hidden">
                <select
                  value={selectedRooftopId ?? ""}
                  onChange={(e) => setSelectedRooftopId(e.target.value || null)}
                  className="bg-[#2a2d38] border border-white/10 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  <option value="">All Rooftops</option>
                  {NAV_ROOFTOPS.filter((r) => r.pilot).map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name} (Live)</option>
                  ))}
                </select>
              </div>
            </div>
            {/* KPI chips */}
            <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 lg:flex lg:w-auto lg:flex-wrap lg:shrink-0">
              {/* Accrued */}
              <div className="bg-white/[0.04] border border-white/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-3 md:px-4 py-2.5 flex items-center gap-3 min-w-0 w-full lg:w-auto lg:min-w-[150px]">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m0 0h-5a2 2 0 000 4h5"/>
                  </svg>
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold text-white leading-tight">{fmt(totalAccrued)}</div>
                  <div className="text-xs text-green-500 font-medium">Accrued</div>
                </div>
              </div>
              {/* Claimed */}
              <div className="bg-white/[0.04] border border-white/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-3 md:px-4 py-2.5 flex items-center gap-3 min-w-0 w-full lg:w-auto lg:min-w-[150px]">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold text-white leading-tight">{fmt(totalClaimed)}</div>
                  <div className="text-xs text-yellow-500 font-medium">Claimed</div>
                </div>
              </div>
              {/* Submitted */}
              <div className="bg-white/[0.04] border border-white/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-3 md:px-4 py-2.5 flex items-center gap-3 min-w-0 w-full lg:w-auto lg:min-w-[150px]">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold text-white leading-tight">{fmt(totalPending)}</div>
                  <div className="text-xs text-stone-400 font-medium">Submitted</div>
                </div>
              </div>
              {/* Available */}
              <div className="bg-white/[0.04] border border-white/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-3 md:px-4 py-2.5 flex items-center gap-3 min-w-0 w-full lg:w-auto lg:min-w-[150px]">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold text-white leading-tight">{fmt(totalAvailable)}</div>
                  <div className="text-xs text-sr-blue font-medium">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-6 space-y-8">

          {/* Opportunity center */}
          <section>
            <div className={`bg-[#22242c] border rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none overflow-hidden transition-colors ${
              showOpportunities ? "border-white/15" : "border-white/8"
            }`}>
              <button
                type="button"
                onClick={() => setShowOpportunities((open) => !open)}
                aria-expanded={showOpportunities}
                className="w-full text-left flex items-stretch focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0 px-4 md:px-5 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opportunity Center</h2>
                    <p className="text-xs text-slate-600 mt-1">Prioritized next moves to capture more co-op value.</p>
                  </div>
                  <div className="flex items-center gap-3 md:gap-5 shrink-0">
                    <div className="grid grid-cols-3 gap-2 min-w-[260px] md:min-w-[360px]">
                      {[
                        { label: "Urgent",     value: urgentOpportunities,  className: "text-amber-400" },
                        { label: "Follow up",  value: followUpOpportunities, className: "text-blue-400" },
                        { label: "Due ≤30d",   value: dueSoonCount,         className: dueSoonCount > 0 ? "text-amber-400" : "text-slate-400" },
                      ].map(({ label, value, className }) => (
                        <div key={label} className="bg-white/[0.035] border border-white/8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2">
                          <div className={`text-lg font-bold leading-tight ${className}`}>{value}</div>
                          <div className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {showOpportunities ? "Hide opportunities" : `${opportunityItems.length} opportunities`}
                      <svg className={`w-4 h-4 transition-transform ${showOpportunities ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                    <svg className={`sm:hidden w-4 h-4 text-slate-500 transition-transform ${showOpportunities ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </button>

              {showOpportunities && (
              <div className="border-t border-white/8">
                {opportunityItems.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-slate-500">No active opportunity flags for this view.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {opportunityItems.slice(0, 6).map((item) => {
                      const kindMeta = KIND_META[item.kind];
                      return (
                        <div key={item.id} className="px-4 py-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-semibold ${kindMeta.className}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${kindMeta.dot}`} />
                                {kindMeta.label}
                              </span>
                              <span className="text-sm font-semibold text-slate-100">{item.title}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{item.detail}</div>
                          </div>
                          <div className="flex items-center gap-4 lg:shrink-0 lg:justify-end lg:w-52">
                            {item.amount !== undefined && (
                              <div className="text-right">
                                <div className="text-sm font-mono font-bold text-white">{fmt(item.amount)}</div>
                                <div className="text-[10px] text-slate-600 uppercase tracking-wider">{item.amountLabel ?? kindMeta.amountLabel}</div>
                              </div>
                            )}
                            <div className="text-xs font-medium text-slate-400 border border-white/10 bg-white/[0.03] rounded px-2.5 py-1.5 whitespace-nowrap">{item.action}</div>
                          </div>
                        </div>
                      );
                    })}
                    {opportunityItems.length > 6 && (
                      <div className="px-4 py-2 text-xs text-slate-600">
                        +{opportunityItems.length - 6} more opportunities in this view
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
          </section>

          {/* Fund balance cards — accordion */}
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Fund Periods</h2>
            <div className="space-y-2">
              {upcomingDeadlines.map((fund) => {
                const rt         = ROOFTOPS.find((r) => r.id === fund.rooftopId)!;
                const urgency    = expiryUrgency(fund.daysUntilExpiry);
                const meta       = URGENCY_META[urgency];
                const claimedPct = Math.round((fund.claimedYTD / fund.accruedBalance) * 100);
                const pendingPct = Math.min(100 - claimedPct, Math.round((fund.pendingClaims / fund.accruedBalance) * 100));
                const unsubCount = claims.filter((c) => c.rooftopId === fund.rooftopId && c.status === "unsubmitted").length;
                const isExpanded = expandedFunds.has(fund.id);
                const borderCls  = isExpanded ? "border-white/15" : "border-white/8";
                return (
                  <div
                    key={fund.id}
                    className={`bg-[#22242c] ${borderCls} border rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none overflow-hidden transition-colors`}
                  >
                    {/* ── Collapsed single-row summary ── */}
                    <button
                      type="button"
                      onClick={() => toggleFund(fund.id)}
                      className="w-full text-left flex items-stretch focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Brand mark column — desktop */}
                      <div className="hidden md:flex w-20 shrink-0 bg-black/20 items-center justify-center border-r border-white/8">
                        <BrandMark brand={rt.brand} size={36} />
                      </div>

                      {/* Single flex row */}
                      <div className="flex-1 min-w-0 px-4 md:px-5 py-3 flex items-center gap-3 md:gap-5">

                        {/* Mobile brand mark */}
                        <div className="shrink-0 md:hidden">
                          <BrandMark brand={rt.brand} size={22} />
                        </div>

                        {/* Name + badges — grows */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-100">{rt.name}</span>
                            {rt.pilot && (
                              <span className="shrink-0 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-semibold">PILOT</span>
                            )}
                            {unsubCount > 0 && (
                              <span className="shrink-0 text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-medium">
                                {unsubCount} to submit
                              </span>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 md:hidden">
                            {[
                              { label: "Accrued", dotStyle: { backgroundColor: "#22c55e" }, val: fund.accruedBalance },
                              { label: "Claimed", dotStyle: { backgroundColor: "#eab308" }, val: fund.claimedYTD },
                              { label: "Submitted", dotStyle: { backgroundColor: "#a69f95" }, val: fund.pendingClaims },
                            ].map(({ label, dotStyle, val }) => (
                              <div key={label} className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-300 leading-tight">{fmt(val)}</div>
                                <div className="flex items-center gap-1 text-[9px] text-slate-500 leading-tight">
                                  <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={dotStyle} />
                                  <span className="truncate">{label}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3 stats — desktop only in collapsed row */}
                        <div className="hidden md:flex items-center gap-10 shrink-0">
                          {[
                            { val: fund.accruedBalance, dotStyle: { backgroundColor: "#22c55e" }, label: "Accrued" },
                            { val: fund.claimedYTD,     dotStyle: { backgroundColor: "#eab308" }, label: "Claimed" },
                            { val: fund.pendingClaims,  dotStyle: { backgroundColor: "#a69f95" }, label: "Submitted" },
                          ].map(({ val, dotStyle, label }) => (
                            <div key={label} className="w-[80px] flex flex-col">
                              <div className="text-xs font-bold text-slate-300 mb-0.5 text-right tabular-nums">{fmt(val)}</div>
                              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={dotStyle}/>{label}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Available + chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-[88px] text-right">
                            <div className="text-base md:text-lg font-bold text-white leading-tight tabular-nums">{fmt(fund.availableBalance)}</div>
                            <div className="text-[10px] text-slate-500">Available</div>
                          </div>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                          </svg>
                        </div>
                      </div>
                    </button>

                    {/* ── Expanded detail panel ── */}
                    {isExpanded && (() => {
                      const program      = OEM_PROGRAMS.find((p) => p.id === fund.programId)!;
                      const fundClaims   = claims.filter((c) => c.fundRecordId === fund.id)
                                                  .sort((a, b) => {
                                                    const order = { unsubmitted: 0, pending: 1, approved: 2, paid: 3, expired: 4 };
                                                    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
                                                  });
                      const utilizedPct  = Math.round(((fund.claimedYTD + fund.pendingClaims) / fund.accruedBalance) * 100);
                      const availPct     = Math.max(0, 100 - claimedPct - pendingPct);
                      const utilLabel    = utilizedPct >= 75 ? "Well utilized" : utilizedPct >= 45 ? "On pace" : "Room to grow";
                      const utilColor    = utilizedPct >= 75 ? "text-blue-400" : utilizedPct >= 45 ? "text-slate-300" : "text-slate-400";
                      const statusColors: Record<string, string> = {
                        unsubmitted: "text-slate-300 bg-white/5 border-white/10",
                        pending:     "text-blue-400 bg-blue-500/10 border-blue-500/20",
                        approved:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                        paid:        "text-slate-500 bg-white/[0.03] border-white/8",
                        expired:     "text-slate-600 bg-white/[0.02] border-white/5",
                      };
                      const statusLabels: Record<string, string> = {
                        unsubmitted: "Ready to submit",
                        pending:     "Submitted",
                        approved:    "Approved",
                        paid:        "Paid",
                        expired:     "Expired",
                      };
                      return (
                        <div className="border-t border-white/8 px-4 md:px-5 md:ml-20 py-4 space-y-4">

                          {/* Context strip */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>{fund.periodLabel}</span>
                            <span className="text-white/15">·</span>
                            <span>{fmt(fund.accrualRate)}/unit accrual</span>
                            <span className="text-white/15">·</span>
                            <span className="text-slate-400">{program.portal} portal</span>
                            <span className="text-white/15">·</span>
                            <span className={`font-semibold ${meta.color}`}>
                              Submit by {fund.expiryDate} &nbsp;·&nbsp; {fund.daysUntilExpiry}d remaining
                            </span>
                          </div>

                          {/* Stats — mobile only */}
                          <div className="flex gap-5 md:hidden">
                            {[
                              { label: "Accrued",  dotStyle: { backgroundColor: "#22c55e" }, val: fund.accruedBalance },
                              { label: "Claimed",  dotStyle: { backgroundColor: "#eab308" }, val: fund.claimedYTD },
                              { label: "Submitted", dotStyle: { backgroundColor: "#a69f95" }, val: fund.pendingClaims },
                            ].map(({ label, dotStyle, val }) => (
                              <div key={label}>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={dotStyle}/>{label}
                                </div>
                                <div className="text-xs font-bold text-slate-300">{fmt(val)}</div>
                              </div>
                            ))}
                          </div>

                          {/* Utilization bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fund Utilization</span>
                              <span className={`text-xs font-semibold ${utilColor}`}>{utilizedPct}% &nbsp;·&nbsp; {utilLabel}</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                              <div className="h-full" style={{ width: `${claimedPct}%`, backgroundColor: "#eab308" }}/>
                              <div className="h-full" style={{ width: `${pendingPct}%`, backgroundColor: "#a69f95" }}/>
                            </div>
                            <div className="flex gap-4 mt-1.5 text-[10px] text-slate-600">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#eab308" }}/>Claimed {claimedPct}%</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#a69f95" }}/>Submitted {pendingPct}%</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#5b9bd5" }}/>Available {availPct}%</span>
                            </div>
                          </div>

                          {/* Claims in this period */}
                          {fundClaims.length > 0 ? (
                            <div>
                              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Claims This Period ({fundClaims.length})
                              </div>
                              <div className="space-y-1">
                                {fundClaims.slice(0, 6).map((claim) => (
                                  <div
                                    key={claim.id}
                                    className="flex items-center justify-between gap-3 py-1.5 border-b border-white/5 last:border-0"
                                  >
                                    <span className="text-xs text-slate-300 min-w-0 truncate">{claim.activity}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs font-mono text-slate-400">{fmt(claim.eligibleAmount)}</span>
                                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${statusColors[claim.status]}`}>
                                        {statusLabels[claim.status]}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {fundClaims.length > 6 && (
                                  <div className="text-xs text-slate-600 pt-1">+{fundClaims.length - 6} more</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-600 italic">No claims recorded yet for this period.</div>
                          )}

                          {/* Agreement settings strip */}
                          <div className="bg-white/[0.025] border border-white/6 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Agreement</span>
                              <button
                                onClick={() => setEditFund(fund)}
                                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2.121 2.121 0 013 3L12 16H9v-3z"/>
                                </svg>
                                Edit
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                              <span>
                                <span className="text-slate-600">Match: </span>
                                <span className="text-slate-400 font-medium">
                                  {fund.matchRequirement === "100"   ? "100% OEM"
                                   : fund.matchRequirement === "75-25" ? "75/25"
                                   : fund.matchRequirement === "50-50" ? "50/50 Co-op"
                                   : "—"}
                                </span>
                              </span>
                              {fund.eligibleActivities && fund.eligibleActivities.length > 0 && (
                                <span>
                                  <span className="text-slate-600">Eligible: </span>
                                  <span className="text-slate-400">{fund.eligibleActivities.join(" · ")}</span>
                                </span>
                              )}
                            </div>
                            {fund.internalNotes && (
                              <p className="text-[11px] text-slate-600 italic leading-relaxed">{fund.internalNotes}</p>
                            )}
                          </div>

                          {/* Period-over-period utilization trend */}
                          {(() => {
                            const trend = UTILIZATION_TREND[fund.programId];
                            if (!trend) return null;
                            return (
                              <div>
                                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                  Period-over-Period Utilization
                                </div>
                                <div className="flex items-end gap-2">
                                  {trend.map(({ label, pct, isCurrent }) => (
                                    <div key={label} className="flex-1 text-center">
                                      <div className={`text-[10px] font-bold mb-1 ${isCurrent ? "text-blue-400" : "text-slate-500"}`}>{pct}%</div>
                                      <div className="relative h-8 bg-white/5 rounded-sm overflow-hidden">
                                        <div
                                          className={`absolute bottom-0 left-0 right-0 ${isCurrent ? "bg-blue-500/50" : "bg-slate-500/35"}`}
                                          style={{ height: `${pct}%` }}
                                        />
                                      </div>
                                      <div className={`text-[9px] mt-1 ${isCurrent ? "text-blue-400 font-semibold" : "text-slate-600"}`}>{label}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[10px] text-slate-600">
                              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                              </svg>
                              {syncedFundIds.has(fund.id) ? "Synced just now" : `Synced ${fund.portalLastSynced}`} &nbsp;·&nbsp; {program.portal}
                              <button
                                onClick={() => handleSync(fund.id)}
                                disabled={!!syncingFundId}
                                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 disabled:opacity-40 transition-colors font-medium ml-1"
                              >
                                <svg className={`w-3 h-3 ${syncingFundId === fund.id ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                                {syncingFundId === fund.id ? "Syncing…" : "Sync"}
                              </button>
                            </div>
                            {unsubCount > 0 ? (
                              <span className="text-xs text-blue-400 font-semibold">
                                {unsubCount} claim{unsubCount > 1 ? "s" : ""} ready to submit →
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-500 font-medium">Queue clear ✓</span>
                            )}
                          </div>

                        </div>
                      );
                    })()}
                  </div>
                );
              })}
              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-sm">No active fund periods.</div>
              )}
            </div>

            {/* Closed periods */}
            {pastDeadline.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Closed Periods</div>
                {pastDeadline.map((fund) => {
                  const rt         = ROOFTOPS.find((r) => r.id === fund.rooftopId)!;
                  const claimedPct = Math.round((fund.claimedYTD / fund.accruedBalance) * 100);
                  const pendingPct = Math.min(100 - claimedPct, Math.round((fund.pendingClaims / fund.accruedBalance) * 100));
                  return (
                    <div key={fund.id} className="bg-[#22242c] border border-white/5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex flex-col md:flex-row overflow-hidden opacity-55">
                      <div className="hidden md:flex w-20 shrink-0 bg-black/20 items-center justify-center border-r border-white/5 opacity-50">
                        <BrandMark brand={rt.brand} size={38} />
                      </div>
                      <div className="flex-1 min-w-0 px-4 md:px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5 md:hidden opacity-50">
                              <BrandMark brand={rt.brand} size={18} />
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{rt.brand}</span>
                            </div>
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
                            <div className="text-xl font-bold text-slate-500">{fmt(fund.availableBalance)}</div>
                            <div className="text-xs text-slate-600 mt-0.5">unclaimed</div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-white/5 px-4 md:px-5 py-3 md:py-4 flex items-center md:flex-col md:justify-center md:w-64 gap-4">
                        <div className="flex gap-4 md:gap-5">
                          <div>
                            <div className="text-xs text-slate-600 mb-0.5">Claimed</div>
                            <div className="text-sm font-bold text-slate-500">{fmt(fund.claimedYTD)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600 mb-0.5">Submitted</div>
                            <div className="text-sm font-bold text-slate-500">{fmt(fund.pendingClaims)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600 mb-0.5">Accrued</div>
                            <div className="text-sm font-bold text-slate-500">{fmt(fund.accruedBalance)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Rooftop summary table */}
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rooftop Summary</h2>
            <div className="bg-[#22242c] rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border border-white/8 overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="border-b border-white/8">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rooftop</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Brand</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accrued</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Claimed</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Deadline</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rooftopRollup.map(({ rt, accrued, claimed, available, soonestDeadline, readyToSubmit, pastDeadlineCount }) => {
                    const urgency = soonestDeadline ? expiryUrgency(soonestDeadline.daysUntilExpiry) : "healthy";
                    const uMeta   = URGENCY_META[urgency];
                    return (
                      <tr key={rt.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {rt.name}
                          {rt.pilot && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-semibold">PILOT</span>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <BrandMark brand={rt.brand} size={22} />
                            <span className="text-slate-500 text-xs">{rt.brand}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{fmt(accrued)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-400">{fmt(claimed)}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">{fmt(available)}</td>
                        <td className="px-4 py-3 text-center">
                          {soonestDeadline ? (
                            <span className={`text-xs font-semibold ${uMeta.color}`}>
                              {soonestDeadline.daysUntilExpiry}d · {soonestDeadline.expiryDate}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {readyToSubmit > 0 && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                                {readyToSubmit} to submit
                              </span>
                            )}
                            {pastDeadlineCount > 0 && (
                              <span className="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                                {pastDeadlineCount} past deadline
                              </span>
                            )}
                            {readyToSubmit === 0 && pastDeadlineCount === 0 && (
                              <span className="text-emerald-500 text-sm">✓</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Claim log */}
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Claim Log</h2>
            <div className="bg-[#22242c] rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border border-white/8 overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead className="border-b border-white/8">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ref</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rooftop</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {claims
                    .filter((c) => visibleRooftops.some((r) => r.id === c.rooftopId))
                    .map((claim) => {
                      const rt = ROOFTOPS.find((r) => r.id === claim.rooftopId)!;
                      return (
                        <tr key={claim.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{claim.oemReference ?? claim.id}</td>
                          <td className="px-4 py-2.5 text-slate-400">{rt.name}</td>
                          <td className="px-4 py-2.5 text-slate-200 font-medium">{claim.activity}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-300">{fmt(claim.eligibleAmount)}</td>
                          <td className="px-4 py-2.5 text-center"><StatusBadge status={claim.status} /></td>
                          <td className="px-4 py-2.5 text-center text-xs text-slate-500">{claim.submissionDeadline}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Deadline Calendar */}
      {showCalendar && <DeadlineCalendar fundRecords={fundRecords} onClose={() => setShowCalendar(false)} />}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#22242c] border border-emerald-500/30 text-emerald-300 text-sm font-medium px-5 py-3 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none shadow-xl">
          {toastMsg}
        </div>
      )}

      {/* Edit Agreement Modal */}
      {editFund && (() => {
        const rt      = ROOFTOPS.find((r) => r.id === editFund.rooftopId)!;
        const program = OEM_PROGRAMS.find((p) => p.id === editFund.programId)!;
        return (
          <EditAgreementModal
            fund={editFund}
            brand={rt.brand}
            rooftopName={rt.name}
            programName={program.name}
            portal={program.portal}
            onClose={() => setEditFund(null)}
            onSave={handleAgreementSave}
          />
        );
      })()}
    </div>
  );
}
