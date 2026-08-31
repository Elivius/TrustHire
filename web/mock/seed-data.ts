import {
  User,
  ClientProfile,
  FreelancerProfile,
  Project,
  Milestone,
  Invitation,
  Application,
  SavedProject,
  Notification,
  OnChainTransaction,
  Rating
} from "@/types";

export const SEED_USERS: User[] = [
  {
    id: "user-client-1",
    name: "Elena Vance",
    email: "elena@vanceholdings.xyz",
    roles: ["client"],
    walletAddress: "0x4f2a91...9a2c",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    companyName: "Nexus Web3 Labs"
  },
  {
    id: "user-free-1",
    name: "Alex Rivera",
    email: "alex.dev@trusthire.io",
    roles: ["freelancer"],
    walletAddress: "0x8e3b22...4c19",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "user-free-2",
    name: "Sarah Chen",
    email: "sarah.chen@sui.design",
    roles: ["freelancer"],
    walletAddress: "0x3a19ff...bb82",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "user-free-3",
    name: "Devon Thorne",
    email: "devon@move-audits.io",
    roles: ["freelancer"],
    walletAddress: "0x91cc45...20d3",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "user-free-4",
    name: "Aria Sterling",
    email: "aria@crypto-copy.ai",
    roles: ["freelancer"],
    walletAddress: "0x12bb99...77a1",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "user-free-5",
    name: "Kenji Sato",
    email: "kenji@frontend-arch.dev",
    roles: ["freelancer"],
    walletAddress: "0x44dd12...990a",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "user-free-6",
    name: "Priya Sharma",
    email: "priya@tokenomics.xyz",
    roles: ["freelancer"],
    walletAddress: "0x66bb88...11cc",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "user-free-7",
    name: "Lucas Meyer",
    email: "lucas@fullstack-rust.de",
    roles: ["freelancer"],
    walletAddress: "0x77aa22...33ee",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "user-free-8",
    name: "Maya Lin",
    email: "maya@defi-ux.com",
    roles: ["freelancer"],
    walletAddress: "0x55ee11...99ff",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  }
];

export const SEED_CLIENT_PROFILES: Record<string, ClientProfile> = {
  "user-client-1": {
    userId: "user-client-1",
    companyName: "Nexus Web3 Labs",
    bio: "Building decentralized coordination and automated liquidity tools on Sui.",
    hiringCategories: ["Web Development", "Smart Contracts", "Design"],
    typicalBudgetRange: "2k-10k"
  }
};

