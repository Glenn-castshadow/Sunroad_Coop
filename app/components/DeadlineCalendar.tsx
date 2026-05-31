"use client";
import { useState } from "react";
import { FUND_RECORDS, ROOFTOPS, OEM_PROGRAMS, type FundRecord } from "@/app/data/mockData";
import BrandMark from "./BrandMark";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_ABBR    = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const TODAY_STR   = "2026-05-31";

interface Props {
  fundRecords?: FundRecord[];
  onClose: () => void;
}

export default function DeadlineCalendar({ fundRecords = FUND_RECORDS, onClose }: Props) {
  // Default to June 2026 — most deadlines land here
  const [year,  setYear]  = useState(2026);
  const [month, setMonth] = useState(5);
  const [selected, setSelected] = useState<string | null>("2026-06-30");

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelected(null);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow    = new Date(year, month, 1).getDay();
  const cells       = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const deadlineMap = fundRecords.reduce<Record<string, FundRecord[]>>((map, fund) => {
    map[fund.expiryDate] = [...(map[fund.expiryDate] ?? []), fund];
    return map;
  }, {});

  const selectedFunds = selected ? (deadlineMap[selected] ?? []) : [];

  // Total upcoming deadlines this month
  const monthDeadlines = Object.entries(deadlineMap)
    .filter(([d]) => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
    .flatMap(([, funds]) => funds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#1e2028] border border-white/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-[#22242c] border-b border-white/8 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white">Deadline Calendar</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All active fund periods across rooftops
              {monthDeadlines.length > 0 && (
                <> · <span className="text-amber-400">{monthDeadlines.length} deadline{monthDeadlines.length > 1 ? "s" : ""} this month</span></>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Calendar grid ── */}
          <div className="flex-1 min-w-0 p-5 flex flex-col overflow-y-auto">

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-sm font-bold text-white">{MONTH_NAMES[month]} {year}</span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_ABBR.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-slate-600 uppercase py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5 flex-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />;
                const dateStr     = isoDate(year, month, day);
                const funds       = deadlineMap[dateStr] ?? [];
                const isToday     = dateStr === TODAY_STR;
                const isPast      = dateStr < TODAY_STR;
                const isSelected  = dateStr === selected;
                const hasDeadline = funds.length > 0;

                // Urgency of earliest deadline on this date
                const maxUrgency  = funds.reduce((acc, f) => {
                  if (f.daysUntilExpiry <= 0)  return acc === "critical" ? acc : "past";
                  if (f.daysUntilExpiry <= 30)  return "critical";
                  if (f.daysUntilExpiry <= 60 && acc !== "critical") return "warning";
                  return acc;
                }, "healthy" as "past" | "critical" | "warning" | "healthy");

                return (
                  <button
                    key={dateStr}
                    disabled={!hasDeadline}
                    onClick={() => setSelected(isSelected ? null : dateStr)}
                    className={`relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded transition-colors ${
                      isSelected
                        ? "bg-blue-500/20 border border-blue-500/40"
                        : hasDeadline
                        ? "hover:bg-white/8 cursor-pointer border border-transparent"
                        : "cursor-default border border-transparent"
                    } ${isPast && !hasDeadline ? "opacity-25" : ""}`}
                  >
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                      isToday     ? "bg-blue-500 text-white font-bold" :
                      isSelected  ? "text-blue-300 font-semibold" :
                      isPast      ? "text-slate-600" :
                                    "text-slate-400"
                    }`}>{day}</span>

                    {hasDeadline && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                        {funds.slice(0, 4).map((f, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                            f.daysUntilExpiry <= 0  ? "bg-white/15"  :
                            f.daysUntilExpiry <= 30  ? "bg-amber-400" :
                            f.daysUntilExpiry <= 60  ? "bg-white/35"  :
                                                       "bg-white/20"
                          }`} />
                        ))}
                        {funds.length > 4 && (
                          <span className="text-[8px] text-slate-600 leading-none mt-px">+{funds.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Urgency ring on deadline days */}
                    {hasDeadline && !isSelected && (
                      <div className={`absolute inset-0 rounded pointer-events-none border ${
                        maxUrgency === "critical" ? "border-amber-500/30" :
                        maxUrgency === "warning"  ? "border-white/12"     :
                        maxUrgency === "past"     ? "border-white/5"      :
                                                    "border-white/8"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-3 border-t border-white/8 text-[10px] text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>≤30 days</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/35 inline-block"/>≤60 days</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20 inline-block"/>On track</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/12 inline-block"/>Closed</span>
            </div>
          </div>

          {/* ── Detail panel ── */}
          <div className="w-64 shrink-0 bg-[#1a1c23] border-l border-white/8 overflow-y-auto">
            {selected ? (
              <div className="p-4">
                <div className="text-xs font-semibold text-slate-400 mb-3">
                  {new Date(selected + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short", month: "long", day: "numeric", year: "numeric",
                  })}
                </div>
                {selectedFunds.length === 0 ? (
                  <div className="text-xs text-slate-600 italic">No deadlines on this date.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedFunds.map((f) => {
                      const rt      = ROOFTOPS.find((r) => r.id === f.rooftopId)!;
                      const program = OEM_PROGRAMS.find((p) => p.id === f.programId)!;
                      const urgency = f.daysUntilExpiry <= 0  ? "past"     :
                                      f.daysUntilExpiry <= 30  ? "critical" :
                                      f.daysUntilExpiry <= 60  ? "warning"  : "healthy";
                      return (
                        <div key={f.id} className={`rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border p-3 ${
                          urgency === "critical" ? "border-amber-500/30 bg-amber-500/5" :
                          urgency === "warning"  ? "border-white/8 bg-white/[0.02]"    :
                          urgency === "past"     ? "border-white/5 bg-white/[0.015] opacity-60" :
                                                   "border-white/8 bg-white/[0.02]"
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5 min-w-0">
                            <BrandMark brand={rt.brand} size={16} className="shrink-0" />
                            <span className="text-xs font-semibold text-slate-200 truncate">{rt.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mb-2">
                            {f.periodLabel} · {program.portal}
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`font-semibold ${
                              urgency === "past"     ? "text-slate-500" :
                              urgency === "critical" ? "text-amber-400" :
                              urgency === "warning"  ? "text-slate-400" : "text-slate-500"
                            }`}>
                              {f.daysUntilExpiry > 0 ? `${f.daysUntilExpiry}d remaining` : "Closed"}
                            </span>
                            <span className="text-blue-400 font-semibold">{fmt(f.availableBalance)}</span>
                          </div>
                          <div className="text-[9px] text-slate-600 text-right mt-0.5">available</div>
                          {/* Mini utilization bar */}
                          <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="bg-blue-500 h-full"
                              style={{ width: `${Math.round((f.claimedYTD / f.accruedBalance) * 100)}%` }}/>
                            <div className="bg-white/20 h-full"
                              style={{ width: `${Math.min(100 - Math.round((f.claimedYTD / f.accruedBalance) * 100), Math.round((f.pendingClaims / f.accruedBalance) * 100))}%` }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 pt-12 text-center">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="text-xs text-slate-600">Select a date with a deadline dot to see details</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
