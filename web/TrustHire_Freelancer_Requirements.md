# TrustHire — Freelancer Requirements (Frontend Prototype)

**Read `TrustHire_Master_Requirements.md` first.** This document assumes its design tokens, reusable components, mock data model, simulated call behavior, and cross-cutting UX rules. Everything below is Freelancer-role-specific.

---

## 1. Freelancer Sitemap

| Nav location | Label | Route | Screen(s) |
|---|---|---|---|
| Sidebar | Dashboard | `/freelancer/dashboard` | §4.2 |
| Sidebar | Browse Projects | `/freelancer/browse` | §4.3 |
| Sidebar | My Applications | `/freelancer/applications` | §4.5 |
| Sidebar | Active Work | `/freelancer/active-work` | §4.6 |
| Sidebar | Earnings | `/freelancer/earnings` | §4.8 |
| Sidebar | Settings | `/freelancer/settings` | §4.11 |
| From Browse Projects | Project Detail | `/project/[id]` (freelancer view) | §4.4 |
| From Active Work | Milestone Submission | modal/slide-over on §4.6 | §4.7 |
| Top bar (bell icon) | Notifications | slide-over, any route | §4.10 |
| Top bar (avatar) | My Profile | `/freelancer/profile` | §4.9 |
| Onboarding (first login only) | Freelancer Setup | `/freelancer/onboarding` | §4.1 |

Two entry states:
- **First-time freelancer** → `/freelancer/onboarding` → `/freelancer/dashboard`.
- **Returning freelancer** → `/freelancer/dashboard` directly.

---

## 2. Freelancer-Specific Mock Data Notes

- **Browse Projects "Recommended" tab** and **Dashboard recommendations** both read from the same simulated `Match Projects` call result — don't re-run it separately per screen; cache the result for the session and refresh on an explicit action (profile update, or a manual "Refresh Recommendations" if provided).
- **Saved Projects** (`SavedProject` records) are keyed by `freelancerId` + `projectId` — a bookmark toggle on §4.4 writes/removes this record and is reflected as a third tab on §4.5.
- **"Matched — awaiting escrow"** is a real intermediate state: after a freelancer accepts an invitation (or a client approves their application) but before the client funds escrow, the project is `matched` with no milestones active yet. This must render as its own distinct, non-milestone-stepper card in §4.6 Active Work until escrow funding completes.

---

## 3. Freelancer-Specific Components

Extend the master doc's component set — reuse Gradient/Ghost Buttons, Glass Card, Score Badge, AI Reasoning Callout, Skill Chip, Milestone Stepper, Wallet Chip, On-Chain Transaction Card, Status Badge, Notification Row, Empty State Block exactly as defined there.

| Component | Spec |
|---|---|
| **Invitation Card** | Glass card, blue-tinted left accent bar (matches the paper-plane notification color). Client avatar + name, project title + budget snippet, gradient "Accept" and outline "Decline" side by side, "Invited [x] ago" timestamp so it doesn't feel indefinite. |
| **Application Status Badge** | Reuses Status Badge: `Pending` (gray) / `Accepted` (teal) / `Declined` (muted gray-red, low-emphasis — closed, not alarming). |
| **Changes Requested State** | A distinct milestone-stepper dot: amber outline + small pencil icon — visually different from the solid amber clock used for `submitted`, so a freelancer can tell "waiting on them" from "waiting on the client" at a glance. |
| **Filter Bar** | Used on Browse Projects: skill multi-select chips, budget range presets (`<$500 / $500–2k / $2k–10k / $10k+`), timeline filter, sort control (Best Match / Newest / Highest Budget — Best Match only shown under the Recommended tab). |
| **Transaction History Row** | Used on Earnings: project/milestone title, amount, date, status (`Released` teal / `Pending` amber), mono tx-hash chip with copy icon, "View on Sui Explorer" link — a flattened list version of the On-Chain Transaction Card. |
| **Trust Score Breakdown Block** | Structured expansion of the AI Reasoning Callout: instead of one paragraph, short labeled lines (e.g. "Profile completeness," "Portfolio quality," "Platform history") each with a short AI-generated note. Keep the violet AI-accent treatment. |
| **Empty State Block (role-specific copy)** | Same pattern as master §7.3, applied consistently across Browse Projects, My Applications, Active Work, Earnings — explain plainly, one relevant CTA. |