export const SEED_FREELANCER_PROFILES: Record<string, FreelancerProfile> = {
  "user-free-1": {
    userId: "user-free-1",
    headline: "Senior Move & Full-Stack React Engineer",
    bio: "5+ years in Web3. Specialized in Sui Move smart contract design, TypeScript SDK integration, and high-performance React frontends. Delivered 14+ on-chain milestone contracts with zero vulnerabilities.",
    skills: ["React", "Next.js", "TypeScript", "Sui Move", "Smart Contracts", "Tailwind CSS"],
    experienceLevel: "Expert",
    portfolioLinks: [
      { title: "Sui DEX Liquidity Router", url: "https://github.com/example/sui-dex-router" },
      { title: "Gonka AI Oracle Interface", url: "https://gonka-interface.vercel.app" },
      { title: "Decentralized Escrow SDK", url: "https://crates.io/crates/sui-escrow" }
    ],
    trustScore: 96,
    trustScoreConfidence: "High",
    trustScoreReasoning: [
      { label: "Profile completeness", note: "100% verified credentials, wallet bound, rich portfolio history." },
      { label: "On-chain track record", note: "14 successfully released Sui milestones with 0 dispute flags." },
      { label: "On-time delivery", note: "98% on-time delivery rate across all historical contracts." },
      { label: "AI Verification match", note: "Gonka code pattern analysis verified top 2% Rust/Move idiom proficiency." }
    ],
    trustScoreRequestId: "gonka_req_89ab34ef",
    trustScoreUpdatedAt: "2026-08-20T10:15:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 14,
    onTimeDeliveryPct: 98,
    averageRating: 4.95
  },
  "user-free-2": {
    userId: "user-free-2",
    headline: "Lead Web3 Product & Interaction Designer",
    bio: "Crafting intuitive UX for complex DeFi and AI protocols. Designed design systems for 3 major Sui dApps.",
    skills: ["UI/UX", "Figma", "Design Systems", "Tailwind CSS", "Prototyping"],
    experienceLevel: "Expert",
    portfolioLinks: [
      { title: "DeFi Yield Aggregator Figma", url: "https://figma.com/@sarahchen/defi-ui" },
      { title: "TrustHire Mobile Concept", url: "https://dribbble.com/sarahchen" }
    ],
    trustScore: 92,
    trustScoreConfidence: "High",
    trustScoreReasoning: [
      { label: "Profile completeness", note: "Verified design portfolio and multiple public Figma assets." },
      { label: "Client satisfaction", note: "Consistent 5-star ratings on frontend collaboration." }
    ],
    trustScoreRequestId: "gonka_req_47cd1122",
    trustScoreUpdatedAt: "2026-08-22T14:30:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 9,
    onTimeDeliveryPct: 95,
    averageRating: 4.9
  },
  "user-free-3": {
    userId: "user-free-3",
    headline: "Sui Move Smart Contract Auditor & Architect",
    bio: "Security-focused Move developer. Audited over $20M in TVL on Sui mainnet. Formal verification specialist.",
    skills: ["Sui Move", "Smart Contracts", "Rust", "Security Audit", "Formal Verification"],
    experienceLevel: "Expert",
    portfolioLinks: [
      { title: "Move Vulnerability Database", url: "https://github.com/devon/move-audit-db" }
    ],
    trustScore: 98,
    trustScoreConfidence: "High",
    trustScoreReasoning: [
      { label: "Security certification", note: "Top ranked security contributor in Sui ecosystem." },
      { label: "Escrow reliability", note: "100% dispute-free milestone history." }
    ],
    trustScoreRequestId: "gonka_req_10ef9933",
    trustScoreUpdatedAt: "2026-08-18T09:00:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 18,
    onTimeDeliveryPct: 100,
    averageRating: 5.0
  },
  "user-free-4": {
    userId: "user-free-4",
    headline: "AI & Web3 Technical Content Strategist",
    bio: "Translating cutting-edge cryptography and AI agent routing into compelling technical documentation, blogs, and tutorials.",
    skills: ["Copywriting", "Technical Writing", "Marketing", "Documentation", "SEO"],
    experienceLevel: "Intermediate",
    portfolioLinks: [
      { title: "Gonka Protocol Whitepaper Summary", url: "https://medium.com/@aria/gonka-ai" }
    ],
    trustScore: 88,
    trustScoreConfidence: "Medium",
    trustScoreReasoning: [
      { label: "Content accuracy", note: "Peer-reviewed technical guides with high community acclaim." }
    ],
    trustScoreRequestId: "gonka_req_77aa0011",
    trustScoreUpdatedAt: "2026-08-25T11:20:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 6,
    onTimeDeliveryPct: 92,
    averageRating: 4.8
  },
  "user-free-5": {
    userId: "user-free-5",
    headline: "Frontend Architecture & WebGL Developer",
    bio: "Building buttery-smooth Web3 frontends with Framer Motion, Three.js, and Next.js App Router.",
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js"],
    experienceLevel: "Expert",
    portfolioLinks: [
      { title: "3D Sui Explorer Visualization", url: "https://kenji-sui3d.vercel.app" }
    ],
    trustScore: 94,
    trustScoreConfidence: "High",
    trustScoreReasoning: [
      { label: "Performance score", note: "100 Lighthouse performance on all shipped frontend milestones." }
    ],
    trustScoreRequestId: "gonka_req_33bb6677",
    trustScoreUpdatedAt: "2026-08-21T16:45:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 11,
    onTimeDeliveryPct: 96,
    averageRating: 4.92
  },
  "user-free-6": {
    userId: "user-free-6",
    headline: "Tokenomics & Economic Modeling Analyst",
    bio: "Mathematical simulation of bonding curves, staking incentives, and DAO governance parameters.",
    skills: ["Smart Contracts", "Python", "Economic Modeling", "Tokenomics", "Data Analysis"],
    experienceLevel: "Intermediate",
    portfolioLinks: [
      { title: "Dynamic Escrow Fee Simulator", url: "https://github.com/priya/escrow-sim" }
    ],
    trustScore: 86,
    trustScoreConfidence: "Medium",
    trustScoreReasoning: [
      { label: "Mathematical rigor", note: "Simulations verified against historical AMM volume data." }
    ],
    trustScoreRequestId: "gonka_req_99ee2244",
    trustScoreUpdatedAt: "2026-08-19T13:10:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 5,
    onTimeDeliveryPct: 90,
    averageRating: 4.75
  },
  "user-free-7": {
    userId: "user-free-7",
    headline: "Rust & Distributed Systems Engineer",
    bio: "Low-level protocol engineer. Experienced in Sui RPC indexing, custom WebSocket streaming, and Rust backends.",
    skills: ["Rust", "Sui Move", "Distributed Systems", "TypeScript", "WebSocket"],
    experienceLevel: "Expert",
    portfolioLinks: [
      { title: "Fast Sui Event Indexer", url: "https://github.com/lucasmeyer/sui-indexer" }
    ],
    trustScore: 95,
    trustScoreConfidence: "High",
    trustScoreReasoning: [
      { label: "Code throughput", note: "High concurrency benchmarks independently reproduced." }
    ],
    trustScoreRequestId: "gonka_req_66cc8899",
    trustScoreUpdatedAt: "2026-08-23T15:00:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 12,
    onTimeDeliveryPct: 97,
    averageRating: 4.94
  },
  "user-free-8": {
    userId: "user-free-8",
    headline: "UX Researcher & Design System Architect",
    bio: "Designing friction-free onboarding and complex multi-step DeFi transaction modals.",
    skills: ["UI/UX", "Figma", "User Research", "Design Systems"],
    experienceLevel: "Intermediate",
    portfolioLinks: [
      { title: "Web3 Onboarding Case Study", url: "https://mayalin.design/web3-onboarding" }
    ],
    trustScore: 89,
    trustScoreConfidence: "Medium",
    trustScoreReasoning: [
      { label: "UX benchmark", note: "Demonstrated 35% improvement in user task completion." }
    ],
    trustScoreRequestId: "gonka_req_1234abcd",
    trustScoreUpdatedAt: "2026-08-24T18:00:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 7,
    onTimeDeliveryPct: 94,
    averageRating: 4.85
  }
};

