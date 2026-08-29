# TrustHire — Workflow & System Requirements Document

**Hackathon Tracks:** Sui Track 01 (Payments & Stablecoins) / Sui Track 02 (AI × Sui) + Gonka Track (AI For Society)
**Tech Stack:** Next.js (frontend + API routes) · Sui Move (smart contracts) · Supabase (off-chain DB) · Gonka Router (AI reasoning API)
**Team Size:** 4
**Deadline:** May 9, 2026

---

## 1. Project Summary

TrustHire is a global freelance marketplace where **AI decides who to trust** and **Sui smart contracts enforce that trust is honored**. Every AI judgment (matching, trust scoring, submission verification) runs through the **Gonka Router** and returns a **Request ID** for auditability. Every payment is **escrowed on Sui via Move contracts** and released automatically per milestone — no platform custody, no manual disputes over "did they get paid."

### Priority Scope for Hackathon (P0 — build first)
1. **AI Matching + Trust Score** (Gonka Router)
2. **Escrow + Milestone Payments** (Sui Move)
3. **zkLogin / sponsored transactions** (UX polish for Sui track judging)

### Deferred / Stretch Scope (P1 — only if time allows)
4. AI Submission Verification (Gonka)
5. Walrus + Seal file storage/integrity
6. On-chain Reputation history

---

## 2. User Roles

| Role | Description |
|---|---|
| **Client** | Posts projects, funds escrow, reviews milestones, releases payment |
| **Freelancer** | Builds profile, receives project recommendations, submits work, gets paid |
| **System (AI Agent)** | Calls Gonka Router to extract requirements, score trust, rank matches |
| **Smart Contract (Move)** | Holds escrow, enforces milestone release logic, records reputation |

---

## 3. High-Level Architecture

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────────┐
│  Next.js UI │◄──────►│  Next.js API      │◄──────►│  Gonka Router    │
│ (Client &   │        │  Routes (server)  │        │  (AI reasoning,  │
│ Freelancer) │        │                   │        │  Request IDs)    │
└─────────────┘        └────────┬──────────┘        └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼                         ▼
            ┌───────────────┐        ┌──────────────────┐
            │   Supabase     │        │   Sui Blockchain  │
            │ (profiles,     │        │  (Move contracts: │
            │ projects, AI   │        │  escrow, milestone│
            │ score cache)   │        │  release, reputa- │
            │                │        │  tion)            │
            └───────────────┘        └──────────────────┘
