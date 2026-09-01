# TrustHire — Master Requirements (Frontend Prototype)

**Purpose of this document set:** Build a fully interactive, front-end-only prototype of TrustHire — an AI-matched, blockchain-escrowed freelance marketplace — with dummy data standing in for the AI (Gonka) and blockchain (Sui) layers. This is intended to be read and implemented directly by an AI coding agent (Antigravity).

**Document map:**
| File | Contents |
|---|---|
| `TrustHire_Master_Requirements.md` (this file) | Shared design system, mock data model, simulated AI/on-chain call behavior, shared screens (Landing, Auth, Role Selection), cross-cutting UX rules, scope decisions |
| `TrustHire_Client_Requirements.md` | Every screen a logged-in Client sees, in full detail |
| `TrustHire_Freelancer_Requirements.md` | Every screen a logged-in Freelancer sees, in full detail |

Read this file first — both role files assume the tokens, components, and data shapes defined here.

---

## 1. Product Summary

TrustHire is a freelance marketplace where AI (Gonka Router) matches clients with freelancers and scores trust, and Sui smart contracts escrow payments and release them per milestone. In this prototype:

- **No real AI calls** — every "Gonka" result is simulated with a realistic delay and mock output.
- **No real blockchain** — every "Sui" transaction is simulated with a realistic delay and a mock transaction hash.
- **No real backend** — all data lives in-memory (React state/context) or `localStorage` for session continuity. See §2.

The prototype must still *feel* real: loading states take a believable amount of time, results look plausible, and every interactive element leads somewhere (no dead-end buttons).

---

## 2. Prototype Ground Rules

These apply everywhere in both role documents.

1. **All data is mock.** Define it as typed in-memory objects (§8). Seed the app with enough sample data that every screen has something to show by default — an empty product is a bad demo. Suggested seed volume: 8–12 freelancer profiles, 6–10 projects across different statuses, a handful of invitations/applications/notifications already populated for at least one demo account.
2. **Persistence:** use `localStorage` (or equivalent) to persist state across page refreshes within a browser session, so a live demo doesn't reset if the page reloads. Provide a hidden/dev "Reset Demo Data" action to restore the original seed set.
3. **Simulated AI calls** (parse project, match freelancers, match projects, trust score, verify submission): trigger a loading state of **1.5–3 seconds**, then resolve with a mock result that includes a fake `gonka_request_id` (format: `gonka_req_` + random 8-char alphanumeric). Never resolve instantly — the loading state is part of the product feel.
4. **Simulated on-chain actions** (fund escrow, approve/release milestone, submit milestone content-hash, flag dispute): trigger a pending state of **~2 seconds**, then resolve with a mock transaction hash (format: `0x` + random 12-char hex) and a "View on Sui Explorer" link. The link can point to a real Sui testnet explorer URL pattern (`https://suiscan.xyz/testnet/tx/{hash}`) even though the hash is fake — it should look and behave like a real link, just not resolve to real data.
5. **Occasional simulated failure:** for realism and to exercise the failure states defined in §10, roughly 1 in 10 AI calls and 1 in 15 on-chain actions should randomly resolve as a failure instead of a success, triggering the retry UI. This should be easy to toggle off (e.g. a dev flag) for smooth live demos.
6. **Wallet connect is simulated:** clicking "Connect Wallet" waits ~1 second then sets a mock wallet address (format: `0x` + random 6-char hex + `...` + random 4-char hex, e.g. `0x4f2a91...9a2c`). No real wallet extension integration required.
7. **Single account, both roles, for demo convenience:** a user should be able to hold both Client and Freelancer roles on one account (this is already in scope per the Settings "Also set up as a Client/Freelancer" flow — see role docs). Additionally, provide a lightweight **role switcher** in the top nav whenever an account has both roles, so a live demo can flip between Client view and Freelancer view instantly without logging out.
8. **Every clickable element must lead somewhere.** If a button implies a destination, that destination must exist in one of these three documents. Where the source material referenced something with no defined destination, this document set resolves it explicitly (see §11).