export const SEED_PROJECTS: Project[] = [
  {
    id: "proj-1",
    clientId: "user-client-1",
    title: "Sui Move Smart Escrow Contract & Indexer",
    descriptionRaw: "We need a production-grade Sui Move smart contract capable of multi-milestone escrow locking, automated release conditions, and dispute arbitration hooks. Must include unit tests, testnet deployment scripts, and a lightweight TypeScript event listener.",
    requiredSkills: ["Sui Move", "Smart Contracts", "TypeScript", "Rust"],
    estimatedBudget: 4500,
    timelineDays: 21,
    status: "in_progress",
    matchedFreelancerId: "user-free-1",
    gonkaParseRequestId: "gonka_req_a1b2c3d4",
    escrowObjectId: "0x9182...fa01",
    escrowTxHash: "0x8f2a1100bb43",
    createdAt: "2026-08-15T09:00:00.000Z",
    updatedAt: "2026-08-27T14:20:00.000Z"
  },
  {
    id: "proj-2",
    clientId: "user-client-1",
    title: "AI Talent Matching Dashboard & Interactive Analytics",
    descriptionRaw: "Build a sleek Next.js 15 App Router frontend with Framer Motion animations for displaying AI-recommended candidates, match score breakdown charts, and milestone tracking panels. Dark mode by default.",
    requiredSkills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "UI/UX"],
    estimatedBudget: 3200,
    timelineDays: 14,
    status: "open",
    gonkaParseRequestId: "gonka_req_e5f6g7h8",
    createdAt: "2026-08-26T11:00:00.000Z",
    updatedAt: "2026-08-26T11:00:00.000Z"
  },
  {
    id: "proj-3",
    clientId: "user-client-1",
    title: "DeFi Liquidity Pool Visualizer & Staking UI",
    descriptionRaw: "Design and implement a dynamic yield analytics dashboard connecting with Sui RPC to monitor automated market maker depth and historical APY.",
    requiredSkills: ["React", "TypeScript", "Tailwind CSS", "Figma"],
    estimatedBudget: 2800,
    timelineDays: 12,
    status: "matched",
    matchedFreelancerId: "user-free-5",
    gonkaParseRequestId: "gonka_req_99887766",
    createdAt: "2026-08-22T08:30:00.000Z",
    updatedAt: "2026-08-28T10:00:00.000Z"
  },
  {
    id: "proj-4",
    clientId: "user-client-1",
    title: "Gonka AI Protocol Security Audit & Gas Optimization",
    descriptionRaw: "Comprehensive audit of our core routing contracts on Sui. Verify object capability ownership, access control invariants, and optimize gas consumption for batch transactions.",
    requiredSkills: ["Sui Move", "Smart Contracts", "Security Audit", "Formal Verification"],
    estimatedBudget: 6000,
    timelineDays: 10,
    status: "completed",
    matchedFreelancerId: "user-free-3",
    gonkaParseRequestId: "gonka_req_11223344",
    escrowObjectId: "0x3344...bb99",
    escrowTxHash: "0x44dd1122aa77",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-12T17:00:00.000Z"
  },
  {
    id: "proj-5",
    clientId: "user-client-1",
    title: "Web3 Technical Documentation & Developer Guides",
    descriptionRaw: "Draft comprehensive API documentation, quickstart tutorials, and sample repo guides for developers integrating our smart escrow SDK.",
    requiredSkills: ["Technical Writing", "Documentation", "TypeScript", "Copywriting"],
    estimatedBudget: 1500,
    timelineDays: 7,
    status: "draft",
    createdAt: "2026-08-28T16:00:00.000Z",
    updatedAt: "2026-08-28T16:00:00.000Z"
  },
  {
    id: "proj-6",
    clientId: "user-client-1",
    title: "Cross-Chain Asset Bridge Prototype on Sui",
    descriptionRaw: "Create a verified proof-of-concept for cross-chain message attestation and escrow locking using Gonka oracle triggers.",
    requiredSkills: ["Sui Move", "Rust", "TypeScript", "Smart Contracts"],
    estimatedBudget: 5500,
    timelineDays: 25,
    status: "open",
    gonkaParseRequestId: "gonka_req_55667788",
    createdAt: "2026-08-27T15:30:00.000Z",
    updatedAt: "2026-08-27T15:30:00.000Z"
  }
];