---

## 4. Screens

### 4.1 Freelancer Onboarding (Profile Setup + Trust Score Kickoff)
- **Route:** `/freelancer/onboarding`
- **Purpose:** Collect enough profile data to generate an initial Trust Score and enable project matching.
- **Entry point:** immediately after selecting "I'm a Freelancer" on Role Selection, or from Settings' "Also set up as a Freelancer" action.
- **Layout:** 4-step flow, centered glass card, thin progress bar/step dots, consistent with the client onboarding pattern.
  - **Step 1 — Basic Info:** full name, profile photo upload (circular preview, placeholder avatar if skipped — never block progress on a photo), headline/title (e.g. "Full-Stack Developer"), short bio textarea (visible character count, ~300 char guidance).
  - **Step 2 — Skills & Expertise:** searchable tag-input for skills (React, Move, Solidity, UI/UX, Copywriting, etc.), **minimum 3 required to continue** (inline helper: "Add at least 3 skills so we can match you with the right projects"). Experience level as three selectable segments (Beginner / Intermediate / Expert), not a dropdown.
  - **Step 3 — Portfolio & Verified Code Proof:** GitHub Account Verification card ("Connect & Verify GitHub Profile") allowing Gonka AI to scan and auto-discover verified public repositories (`GitHub Verified ✓` tag with commit counts & language tags to prevent repository impersonation). Accompanied by a custom links section below for non-GitHub artifacts (live dApps, Figma prototypes, whitepapers). Boosts Gonka Trust Score confidence to High upon verification.
  - **Step 4 — Wallet Connect:** "Connect your wallet to receive payments" card, gradient "Connect Wallet" button (simulated per master §2.6), reassurance copy: "Payments are released directly to this address the moment a client approves your milestone — no platform holding period." **Not skippable** — block "Finish Setup" until connected, or explicitly flag the account incomplete.
- **Transition state:** after Step 4, before landing on the dashboard, full-screen transitional state — pulsing violet sparkle, "Gonka AI is calculating your Trust Score…" tied to the simulated Trust Score call (master §9), never a fixed duration shorter than the real call. Land on Dashboard with the new Trust Score badge visible, one-time subtle highlight/pulse on first appearance.
- **Failure handling:** if the simulated Trust Score call fails, don't block dashboard entry — show the badge in a "Calculating…" state with a retry affordance, let the freelancer proceed.

### 4.2 Freelancer Dashboard (Home)
- **Route:** `/freelancer/dashboard`
- **Data source:** active contracts for this freelancer; top 3–4 results from the cached `Match Projects` call (§2); `trustScore` from the freelancer's profile.
- **Layout:** left sidebar nav (Dashboard, Browse Projects, My Applications, Active Work, Earnings, Settings — bottom tab bar on mobile). Top bar: theme toggle, notification bell (unread-count dot), wallet chip, profile avatar (→ §4.9).
- **Main content, top to bottom:**
  - Greeting header ("Welcome back, [Name]") with inline Trust Score pill badge ("Trust Score: [score]/100"), small "View full Gonka AI trust score breakdown" link underneath → §4.9.
  - Stat card row: Active Contracts, Total Earned (on-chain, links to §4.8), Completed Projects, Trust Score (numeric).
  - **"Active Work"** section — Glass Card per active contract, mini milestone-stepper preview, "Submit Milestone" button where the next milestone is `pending`. Clicking a card opens §4.6 in full. Empty state: "No active contracts yet" + "Browse Projects" CTA.
  - **"AI-Recommended Projects For You"** section — small "Powered by Gonka AI" sparkle label. 3–4 project cards (title, budget, required-skill chips, violet Match Score badge; reasoning text snippet omitted on dashboard cards for a cleaner layout — full AI reasoning viewable on project detail page), "View & Apply" → §4.4. "See All Recommendations →" routes to §4.3 with the Recommended tab pre-selected.
  - If profile is incomplete (missing skills or portfolio): dismissible banner above recommendations — "Complete your profile to improve your matches" → §4.9 edit mode.
  - Empty state for a brand-new freelancer with zero recommendations yet: "AI is still learning what fits you best — check back soon, or browse projects directly" + "Browse Projects" CTA.