---

## 3. Tech Assumptions

This spec assumes (but does not strictly require) a **Next.js (App Router) + Tailwind CSS** front end, with component patterns compatible with shadcn/ui. Route paths given throughout both role documents follow this convention. If Antigravity's default stack differs, preserve the same screen structure, state shapes, and navigation flow — the stack is a suggestion, the structure is the requirement.

Suggested top-level route groups:
- `/` — Landing, Auth, Role Selection (public/shared)
- `/client/*` — Client screens
- `/freelancer/*` — Freelancer screens
- `/project/[id]/*` — shared project detail routes used differently by each role (see role docs for exact behavior per role)

---

## 4. User Roles

| Role | Description |
|---|---|
| **Client** | Posts projects, reviews AI-recommended and applying freelancers, funds escrow, reviews and approves milestones, rates freelancers |
| **Freelancer** | Builds a profile, receives AI-recommended projects, applies/accepts invitations, submits milestone work, gets paid |

A single logged-in user can hold either or both roles (see §2.7).

---

## 5. Information Architecture Overview

| Area | Defined in |
|---|---|
| Landing Page | §6.1 (this file) |
| Sign Up / Sign In | §6.2 (this file) |
| Role Selection | §6.3 (this file) |
| All Client screens | `TrustHire_Client_Requirements.md` |
| All Freelancer screens | `TrustHire_Freelancer_Requirements.md` |

---

## 6. Shared Screens

### 6.1 Landing Page
- **Route:** `/`
- **Purpose:** Introduce TrustHire to first-time visitors and drive sign-up.
- **Sections, top to bottom:**
  1. Nav bar — logo, links (How it Works / For Clients / For Freelancers), theme toggle, "Sign In" link, gradient "Get Started" button.
  2. Hero — bold headline ("Hire and get hired with AI-verified trust — payments secured on-chain"), subtext, gradient "Get Started" CTA, ghost "See How It Works" button, abstract gradient/network visual.
  3. Trust bar — short stat row ("Escrow secured on Sui" / "Matching powered by Gonka AI" / "$0 platform custody risk").
  4. "How It Works" — 4 step cards: Post a project or build your profile → Get AI-matched with Trust Scores → Funds locked in on-chain escrow → Get paid automatically per milestone.
  5. Dual value-prop — two cards, "For Clients" and "For Freelancers," each with a short CTA into Sign Up.
  6. Feature strip — icons + labels: AI Matching, Trust Scores, Smart Escrow, Milestone Payments, On-chain Reputation.
  7. Footer — logo, nav links, small note on Sui + Gonka.
- **Interactions:** any CTA routes to `/auth` (§6.2). No dummy data needed here.

### 6.2 Sign Up / Sign In
- **Route:** `/auth`
- **Purpose:** Authenticate before role selection. For the prototype, authentication is mocked — no real OAuth or password verification required.
- **Layout:** centered glass card (~420px), animated gradient background, logo above card.
- **Content:** "Continue with Google" button (mock — clicking it immediately signs in a demo user), divider "or", email + password fields with "Continue with Email" button (mock — any non-empty input signs in), toggle link switching between Sign Up / Sign In copy on the same screen.
- **Interactions:**
  - New/first-time mock account → routes to `/role-selection` (§6.3).
  - Returning mock account (has a role already) → routes directly to that role's Dashboard (`/client/dashboard` or `/freelancer/dashboard`; if both roles exist, use the last-active role, defaulting to Client).

### 6.3 Role Selection
- **Route:** `/role-selection`
- **Purpose:** First-time-only screen asking whether the user is joining as a Client or Freelancer.
- **Layout:** centered heading "How will you use TrustHire?", subtext "You can always add the other role later from your settings," two large selectable cards side by side (stack on mobile): "I'm a Client" and "I'm a Freelancer," each with icon + one-line description. Gradient "Continue" button, disabled until one card is selected.
- **Interactions:** selecting Client → routes to `/client/onboarding`. Selecting Freelancer → routes to `/freelancer/onboarding`. This promise ("add the other role later") must be fulfilled by both role docs' Settings screens.