export const SEED_MILESTONES: Milestone[] = [
  // For proj-1 (in_progress with Alex Rivera user-free-1)
  {
    id: "ms-1-1",
    projectId: "proj-1",
    title: "Architecture & Move Module Core Structs",
    deliverable: "Escrow smart contract architecture spec, core resource structs, capability patterns, and test harness.",
    amount: 1500,
    percentOfBudget: 33.33,
    deadline: "2026-08-20T23:59:59.000Z",
    status: "released",
    submissionContent: "Completed initial Move module with `Escrow<T>` object definitions, fee sharing caps, and unit test suite achieving 100% branch coverage.",
    submissionLinks: ["https://github.com/nexus-web3/escrow-core/pull/1"],
    onChainTxHash: "0x12fa9988bb11",
    submittedAt: "2026-08-19T14:00:00.000Z",
    releasedAt: "2026-08-20T16:30:00.000Z"
  },
  {
    id: "ms-1-2",
    projectId: "proj-1",
    title: "Milestone Release Logic & Dispute Safety Hooks",
    deliverable: "Implementation of partial payouts, automated release timers, dispute freeze state, and multi-sig authorization.",
    amount: 1500,
    percentOfBudget: 33.33,
    deadline: "2026-08-29T23:59:59.000Z",
    status: "submitted", // currently awaiting client review!
    submissionContent: "Implemented all release conditions, dispute arbitration gates, and gas-efficient batch settlement functions. Deployed to Sui Testnet Package ID: 0x4f20...aa99.",
    submissionLinks: [
      "https://github.com/nexus-web3/escrow-core/pull/2",
      "https://suiscan.xyz/testnet/object/0x4f20aa9911bb"
    ],
    submittedAt: "2026-08-28T18:45:00.000Z"
  },
  {
    id: "ms-1-3",
    projectId: "proj-1",
    title: "TypeScript SDK, Testnet Integration & Documentation",
    deliverable: "Complete NPM package wrapper for contract calls, event subscription listener, and interactive usage guide.",
    amount: 1500,
    percentOfBudget: 33.34,
    deadline: "2026-09-05T23:59:59.000Z",
    status: "pending"
  },

  // For proj-2 (open project)
  {
    id: "ms-2-1",
    projectId: "proj-2",
    title: "UI Design System & Core Dashboard Layout",
    deliverable: "Responsive layouts, dark theme tokens, glass cards, and sidebar navigation.",
    amount: 1200,
    percentOfBudget: 37.5,
    deadline: "2026-09-03T23:59:59.000Z",
    status: "pending"
  },
  {
    id: "ms-2-2",
    projectId: "proj-2",
    title: "AI Match Score Breakdown & Candidate Review Flow",
    deliverable: "Interactive candidate cards, Gonka reasoning modals, and invitation actions.",
    amount: 1000,
    percentOfBudget: 31.25,
    deadline: "2026-09-08T23:59:59.000Z",
    status: "pending"
  },
  {
    id: "ms-2-3",
    projectId: "proj-2",
    title: "Milestone Management & Sui Escrow Integration Views",
    deliverable: "Milestone submission modals, proof of release transaction cards, and review actions.",
    amount: 1000,
    percentOfBudget: 31.25,
    deadline: "2026-09-12T23:59:59.000Z",
    status: "pending"
  },

  // For proj-3 (matched with Kenji Sato user-free-5)
  {
    id: "ms-3-1",
    projectId: "proj-3",
    title: "Interactive WebGL Liquidity Charts",
    deliverable: "High performance rendering of pool depth and order book distribution.",
    amount: 1400,
    percentOfBudget: 50,
    deadline: "2026-09-04T23:59:59.000Z",
    status: "pending"
  },
  {
    id: "ms-3-2",
    projectId: "proj-3",
    title: "Live Sui RPC Data Hookup & Wallet Actions",
    deliverable: "Real-time pool data subscription, swap simulation, and LP position management.",
    amount: 1400,
    percentOfBudget: 50,
    deadline: "2026-09-10T23:59:59.000Z",
    status: "pending"
  },

  // For proj-4 (completed with Devon Thorne user-free-3)
  {
    id: "ms-4-1",
    projectId: "proj-4",
    title: "Formal Move Contract Vulnerability Assessment",
    deliverable: "Line-by-line manual code review and formal verification model.",
    amount: 3000,
    percentOfBudget: 50,
    deadline: "2026-08-06T23:59:59.000Z",
    status: "released",
    submissionContent: "Full audit report generated. 2 minor gas issues identified and resolved. 0 critical vulnerabilities.",
    submissionLinks: ["https://reports.move-audits.io/nexus-escrow-final.pdf"],
    onChainTxHash: "0x44aa882200ff",
    submittedAt: "2026-08-05T12:00:00.000Z",
    releasedAt: "2026-08-06T15:00:00.000Z"
  },
  {
    id: "ms-4-2",
    projectId: "proj-4",
    title: "Gas Optimization & Testnet Hardening Verification",
    deliverable: "Refactored byte vector allocations and signed deployment proof.",
    amount: 3000,
    percentOfBudget: 50,
    deadline: "2026-08-12T23:59:59.000Z",
    status: "released",
    submissionContent: "Gas usage reduced by 28% across all transfer functions. Final verification passed.",
    submissionLinks: ["https://github.com/nexus-web3/escrow-core/releases/tag/v1.0.0"],
    onChainTxHash: "0x77ee99112233",
    submittedAt: "2026-08-11T16:00:00.000Z",
    releasedAt: "2026-08-12T17:00:00.000Z"
  }
];

