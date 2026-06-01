import {
  FUND_RECORDS,
  OEM_PROGRAMS,
  ROOFTOPS,
  MOCK_TODAY,
  type Claim,
  type FundRecord,
} from "@/app/data/mockData";

export type ReadinessState = "ready" | "review" | "blocked" | "watching" | "closed";
export type ExceptionSeverity = "critical" | "warning" | "info";
export type ExceptionKind =
  | "deadline-risk"
  | "past-deadline"
  | "over-balance"
  | "missing-reference"
  | "stale-oem"
  | "approved-unpaid"
  | "closed-balance";

export interface ClaimReadiness {
  state: ReadinessState;
  score: number;
  label: string;
  reason: string;
  blockers: string[];
  warnings: string[];
  actions: string[];
}

export interface ExceptionItem {
  id: string;
  kind: ExceptionKind;
  severity: ExceptionSeverity;
  title: string;
  detail: string;
  action: string;
  rooftopName: string;
  brand: string;
  claim?: Claim;
  fund?: FundRecord;
  days?: number;
  amount?: number;
}

function daysBetween(from: string, to = MOCK_TODAY) {
  return Math.ceil((to.getTime() - new Date(from + "T00:00:00").getTime()) / 86400000);
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr + "T00:00:00").getTime() - MOCK_TODAY.getTime()) / 86400000);
}

function findContext(claim: Claim, funds: FundRecord[]) {
  const fund = funds.find((f) => f.id === claim.fundRecordId);
  const rooftop = ROOFTOPS.find((r) => r.id === claim.rooftopId);
  const program = OEM_PROGRAMS.find((p) => p.id === claim.programId);
  return { fund, rooftop, program };
}

export function getClaimReadiness(claim: Claim, funds: FundRecord[] = FUND_RECORDS): ClaimReadiness {
  const { fund } = findContext(claim, funds);
  const left = daysUntil(claim.submissionDeadline);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const actions: string[] = [];

  if (claim.status === "paid") {
    return {
      state: "closed",
      score: 100,
      label: "Closed",
      reason: "Paid and closed",
      blockers,
      warnings,
      actions: ["No action needed"],
    };
  }

  if (claim.status === "expired" || left < 0 || (fund && fund.daysUntilExpiry <= 0 && claim.status === "unsubmitted")) {
    blockers.push("Prior-period deadline is closed");
    actions.push("Capture recovery note and no-carryover impact");
  }

  if (!claim.activity.trim()) {
    blockers.push("Missing activity description");
    actions.push("Add the activity name from the reconciliation");
  }

  if (!Number.isFinite(claim.eligibleAmount) || claim.eligibleAmount <= 0) {
    blockers.push("Missing eligible amount");
    actions.push("Enter eligible amount");
  }

  if (fund && claim.status === "unsubmitted" && claim.eligibleAmount > fund.availableBalance) {
    blockers.push("Claim is above available fund balance");
    actions.push("Split, resize, or reallocate before submission");
  }

  if (claim.status === "unsubmitted" && left >= 0 && left <= 30) {
    warnings.push(`${left} days left to capture available funds`);
    actions.push("Submit before the fund closes");
  }

  if (claim.status === "pending" && !claim.oemReference) {
    warnings.push("Missing OEM reference");
    actions.push("Paste the portal reference number");
  }

  if (claim.status === "pending" && claim.submittedDate && daysBetween(claim.submittedDate) >= 14) {
    warnings.push(`At OEM for ${daysBetween(claim.submittedDate)} days`);
    actions.push("Refresh portal export or follow up with OEM");
  }

  if (claim.status === "approved" && !claim.paidDate && claim.approvedDate && daysBetween(claim.approvedDate) >= 14) {
    warnings.push(`Approved ${daysBetween(claim.approvedDate)} days ago and not paid`);
    actions.push("Confirm payment status with accounting/OEM");
  }

  if (blockers.length > 0) {
    return {
      state: "blocked",
      score: Math.max(0, 35 - blockers.length * 10),
      label: "Needs Prep",
      reason: blockers[0],
      blockers,
      warnings,
      actions,
    };
  }

  if (warnings.length > 0) {
    return {
      state: claim.status === "unsubmitted" ? "review" : "watching",
      score: claim.status === "unsubmitted" ? 72 : 82,
      label: claim.status === "unsubmitted" ? "Needs Review" : "Watching",
      reason: warnings[0],
      blockers,
      warnings,
      actions,
    };
  }

  if (claim.status === "unsubmitted") {
    return {
      state: "ready",
      score: 94,
      label: "Ready",
      reason: "Clear to submit",
      blockers,
      warnings,
      actions: ["Submit to OEM portal"],
    };
  }

  return {
    state: "ready",
    score: 90,
    label: "On Track",
    reason: "No opportunity flags detected",
    blockers,
    warnings,
    actions: ["No action needed"],
  };
}