---

## 7. Shared Design System

### 7.1 Color Tokens

| Token | Dark mode | Light mode | Usage |
|---|---|---|---|
| `--bg-base` | `#0B0B12` | `#F7F7FB` | Page background |
| `--surface-glass` | `#151622` @ 8–12% white border | `#FFFFFF` w/ soft shadow | Card surfaces |
| `--brand-start` | `#4DA2FF` | same | Gradient start (Sui blue) |
| `--brand-mid` | `#7B61FF` | same | Gradient mid |
| `--brand-end` | `#2DD4BF` | same | Gradient end |
| `--accent-ai` | `#8B5CF6` | same | Anything AI-generated: match scores, reasoning callouts, "AI Suggested" tags, Gonka Request ID chips |
| `--accent-trust` | `#2DD4BF` / `#10B981` | same | Trust scores, on-chain confirmations, "funds secured," milestone-released |
| `--accent-warning` | `#F59E0B` | same | Pending, awaiting approval, disputes |
| `--text-primary` | near-white | near-black | Primary text |
| `--text-secondary` | `#9CA3AF` | `#6B7280` | Secondary/muted text |

### 7.2 Typography
- Headlines: bold geometric sans (Space Grotesk / Satoshi-style).
- Body: clean grotesk sans (Inter-style).
- Scores, wallet addresses, tx hashes: tabular/mono numerals (JetBrains Mono).

### 7.3 Reusable Components

Implement each of these once and reuse everywhere; role documents reference them by name.