export const SEED_INVITATIONS: Invitation[] = [
  {
    id: "inv-1",
    projectId: "proj-2",
    freelancerId: "user-free-1",
    status: "pending",
    invitedAt: "2026-08-27T10:00:00.000Z"
  },
  {
    id: "inv-2",
    projectId: "proj-2",
    freelancerId: "user-free-2",
    status: "pending",
    invitedAt: "2026-08-27T11:30:00.000Z"
  },
  {
    id: "inv-3",
    projectId: "proj-3",
    freelancerId: "user-free-5",
    status: "accepted",
    invitedAt: "2026-08-24T09:00:00.000Z"
  }
];

export const SEED_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    projectId: "proj-2",
    freelancerId: "user-free-5",
    status: "pending",
    coverNote: "Hi Elena! I have built 4 similar Web3 dashboards using Next.js 15, Framer Motion, and Tailwind. I can deliver a crisp, responsive, glass-themed prototype ahead of schedule.",
    appliedAt: "2026-08-27T14:20:00.000Z"
  },
  {
    id: "app-2",
    projectId: "proj-2",
    freelancerId: "user-free-8",
    status: "pending",
    coverNote: "I'd love to help design and implement the user onboarding and candidate match flows. I specialize in accessible, high-converting UX components.",
    appliedAt: "2026-08-28T09:10:00.000Z"
  },
  {
    id: "app-3",
    projectId: "proj-6",
    freelancerId: "user-free-7",
    status: "pending",
    coverNote: "I have deep experience with Sui cross-chain messaging and indexing. Would be excited to build this proof of concept.",
    appliedAt: "2026-08-28T16:00:00.000Z"
  }
];

