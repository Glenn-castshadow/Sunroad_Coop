// ─── ROOFTOPS ────────────────────────────────────────────────────────────────
// 10 in-scope franchise rooftops. Pilot: Kearny Mesa Kia.
// Excluded: BMW of Chula Vista Motorrad, Sunroad Auto Collision Center, VinFast San Diego.
// BMW has two rooftops (El Cajon + Chula Vista) under one OEM program = 10 stores / 9 programs.
export const ROOFTOPS = [
  { id: "SR-KIA-KM",   name: "Kearny Mesa Kia",       brand: "Kia",       region: "Kearny Mesa", pilot: true  },
  { id: "SR-BMW-EC",   name: "BMW of El Cajon",        brand: "BMW",       region: "East County",  pilot: false },
  { id: "SR-BMW-CV",   name: "BMW of Chula Vista",     brand: "BMW",       region: "South Bay",    pilot: false },
  { id: "SR-FOR-KM",   name: "Kearny Mesa Ford",       brand: "Ford",      region: "Kearny Mesa",  pilot: false },
  { id: "SR-HYU-KM",   name: "Kearny Mesa Hyundai",   brand: "Hyundai",   region: "Kearny Mesa",  pilot: false },
  { id: "SR-SUB-KM",   name: "Kearny Mesa Subaru",    brand: "Subaru",    region: "Kearny Mesa",  pilot: false },
  { id: "SR-TOY-CV",   name: "Toyota Chula Vista",    brand: "Toyota",    region: "South Bay",    pilot: false },
  { id: "SR-CHE-KM",   name: "Kearny Mesa Chevrolet", brand: "Chevrolet", region: "Kearny Mesa",  pilot: false },
  { id: "SR-CDJ-KM",   name: "Kearny Mesa CDJR",      brand: "CDJR",      region: "Kearny Mesa",  pilot: false },
  { id: "SR-HON-PAC",  name: "Pacific Honda",          brand: "Honda",     region: "Pacific Beach", pilot: false },
];

// ─── OEM PROGRAMS ─────────────────────────────────────────────────────────────
// 9 OEM programs. BMW covers both El Cajon and Chula Vista stores.
// Kia: DAS portal. Co-op mechanics vary by brand — rules layer must be per-brand.
// Canonical deadline pattern: December wholesale funds expire April 30, no carryover.
export const OEM_PROGRAMS = [
  { id: "KIA-COOP-2025", brand: "Kia",       name: "Kia Co-op Advertising",           portal: "DAS",         pilot: true  },
  { id: "BMW-COOP-2025", brand: "BMW",       name: "BMW Co-op Program",               portal: "BMW NA",      pilot: false },
  { id: "FOR-COOP-2025", brand: "Ford",      name: "Ford Dealer Advertising Fund",    portal: "FordDirect",  pilot: false },
  { id: "HYU-COOP-2025", brand: "Hyundai",   name: "Hyundai Co-op Advertising",       portal: "Hyundai",     pilot: false },
  { id: "SUB-COOP-2025", brand: "Subaru",    name: "Subaru Co-op Advertising",        portal: "Subaru",      pilot: false },
  { id: "TOY-COOP-2025", brand: "Toyota",    name: "Toyota Dealer Advertising Assoc", portal: "Toyota",      pilot: false },
  { id: "CHE-COOP-2025", brand: "Chevrolet", name: "GM Dealer Advertising Fund",      portal: "GM Marketing",pilot: false },
  { id: "CDJ-COOP-2025", brand: "CDJR",      name: "Stellantis Co-op Program",        portal: "Stellantis",  pilot: false },
  { id: "HON-COOP-2025", brand: "Honda",     name: "Honda Dealer Co-op",              portal: "Honda",       pilot: false },
];

