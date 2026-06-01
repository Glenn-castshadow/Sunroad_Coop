"use client";
import { useState } from "react";
import { FUND_RECORDS, ROOFTOPS, OEM_PROGRAMS, fmt, MOCK_TODAY_STR, type FundRecord } from "@/app/data/mockData";
import { useClaims } from "@/app/data/sessionStore";
import BrandMark from "./BrandMark";

const MONTH_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TODAY_STR    = MOCK_TODAY_STR;
const TODAY_YEAR   = parseInt(TODAY_STR.slice(0, 4));
const TODAY_MONTH  = parseInt(TODAY_STR.slice(5, 7)) - 1;

const URGENCY_RANK: Record<string, number> = { critical: 4, warning: 3, healthy: 2, past: 1, none: 0 };

function fundUrgency(f: FundRecord): "past" | "critical" | "warning" | "healthy" {
  if (f.daysUntilExpiry <= 0)  return "past";
  if (f.daysUntilExpiry <= 30) return "critical";
  if (f.daysUntilExpiry <= 60) return "warning";
  return "healthy";
}

function maxUrgency(funds: FundRecord[]): "critical" | "warning" | "healthy" | "past" | "none" {
  if (funds.length === 0) return "none";
  return funds.reduce<"past" | "critical" | "warning" | "healthy">((acc, f) => {
    const u = fundUrgency(f);
    return URGENCY_RANK[u] > URGENCY_RANK[acc] ? u : acc;
  }, "past");
}

interface Props {
  fundRecords?: FundRecord[];
  onClose: () => void;
}

