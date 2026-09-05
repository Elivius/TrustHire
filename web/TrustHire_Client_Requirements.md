# TrustHire — Client Requirements (Frontend Prototype)

**Read `TrustHire_Master_Requirements.md` first.** This document assumes its design tokens, reusable components, mock data model, simulated call behavior, and cross-cutting UX rules. Everything below is Client-role-specific.

---

## 1. Client Sitemap

| Nav location | Label | Route | Screen(s) |
|---|---|---|---|
| Sidebar | Dashboard | `/client/dashboard` | §4.2 |
| Sidebar | My Projects | `/client/projects` | §4.3 |
| Sidebar | Post a Project | `/client/projects/new` | §4.7 |
| Sidebar | Escrow & Payments | `/client/escrow` | §4.10 |
| Sidebar | Settings | `/client/settings` | §4.12 |
| Within a project | Project Detail Hub | `/project/[id]` (client view) | §4.4 |
| Within Project Detail Hub | Candidates | `/project/[id]/candidates` | §4.5 |
| Within Project Detail Hub | Finalize & Fund | `/project/[id]/fund` | §4.8 |
| Reached once `in_progress` | Active Workspace | `/project/[id]/workspace` (client view) | §4.9 |
| Top bar (bell icon) | Notifications | slide-over, any route | §4.11 |
| Onboarding (first login only) | Client Setup | `/client/onboarding` | §4.1 |

Two entry states:
- **First-time client** → `/client/onboarding` → `/client/dashboard`.
- **Returning client** → `/client/dashboard` directly.

---

## 2. Client-Specific Mock Data Notes

- **Candidates** for a project = union of: AI-recommended freelancers (simulated `Match Freelancers` call), freelancers who applied (`Application` records where `projectId` matches), and freelancers the client invited (`Invitation` records where `projectId` matches). A single freelancer may appear via more than one path — dedupe by `freelancerId` when computing a candidate count badge.
- **"Matched" transition:** a project moves from `open` → `matched` the moment *either* an invitation is accepted *or* an application is approved — whichever happens first. Once `matched`, the other pending invitations/applications for that project should visually deprioritize (see §4.5) rather than disappear.
- **Pending Actions** (Dashboard, Escrow & Payments) is computed, not stored: count of milestones with status `submitted` across the client's projects, plus count of projects with status `matched` that haven't yet been funded.

---

## 3. Client-Specific Components

Extend the master doc's component set — reuse Gradient/Ghost Buttons, Glass Card, Score Badge, AI Reasoning Callout, Skill Chip, Milestone Stepper, Wallet Chip, On-Chain Transaction Card, Status Badge, Notification Row, Empty State Block exactly as defined there.

| Component | Spec |
|---|---|
| **Application Card** | Glass card, violet-tinted left accent if a match score exists for this freelancer/project pair, plain glass otherwise. Shows avatar, name, headline, Trust Score badge, a short cover-note snippet, applied date, single "View Profile & Respond" button (deliberately no direct Approve/Decline on the card — that decision happens after a full profile read on §4.6). |
| **Invite Status Badge** | Reuses Status Badge: `Pending` (gray) / `Accepted` (teal) / `Declined` (muted gray). |
| **Milestone Finalize Row** | Editable variant of a milestone card: title, deliverable, % of budget, deadline — all editable. Always paired with a **running total indicator** pinned above the list ("87% allocated — must equal 100% to continue"). Any "Continue"/"Post"/"Confirm" action tied to this list must be disabled until the total equals exactly 100%, with a small inline note explaining why it's disabled. |
| **Pending Actions List** | Compact checklist: short rows like "2 milestones awaiting your review" or "1 project ready to fund escrow," each linking directly to the relevant screen. Omit the whole block if there is nothing pending — never render an empty version of it. |
| **Star Rating Input** | 1–5 star selector + optional short comment textarea. Filled stars use the teal trust/escrow accent (this is a human judgment, not an AI output — keep it visually distinct from violet AI elements). Used once, in §4.9's post-completion flow. |

---

## 4. Screens