// ─── FUND RECORDS ─────────────────────────────────────────────────────────────
// Per rooftop/brand. Urgency is driven by days-until-expiry, NOT balance size.
// Canonical case: large balance + near deadline = highest alert.
export interface FundRecord {
  id: string;
  rooftopId: string;
  programId: string;
  periodLabel: string;       // e.g. "H2 2025" or "Q1 2026"
  accrualRate: number;       // $ per vehicle wholesaled
  accruedBalance: number;    // total accrued this period
  claimedYTD: number;        // approved + paid claims
  pendingClaims: number;     // submitted but not yet approved
  availableBalance: number;  // accrued - claimed - pending
  expiryDate: string;        // ISO date — the hard deadline
  daysUntilExpiry: number;
  portalLastSynced: string;  // when OEM export was last pulled
  // Agreement settings — editable by director, internal to this tool
  matchRequirement?: "100" | "75-25" | "50-50"; // OEM reimbursement structure
  eligibleActivities?: string[];                 // approved media types under this program
  internalNotes?: string;                        // special terms, exceptions, reminders
}

// Days-until-expiry urgency thresholds
export function expiryUrgency(days: number): "critical" | "warning" | "healthy" {
  if (days <= 30)  return "critical";
  if (days <= 60)  return "warning";
  return "healthy";
}