export const SEED_SAVED_PROJECTS: SavedProject[] = [
  {
    freelancerId: "user-free-1",
    projectId: "proj-2",
    savedAt: "2026-08-27T12:00:00.000Z"
  },
  {
    freelancerId: "user-free-1",
    projectId: "proj-6",
    savedAt: "2026-08-28T10:00:00.000Z"
  }
];

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    userId: "user-client-1",
    type: "milestone_submitted",
    text: "Marcus Vance (Alex) submitted 'Milestone Release Logic & Dispute Safety Hooks' — awaiting your review",
    linkTo: "/project/proj-1/workspace",
    createdAt: "2026-08-28T18:45:00.000Z",
    read: false
  },
  {
    id: "notif-2",
    userId: "user-client-1",
    type: "application_received",
    text: "New application received for 'AI Talent Matching Dashboard' from Kenji Sato",
    linkTo: "/project/proj-2/candidates",
    createdAt: "2026-08-27T14:20:00.000Z",
    read: false
  },
  {
    id: "notif-3",
    userId: "user-client-1",
    type: "invitation_response",
    text: "Kenji Sato accepted your invitation to 'DeFi Liquidity Pool Visualizer'",
    linkTo: "/project/proj-3",
    createdAt: "2026-08-28T10:00:00.000Z",
    read: true
  },
  {
    id: "notif-4",
    userId: "user-client-1",
    type: "escrow_funded",
    text: "Escrow funded ($4,500 USDC) for 'Sui Move Smart Escrow Contract & Indexer'",
    linkTo: "/client/escrow",
    createdAt: "2026-08-15T09:30:00.000Z",
    read: true
  },
  {
    id: "notif-5",
    userId: "user-free-1",
    type: "invitation_received",
    text: "New invitation from Elena Vance for 'AI Talent Matching Dashboard & Interactive Analytics'",
    linkTo: "/freelancer/applications",
    createdAt: "2026-08-27T10:00:00.000Z",
    read: false
  },
  {
    id: "notif-6",
    userId: "user-free-1",
    type: "milestone_released",
    text: "Milestone 'Architecture & Move Module Core Structs' approved — $1,500 USDC released to your wallet",
    linkTo: "/freelancer/earnings",
    createdAt: "2026-08-20T16:30:00.000Z",
    read: true
  },
  {
    id: "notif-7",
    userId: "user-free-1",
    type: "trust_score_updated",
    text: "Your Trust Score was recalculated to 96 (Confidence: High) by Gonka AI",
    linkTo: "/freelancer/profile",
    createdAt: "2026-08-20T10:15:00.000Z",
    read: true
  }
];