| Component | Spec |
|---|---|
| **Gradient Button** | Pill-shaped, `--brand-start → --brand-mid → --brand-end` fill, subtle glow on hover. Primary CTA everywhere. |
| **Ghost Button** | Outline only, no fill. Secondary actions. |
| **Glass Card** | `rounded-2xl`, translucent surface (`--surface-glass`), soft 1px border. Base container for profiles/projects/milestones. |
| **Score Badge** | Circular progress ring or pill, 0–100. Color-coded: violet (`--accent-ai`) = AI Match Score, teal (`--accent-trust`) = Trust Score, amber (`--accent-warning`) = Verification pending. |
| **AI Reasoning Callout** | Bordered box, violet-tinted background, sparkle icon, 2–3 sentences of AI-generated explanation, mono-font "Gonka Request ID: gonka_req_xxxxxxxx" footer, tap/click to expand a longer reasoning trace (can be 1–2 extra mock paragraphs). |
| **Skill/Filter Chip** | Small rounded pill, neutral background. Used for skills, filters, categories. |
| **Milestone Stepper** | Vertical or horizontal step tracker. States: `pending` (gray) → `submitted` (amber, filled clock) → `changes_requested` (amber outline, pencil icon — distinct from `submitted`) → `approved`/`released` (teal, filled checkmark) → `disputed` (muted red/amber, non-interactive in this prototype). |
| **Wallet/Address Chip** | Mono font, truncated address (`0x4f...9a2c`), small copy-to-clipboard icon. |
| **On-Chain Transaction Card** | Glass card: tx status, amount, from/to, "View on Sui Explorer" link, teal accent when confirmed. |
| **Status Badge** | Generic small pill used for application/invitation/project status. `Pending` = neutral gray, `Accepted`/`Approved` = teal, `Declined` = muted gray-red (not alarming). |
| **Notification Row** | Icon (by type, see §10.4) + short text + timestamp + unread left-accent bar in the relevant color. |
| **Empty State Block** | Centered icon + one-line plain-language explanation + one relevant CTA (or none, if the state is passive — see each screen's spec). |
| **Theme Toggle** | Sun/moon switch, persistent top-right in every authenticated layout. |
| **Nav** | Left sidebar (desktop) with role-specific items (see role docs), collapsing to a bottom tab bar (mobile). Top bar: theme toggle, notification bell (unread-count dot), wallet chip, profile avatar. |

### 7.4 Tone of Microcopy
Confident, plain-language, trust-forward. Explain what's happening ("Your funds are locked and released automatically per milestone") rather than just labeling ("Escrow Active"). Never show a raw error code as the primary message — always a plain-language explanation plus a retry action.

---

## 8. Mock Data Model

Define these as TypeScript interfaces (or equivalent) backing the in-memory/localStorage store. Field names below are the contract both role documents rely on.

```ts
type UserRole = 'client' | 'freelancer';

interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];        // can hold both
  walletAddress?: string;   // set once "Connect Wallet" is simulated
  avatarUrl?: string;
}

interface ClientProfile {
  userId: string;
  companyName?: string;
  bio?: string;
  hiringCategories: string[];   // e.g. ['Web Development', 'Design']
  typicalBudgetRange?: '<500' | '500-2k' | '2k-10k' | '10k+';
}

interface FreelancerProfile {
  userId: string;
  headline: string;
  bio: string;
  skills: string[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Expert';
  portfolioLinks: { title: string; url: string }[];
  trustScore: number;                // 0-100
  trustScoreConfidence: 'Low' | 'Medium' | 'High';
  trustScoreReasoning: { label: string; note: string }[]; // e.g. [{label:'Profile completeness', note:'...'}]
  trustScoreRequestId: string;
  trustScoreUpdatedAt: string;       // ISO date
  isDiscoverable: boolean;            // privacy toggle, Settings
  completedProjectsCount: number;
  onTimeDeliveryPct: number;
  averageRating: number;              // 0-5
}

type ProjectStatus = 'draft' | 'open' | 'matched' | 'in_progress' | 'completed';

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  deliverable: string;
  amount: number;
  percentOfBudget: number;
  deadline: string; // ISO date
  status: 'pending' | 'submitted' | 'changes_requested' | 'approved' | 'released' | 'disputed';
  submissionContent?: string;
  submissionLinks?: string[];
  revisionNote?: string;      // set when status = changes_requested
  disputeReason?: string;     // set when status = disputed
  onChainTxHash?: string;     // set once released
}

interface Project {
  id: string;
  clientId: string;
  title: string;
  descriptionRaw: string;
  requiredSkills: string[];
  estimatedBudget: number;
  timelineDays: number;
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  deliverables?: string[];
  status: ProjectStatus;
  matchedFreelancerId?: string;
  gonkaParseRequestId?: string;
  escrowObjectId?: string;
  escrowTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

interface Invitation {
  id: string;
  projectId: string;
  freelancerId: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
}

interface Application {
  id: string;
  projectId: string;
  freelancerId: string;
  status: 'pending' | 'accepted' | 'declined';
  coverNote?: string;
  appliedAt: string;
}

interface SavedProject {
  freelancerId: string;
  projectId: string;
  savedAt: string;
}

interface AiMatchResult {
  requestId: string;
  matchScore: number;      // 0-100
  reasoning: string;
}

interface Rating {
  projectId: string;
  freelancerId: string;
  clientId: string;
  stars: number;   // 1-5
  comment?: string;
  ratedAt: string;
}

type NotificationType =
  | 'invitation_received'
  | 'invitation_response'
  | 'application_received'
  | 'application_response'
  | 'new_recommendation'
  | 'trust_score_updated'
  | 'milestone_submitted'
  | 'changes_requested'
  | 'milestone_released'
  | 'dispute_flagged'
  | 'escrow_funded';

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  text: string;
  linkTo: string;      // route to open on click
  createdAt: string;
  read: boolean;
}
```

**Seed data requirement:** on first load, populate a realistic demo set (see §2.1). At minimum, seed one demo Client account and one demo Freelancer account with enough cross-linked data (a project that's `in_progress` with a submitted milestone, a pending invitation, a couple of notifications) that both role documents' non-empty states are visible immediately without the user manually creating everything from scratch.

---

## 9. Simulated AI & On-Chain Call Reference

| Call | Trigger | Delay | Mock Output |
|---|---|---|---|
| Parse Project | Client chats with Gonka AI / enters project scope | 1.5–3s | `{ title, descriptionRaw, requiredSkills[], estimatedBudget, timelineDays, experienceLevel, deliverables[], suggestedMilestones[], gonkaRequestId }` — derive structured technical plan and milestone breakdown from conversation dialogue; fall back to editable defaults on manual skip. |
| Match Freelancers | Client opens a project's Candidates → Recommended tab | 1.5–3s | Ranked list of seeded freelancers with `matchScore`, `reasoning`, shared `gonkaRequestId` for the batch |
| Match Projects | Freelancer opens Dashboard or Browse Projects → Recommended tab | 1.5–3s | Ranked list of seeded open projects with `matchScore`, `reasoning`, shared `gonkaRequestId` |
| Trust Score | Freelancer profile created or edited | 1.5–3s | `{ trustScore, confidenceLevel, reasoningReport[], gonkaRequestId }` |
| Verify Submission (stretch — optional) | Milestone submitted | 1.5–3s | `{ verificationScore, reasoningTrace, suggestions[], gonkaRequestId }` — only needed if time allows; not required for the core prototype |
| Fund Escrow | Client confirms milestone plan and clicks "Confirm & Lock Funds" | ~2s pending | `{ escrowObjectId, txHash }` — project status → `in_progress` |
| Submit Milestone | Freelancer submits milestone content | ~2s pending | Content hash recorded (mock string), milestone status → `submitted` |
| Approve/Release Milestone | Client clicks "Approve & Release Payment" | ~2s pending | `{ txHash }` — milestone status → `released` |
| Flag Dispute | Client clicks "Flag a Dispute" and confirms | ~2s pending | Milestone status → `disputed` |
| Respond to Invitation | Freelancer accepts/declines | instant (no chain call) | Invitation status updates; on accept, project status → `matched` |
| Respond to Application | Client approves/declines | instant (no chain call) | Application status updates; on approve, project status → `matched` |
| Submit Rating | Client rates freelancer post-completion | instant (no chain call) | Rating stored, feeds freelancer's `averageRating` |

All AI-call outputs must carry a `gonkaRequestId` and be displayed somewhere in the UI per the transparency requirement. All on-chain outputs must carry a `txHash` shown via the On-Chain Transaction Card.

---

## 10. Cross-Cutting UX Rules

### 10.1 Every AI Call
- **Loading:** honest wait matching §9's delay, violet sparkle pulse animation, short descriptive text ("Finding your best matches…", "Calculating your Trust Score…").
- **Success:** result shown with Gonka Request ID visible (AI Reasoning Callout or a small mono chip).
- **Failure** (see §2.5 for simulated rate): plain inline message ("Couldn't load recommendations right now") + "Retry" button. Never block the rest of the screen; last-known cached data (e.g. last Trust Score) stays visible rather than disappearing.

### 10.2 Every On-Chain Action
- **Pending:** spinner + "Confirming on Sui…"
- **Success:** transitions into the On-Chain Transaction Card (tx hash, "View on Sui Explorer" link).
- **Failure:** plain-language message ("Transaction didn't go through — no funds were moved") + "Try Again." Never lose the user's in-progress input (e.g. a milestone plan being funded).

### 10.3 Wallet States
`disconnected` → `connecting` → `connected`. A user without a connected wallet can still browse, post projects, apply, and view everything read-only — the wallet is only required at the point money actually moves (funding escrow, receiving payment).

### 10.4 Notification Types (master list — both roles)

| Icon/color | Type | Example text |
|---|---|---|
| Blue paper-plane | `invitation_received` | "New invitation from [Client]" |
| Blue paper-plane (outbound variant) | `invitation_response` | "[Freelancer] accepted your invitation" |
| Blue paper-plane | `application_received` | "New application received for [Project]" |
| Blue paper-plane (outbound variant) | `application_response` | "Your application to [Project] was accepted" |
| Violet sparkle | `new_recommendation` | "New project recommended for you" / "New AI-recommended freelancers for [Project]" |
| Violet sparkle | `trust_score_updated` | "Your Trust Score was updated" |
| Amber clock | `milestone_submitted` | "[Freelancer] submitted [Milestone] — awaiting your review" |
| Amber pencil | `changes_requested` | "[Client] requested changes on [Milestone]" |
| Teal checkmark | `milestone_released` | "[Milestone] approved — payment released" |
| Teal checkmark | `escrow_funded` | "Escrow funded for [Project]" |
| Red/amber combo | `dispute_flagged` | "[Client] flagged [Milestone] for review" (freelancer-facing; resolves the gap where disputes previously had no notification) |

### 10.5 Empty States
Every list screen needs an explicit empty state per §7.3's Empty State Block pattern — role documents specify the exact copy per screen. General rule: explain plainly, offer one relevant action, never a dead illustration with no path forward.

### 10.6 Responsive Behavior
Left sidebar nav collapses to a bottom tab bar on mobile for both roles. Modals/slide-overs (notifications panel, milestone submission) become full-screen sheets on mobile.

---

## 11. Resolved Scope Decisions

These were ambiguous or missing across the source material and are settled here so both role documents can build against a single answer:

1. **"Changes Requested" is off-chain/UI-only.** The Move contract's real states are `pending → submitted → approved → released` or `disputed`. "Request Changes" keeps a milestone at `submitted` in the mock data with a `revisionNote` attached, and is a distinct visual state (`changes_requested`) purely at the UI layer — it never touches the simulated on-chain layer.
2. **Dispute is the real escalation path**, distinct from Changes Requested, and requires client confirmation before triggering. It is read-only/non-interactive once flagged (no in-prototype arbitration flow — that's genuinely out of scope, see §12).
3. **`draft` is a first-class project status**, alongside `open / matched / in_progress / completed`.
4. **Application and Invitation status** both use a three-value enum: `pending / accepted / declined`.
5. **Saved/bookmarked projects need a home.** Freelancers can bookmark a project from its detail page; a "Saved" tab lives alongside Applications and Invitations (see `TrustHire_Freelancer_Requirements.md` §4.5).
6. **Messaging is a UI stub, not a feature.** "Message" buttons appear on counterparty cards (client ↔ freelancer) per the original design, but in this prototype they open a simple placeholder ("Messaging is coming in a future release") rather than a real thread — this keeps the layout intact without requiring a messaging system to be built.
7. **Reputation display is mock-only.** Completed project history, ratings, and on-time % are pulled straight from seeded mock data — no real on-chain reputation object is required for this prototype pass.
8. **AI Submission Verification, Walrus/Seal file integrity, zkLogin/sponsored transactions** remain explicitly out of scope for this prototype (see §12). Do not build real integrations for these; a static "AI Pre-Check" badge placeholder is acceptable if it's trivial, but not required.

---

## 12. Out of Scope for This Prototype

- Real AI/LLM calls (Gonka Router) — fully mocked per §9.
- Real blockchain transactions (Sui) — fully mocked per §9.
- Real wallet integration (Sui Wallet Standard / zkLogin) — mocked per §2.6.
- Real backend/database — in-memory or `localStorage` only.
- Real messaging system between client and freelancer.
- Dispute arbitration/resolution flow (disputes display but cannot be resolved in-app).
- Project cancellation/withdrawal before matching.
- Walrus/Seal file storage and integrity proofs.
- Multi-currency or real payment rails of any kind.

---

## 13. Build Order Suggestion

1. Shared design system components (§7) + mock data store (§8) + simulated call layer (§9).
2. Landing → Auth → Role Selection (§6).
3. Freelancer onboarding through dashboard (fastest path to a demoable "AI matched me" moment).
4. Client onboarding through Post a Project (fastest path to a demoable "AI parsed my project" moment).
5. The full match → invite/apply → accept/approve → fund escrow loop, both sides.
6. Milestone submit → approve → release loop, both sides, including Changes Requested and Dispute states.
7. Notifications, Settings, Earnings/Escrow & Payments overviews, Profile/Reputation — polish pass.
