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

// Keep SEED Users as we need some mock user as telent pool - same goes to client and freelancer
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

export const SEED_PROJECTS: Project[] = [];

export const SEED_MILESTONES: Milestone[] = [];

export const SEED_INVITATIONS: Invitation[] = [];

export const SEED_APPLICATIONS: Application[] = [];

export const SEED_SAVED_PROJECTS: SavedProject[] = [];

export const SEED_NOTIFICATIONS: Notification[] = [];

export const SEED_TRANSACTIONS: OnChainTransaction[] = [];

export const SEED_RATINGS: Rating[] = [];