### 4.3 Browse Projects
- **Route:** `/freelancer/browse`
- **Purpose:** Full searchable project pool, distinct from the dashboard's curated preview.
- **Data source:** **Recommended** tab → cached `Match Projects` result, ranked by `matchScore`. **All Open Projects** tab → plain listing of every `open`-status project, no AI ranking.
- **Layout:** two tabs — **Recommended for You** (default, violet Match Score badges visible) and **All Open Projects** (chronological or budget-sortable, no Match Score badge — these are unscored browsing results, don't fabricate a score for them). Filter Bar (§3) directly under the tabs; sort options adapt to the active tab (Best Match only under Recommended).
- Project cards (grid or list): title, client name/avatar, budget, timeline, required-skill chips (highlight overlaps with the freelancer's own skills), Match Score badge + one-line reasoning (Recommended tab only), "View Details" → §4.4.
- **Empty state** (All Open Projects, filtered to zero results): "No open projects match these filters — try widening your budget or skill filters" + "Clear Filters" ghost button.

### 4.4 Project Detail (Apply Flow)
- **Route:** `/project/[id]` (freelancer view)
- **Purpose:** Full project view before committing to an application — the link between "see a card" and "apply."
- **Data source:** full `Project` + `Milestone` fields.
- **Layout:** header — project title, client name/avatar, status ("Open"). If arrived via a Recommended card, show the AI Reasoning Callout (violet-tinted, sparkle icon, 2–3 sentences, mono Gonka Request ID footer, expandable full trace) — only when a real match score exists for this pair. If arrived via All Open Projects, omit the callout entirely.
- Below: full description (client's original text, not just the AI-parsed summary), required-skill chips, budget, timeline, and a **read-only milestone breakdown** (title, deliverable, % of budget, deadline per milestone — non-editable here, the freelancer isn't setting terms).
- **Bottom action bar:** gradient "Apply to This Project" → lightweight modal (optional short cover-note textarea, "Confirm Application" button). On confirm: inline success state ("Application sent ✓ — you'll be notified if the client responds") without navigating away, so browsing can continue. Also a ghost bookmark icon in the header — "Save for Later" — toggles a `SavedProject` record and surfaces in §4.5's Saved tab.
- If already applied: replace the Apply button with a disabled state showing the current Application Status Badge ("Applied — Pending Review").

### 4.5 My Applications, Invitations & Saved Projects
- **Route:** `/freelancer/applications`
- **Purpose:** Track outbound applications, handle inbound invitations, and revisit bookmarked projects — three tabs in one place.
- **Layout:** three tabs — **Applications** / **Invitations** / **Saved**. Invitations tab shows an unread-count badge (time-sensitive, easy to miss).
  - **Applications tab:** glass card rows — project title, client name, date applied, Application Status Badge. Clicking opens §4.4 read-only. Sort/filter by status. Empty state: "You haven't applied to anything yet" + "Browse Projects" CTA.
  - **Invitations tab:** Invitation Cards (§3) — client info, project title/budget snippet, "Invited [x] ago," gradient "Accept" / outline "Decline" directly on the card (clicking the card body still opens §4.4 for full context). **On Accept:** brief confirmation ("You're in! [Client] will finalize milestones and fund escrow next — you'll be notified"), project moves to "Matched — awaiting escrow" and also appears as that distinct card in §4.6. **On Decline:** removes from list with a short-lived undo toast, no confirmation dialog needed. Empty state: "No invitations right now — clients can invite you directly once your profile is visible."
  - **Saved tab:** grid/list of bookmarked projects (same card style as Browse Projects), each with a "Remove" bookmark toggle and "View Details" → §4.4. Empty state: "Nothing saved yet — bookmark a project from its detail page to find it here later."

### 4.6 Active Work (Project Workspace — Freelancer View)
- **Route:** `/freelancer/active-work` (list) → `/project/[id]/workspace` (individual, freelancer view)
- **Purpose:** Freelancer-facing project workspace, covering both the pre-escrow "matched" state and the full milestone lifecycle.
- **Data source:** `escrowObjectId`/`Milestone` rows for projects where `matchedFreelancerId` = current user.
- **List view (`/freelancer/active-work`):** cards for every matched/in-progress/completed project. A project that is `matched` but not yet funded renders as a distinct, simplified card (no milestone stepper) with copy: "Matched with [Client] — waiting on escrow funding." A funded project renders with its milestone-stepper preview.
- **Individual workspace (`/project/[id]/workspace`):** header — project title, overall status badge, client info card (avatar, name, ghost "Message" stub button), total escrow amount with teal lock icon "Secured on-chain" — expandable to the original `EscrowCreated` transaction card.
- **Vertical Milestone Stepper**, one expandable row per milestone, five states (must match the client doc's state set exactly):
  - `pending` (gray) — freelancer's turn: gradient "Submit Milestone" button → §4.7.
  - `submitted` (amber, filled clock) — read-only now: "Waiting on [Client Name] to review," date submitted.
  - `changes_requested` (amber outline, pencil icon — §3) — show the client's revision note in a plain, non-AI-styled callout, and re-surface "Submit Milestone" pre-filled with the previous submission content for editing.
  - `approved` (teal, brief transitional) → animates into `released` once the simulated on-chain call resolves (can be treated as the same visual moment).
  - `released` (teal, filled checkmark) — expandable to the On-Chain Transaction Card (tx hash, "View on Sui Explorer," amount, timestamp).
  - `disputed` — clearly different visual treatment (muted red/amber, not just another amber shade): "This milestone is under review by both parties. Funds remain locked until it's resolved." Visible and honest only, not interactive (arbitration out of scope, master §12).

### 4.7 Milestone Submission Flow
- **Purpose:** The actual "Submit Milestone" action.
- **Presentation:** modal or slide-over on top of §4.6 — a quick, focused action, not a full page navigation.
- **Header:** milestone title, amount, deadline reminder if close ("Due in 2 days").
- **Form:** description textarea ("Describe what you're delivering — a summary the client will see alongside your files/links"), repeatable link input (GitHub, Figma, live URL), file upload zone (drag-and-drop, per-file upload progress — mock the upload). Helper text: "A content hash of your submission is recorded on-chain for integrity, even before full file verification is available."
- **Resubmission** (after `changes_requested`): pre-fill with previous content, pin the client's revision note above the form, non-editable, so the response is clearly addressing it.
- **Bottom:** ghost "Save Draft" (holds content locally without submitting) and gradient "Submit Milestone." On submit: brief inline "Submitting…" pending state (simulated content-hash write, master §9), then close the modal, update the stepper row to `submitted`, success toast: "Milestone submitted — [Client] has been notified."
- **Failure state:** keep the modal open with entered content intact, inline error banner + "Try Again" — never lose what was typed.

### 4.8 Earnings
- **Route:** `/freelancer/earnings`
- **Purpose:** Full payment history and on-chain proof of earnings.
- **Data source:** all `released` milestones for this freelancer, cross-referenced with project/escrow data.
- **Layout:** top stat row — Total Earned (on-chain, all-time), Pending (currently escrowed for active work, not yet released — labeled "not yet released" so it's never confused with available balance), This Month. Below: filterable Transaction History Row list (§3) — filter by project or date range, default sort most recent first.
- **Empty state:** "Your on-chain earnings will show up here once your first milestone is approved" — no CTA (passive waiting state tied to work already in progress).

### 4.9 My Profile (View/Edit) + Trust Score Breakdown
- **Route:** `/freelancer/profile`
- **Purpose:** (1) ongoing profile editing distinct from the one-time onboarding wizard, (2) the Trust Score Breakdown destination linked from the Dashboard.
- **Layout:** **View mode** (pencil icon toggles to Edit mode, no separate route) — reuse the same layout as the client-facing "Freelancer Profile Detail" screen for visual consistency between what the freelancer edits and what a client sees.
  - **View mode:** avatar, name, headline, Trust Score badge (teal ring) with an expandable "View Score Breakdown" panel directly below it (not a separate page) — Trust Score Breakdown Block (§3) showing the `reasoningReport` as short labeled lines, plus `confidenceLevel` and a mono Gonka Request ID footer with a "recalculated [date]" timestamp. Below: bio, skills (chips), portfolio (link cards), and a **Reputation** section — completed project count, on-time delivery %, average client rating, list of completed projects with client name/star rating/"View on-chain record" mono link (mock data per master §11.7; if a given reputation field has no data yet, show "Reputation tracking coming soon" rather than removing the section).
  - **Edit mode:** the same fields from onboarding Steps 1–3, pre-filled and editable inline, plus wallet address shown read-only with a "Change Wallet" option (requires confirmation — affects where future payments go). On Save: the same "Recalculating your Trust Score…" transitional pattern as onboarding, since a real (simulated) Gonka call is happening, not just a data write.

### 4.10 Notifications Panel (Freelancer)
- **Trigger:** bell icon, top bar, any authenticated freelancer route.
- **Layout:** slide-in glass panel, grouped "Today"/"Earlier." Uses the Notification Row component (master §7.3) and the full type list (master §10.4), filtered to freelancer-relevant types:
  - `invitation_received` → §4.5 Invitations tab.
  - `new_recommendation` → §4.3, or `trust_score_updated` → §4.9.
  - `milestone_submitted`-adjacent reminders (e.g. deadline approaching) — amber clock → §4.6, that milestone.
  - `changes_requested` (amber pencil) → §4.6, opens directly to that milestone.
  - `milestone_released` (teal checkmark) → §4.8 Earnings, scrolled/highlighted to that transaction.
  - `dispute_flagged` (red/amber) → §4.6, that milestone's disputed state. **This notification type did not exist in earlier drafts and must be included** — a freelancer needs to know when a milestone they submitted has been disputed, not just discover it by revisiting the workspace.

### 4.11 Settings
- **Route:** `/freelancer/settings`
- **Layout:** sectioned list (not a wizard):
  - **Account** — name, email, password change (mock).
  - **Wallet** — connected address chip, "Disconnect" / "Switch Wallet" (both require confirmation, given payment implications).
  - **Roles** — "You're currently set up as a Freelancer." Gradient "Also set up as a Client" button → routes into `TrustHire_Client_Requirements.md` §4.1 Onboarding, reused as-is. On completion, `roles` gains `'client'` and a role-switcher appears in the top nav (master §2.7).
  - **Notifications** — toggle per type from §4.10 (invitations, recommendations, milestone updates, trust score changes, disputes).
  - **Privacy** — toggle for whether the profile (`isDiscoverable`) is visible in client searches/matching at all — useful for a freelancer temporarily unavailable for new work; does not affect existing active contracts.
  - **Danger zone** — log out; delete account, with a plain-language warning about what happens to active contracts and escrowed funds — never a silent action given money is involved.

---

## 5. Cross-Cutting States (Freelancer-Specific Notes)

Follow master §10 in full. Freelancer-specific emphasis:
- Every AI call (Match Projects, Trust Score) shows a Gonka Request ID on its result; a failed call never removes the last-known Trust Score from view.
- Every on-chain-adjacent action (accepting an invitation that leads to the client funding escrow, milestone submission's content-hash write, eventually seeing a `MilestoneReleased` state) follows pending → success → failure per master §10.2.
- A freelancer with no wallet connected can still browse, apply, and view everything read-only — the wallet only matters at the point payment actually happens (which, per onboarding, is already required upfront, but a later disconnect shouldn't lock out read-only screens).
- **Empty states master list:** Dashboard (no active work / no recommendations yet), Browse Projects (no results for current filters), My Applications & Invitations (independent empty state per tab: Applications / Invitations / Saved), Active Work (no active contracts), Earnings (no released payments yet).
- Responsive: sidebar (Dashboard/Browse Projects/My Applications/Active Work/Earnings/Settings) collapses to a bottom tab bar on mobile, carried across every screen in this document.

---

## 6. Notes for Implementation Order

Build in this order — it mirrors the actual path a new freelancer moves through the product:

§4.1 Onboarding → §4.2 Dashboard → §4.3 Browse Projects → §4.4 Project Detail → §4.5 Applications, Invitations & Saved → §4.6 Active Work → §4.7 Milestone Submission → §4.8 Earnings → §4.9 Profile → §4.10 Notifications → §4.11 Settings.

Every AI touchpoint must show a Gonka Request ID; every payment touchpoint must show an on-chain transaction reference (mocked per master §9); every nav item and every button implying a destination (`View & Apply`, `View Score Breakdown`, `Also set up as a Client`, `Save for Later`, etc.) must route to a screen defined above — this was the core failure mode in the earliest draft of this product, and this document set is written specifically to close every one of those gaps.