export default function DeadlineCalendar({ fundRecords = FUND_RECORDS, onClose }: Props) {
  const [year,           setYear]           = useState(TODAY_YEAR);
  const [selectedMonth,  setSelectedMonth]  = useState<number | null>(null);
  const [claims] = useClaims();

  // "YYYY-MM" → FundRecord[]
  const monthMap = fundRecords.reduce<Record<string, FundRecord[]>>((map, fund) => {
    const key = fund.expiryDate.slice(0, 7);
    map[key] = [...(map[key] ?? []), fund];
    return map;
  }, {});

  function getMonthFunds(m: number): FundRecord[] {
    return monthMap[`${year}-${String(m + 1).padStart(2, "0")}`] ?? [];
  }

  function readyClaimsFor(funds: FundRecord[]) {
    const fundIds = new Set(funds.map((f) => f.id));
    return claims.filter((claim) => fundIds.has(claim.fundRecordId) && claim.status === "unsubmitted");
  }

  function availableFor(funds: FundRecord[]) {
    return funds.reduce((sum, fund) => sum + Math.max(0, fund.availableBalance), 0);
  }

  function pendingFor(funds: FundRecord[]) {
    return funds.reduce((sum, fund) => sum + Math.max(0, fund.pendingClaims), 0);
  }

  function nextActionFor(fund: FundRecord, readyCount: number) {
    if (fund.daysUntilExpiry <= 0) return "Review learning";
    if (readyCount > 0) return "Ready to file";
    if (fund.pendingClaims > 0) return "Follow up";
    if (fund.availableBalance > 0) return "Capture window";
    return "Monitor";
  }

  const selectedFunds = selectedMonth !== null ? getMonthFunds(selectedMonth) : [];
  const byDate        = selectedFunds.reduce<Record<string, FundRecord[]>>((acc, f) => {
    acc[f.expiryDate] = [...(acc[f.expiryDate] ?? []), f];
    return acc;
  }, {});
  const sortedDates = Object.keys(byDate).sort();
  const selectedAvailable = availableFor(selectedFunds);
  const selectedReady = readyClaimsFor(selectedFunds).length;
  const selectedPending = pendingFor(selectedFunds);
  const selectedNextDate = sortedDates.find((date) => date > TODAY_STR) ?? sortedDates[0];
  const selectedNextDateLabel = selectedNextDate
    ? new Date(selectedNextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "this month";
  const selectedRecommendation =
    selectedReady > 0
      ? `File ${selectedReady} ready claim${selectedReady !== 1 ? "s" : ""} before ${selectedNextDateLabel}.`
      : selectedPending > 0
        ? `Follow up on ${fmt(selectedPending)} at OEM before ${selectedNextDateLabel}.`
        : selectedAvailable > 0
          ? `Capture eligible activity against ${fmt(selectedAvailable)} open before ${selectedNextDateLabel}.`
          : "No active recommendation for this month.";
  const topCaptureDate = Object.entries(monthMap)
    .flatMap(([, funds]) => Object.entries(
      funds.reduce<Record<string, FundRecord[]>>((acc, fund) => {
        if (fund.daysUntilExpiry > 0 && fund.availableBalance > 0) {
          acc[fund.expiryDate] = [...(acc[fund.expiryDate] ?? []), fund];
        }
        return acc;
      }, {})
    ))
    .map(([date, funds]) => ({
      date,
      funds,
      available: availableFor(funds),
      ready: readyClaimsFor(funds).length,
      days: Math.min(...funds.map((fund) => fund.daysUntilExpiry)),
    }))
    .sort((a, b) => a.days - b.days || b.available - a.available)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {selectedMonth !== null && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-white">
                {selectedMonth !== null
                  ? `${MONTH_NAMES[selectedMonth]} ${year}`
                  : `Deadline Opportunity Calendar · ${year}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMonth !== null
                  ? `${fmt(selectedAvailable)} open · ${selectedReady} ready to file · ${selectedPending > 0 ? `${fmt(selectedPending)} at OEM` : "no OEM follow-up"}`
                  : "Capture windows, ready claims, and open co-op dollars"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">✕</button>
        </div>

        {/* ── Year grid ── */}
        {selectedMonth === null && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setYear(y => y - 1)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-sm font-bold text-white">{year}</span>
              <button
                onClick={() => setYear(y => y + 1)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            {topCaptureDate && (
              <button
                type="button"
                onClick={() => setSelectedMonth(parseInt(topCaptureDate.date.slice(5, 7)) - 1)}
                className="w-full text-left bg-emerald-500/8 border border-emerald-500/25 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-3 mb-4 hover:bg-emerald-500/12 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Top Capture Window</div>
                    <div className="text-sm font-bold text-slate-100 mt-0.5">
                      {new Date(topCaptureDate.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {fmt(topCaptureDate.available)} open
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {topCaptureDate.ready} ready to file · {topCaptureDate.funds.length} fund{topCaptureDate.funds.length !== 1 ? "s" : ""} in this window
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-emerald-400">{topCaptureDate.days}d</div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">remaining</div>
                  </div>
                </div>
              </button>
            )}

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 12 }, (_, m) => {
                const funds      = getMonthFunds(m);
                const urgency    = maxUrgency(funds);
                const isPast     = year < TODAY_YEAR || (year === TODAY_YEAR && m < TODAY_MONTH);
                const isCurrent  = year === TODAY_YEAR && m === TODAY_MONTH;
                const uniqueDates = [...new Set(funds.map(f => f.expiryDate))].sort();
                const monthAvailable = availableFor(funds);
                const monthReady = readyClaimsFor(funds).length;
                const monthPending = pendingFor(funds);

                const borderCls =
                  urgency === "critical" ? "border-amber-500/50" :
                  urgency === "warning"  ? "border-white/20"     :
                  urgency === "healthy"  ? "border-white/12"     :
                  urgency === "past"     ? "border-white/8"      :
                                          "border-white/8";
                const bgCls =
                  urgency === "critical"             ? "bg-amber-500/5 hover:bg-amber-500/10" :
                  funds.length > 0 && !isPast        ? "bg-white/[0.03] hover:bg-white/[0.06]" :
                  funds.length > 0                   ? "bg-white/[0.02] hover:bg-white/[0.04]" :
                                                       "bg-white/[0.01]";
                return (
                  <button
                    key={m}
                    onClick={funds.length > 0 ? () => setSelectedMonth(m) : undefined}
                    disabled={funds.length === 0}
                    className={`text-left p-3 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border transition-colors ${borderCls} ${bgCls} ${
                      funds.length === 0 ? "cursor-default opacity-35" : "cursor-pointer"
                    }`}
                  >
                    {/* Month name + count */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${
                        isCurrent ? "text-blue-400" :
                        isPast    ? "text-slate-500" :
                                    "text-slate-200"
                      }`}>
                        {MONTH_SHORT[m]}
                      </span>
                      {funds.length > 0 && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          urgency === "critical" ? "bg-amber-500/20 text-amber-400" :
                          urgency === "past"     ? "bg-white/5 text-slate-600"      :
                                                   "bg-white/8 text-slate-400"
                        }`}>
                          {funds.length}
                        </span>
                      )}
                    </div>

                    {/* Month recommendation summary */}
                    {uniqueDates.length > 0 ? (
                      <div className="space-y-2">
                        <div>
                          <div className="text-[13px] font-bold text-slate-100 leading-none">{fmt(monthAvailable)}</div>
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-500 leading-none">
                            <span>{monthReady} ready</span>
                            {monthPending > 0 && <span>{fmt(monthPending)} at OEM</span>}
                          </div>
                        </div>
                        <div className="space-y-1">
                        {uniqueDates.slice(0, 2).map(date => {
                          const dateFunds  = funds.filter(f => f.expiryDate === date);
                          const dayNum     = date.slice(8);
                          const dateUrgency = maxUrgency(dateFunds);
                          return (
                            <div key={date} className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                dateUrgency === "critical" ? "bg-amber-400" :
                                dateUrgency === "past"     ? "bg-white/15"  :
                                                             "bg-white/30"
                              }`} />
                              <span className="text-[10px] text-slate-500 leading-none">
                                {MONTH_SHORT[m]} {dayNum} &nbsp;·&nbsp; {dateFunds.length} fund{dateFunds.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          );
                        })}
                        {uniqueDates.length > 2 && (
                          <div className="text-[9px] text-slate-600 pl-3">+{uniqueDates.length - 2} more windows</div>
                        )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-600">No deadlines</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-3 border-t border-white/8 text-[10px] text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Capture window ≤30d</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/30 inline-block"/>Open window</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/15 inline-block"/>Prior period</span>
            </div>
          </div>
        )}

        {/* ── Month detail view ── */}
        {selectedMonth !== null && (
          <div className="flex-1 overflow-y-auto p-5">
            {selectedFunds.length === 0 ? (
              <div className="text-xs text-slate-600 italic text-center py-8">No deadlines this month.</div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-white/[0.03] border border-white/8 p-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Open</div>
                    <div className="mt-1 text-sm font-bold text-white">{fmt(selectedAvailable)}</div>
                  </div>
                  <div className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-emerald-500/8 border border-emerald-500/20 p-3">
                    <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Ready</div>
                    <div className="mt-1 text-sm font-bold text-white">{selectedReady} claims</div>
                  </div>
                  <div className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-white/[0.03] border border-white/8 p-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">At OEM</div>
                    <div className="mt-1 text-sm font-bold text-white">{fmt(selectedPending)}</div>
                  </div>
                </div>
                <div className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border border-emerald-500/20 bg-emerald-500/8 p-3">
                  <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Recommended Next Step</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">{selectedRecommendation}</div>
                </div>
                {sortedDates.map(date => {
                  const dateFunds = byDate[date];
                  const dayLabel  = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                  });
                  const isClosed = date <= TODAY_STR;
                  return (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{dayLabel}</span>
                        {isClosed && <span className="text-[10px] text-slate-600 italic">Closed</span>}
                      </div>
                      <div className="space-y-2">
                        {dateFunds.map(f => {
                          const rt         = ROOFTOPS.find(r => r.id === f.rooftopId)!;
                          const program    = OEM_PROGRAMS.find(p => p.id === f.programId)!;
                          const urgency    = fundUrgency(f);
                          const readyCount = readyClaimsFor([f]).length;
                          const nextAction = nextActionFor(f, readyCount);
                          const claimedPct = Math.round((f.claimedYTD / f.accruedBalance) * 100);
                          const pendingPct = Math.min(100 - claimedPct, Math.round((f.pendingClaims / f.accruedBalance) * 100));
                          return (
                            <div key={f.id} className={`rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border p-3 ${
                              urgency === "critical" ? "border-amber-500/30 bg-amber-500/5"           :
                              urgency === "past"     ? "border-white/5 bg-white/[0.015] opacity-60"  :
                                                       "border-white/8 bg-white/[0.02]"
                            }`}>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <BrandMark brand={rt.brand} size={18} className="shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-200 truncate">{rt.name}</div>
                                    <div className="text-[10px] text-slate-500">{f.periodLabel} · {program.portal}</div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-sm font-bold text-white">{fmt(f.availableBalance)}</div>
                                  <div className="text-[10px] text-slate-500">available</div>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <div className="text-slate-600 uppercase tracking-wider">Ready</div>
                                  <div className="mt-0.5 font-semibold text-emerald-400">{readyCount}</div>
                                </div>
                                <div>
                                  <div className="text-slate-600 uppercase tracking-wider">At OEM</div>
                                  <div className="mt-0.5 font-semibold text-slate-300">{fmt(f.pendingClaims)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-slate-600 uppercase tracking-wider">Next</div>
                                  <div className={`mt-0.5 font-semibold ${
                                    nextAction === "Ready to file" ? "text-emerald-400" :
                                    nextAction === "Capture window" ? "text-amber-400" :
                                                                     "text-slate-300"
                                  }`}>{nextAction}</div>
                                </div>
                              </div>
                              <div className="mt-2.5 h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                                <div className="bg-yellow-500 h-full" style={{ width: `${claimedPct}%` }}/>
                                <div className="bg-stone-500 h-full"  style={{ width: `${pendingPct}%` }}/>
                              </div>
                              <div className="flex items-center justify-between mt-1.5 text-[10px]">
                                <div className="flex gap-3 text-slate-600">
                                  <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-yellow-500 inline-block"/>Claimed {fmt(f.claimedYTD)}</span>
                                  {f.pendingClaims > 0 && <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-stone-500 inline-block"/>At OEM {fmt(f.pendingClaims)}</span>}
                                </div>
                                <span className={`font-semibold ${
                                  urgency === "past"     ? "text-slate-500" :
                                  urgency === "critical" ? "text-amber-400" :
                                                           "text-slate-400"
                                }`}>
                                  {f.daysUntilExpiry > 0 ? `${f.daysUntilExpiry}d remaining` : "Closed"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