```

**Key principle:** Supabase stores *mutable, searchable* data (profiles, project listings, cached AI scores for fast UI). Sui stores *money and trust-critical facts* (escrow balances, milestone approvals, reputation records) that must be tamper-proof.

---

## 4. Core Workflows (Detailed)

### 4.1 Workflow A — Client Posts a Project (AI Hiring Assistant)  — **P1 Priority**

**Goal:** Turn a plain-English project description into structured, actionable project data.

**Steps:**
1. Client logs in (wallet connect / zkLogin — stretch).
2. Client types a free-text project description into a form, e.g. *"I need a landing page built in Next.js with Tailwind, budget around $500, done in 2 weeks."*
3. Frontend sends this text to a Next.js API route: `POST /api/ai/parse-project`.
4. API route calls **Gonka Router** with a structured-extraction prompt, requesting JSON output only.
5. Gonka returns structured fields:
   - `title`
   - `required_skills[]`
   - `estimated_budget`
   - `timeline_days`
   - `suggested_milestones[]` (title, deliverable, % of budget, deadline)
   - `gonka_request_id`
6. API route returns this structured JSON to the frontend.
7. Client reviews the AI-generated fields in an editable form — **can override anything** before confirming.
8. On confirm, frontend calls `POST /api/projects/create`, which:
   - Inserts the project into **Supabase** (`projects` table) with status `open`.
   - Stores the `gonka_request_id` used for the parsing step (for audit trail).
9. Project is now visible in the open-projects pool.

**Data touched:** Supabase `projects` table only at this stage (no on-chain action yet — escrow happens after a freelancer is chosen, see Workflow C).

---

### 4.2 Workflow B — Bidirectional AI Recommendations  — **P0 Priority**

This is two mirrored flows sharing the same Gonka scoring logic.

#### B1. Client → Freelancer Recommendations
1. After a project is created (Workflow A), client visits the project's "Recommended Freelancers" tab.
2. Frontend calls `POST /api/ai/match-freelancers` with `project_id`.
3. API route:
   - Pulls the project's required skills/budget/timeline from Supabase.
   - Pulls a candidate pool of freelancer profiles from Supabase (filter by skill overlap first to reduce Gonka calls — cheap pre-filter, AI does the fine ranking).
   - Sends candidate profiles + project requirements to **Gonka Router**, asking it to return, per freelancer:
     - `match_score` (0–100)
     - `trust_score` (0–100) — see Workflow B3 below; can be cached and reused rather than recomputed every time
     - `reasoning` (short text explaining the ranking)
     - `gonka_request_id`
4. API route returns a ranked list to the frontend.
5. Frontend displays ranked freelancer cards: name, skills, Match Score, Trust Score, reasoning blurb, "View Profile" / "Invite to Project" button.
6. Client can click **Invite**, which notifies the freelancer (in-app notification / Supabase row insert into `invitations`).

#### B2. Freelancer → Project Recommendations
1. Freelancer completes/updates their profile (skills, bio, portfolio links, past project links).
2. Freelancer visits their "Recommended Projects" dashboard tab.
3. Frontend calls `POST /api/ai/match-projects` with `freelancer_id`.
4. API route:
   - Pulls all `open` status projects from Supabase.
   - Pulls the freelancer's profile.
   - Sends both to **Gonka Router**, requesting per-project `match_score`, `reasoning`, `gonka_request_id`.
5. Returns ranked project list to frontend.
6. Freelancer can click **Apply** → inserts a row into `applications` table (status: `pending`).

#### B3. Trust Score Generation (feeds both B1 and B2)
1. Triggered when a freelancer profile is created/updated, or on a scheduled/cache-expiry basis (avoid recalculating on every single match call).
2. API route `POST /api/ai/trust-score` sends to **Gonka Router**:
   - Profile completeness (fields filled)
   - Portfolio links / descriptions
   - Past project history *on TrustHire* (completed milestones, ratings — pulled from Supabase/Sui reputation once it exists)
   - (Future/stretch: GitHub integration data)
3. Gonka returns:
   - `trust_score` (0–100)
   - `confidence_level`
   - `reasoning_report` (text)
   - `gonka_request_id`
4. Cached in Supabase `freelancer_profiles.trust_score`, `trust_score_reasoning`, `trust_score_request_id`, `trust_score_updated_at`.

**Why cache:** Calling Gonka fresh for trust score on every match request is wasteful and slow. Trust Score is relatively stable; Match Score is recalculated per project since it's context-dependent.

---

### 4.3 Workflow C — Agreement & Escrow Lock (Sui Move) — **P0 Priority**

**Goal:** Once client and freelancer agree to work together, funds move into a trustless, on-chain escrow.

**Steps:**
1. Client selects a freelancer (from invitation acceptance or application approval). Project status → `matched`.
2. Client reviews AI-suggested milestones from Workflow A (can edit: title, deliverable description, % of budget, deadline per milestone).
3. Client confirms milestone breakdown → frontend calls `POST /api/escrow/create`.
4. API route:
   - Prepares a **Programmable Transaction Block (PTB)** that:
     a. Creates a new `EscrowContract` Move object tied to `project_id`, `client_address`, `freelancer_address`.
     b. Transfers the agreed USDC amount (Sui-wrapped USDC / test stablecoin for hackathon) into the contract.
     c. Registers the milestone list on-chain: array of `{ milestone_id, amount, deadline_ts, status }`.
   - (Stretch) Uses a **sponsored transaction** so the client doesn't need gas — improves UX for judging criteria.
5. Client signs the transaction in their wallet (or zkLogin flow — stretch).
6. On-chain confirmation → Move contract emits an `EscrowCreated` event.
7. Frontend listens for the event / polls the transaction result, then updates Supabase `projects.status = 'in_progress'` and stores the `escrow_object_id` + `tx_digest` for reference.

**Move Contract Responsibilities (`escrow.move`):**
- `create_escrow(client, freelancer, milestones, coin<USDC>) -> EscrowContract`
- Funds held in the contract's balance — **not** withdrawable by client or freelancer unilaterally.
- Each milestone tracked with status: `pending → submitted → approved → released` or `disputed`.

---

### 4.4 Workflow D — Milestone Submission & Approval — **P0 Priority (simplified for hackathon)**

**Steps:**
1. Freelancer works on milestone 1, then clicks **Submit Milestone** in the UI.
2. *(Full version, stretch)*: Files uploaded to Walrus, Seal generates integrity proof, hash stored on-chain.
   *(P0 simplified version)*: Freelancer pastes a submission link/description + optional file upload to Supabase storage; a content hash is still recorded on-chain for integrity, but full Walrus/Seal integration is deferred.
3. Frontend calls `POST /api/milestones/submit` → Supabase updates milestone status to `submitted`, stores submission content/link.
4. *(Stretch — Workflow E)*: Gonka verifies submission quality/completeness against original requirements before client sees it.
5. Client reviews the submission in the UI.
6. Client clicks **Approve Milestone** → frontend triggers a Move contract call:
   - `approve_milestone(escrow_object_id, milestone_id)` — signed by client.
7. Move contract:
   - Validates caller is the registered client for that escrow.
   - Marks milestone status `approved`.
   - **Auto-releases** the milestone's locked USDC amount to the freelancer's address in the same transaction.
   - Emits `MilestoneReleased` event.
8. Frontend updates Supabase project/milestone status to `released` and reflects new escrow balance.
9. If all milestones are released → project status → `completed`.

**Dispute path (stretch, not P0):** Client can flag a milestone as `disputed` instead of approving; funds remain locked pending manual review/arbitration logic (out of scope for hackathon demo — mention in docs as future work).

---

### 4.5 Workflow E — AI Submission Verification (P1 / Stretch)

1. On milestone submission, API route `POST /api/ai/verify-submission` sends to Gonka:
   - Original milestone requirement/deliverable description
   - Submitted content (text description, file metadata/summary)
2. Gonka returns `verification_score`, `reasoning_trace`, `suggestions[]`, `gonka_request_id`.
3. Displayed to client alongside the submission as a "second opinion" before they approve — does **not** block approval (client still has final say), just aids decision-making.

---

### 4.6 Workflow F — Reputation (P1 / Stretch)

1. On `MilestoneReleased` / project `completed` events, a Move call records:
   - Completed project count
   - On-time delivery flag
   - Client rating (1–5, submitted post-completion)
2. Stored as an immutable on-chain reputation object tied to the freelancer's address.
3. Feeds back into future Trust Score calculations (Workflow B3) as a real signal instead of just profile completeness.

---

## 5. Data Model (Supabase — off-chain)

| Table | Key Fields |
|---|---|
| `users` | id, wallet_address, role (client/freelancer), created_at |
| `freelancer_profiles` | user_id, skills[], bio, portfolio_links[], trust_score, trust_score_reasoning, trust_score_request_id, trust_score_updated_at |
| `projects` | id, client_id, title, description_raw, required_skills[], budget, timeline_days, status, gonka_parse_request_id, created_at |
| `milestones` | id, project_id, title, deliverable, amount, deadline, status, submission_content, on_chain_milestone_id |
| `invitations` | id, project_id, freelancer_id, status |
| `applications` | id, project_id, freelancer_id, status |
| `ai_match_cache` | project_id, freelancer_id, match_score, reasoning, gonka_request_id, created_at |
| `escrow_refs` | project_id, escrow_object_id (Sui), tx_digest |

## 6. On-Chain Objects (Sui Move)

| Object / Module | Purpose |
|---|---|
| `EscrowContract` | Holds locked USDC, milestone array, client/freelancer addresses, status per milestone |
| `create_escrow()` | Entry function — client funds escrow with agreed milestone breakdown |
| `approve_milestone()` | Entry function — client-only call, releases funds for a specific milestone |
| `ReputationRecord` (stretch) | Per-freelancer object tracking completed projects, ratings, on-time %|

## 7. Gonka Router Integration Points (all must return Request IDs)

| Call | Trigger | Returns |
|---|---|---|
| Parse Project | Client submits project text | structured project JSON + request_id |
| Match Freelancers | Client views recommendations | ranked list + scores + reasoning + request_id |
| Match Projects | Freelancer views recommendations | ranked list + scores + reasoning + request_id |
| Trust Score | Profile create/update | trust_score + confidence + reasoning + request_id |
| Verify Submission (stretch) | Milestone submitted | verification_score + reasoning + request_id |

All `gonka_request_id` values should be stored and displayed somewhere in the UI (even a small "AI Reasoning Log" panel) — this directly satisfies the Gonka track's transparency/verifiability requirement.

---

## 8. Build Priority Roadmap (for the team of 4)

| Priority | Workstream | Suggested Owner |
|---|---|---|
| P0 | Gonka Router integration: parse project, match (both directions), trust score | 1 dev |
| P0 | Sui Move contracts: escrow create + milestone approve/release | 1 dev |
| P0 | Next.js frontend: project posting, recommendation feeds, escrow/milestone UI | 1–2 dev |
| P0 | Supabase schema + API routes wiring everything together | shared |
| P1 | AI submission verification | if time allows |
| P1 | Walrus/Seal file storage | if time allows |
| P1 | Reputation on-chain | if time allows |
| P1 | zkLogin / sponsored transactions (UX polish) | if time allows |

---

## 9. Demo Script (Happy Path — what gets shown live)

1. Client logs in, posts a project in plain English → AI extracts structured details + milestones.
2. Client sees AI-recommended freelancers with Match Score + Trust Score + reasoning.
3. Client invites a freelancer; freelancer accepts.
4. Client funds escrow on Sui (real testnet transaction, shown on explorer).
5. Freelancer submits milestone 1.
6. Client approves → Move contract auto-releases payment → balance updates visible on-chain.
7. (If time) Show freelancer-side view: freelancer profile gets AI-recommended projects independently.
8. Show the Gonka Request IDs used throughout as an "AI audit trail."

---

## 10. Open Questions / Decisions Needed from Team

- [ ] Which stablecoin to use for the demo — real Sui testnet USDC or a mock token?
- [ ] Wallet connection method: standard Sui wallet vs. zkLogin (zkLogin is more impressive for judging but more setup time)
- [ ] Exact Gonka prompt templates for parsing/matching/trust scoring (need to draft and test early — this is the riskiest external dependency)
- [ ] Do we need real-time updates (websocket/polling) for milestone status, or is manual refresh acceptable for demo?
