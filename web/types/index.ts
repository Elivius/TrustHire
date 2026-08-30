export type UserRole = "client" | "freelancer";

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];        // can hold both
  walletAddress?: string;   // set once "Connect Wallet" is simulated
  avatarUrl?: string;
  companyName?: string;     // quick helper
}

export interface ClientProfile {
  userId: string;
  companyName?: string;
  bio?: string;
  hiringCategories: string[];   // e.g. ['Web Development', 'Design']
  typicalBudgetRange?: "<500" | "500-2k" | "2k-10k" | "10k+";
}

export interface FreelancerProfile {
  userId: string;
  headline: string;
  bio: string;
  skills: string[];
  experienceLevel: "Beginner" | "Intermediate" | "Expert";
  portfolioLinks: { title: string; url: string }[];
  trustScore: number;                // 0-100
  trustScoreConfidence: "Low" | "Medium" | "High";
  trustScoreReasoning: { label: string; note: string }[]; // e.g. [{label:'Profile completeness', note:'...'}]
  trustScoreRequestId: string;
  trustScoreUpdatedAt: string;       // ISO date
  isDiscoverable: boolean;            // privacy toggle, Settings
  completedProjectsCount: number;
  onTimeDeliveryPct: number;
  averageRating: number;              // 0-5
}

export type ProjectStatus = "draft" | "open" | "matched" | "in_progress" | "completed";

export type MilestoneStatus = "pending" | "submitted" | "changes_requested" | "approved" | "released" | "disputed";

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  deliverable: string;
  amount: number;
  percentOfBudget: number;
  deadline: string; // ISO date
  status: MilestoneStatus;
  submissionContent?: string;
  submissionLinks?: string[];
  revisionNote?: string;      // set when status = changes_requested
  disputeReason?: string;     // set when status = disputed
  onChainTxHash?: string;     // set once released
  submittedAt?: string;
  releasedAt?: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  descriptionRaw: string;
  requiredSkills: string[];
  estimatedBudget: number;
  timelineDays: number;
  status: ProjectStatus;
  matchedFreelancerId?: string;
  gonkaParseRequestId?: string;
  escrowObjectId?: string;
  escrowTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  projectId: string;
  freelancerId: string;
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
}

export interface Application {
  id: string;
  projectId: string;
  freelancerId: string;
  status: "pending" | "accepted" | "declined";
  coverNote?: string;
  appliedAt: string;
}

export interface SavedProject {
  freelancerId: string;
  projectId: string;
  savedAt: string;
}

export interface AiMatchResult {
  requestId: string;
  matchScore: number;      // 0-100
  reasoning: string;
}

export interface Rating {
  projectId: string;
  freelancerId: string;
  clientId: string;
  stars: number;   // 1-5
  comment?: string;
  ratedAt: string;
}

export type NotificationType =
  | "invitation_received"
  | "invitation_response"
  | "application_received"
  | "application_response"
  | "new_recommendation"
  | "trust_score_updated"
  | "milestone_submitted"
  | "changes_requested"
  | "milestone_released"
  | "dispute_flagged"
  | "escrow_funded";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  text: string;
  linkTo: string;      // route to open on click
  createdAt: string;
  read: boolean;
}

export interface OnChainTransaction {
  id: string;
  txHash: string;
  type: "escrow_created" | "milestone_released" | "dispute_opened";
  projectId: string;
  projectTitle: string;
  milestoneTitle?: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  status: "confirmed" | "failed";
}