export const FUND_RECORDS: FundRecord[] = [
  // ── Kearny Mesa Kia — DAS portal ──────────────────────────────────────────
  // H2 2025: December wholesale funds expired April 30 — canonical missed-deadline case
  {
    id: "F-KIA-KM-H2",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025",
    periodLabel: "H2 2025",
    accrualRate: 75,
    accruedBalance: 42800,
    claimedYTD: 18500,
    pendingClaims: 7200,
    availableBalance: 17100,
    expiryDate: "2026-04-30",
    daysUntilExpiry: -31,
    portalLastSynced: "2026-05-28",
    matchRequirement: "100",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "TV / Broadcast", "Radio", "Direct Mail"],
    internalNotes: "H2 2025 closed period. April 30 deadline was missed — $17,100 unclaimed. No carryover under Kia DAS rules.",
  },
  {
    id: "F-KIA-KM-Q1",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 75,
    accruedBalance: 19400,
    claimedYTD: 3500,
    pendingClaims: 4800,
    availableBalance: 11100,
    expiryDate: "2026-07-31",
    daysUntilExpiry: 61,
    portalLastSynced: "2026-05-28",
    matchRequirement: "100",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "TV / Broadcast", "Radio", "Direct Mail"],
    internalNotes: "",
  },
  // ── BMW of El Cajon ───────────────────────────────────────────────────────
  {
    id: "F-BMW-EC-Q1",
    rooftopId: "SR-BMW-EC", programId: "BMW-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 150,
    accruedBalance: 38000,
    claimedYTD: 12000,
    pendingClaims: 8400,
    availableBalance: 17600,
    expiryDate: "2026-06-30",
    daysUntilExpiry: 30,
    portalLastSynced: "2026-05-25",
    matchRequirement: "50-50",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "Print", "OOH / Billboard", "Events / Sponsorship"],
    internalNotes: "BMW 50/50 co-op: dealer matches OEM dollar-for-dollar. Max claim $25K per quarter per BMW NA guidelines.",
  },
  // ── BMW of Chula Vista ────────────────────────────────────────────────────
  {
    id: "F-BMW-CV-Q1",
    rooftopId: "SR-BMW-CV", programId: "BMW-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 150,
    accruedBalance: 29500,
    claimedYTD: 8200,
    pendingClaims: 0,
    availableBalance: 21300,
    expiryDate: "2026-06-30",
    daysUntilExpiry: 30,
    portalLastSynced: "2026-05-25",
    matchRequirement: "50-50",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "Print", "OOH / Billboard", "Events / Sponsorship"],
    internalNotes: "BMW 50/50 co-op: dealer matches OEM dollar-for-dollar. Max claim $25K per quarter per BMW NA guidelines.",
  },
  // ── Kearny Mesa Ford ──────────────────────────────────────────────────────
  {
    id: "F-FOR-KM-Q1",
    rooftopId: "SR-FOR-KM", programId: "FOR-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 70,
    accruedBalance: 22400,
    claimedYTD: 10300,
    pendingClaims: 0,
    availableBalance: 12100,
    expiryDate: "2026-09-30",
    daysUntilExpiry: 122,
    portalLastSynced: "2026-05-18",
    matchRequirement: "75-25",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "TV / Broadcast", "Radio", "Print"],
    internalNotes: "FordDirect 75/25 structure: dealer funds 25% of each claim. Itemized receipts required for all submissions.",
  },
  // ── Kearny Mesa Hyundai ───────────────────────────────────────────────────
  {
    id: "F-HYU-KM-Q1",
    rooftopId: "SR-HYU-KM", programId: "HYU-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 65,
    accruedBalance: 18600,
    claimedYTD: 9600,
    pendingClaims: 3400,
    availableBalance: 5600,
    expiryDate: "2026-07-31",
    daysUntilExpiry: 61,
    portalLastSynced: "2026-05-26",
    matchRequirement: "100",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "TV / Broadcast", "Radio", "Direct Mail"],
    internalNotes: "",
  },
  // ── Kearny Mesa Subaru ────────────────────────────────────────────────────
  {
    id: "F-SUB-KM-Q1",
    rooftopId: "SR-SUB-KM", programId: "SUB-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 60,
    accruedBalance: 16200,
    claimedYTD: 4800,
    pendingClaims: 0,
    availableBalance: 11400,
    expiryDate: "2026-06-30",
    daysUntilExpiry: 30,
    portalLastSynced: "2026-05-20",
    matchRequirement: "50-50",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "Print", "Events / Sponsorship"],
    internalNotes: "Subaru 50/50. Event/sponsorship eligible only if co-branded with Subaru marks — confirm with SOA rep before filing.",
  },
  // ── Toyota Chula Vista ────────────────────────────────────────────────────
  {
    id: "F-TOY-CV-Q1",
    rooftopId: "SR-TOY-CV", programId: "TOY-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 80,
    accruedBalance: 31200,
    claimedYTD: 22000,
    pendingClaims: 7800,
    availableBalance: 1400,
    expiryDate: "2026-06-30",
    daysUntilExpiry: 30,
    portalLastSynced: "2026-05-29",
    matchRequirement: "100",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "TV / Broadcast", "Radio", "OOH / Billboard", "Direct Mail"],
    internalNotes: "TDAA funds Toyota-brand activities only. No cross-brand or collision center spend eligible.",
  },
  // ── Kearny Mesa Chevrolet ─────────────────────────────────────────────────
  {
    id: "F-CHE-KM-Q1",
    rooftopId: "SR-CHE-KM", programId: "CHE-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 85,
    accruedBalance: 24600,
    claimedYTD: 6100,
    pendingClaims: 9200,
    availableBalance: 9300,
    expiryDate: "2026-07-15",
    daysUntilExpiry: 45,
    portalLastSynced: "2026-05-22",
    matchRequirement: "50-50",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "TV / Broadcast", "Radio", "OOH / Billboard", "Direct Mail", "Print"],
    internalNotes: "GM Marketing 50/50. Silverado and EV models have separate allocation buckets in portal — file under correct model line.",
  },
  // ── Kearny Mesa CDJR ──────────────────────────────────────────────────────
  {
    id: "F-CDJ-KM-Q1",
    rooftopId: "SR-CDJ-KM", programId: "CDJ-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 90,
    accruedBalance: 33800,
    claimedYTD: 0,
    pendingClaims: 18200,
    availableBalance: 15600,
    expiryDate: "2026-06-30",
    daysUntilExpiry: 30,
    portalLastSynced: "2026-05-24",
    matchRequirement: "100",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "TV / Broadcast", "Radio", "OOH / Billboard"],
    internalNotes: "Stellantis 100% funded. Ram and Jeep activities are tracked separately in portal — submit under correct nameplate.",
  },
  // ── Pacific Honda ─────────────────────────────────────────────────────────
  {
    id: "F-HON-PAC-Q1",
    rooftopId: "SR-HON-PAC", programId: "HON-COOP-2025",
    periodLabel: "Q1 2026",
    accrualRate: 50,
    accruedBalance: 12400,
    claimedYTD: 7000,
    pendingClaims: 2800,
    availableBalance: 2600,
    expiryDate: "2026-08-31",
    daysUntilExpiry: 92,
    portalLastSynced: "2026-05-20",
    matchRequirement: "100",
    eligibleActivities: ["Digital — Search/Display", "Digital Video", "Social Media", "Radio", "Direct Mail"],
    internalNotes: "",
  },
];