export const SEED_TRANSACTIONS: OnChainTransaction[] = [
  {
    id: "tx-1",
    txHash: "0x8f2a1100bb43",
    type: "escrow_created",
    projectId: "proj-1",
    projectTitle: "Sui Move Smart Escrow Contract & Indexer",
    amount: 4500,
    fromAddress: "0x4f2a91...9a2c",
    toAddress: "0x9182...fa01 (Escrow Object)",
    timestamp: "2026-08-15T09:30:00.000Z",
    status: "confirmed"
  },
  {
    id: "tx-2",
    txHash: "0x12fa9988bb11",
    type: "milestone_released",
    projectId: "proj-1",
    projectTitle: "Sui Move Smart Escrow Contract & Indexer",
    milestoneTitle: "Architecture & Move Module Core Structs",
    amount: 1500,
    fromAddress: "0x9182...fa01 (Escrow Object)",
    toAddress: "0x8e3b22...4c19 (Marcus Vance)",
    timestamp: "2026-08-20T16:30:00.000Z",
    status: "confirmed"
  },
  {
    id: "tx-3",
    txHash: "0x44dd1122aa77",
    type: "escrow_created",
    projectId: "proj-4",
    projectTitle: "Gonka AI Protocol Security Audit & Gas Optimization",
    amount: 6000,
    fromAddress: "0x4f2a91...9a2c",
    toAddress: "0x3344...bb99 (Escrow Object)",
    timestamp: "2026-08-01T10:15:00.000Z",
    status: "confirmed"
  },
  {
    id: "tx-4",
    txHash: "0x44aa882200ff",
    type: "milestone_released",
    projectId: "proj-4",
    projectTitle: "Gonka AI Protocol Security Audit & Gas Optimization",
    milestoneTitle: "Formal Move Contract Vulnerability Assessment",
    amount: 3000,
    fromAddress: "0x3344...bb99 (Escrow Object)",
    toAddress: "0x91cc45...20d3 (Devon Thorne)",
    timestamp: "2026-08-06T15:00:00.000Z",
    status: "confirmed"
  },
  {
    id: "tx-5",
    txHash: "0x77ee99112233",
    type: "milestone_released",
    projectId: "proj-4",
    projectTitle: "Gonka AI Protocol Security Audit & Gas Optimization",
    milestoneTitle: "Gas Optimization & Testnet Hardening Verification",
    amount: 3000,
    fromAddress: "0x3344...bb99 (Escrow Object)",
    toAddress: "0x91cc45...20d3 (Devon Thorne)",
    timestamp: "2026-08-12T17:00:00.000Z",
    status: "confirmed"
  }
];

export const SEED_RATINGS: Rating[] = [
  {
    projectId: "proj-4",
    freelancerId: "user-free-3",
    clientId: "user-client-1",
    stars: 5,
    comment: "Outstanding audit depth. Devon found critical edge cases before testnet deployment and helped optimize gas by nearly 30%.",
    ratedAt: "2026-08-12T17:30:00.000Z"
  }
];