function makeClaimException(
  claim: Claim,
  kind: ExceptionKind,
  severity: ExceptionSeverity,
  title: string,
  detail: string,
  action: string,
  funds: FundRecord[],
  days?: number,
): ExceptionItem {
  const { fund, rooftop } = findContext(claim, funds);
  return {
    id: `${claim.id}-${kind}`,
    kind,
    severity,
    title,
    detail,
    action,
    rooftopName: rooftop?.name ?? "Unknown rooftop",
    brand: rooftop?.brand ?? "Unknown",
    claim,
    fund,
    days,
    amount: claim.eligibleAmount,
  };
}

export function getExceptionItems(claims: Claim[], funds: FundRecord[] = FUND_RECORDS): ExceptionItem[] {
  const items: ExceptionItem[] = [];

  claims.forEach((claim) => {
    const { fund } = findContext(claim, funds);
    const left = daysUntil(claim.submissionDeadline);

    if (claim.status === "expired" || left < 0) {
      items.push(makeClaimException(
        claim,
        "past-deadline",
        "critical",
        "Prior-period recovery insight",
        `${claim.activity} belongs to a closed ${claim.submissionDeadline} period.`,
        "Capture no-carryover impact and keep the learning visible.",
        funds,
        left,
      ));
      return;
    }

    if (claim.status === "unsubmitted" && left <= 30) {
      items.push(makeClaimException(
        claim,
        "deadline-risk",
        "critical",
        "Near-term capture opportunity",
        `${claim.activity} has ${left} days left to capture co-op funds.`,
        "Submit or assign an owner today.",
        funds,
        left,
      ));
    }

    if (fund && claim.status === "unsubmitted" && claim.eligibleAmount > fund.availableBalance) {
      items.push(makeClaimException(
        claim,
        "over-balance",
        "critical",
        "Funding fit opportunity",
        `${claim.activity} is above the remaining fund balance.`,
        "Split, resize, or reallocate the claim before submission.",
        funds,
        left,
      ));
    }

    if (claim.status === "pending" && !claim.oemReference) {
      items.push(makeClaimException(
        claim,
        "missing-reference",
        "warning",
        "Reference capture opportunity",
        `${claim.activity} is at OEM without a portal reference.`,
        "Add the portal reference to make reconciliation smoother.",
        funds,
      ));
    }

    if (claim.status === "pending" && claim.submittedDate) {
      const atOemDays = daysBetween(claim.submittedDate);
      if (atOemDays >= 14) {
        items.push(makeClaimException(
          claim,
          "stale-oem",
          "warning",
          "OEM follow-up opportunity",
          `${claim.activity} has been at OEM for ${atOemDays} days.`,
          "Refresh portal export or follow up to keep momentum.",
          funds,
          atOemDays,
        ));
      }
    }

    if (claim.status === "approved" && !claim.paidDate && claim.approvedDate) {
      const approvedDays = daysBetween(claim.approvedDate);
      if (approvedDays >= 14) {
        items.push(makeClaimException(
          claim,
          "approved-unpaid",
          "warning",
          "Payment follow-up opportunity",
          `${claim.activity} was approved ${approvedDays} days ago.`,
          "Confirm payment timing with accounting or the OEM.",
          funds,
          approvedDays,
        ));
      }
    }
  });

  funds
    .filter((fund) => fund.daysUntilExpiry <= 0 && fund.availableBalance > 0)
    .forEach((fund) => {
      const rooftop = ROOFTOPS.find((r) => r.id === fund.rooftopId);
      items.push({
        id: `${fund.id}-closed-balance`,
        kind: "closed-balance",
        severity: "info",
        title: "Prior-period learning opportunity",
        detail: `${fund.periodLabel} closed with remaining funds.`,
        action: "Include in opportunity-capture reporting.",
        rooftopName: rooftop?.name ?? "Unknown rooftop",
        brand: rooftop?.brand ?? "Unknown",
        fund,
        days: fund.daysUntilExpiry,
        amount: fund.availableBalance,
      });
    });

  const severityRank: Record<ExceptionSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) =>
    severityRank[a.severity] - severityRank[b.severity] ||
    (a.days ?? 999) - (b.days ?? 999) ||
    (b.amount ?? 0) - (a.amount ?? 0)
  );
}

export const READINESS_META: Record<ReadinessState, { label: string; className: string; bar: string }> = {
  ready: {
    label: "Ready",
    className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    bar: "bg-emerald-500",
  },
  review: {
    label: "Review",
    className: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    bar: "bg-amber-500",
  },
  blocked: {
    label: "Needs Prep",
    className: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    bar: "bg-rose-500",
  },
  watching: {
    label: "Watching",
    className: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    bar: "bg-blue-500",
  },
  closed: {
    label: "Closed",
    className: "text-slate-500 bg-white/[0.03] border-white/8",
    bar: "bg-slate-500",
  },
};

export const EXCEPTION_META: Record<ExceptionSeverity, { label: string; className: string; dot: string }> = {
  critical: {
    label: "High Value",
    className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "Next Step",
    className: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    dot: "bg-blue-500",
  },
  info: {
    label: "Info",
    className: "text-slate-400 bg-white/5 border-white/10",
    dot: "bg-slate-500",
  },
};