// ─── CLAIMS ──────────────────────────────────────────────────────────────────
// Status per spec: unsubmitted | pending | approved | paid | expired
// Source: media buyer reconciliations — tool does NOT determine eligibility.
// Tool sits between reconciliation receipt and OEM submission.
export type ClaimStatus = "unsubmitted" | "pending" | "approved" | "paid" | "expired";

export interface Claim {
  id: string;
  rooftopId: string;
  programId: string;
  fundRecordId: string;
  activity: string;
  eligibleAmount: number;     // from media buyer reconciliation
  reconciliationDate: string; // when media buyer delivered the recon
  submissionDeadline: string; // OEM hard deadline for this claim
  status: ClaimStatus;
  submittedDate?: string;
  approvedDate?: string;
  paidDate?: string;
  oemReference?: string;      // OEM claim # once submitted
  notes?: string;
  docChecks?: Record<string, boolean>; // per-doc checklist state
}

export const CLAIMS: Claim[] = [
  // ── Kearny Mesa Kia (pilot) ───────────────────────────────────────────────
  {
    id: "CLM-001",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025", fundRecordId: "F-KIA-KM-Q1",
    activity: "Digital Video — Google PMax May",
    eligibleAmount: 4800,
    reconciliationDate: "2026-05-20",
    submissionDeadline: "2026-07-31",
    status: "unsubmitted",
  },
  {
    id: "CLM-002",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025", fundRecordId: "F-KIA-KM-Q1",
    activity: "Radio — Memorial Day Weekend",
    eligibleAmount: 7200,
    reconciliationDate: "2026-05-27",
    submissionDeadline: "2026-07-31",
    status: "unsubmitted",
  },
  {
    id: "CLM-003",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025", fundRecordId: "F-KIA-KM-Q1",
    activity: "Meta Retargeting — April",
    eligibleAmount: 2900,
    reconciliationDate: "2026-05-05",
    submissionDeadline: "2026-07-31",
    status: "pending",
    submittedDate: "2026-05-15",
    oemReference: "KIA-DAS-2026-04412",
  },
  {
    id: "CLM-004",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025", fundRecordId: "F-KIA-KM-Q1",
    activity: "Conquest Direct Mail — Spring",
    eligibleAmount: 5600,
    reconciliationDate: "2026-04-18",
    submissionDeadline: "2026-07-31",
    status: "approved",
    submittedDate: "2026-04-25",
    approvedDate: "2026-05-10",
    oemReference: "KIA-DAS-2026-03891",
  },
  // H2 2025 fund — canonical expired deadline case
  {
    id: "CLM-005",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025", fundRecordId: "F-KIA-KM-H2",
    activity: "TV Spot — December Sales Event",
    eligibleAmount: 9500,
    reconciliationDate: "2026-01-10",
    submissionDeadline: "2026-04-30",
    status: "expired",
    notes: "Recon received Jan 10. April 30 deadline missed — no carryover under Kia DAS rules.",
  },
  {
    id: "CLM-006",
    rooftopId: "SR-KIA-KM", programId: "KIA-COOP-2025", fundRecordId: "F-KIA-KM-H2",
    activity: "Digital — Q4 Conquest Campaign",
    eligibleAmount: 6200,
    reconciliationDate: "2026-01-08",
    submissionDeadline: "2026-04-30",
    status: "paid",
    submittedDate: "2026-02-01",
    approvedDate: "2026-02-28",
    paidDate: "2026-03-15",
    oemReference: "KIA-DAS-2026-01204",
  },

  // ── BMW of El Cajon ───────────────────────────────────────────────────────
  {
    id: "CLM-007",
    rooftopId: "SR-BMW-EC", programId: "BMW-COOP-2025", fundRecordId: "F-BMW-EC-Q1",
    activity: "CPO Digital Campaign — May",
    eligibleAmount: 8400,
    reconciliationDate: "2026-05-18",
    submissionDeadline: "2026-06-30",
    status: "unsubmitted",
  },
  {
    id: "CLM-008",
    rooftopId: "SR-BMW-EC", programId: "BMW-COOP-2025", fundRecordId: "F-BMW-EC-Q1",
    activity: "Lifestyle Photography — Spring",
    eligibleAmount: 12000,
    reconciliationDate: "2026-04-15",
    submissionDeadline: "2026-06-30",
    status: "pending",
    submittedDate: "2026-05-01",
    oemReference: "BMW-2026-8812",
  },

  // ── BMW of Chula Vista ────────────────────────────────────────────────────
  {
    id: "CLM-009",
    rooftopId: "SR-BMW-CV", programId: "BMW-COOP-2025", fundRecordId: "F-BMW-CV-Q1",
    activity: "OOH — South Bay Billboard",
    eligibleAmount: 14000,
    reconciliationDate: "2026-05-22",
    submissionDeadline: "2026-06-30",
    status: "unsubmitted",
    notes: "Fund deadline June 30 — 30 days out. No claims submitted yet this period.",
  },

  // ── Kearny Mesa Ford ──────────────────────────────────────────────────────
  {
    id: "CLM-010",
    rooftopId: "SR-FOR-KM", programId: "FOR-COOP-2025", fundRecordId: "F-FOR-KM-Q1",
    activity: "F-150 Lease Event — Spring",
    eligibleAmount: 4500,
    reconciliationDate: "2026-04-20",
    submissionDeadline: "2026-09-30",
    status: "paid",
    submittedDate: "2026-04-28",
    approvedDate: "2026-05-12",
    paidDate: "2026-05-22",
    oemReference: "FOR-2026-9934",
  },
  {
    id: "CLM-011",
    rooftopId: "SR-FOR-KM", programId: "FOR-COOP-2025", fundRecordId: "F-FOR-KM-Q1",
    activity: "Digital Takeover — May",
    eligibleAmount: 5800,
    reconciliationDate: "2026-05-26",
    submissionDeadline: "2026-09-30",
    status: "unsubmitted",
  },

  // ── Kearny Mesa Hyundai ───────────────────────────────────────────────────
  {
    id: "CLM-012",
    rooftopId: "SR-HYU-KM", programId: "HYU-COOP-2025", fundRecordId: "F-HYU-KM-Q1",
    activity: "IONIQ 6 Social Campaign — Q1",
    eligibleAmount: 6200,
    reconciliationDate: "2026-04-22",
    submissionDeadline: "2026-07-31",
    status: "approved",
    submittedDate: "2026-05-01",
    approvedDate: "2026-05-18",
    oemReference: "HYU-2026-2219",
  },
  {
    id: "CLM-013",
    rooftopId: "SR-HYU-KM", programId: "HYU-COOP-2025", fundRecordId: "F-HYU-KM-Q1",
    activity: "Conquest Email — EV Intenders",
    eligibleAmount: 3400,
    reconciliationDate: "2026-05-20",
    submissionDeadline: "2026-07-31",
    status: "unsubmitted",
  },

  // ── Kearny Mesa Subaru ────────────────────────────────────────────────────
  {
    id: "CLM-014",
    rooftopId: "SR-SUB-KM", programId: "SUB-COOP-2025", fundRecordId: "F-SUB-KM-Q1",
    activity: "Outback Spring Drive Event",
    eligibleAmount: 7800,
    reconciliationDate: "2026-05-15",
    submissionDeadline: "2026-06-30",
    status: "unsubmitted",
    notes: "June 30 deadline — 30 days out. No claims filed this period.",
  },

  // ── Toyota Chula Vista ────────────────────────────────────────────────────
  {
    id: "CLM-015",
    rooftopId: "SR-TOY-CV", programId: "TOY-COOP-2025", fundRecordId: "F-TOY-CV-Q1",
    activity: "Tacoma Summer TV Spot",
    eligibleAmount: 22000,
    reconciliationDate: "2026-05-24",
    submissionDeadline: "2026-06-30",
    status: "pending",
    submittedDate: "2026-05-30",
    oemReference: "TOY-2026-7741",
  },

  // ── Kearny Mesa Chevrolet ─────────────────────────────────────────────────
  {
    id: "CLM-016",
    rooftopId: "SR-CHE-KM", programId: "CHE-COOP-2025", fundRecordId: "F-CHE-KM-Q1",
    activity: "Colorado Launch Digital Push",
    eligibleAmount: 9200,
    reconciliationDate: "2026-05-19",
    submissionDeadline: "2026-07-15",
    status: "pending",
    submittedDate: "2026-05-28",
    oemReference: "GM-2026-5503",
  },
  {
    id: "CLM-017",
    rooftopId: "SR-CHE-KM", programId: "CHE-COOP-2025", fundRecordId: "F-CHE-KM-Q1",
    activity: "Silverado Conquest Mailer",
    eligibleAmount: 4800,
    reconciliationDate: "2026-05-25",
    submissionDeadline: "2026-07-15",
    status: "unsubmitted",
  },

  // ── Kearny Mesa CDJR ──────────────────────────────────────────────────────
  {
    id: "CLM-018",
    rooftopId: "SR-CDJ-KM", programId: "CDJ-COOP-2025", fundRecordId: "F-CDJ-KM-Q1",
    activity: "Ram 1500 Lease Push — Digital",
    eligibleAmount: 11000,
    reconciliationDate: "2026-05-20",
    submissionDeadline: "2026-06-30",
    status: "pending",
    submittedDate: "2026-05-28",
    oemReference: "STL-2026-1104",
  },
  {
    id: "CLM-019",
    rooftopId: "SR-CDJ-KM", programId: "CDJ-COOP-2025", fundRecordId: "F-CDJ-KM-Q1",
    activity: "Jeep Wrangler OOH — I-15",
    eligibleAmount: 7200,
    reconciliationDate: "2026-05-27",
    submissionDeadline: "2026-06-30",
    status: "unsubmitted",
    notes: "June 30 deadline — 30 days out. $15.6K available in fund.",
  },

  // ── Pacific Honda ─────────────────────────────────────────────────────────
  {
    id: "CLM-020",
    rooftopId: "SR-HON-PAC", programId: "HON-COOP-2025", fundRecordId: "F-HON-PAC-Q1",
    activity: "Service Lane Retention Mailer",
    eligibleAmount: 2800,
    reconciliationDate: "2026-04-10",
    submissionDeadline: "2026-08-31",
    status: "paid",
    submittedDate: "2026-04-18",
    approvedDate: "2026-05-05",
    paidDate: "2026-05-20",
    oemReference: "HON-2026-3302",
  },
];