### 4.1 Client Onboarding
- **Route:** `/client/onboarding`
- **Purpose:** Collect minimum info to start posting projects.
- **Entry point:** immediately after selecting "I'm a Client" on Role Selection, or from Settings' "Also set up as a Client" action.
- **Layout:** 3-step flow, centered glass card, thin progress bar/step dots, Back (ghost) / Continue (gradient) per step.
  - **Step 1 — Basic Info:** full name, company name (optional, copy should not imply it's expected), profile photo upload (circular preview, placeholder if skipped), short bio textarea.
  - **Step 2 — Preferences:** multi-select chips for hiring categories (Web Development, Design, Writing, Marketing, Smart Contracts, Other), typical budget range via preset buttons (`<$500 / $500–2k / $2k–10k / $10k+`). Neither field blocks progress.
  - **Step 3 — Wallet Connect:** "Connect your wallet to fund future projects" card, gradient "Connect Wallet" button (simulated per master §2.6), reassurance copy: "Your funds stay in your control until you approve a milestone — TrustHire never holds a balance on your behalf." **Not skippable** — if the user tries to finish without connecting, show an inline note and keep the account flagged incomplete; re-prompt the first time they try to fund escrow (§4.8).
- **On finish:** create/update `ClientProfile` in mock store, route to `/client/dashboard` (empty-state variant, primary CTA "Post Your First Project").

### 4.2 Client Dashboard
- **Route:** `/client/dashboard`
- **Data source:** all `Project` rows where `clientId` = current user; rollup of per-project `Match Freelancers` results.
- **Layout, top to bottom:**
  - Greeting header ("Welcome back, [Name]") + gradient "Post a New Project" button, top-right.
  - **Pending Actions List** (§3) directly under the header — omit entirely if empty.
  - Stat card row: Active Projects, Total Escrowed (sum of funded, unreleased milestone amounts — links to §4.10), Freelancers Hired (distinct `matchedFreelancerId` count), Avg. Trust Score of Hires.
  - **"Active Projects"** section — Glass Card per `in_progress` project: title, status badge, mini milestone-stepper preview, freelancer avatar + name. Clicking routes directly to §4.9 (already matched and funded, no need to route through the Detail Hub). Empty state: "No active projects yet" + "Post a Project" CTA.
  - **"Top Matches Across Your Projects"** section — small "Powered by Gonka AI" sparkle label. Horizontal scroll of freelancer cards (avatar, name, headline, Trust Score badge, top overlapping skill chips, a small tag noting which open project they matched to). "View Profile" opens §4.6. "View All Candidates" routes to that project's §4.5. Omit this whole section if the client has no `open` (unmatched) projects.

### 4.3 My Projects
- **Route:** `/client/projects`
- **Purpose:** Full project list across every status — the only place to find drafts or completed work.
- **Data source:** all `Project` rows for this client, every status.
- **Layout:** status filter tabs — **All / Drafts / Open / Matched / In Progress / Completed**. Each row/card: title, color-coded status badge (gray = draft/open, amber = matched, teal = in_progress/completed), budget, timeline, and a context line: candidate count for Open, freelancer name for Matched/In Progress/Completed, "Last edited [date]" for Drafts.
- **Row click routing by status:** `draft` → resumes §4.7 Stage 2 with saved data · `open`/`matched` → §4.4 Project Detail Hub · `in_progress` → §4.9 Active Workspace directly · `completed` → §4.9 in read-only completed state.
- Gradient "+ New Project" button always visible, routes to §4.7.
- **Empty states:** first-time/All tab → full illustrated "You haven't posted a project yet" + CTA. A specific filter with no results → lighter inline message, not a full illustration.

### 4.4 Project Detail Hub
- **Route:** `/project/[id]` (client view; only relevant while status is `open` or `matched` — once `in_progress`, §4.9 takes over)
- **Purpose:** Pre-escrow home for a single project.
- **Layout:** header (title, status badge, edit/pencil icon on description/skills/budget — editing here behaves like Post-a-Project Stage 2's editable form, no need to re-run the AI parse call just to fix a typo). Below: full description, skill chips, budget, timeline, current milestone plan (read-only summary — editing milestones happens in §4.8 once a freelancer is selected). A **"Candidates"** section/tab with a live count badge (recommended + applied + invited, deduped) linking to §4.5.
- **If status = `matched`:** persistent banner "You've matched with [Freelancer Name] — finalize milestones and fund escrow to get started," gradient "Continue to Escrow" button → §4.8.

### 4.5 Candidates
- **Route:** `/project/[id]/candidates`
- **Purpose:** Everyone connected to this project on the freelancer side, in one place.
- **Layout:** three tabs — **Recommended** (default) / **Applications** / **Invited**. Applications tab shows an unread-count badge.
  - **Recommended tab:** triggers the simulated `Match Freelancers` call on first visit (loading state per master §10.1). Ranked freelancer cards: avatar, name, headline, violet Match Score badge, teal Trust Score badge, one-line AI reasoning, "View Profile" (→ §4.6) and an inline gradient "Invite" button directly on the card. If already invited, replace with the Invite Status Badge.
  - **Applications tab:** list of Application Cards (§3). "View Profile & Respond" → §4.6 with the cover note shown. Empty state: "No applications yet — freelancers can apply once your project is visible in the open pool."
  - **Invited tab:** list of invited freelancers with Invite Status Badge. Accepted invitations behave the same as an approved application (project → `matched`). Empty state: "You haven't invited anyone yet — check the Recommended tab for AI-matched suggestions."
- **Once `matched`:** the two non-winning tabs stay viewable but show deprioritizing copy: "This project has already been matched with [Name]" — no further Invite/Approve actions available on them.

### 4.6 Freelancer Profile Detail (Client's View)
- **Route:** `/project/[id]/candidates/[freelancerId]`
- **Purpose:** Full profile review before inviting or approving.
- **Layout:** header — avatar, name, headline, two badges side by side: Trust Score (teal ring) and, only if this freelancer was actually AI-matched to this project, Match Score (violet ring). Omit Match Score entirely (not blank, not fabricated) if the freelancer arrived via unsolicited application.
- Below the badges: AI Reasoning Callout (only present when real match reasoning exists for this pair).
- If arriving from Applications: show the freelancer's **cover note** in its own plain, non-AI-styled callout above the reasoning box, clearly attributed as their own words.
- Sections: Bio, Skills (chips), Portfolio (link cards), Past Projects on TrustHire (read-only list with ratings, pulled from the freelancer's mock reputation data).
- **Bottom action bar adapts to entry context:**
  - From Recommended: gradient "Invite to Project" + ghost "Message" (stub, master §11.6).
  - From Applications: gradient "Approve Application" + outline "Decline" + ghost "Message" (stub).
- Approving an application or the freelancer accepting an invite both set project status → `matched` and route back to §4.4's matched banner.

### 4.7 Post a Project — Conversational AI Hiring Assistant
- **Route:** `/client/projects/new`
- **Purpose:** Interactive AI-assisted project scoping and specification creation flow.
- **Stage 1 — Conversational AI Chat:** interactive dialogue with Gonka AI asking intelligent clarifying questions (target audience, core user flows, technical stack, budget, timeline, deliverables).
  - Clean layout: Gonka AI responses on the left with full-width message bubbles and dynamic quick-reply chips; client messages on the right.
  - **Per-Message Gonka Audit Badge:** Each Gonka AI reply bubble includes an audit footer displaying `Gonka Router` with CPU icon and a unique, verifiable monospace Request ID (`gonka_req_...`).
  - Interactive typing indicator and live Gonka session status.
  - "Skip AI & Configure Manually" link to jump straight to Stage 2 with a default template.
  - "Generate Specification" button to convert the conversation into a structured project plan at any point.
- **Stage 2 — Editable Specification & Milestone Review Form:** violet-tinted banner "Gonka AI Structured Specification" with the session's Gonka Request ID in mono text, pulsing "Synthesized & Ready" badge, and a "Back to AI Chat" button.
  - **Quick Metrics Bar:** 4 visual parameter cards displaying Total Budget (SUI with Sui Escrow lock note), Timeline (Days / ~Weeks), Seniority Level, and Escrow Phases count.
  - **Editable Fields:** Project Title, Scope / Detailed Description, Estimated Budget (SUI), Timeline (Days), Expected Experience Level (`Beginner` | `Intermediate` | `Expert` interactive segmented pills), Required Skills (interactive chip list with add/remove), and Key Deliverables (numbered `D1`, `D2`, ... checklist cards with add/delete).
  - **Milestones Plan:** AI-suggested milestone allocation plan featuring a **segmented multi-color visual funding distribution progress bar**, repeatable **Milestone Finalize Rows** (§3), and the **running-total indicator pinned above** ("100% Allocated ✓" in green, or warning if unbalanced), "+ Add Another Milestone" ghost button, and delete actions.
  - **Bottom bar:** Non-custodial escrow security assurance notice, ghost "Save as Draft" (sets status `draft`, routes to §4.3), and gradient "Post Project to Candidates Pool" — disabled with an inline note if milestone percentages don't sum to 100% or title is empty.
- **Confirmation state:** on successful post (status → `open`), brief "Project posted ✓" moment, then auto-routes to §4.4's Candidates hub (`/project/[id]/candidates`), landing directly on the Recommended tab where Gonka candidate matching begins computing.

### 4.8 Finalize Milestones & Fund Escrow
- **Route:** `/project/[id]/fund`
- **Purpose:** Re-confirm milestones at agreement time (terms may have shifted since the original draft), then fund escrow — one continuous flow, not two separate pages.
- **Part 1 — Finalize Milestones:** same Milestone Finalize Rows pre-filled with the project's existing plan, fully editable, featuring the **segmented multi-color visual funding distribution progress bar**, gradient step badges (`M1`, `M2`), and running-total indicator pinned above ("100% Allocated ✓"). Heading: "Confirm milestones with [Freelancer Name] before funding escrow." Gradient "Confirm & Continue to Fund Escrow" disabled until total = exactly 100%.
- **Part 2 — Fund Escrow:** heading "Fund Escrow for [Project Title]." Summary card: freelancer avatar + name, total SUI amount, the now-finalized milestone breakdown (read-only), reassurance copy: "Funds are locked in a Sui smart contract and only released when you approve each milestone — TrustHire never holds your funds." Wallet section: connected wallet chip, network indicator, "Gas fees sponsored by TrustHire" teal badge (cosmetic only in this prototype).
- **On confirm:** simulated Fund Escrow call (master §9) — pending ("Confirming on Sui…") → success (teal checkmark, "Escrow Funded ✓," On-Chain Transaction Card) → auto-route into §4.9, project now `in_progress`.
- **Failure state:** stay on screen with plan and amount intact, plain-language error ("Transaction didn't go through — no funds were moved") + "Try Again."

### 4.9 Active Project Workspace (Client View)
- **Route:** `/project/[id]/workspace`
- **Purpose:** Track and act on an in-progress project's milestones.
- **Header:** project title, overall status badge, freelancer info card (avatar, name, ghost "Message" stub button), total escrow amount with teal lock icon "Secured on-chain" — expandable to the original `EscrowCreated` transaction card.
- **Vertical Milestone Stepper**, one row per milestone (state set must match the freelancer doc's exactly, since both sides read the same milestone):
  - `pending` (gray) — nothing for the client to do.
  - `submitted` (amber, filled clock) — expandable to show the freelancer's submission content/links/files. Two actions: gradient **"Approve & Release Payment"** and outline **"Request Changes"** (opens a short textarea for a revision note; sets `revisionNote`, milestone stays `submitted` internally but displays as `changes_requested` — see master §11.1).
  - **Flag a Dispute** — small, deliberately de-emphasized text link near (not beside) the two main actions, only on a `submitted` milestone. Clicking asks for a short reason + a confirmation step ("This will lock the milestone for manual review. Only use this if you and the freelancer can't resolve it directly.") before setting status → `disputed`.
  - `approved`/`released` (teal) — on approval, run the simulated Approve/Release call (master §9): pending → success → stepper dot fills with checkmark, `MilestoneReleased` transaction card shown.
  - `disputed` — muted red/amber, plain copy: "This milestone is under review. Funds remain locked until it's resolved." No interactive actions (arbitration is out of scope, master §12).
- **On project completion** (all milestones `released`): one-time modal — "Project complete! Rate your experience with [Freelancer Name]" — Star Rating Input (§3) + optional comment, gradient "Submit Rating," ghost "Skip for now." Either action transitions the workspace to a read-only completed view retaining full milestone history and transaction references.

### 4.10 Escrow & Payments
- **Route:** `/client/escrow`
- **Purpose:** All-projects financial overview.
- **Data source:** aggregate across every project this client owns.
- **Layout:** top stat row — Currently Escrowed (locked across active projects), Total Released (all-time), Pending Actions count (links into the Pending Actions List, §3). Below: per-project breakdown row (escrowed amount, released-so-far, remaining), each linking into that project's §4.9. Below that: flat transaction history (master's transaction history row pattern) combining every escrow-funding and milestone-release event, filterable by project or date.
- **Empty state:** "You haven't funded any escrow yet — this is where you'll track locked and released funds once you hire someone." No CTA (downstream of hiring, not an action in itself).

### 4.11 Notifications Panel (Client)
- **Trigger:** bell icon, top bar, any authenticated client route.
- **Layout:** slide-in glass panel, grouped "Today" / "Earlier". Uses the Notification Row component (master §7.3) and the full type list (master §10.4), filtered to client-relevant types:
  - `application_received` → §4.5 Applications tab.
  - `invitation_response` (accepted/declined) → §4.5 Invited tab (or §4.4's matched banner if accepted).
  - `new_recommendation` → §4.5 Recommended tab.
  - `milestone_submitted` → §4.9, scrolled to that milestone.
  - `escrow_funded` / `milestone_released` → §4.10, scrolled to that transaction.

### 4.12 Settings
- **Route:** `/client/settings`
- **Layout:** sectioned list (not a wizard):
  - **Account** — name, company name, email, password change (mock, no real auth backend needed).
  - **Wallet** — connected address chip, "Disconnect" / "Switch Wallet" (both require a confirmation step).
  - **Roles** — "You're currently set up as a Client." Gradient "Also set up as a Freelancer" button → routes into `TrustHire_Freelancer_Requirements.md` §4.1 Onboarding, reused as-is. On completion, `roles` gains `'freelancer'` and a role-switcher appears in the top nav (master §2.7).
  - **Notifications** — toggle per type from §4.11.
  - **Danger zone** — log out; delete account (plain-language warning if any project has funds currently escrowed — do not silently block, state the implication directly).

---

## 5. Cross-Cutting States (Client-Specific Notes)

Follow master §10 in full. Client-specific emphasis:
- Every AI call (Parse Project, Match Freelancers) must show the Gonka Request ID on its result and never discard what the client already typed if it fails.
- Every on-chain action (fund escrow, approve/release, dispute) must follow pending → success → failure and never leave the client unsure whether money moved.
- A client can browse, post projects, and review candidates with no wallet connected — it's only required at the point of actually funding escrow (§4.8).
- Empty states specific to this role: My Projects (no projects yet / no results in a filter), Candidates (no recommendations yet — still computing / no applications yet / no invitations sent yet), Escrow & Payments (no escrow funded yet).

---

## 6. Notes for Implementation Order

Build in this order — it follows the actual path a new client takes, from first project to first payout:

§4.1 Onboarding → §4.2 Dashboard → §4.3 My Projects → §4.7 Post a Project → §4.4 Project Detail Hub → §4.5 Candidates → §4.6 Freelancer Profile Detail → §4.8 Finalize & Fund Escrow → §4.9 Active Workspace → §4.10 Escrow & Payments → §4.11 Notifications → §4.12 Settings.

Every AI touchpoint must show a Gonka Request ID; every payment touchpoint must show an on-chain transaction reference (mocked per master §9); every nav item or button implying a destination must route to a screen defined above.
