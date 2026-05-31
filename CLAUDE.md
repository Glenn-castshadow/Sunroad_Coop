# Sunroad Co-op Tool — Project Brief
> Drop this file in the root of your project as `CLAUDE.md`. Claude Code will auto-load it at the start of every session.

---

## What this project is

A standalone co-op fund management and claims facilitation tool for the Sunroad automotive dealer group. This is **not** a marketing dashboard — Sunroad has already built internal tools that cover the broader marketing roll-up. This tool solves the specific co-op problem: tracking accrued funds and turning media buyer reconciliations into submitted OEM claims.

---

## Positioning and tone — critical

**The value proposition is friction reduction, not loss prevention.**

Do not frame this tool — in UI copy, panel labels, status language, or any documentation — as catching missed funds or implying that Sunroad has been letting money expire. That framing is adversarial and positions the tool as a critique of how they currently run their business.

The correct framing: a manual, multi-portal chore becomes one low-effort place to track and file. The win is ease and clarity, not rescue.

Deadlines and expiry dates are still prominent features — they're essential data. But they should be presented as "here's what's coming up, stay ahead easily" rather than "you're at risk of losing this." Status indicators, alert language, and panel copy should all reflect this. No "at risk," no "expiring funds," no urgency language that implies current failure.

---

## Two core jobs

### 1. Fund Tracking (Fund View)
Per rooftop and brand, answer:
- What has accrued?
- What has been claimed?
- What is available?
- What deadlines are coming up?

Data source: OEM portal exports (e.g. Kia's DAS portal). Once-a-week export cadence is acceptable — no real-time feed required.

### 2. Claims Facilitation (Claims View)
The media buying company provides reconciliations that identify eligible spend. This tool:
- Ingests those reconciliations as the authoritative source for eligibility
- Matches eligible spend against available fund balances and OEM deadlines
- Packages claims for submission
- Tracks claim status (pending → approved → paid)

**Important boundary:** The tool does not independently determine co-op eligibility from scratch. The media buyer owns eligibility. The OEM approves and pays. This tool sits in between and removes the manual reconciliation-and-claim-prep work.

---

## Primary users

### Marketing Associate (day-to-day user)
Needs a **task queue view**:
- What reconciliations have arrived that haven't been turned into claims yet?
- What claims are due soon / what funds are expiring?
- Status of submitted claims (pending, approved, paid)
- Available balance per rooftop/brand to avoid over-claiming

### Marketing Director (oversight user)
Needs an **overview/status view**:
- Group-level accrued vs claimed vs available
- Upcoming deadlines across all rooftops in one place
- Which rooftops have pending claims that need attention

The associate's view is the primary design target. The director's view is essentially a rollup of the same data with exception highlighting.

---

## Scope — in scope rooftops

10 franchise rooftops across 9 OEM programs. **Pilot: Kearny Mesa Kia.**

The Kia pilot is the proof-of-concept. If the pattern works for Kia (DAS portal, co-op mechanics, claims workflow), it becomes the skeleton for other brands. Not all brands share Kia's exact DAS mechanics — the rules layer must be per-brand.

**Excluded from all strategy and feasibility work:**
- BMW Motorrad
- Sunroad Auto Collision Center (body shop, no new-vehicle OEM)
- VinFast

---

## Key data model (per rooftop/brand)

**Fund record:**
- Rooftop name
- OEM / brand
- Accrual rate
- Accrued balance (current period)
- Claimed YTD
- Available balance
- Expiry date (soonest)
- Days until expiry

**Claim record:**
- Rooftop
- OEM
- Reconciliation received date
- Eligible amount (from media buyer)
- Claim status: `unsubmitted` | `pending` | `approved` | `paid` | `expired`
- Submission deadline
- OEM claim reference (once submitted)

**Status/visibility logic:**
Deadline proximity drives status color, not dollar amount. A large balance with a distant deadline needs no action. A balance with a near-term deadline is the one to surface prominently — not as an alert of failure, but as a clear "act on this soon" signal.

Example from Kia mechanics: December wholesale funds must be claimed by April 30 with no carryover. That deadline pattern is the canonical case for surfacing upcoming action items.

---

## What has already been built / discussed

- A feasibility brief document was drafted and revised through multiple sessions
- Section 6 was revised away from dashboard framing toward the two-view structure above
- Section 8 (originally said tool is read-only / does not file claims) was flagged as incorrect and needs updating — claims facilitation IS a core function
- A scoped rooftop visualization was built showing the 10 in-scope rooftops grouped by OEM
- A roll-up panel mock was explored showing: available balance, utilization %, soonest expiry, and a status color per rooftop

---

## Current next step

Design and build the mock UI panels for both views using fabricated but realistic Sunroad/Kia data:

1. **Associate task queue panel** — reconciliations pending action, claims by status, upcoming deadlines per rooftop
2. **Director overview panel** — group-level fund status, deadline visibility across rooftops

Start with the associate view. Use React with Tailwind. Mock data should reflect realistic Kia co-op amounts and deadline patterns.

---

## Open questions to resolve during build

- What does the reconciliation ingestion UI look like? (File upload? Manual entry? Both?)
- How does the tool handle a rooftop with multiple active fund periods simultaneously?
- Does the director view filter by brand or always show all brands?
- What triggers a claim being marked "at risk" vs just "pending"?

---

## Tech context

- Developer: Glenn (Windows 11, VS Code, Claude Code on Pro/Sonnet)
- Stack: React preferred for UI components
- No live OEM API available — all data sourced from portal exports and media buyer reconciliation files
- This is a feasibility/prototype phase — no production deployment decisions made yet