// ─── SHARED UTILITIES ────────────────────────────────────────────────────────
// Single source for the mock date anchor — update here when advancing the demo.
export const MOCK_TODAY     = new Date("2026-05-31T00:00:00");
export const MOCK_TODAY_STR = "2026-05-31";

export function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Sidebar rooftop order: pilot(s) first, then the rest alphabetically.
export const NAV_ROOFTOPS = [
  ...ROOFTOPS.filter((r) => r.pilot),
  ...ROOFTOPS.filter((r) => !r.pilot).sort((a, b) => a.name.localeCompare(b.name)),
];

// ─── STATUS META ──────────────────────────────────────────────────────────────
// One accent color (blue) for the active/in-progress state.
// Green only for genuine success (approved). Everything else is neutral.
export const STATUS_META: Record<ClaimStatus, { label: string; color: string; bg: string }> = {
  unsubmitted: { label: "Ready",    color: "text-slate-300",   bg: "bg-white/5 border-white/10" },
  pending:     { label: "At OEM",   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  approved:    { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  paid:        { label: "Paid",     color: "text-slate-500",   bg: "bg-white/[0.03] border-white/8" },
  expired:     { label: "Expired",  color: "text-red-400",     bg: "bg-red-500/8 border-red-500/15" },
};

// ─── URGENCY META ─────────────────────────────────────────────────────────────
// "Healthy" should be the quietest thing on screen — nothing to act on.
// Amber for ≤30d (act soon). Neutral for ≤60d (awareness only).
export const URGENCY_META = {
  critical: { label: "Submit within 30 days", color: "text-amber-400",  bg: "bg-amber-500/8 border-amber-500/20" },
  warning:  { label: "Submit within 60 days", color: "text-slate-400",  bg: "bg-white/5 border-white/8" },
  healthy:  { label: "On track",              color: "text-slate-500",  bg: "bg-white/[0.025] border-white/6" },
};
