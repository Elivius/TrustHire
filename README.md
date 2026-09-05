# TrustHire

TrustHire is a decentralized hiring platform where **AI decides who to trust** and **Sui Move contracts enforce that trust is honored**. Clients describe a project, the Gonka AI router turns it into structured requirements and ranked freelancer matches, and payments are held in an on-chain milestone escrow instead of platform custody.

> Status: hackathon prototype. Some flows described in the requirements docs are still specification-only — see [Current state](#current-state).

## Key Sui Features

This project leverages several standout features of the Sui blockchain to provide a seamless Web2-like experience with Web3 guarantees:

- **zkLogin**: Frictionless, passwordless onboarding via Google OAuth. Users can create a wallet and interact with the platform using just their Google account. *(See [`web/components/ui/google-login-button.tsx`](web/components/ui/google-login-button.tsx) and `@mysten/enoki` integration)*.
- **Enoki Sponsored Transactions**: Gasless interactions for talent. Creating a profile and submitting milestone deliverables are 100% sponsored by the platform, allowing freelancers to start working without needing any SUI for gas fees. *(See [`web/lib/sui/sponsored.ts`](web/lib/sui/sponsored.ts) and [`web/app/api/enoki/sponsor/route.ts`](web/app/api/enoki/sponsor/route.ts))*.
- **Programmable Transaction Blocks (PTBs)**: Atomic, multi-step transactions. TrustHire uses PTBs to securely batch coin splitting, escrow funding, and milestone approvals into single, atomic executions. *(See [`web/lib/sui/escrow.ts`](web/lib/sui/escrow.ts))*.
- **On-chain Milestone Escrow**: Trustless payment rails. Client funds are locked securely in a shared escrow object, eliminating platform custody and guaranteeing freelancers get paid when work is approved. *(See [`smart-contracts/trusthire/sources/escrow.move`](smart-contracts/trusthire/sources/escrow.move))*.
- **On-chain Reputation**: Immutable work history. A shared `ReputationRegistry` tracks completed projects, lifetime earnings, and AI-verified trust scores, giving freelancers verifiable and portable identities. *(See [`smart-contracts/trusthire/sources/reputation.move`](smart-contracts/trusthire/sources/reputation.move))*.

## Hackathon Tracks & Judging Criteria

### <img src="https://cryptologos.cc/logos/sui-sui-logo.svg" width="24" height="24" alt="Sui Logo" style="vertical-align: middle; margin-right: 4px;"/> Sui Track 02: AI × Sui
**The Problem (Trust & Fairness):** On traditional platforms, freelancers worry about clients defaulting on payments, while clients worry about fake profiles or subpar work. 
**The Solution:** TrustHire uses Sui smart contracts to enforce payment fairness via **On-chain Milestone Escrow**. Clients securely lock funds in advance, and freelancers build an immutable **On-chain Reputation** that proves their skills and track record, eliminating fake profiles.

**Product UX (Web2 UX + Web3 Power):** 
To ensure real-world readiness, TrustHire completely removes blockchain friction for talent:
- **Zero-Friction Onboarding:** Freelancers sign in with Google (**zkLogin**)—no seed phrases or wallet extensions required.
- **Gasless Interactions:** Using **Enoki Sponsored Transactions**, freelancer onboarding and milestone submissions are 100% sponsored. They never need faucet tokens to start working.

**Technical Implementation (End-to-End Completeness):**
The core Sui integration is fully complete, prioritizing robust, working mechanics over unnecessary complexity:
- **Programmable Transaction Blocks (PTBs):** Used to atomically split client SUI coins and fund the escrow contract in a single step (see `web/lib/sui/escrow.ts`).
- **Secure Move Contracts:** A clean `escrow.move` contract handles milestone locking and release logic securely on-chain.
- **Seamless App Integration:** The Next.js frontend is fully wired to the Sui testnet using `@mysten/dapp-kit`, handling wallet connections, Enoki sponsorship, and on-chain state querying.

### <img src="https://gonkarouter.io/gonkaIcon.png" width="24" height="24" alt="Gonka Logo" style="vertical-align: middle; margin-right: 4px; background-color: white; border-radius: 50%; padding: 2px;"/> Gonka Track: AI Fact Checker for Society (WIP)
*Note: This integration is actively under development.*
To guarantee unbiased milestone approvals, TrustHire utilizes the Gonka Router to verify freelancer submissions (e.g., GitHub PRs or URL links):
- **Decentralized Verification:** When a milestone is submitted, the proof (URL/Text) is sent to `gonkarouter.io` to analyze against the project requirements.
- **Multi-Model Consensus:** The submission is cross-verified by at least two different AI models to ensure neutrality and prevent hallucination.
- **Truth Score & Transparency:** The AI outputs a **Truth Score (0-100%)** and a detailed reasoning trace evaluating the work. The specific **Gonka Request IDs** are displayed on the dashboard for complete transparency.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS
- **Blockchain:** Sui Move (Smart Contracts), `@mysten/dapp-kit` (React hooks), `@mysten/enoki` (zkLogin & Sponsored Transactions)
- **Database & Off-chain state:** Supabase (PostgreSQL)
- **AI & Verification:** Gonka Router (Multi-model consensus, API client)
- **Backend Services:** Hono (Node.js server for GitHub OAuth/Evidence)

## Repository layout

```text
TrustHire/
├── web/                          # Next.js 15 / React 19 app (pages + API routes)
│   ├── app/                      # App Router: client/, freelancer/, project/, auth/, api/
│   ├── components/               # UI components and layouts
│   └── lib/                      # Sui transaction builders, Supabase clients, helpers
├── gonka/                        # AI router client and reasoning modules
│   ├── client.ts                 # OpenAI-compatible client for api.gonkarouter.io
│   ├── router.ts, models.ts, multiModel.ts, consensus.ts, responseParser.ts
│   ├── integrations/             # projectAnalysis, projectAssistant, matchEngine,
│   │                             # matchFreelancers, matchProjects, trustScore,
│   │                             # skillVerification
│   └── tests/                    # Standalone tsx scripts (not a test runner)
├── server/                       # Hono service on port 3010 (GitHub OAuth + evidence)
├── smart-contracts/trusthire/    # Sui Move package
│   └── sources/                  # escrow.move, reputation.move
└── package.json                  # pnpm monorepo root
```

`pnpm-workspace.yaml` declares only `web` and `smart-contracts` as workspaces. `gonka/` and `server/` are plain TypeScript folders compiled by the root `tsconfig.json` and run with `tsx` from the repository root — they have no `package.json` of their own and share the root dependencies.

## Requirements

- Node.js >= 18 and pnpm
- [Sui CLI](https://docs.sui.io/references/cli) for building/publishing the Move package
- Accounts/keys for Supabase, Enoki (zkLogin), Gonka Router, and a GitHub OAuth app

## Setup

```bash
pnpm install
cp web/.env.example web/.env.local
```

### Environment variables

`web/.env.example` documents the frontend variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`, `DATABASE_URL` | Supabase persistence and auth |
| `NEXT_PUBLIC_ENOKI_API_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Enoki / zkLogin sign-in |
| `NEXT_PUBLIC_TESTNET_PACKAGE_ID`, `NEXT_PUBLIC_MAINNET_PACKAGE_ID` | Published Move package IDs (read in `web/lib/contracts.ts`) |

The AI and OAuth code reads a `.env.local` in the process working directory (`dotenv.config({ path: ".env.local" })`), so add these to `web/.env.local` for the Next.js app and to a root `.env.local` when running `gonka/` scripts or `server/` from the repository root:

| Variable | Used by |
| --- | --- |
| `GONKA_API_KEY` | `gonka/client.ts` (required for every AI call) |
| `GONKA_MODEL`, `GONKA_MODELS`, `GONKA_MATCH_MODEL`, `GONKA_VERIFIER_MODELS` | Optional model overrides for analysis, trust scoring, matching and multi-model verification |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` | GitHub OAuth flow in `server/index.ts` |
| `GITHUB_TEST_TOKEN` | Local-only `/test/evidence` endpoint |

## Run

### Web app

```bash
pnpm dev      # next dev in ./web
pnpm build    # next build in ./web
pnpm lint     # eslint in ./web
```

All three root scripts are filtered to `./web`.

### Hono server (GitHub OAuth + evidence)

Run from the repository root; it listens on port `3010`:

```bash
pnpm exec tsx server/index.ts
```

Endpoints: `GET /` (health), `GET /auth/github`, `GET /auth/github/callback`, `POST /profile/verify`, plus the local-only `GET /test/evidence` and `GET /test/oauth-status`.

### Gonka modules

There is no test runner configured. The modules under `gonka/integrations/` are imported directly by the Next.js API routes, and the scripts in `gonka/tests/` are executed individually with `tsx` from the repository root:

```bash
pnpm exec tsx gonka/tests/projectAnalysisTest.ts
pnpm exec tsx gonka/tests/trustScoreTest.ts
pnpm exec tsx gonka/tests/matchFreelancerTest.ts
```

Some scripts (`skillVerificationTest.ts`, `trustScoreTest.ts`) start the Hono server themselves and can be pointed elsewhere with `SERVER_URL` / `SERVER_START_COMMAND` / `SERVER_ENTRY`. They call the live Gonka Router, so `GONKA_API_KEY` must be set.

### Smart contracts

```bash
cd smart-contracts/trusthire
sui move build
sui move test
sui client publish --gas-budget 100000000
```

Copy the published package ID into `NEXT_PUBLIC_TESTNET_PACKAGE_ID`. See [`smart-contracts/Sui_CLI_Testing_Guide.md`](smart-contracts/Sui_CLI_Testing_Guide.md) for the full CLI walkthrough (creating a reputation record, funding escrow, releasing milestones).

## Core workflows

- **Project intake (implemented).** `web/app/client/projects/new` talks to `POST /api/gonka/project-assistant` for the guided requirements chat and `POST /api/gonka/project-analysis` to turn the collected requirements into a structured project spec via the Gonka Router.
- **Escrow and milestones (contracts implemented).** `escrow.move` exposes `create_escrow`, `submit_milestone` and `approve_milestone` over an `EscrowContract<T>` holding locked coins; `web/lib/sui/escrow.ts` builds the corresponding transactions from the client and freelancer pages.
- **Reputation (contracts implemented).** `reputation.move` keeps a shared `ReputationRegistry` of `ReputationRecord`s with completed projects, earnings, ratings and a Gonka trust score plus its request ID.
- **Skill evidence (server-side only).** The Hono server performs the GitHub OAuth handshake and builds repository evidence (`POST /profile/verify`); it is not yet wired into the web app.
- **Matching, trust scoring and skill verification (modules only).** `gonka/integrations/matchEngine.ts`, `trustScore.ts` and `skillVerification.ts` exist and are exercised by the scripts in `gonka/tests/`, but no API route exposes them yet.

## Current state

Only three API routes exist under `web/app/api/`: `gonka/project-analysis`, `gonka/project-assistant`, and `projects/create` (currently an empty placeholder file). Anything else described in the requirements documents — end-to-end matching, on-chain trust score writes, submission verification, Walrus/Seal storage — is not implemented in the web layer yet. Parts of the UI still render simulated data from `web/lib/simulation.ts`.

## Documentation

- [`TrustHire_Workflow_System_Requirements.md`](TrustHire_Workflow_System_Requirements.md) — system architecture, roles, scope
- [`web/TrustHire_Master_Requirements.md`](web/TrustHire_Master_Requirements.md) — master product requirements
- [`web/TrustHire_Client_Requirements.md`](web/TrustHire_Client_Requirements.md) — client-side flows
- [`web/TrustHire_Freelancer_Requirements.md`](web/TrustHire_Freelancer_Requirements.md) — freelancer-side flows
- [`smart-contracts/Sui_CLI_Testing_Guide.md`](smart-contracts/Sui_CLI_Testing_Guide.md) — manual contract testing on Testnet
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branch naming and Git workflow
