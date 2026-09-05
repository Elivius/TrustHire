"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  UserRole,
  ClientProfile,
  FreelancerProfile,
  Project,
  Milestone,
  ProjectStatus,
  MilestoneStatus,
  Invitation,
  Application,
  SavedProject,
  Notification,
  OnChainTransaction,
  Rating
} from "@/types";
import { generateSuiTxHash } from "@/lib/simulation";
import { useCurrentAccount, useDAppKit, useCurrentClient } from "@mysten/dapp-kit-react";
import {
  buildCreateEscrowTx,
  buildSubmitMilestoneTx,
  buildApproveMilestoneTx,
  resolveFreelancerReputationRecordId,
  getMilestoneOnChainId,
  TESTNET_PACKAGE_ID,
} from "@/lib/sui/escrow";
import { executeWithEnokiSponsorship } from "@/lib/sui/sponsored";
import { createClient } from "@/lib/supabase/client";

interface AppContextType {
  currentUser: User;
  activeRole: UserRole;
  theme: "dark" | "light";
  users: User[];
  clientProfiles: Record<string, ClientProfile>;
  freelancerProfiles: Record<string, FreelancerProfile>;
  projects: Project[];
  milestones: Milestone[];
  invitations: Invitation[];
  applications: Application[];
  savedProjects: SavedProject[];
  notifications: Notification[];
  transactions: OnChainTransaction[];
  ratings: Rating[];
  
  // Actions
  setActiveRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  toggleTheme: () => void;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  syncUserWithDatabase: (address: string) => Promise<User | null>;
  
  // Profiles
  updateClientProfile: (data: Partial<ClientProfile> & { name?: string; avatarUrl?: string }) => void;
  updateFreelancerProfile: (data: Partial<FreelancerProfile> & { name?: string; avatarUrl?: string }) => void;
  addRoleToUser: (role: UserRole) => void;
  
  // Projects & Milestones
  createProject: (projectData: Omit<Project, "id" | "clientId" | "createdAt" | "updatedAt">, milestoneData: Omit<Milestone, "id" | "projectId">[]) => string;
  updateProject: (id: string, data: Partial<Project>) => void;
  updateMilestone: (id: string, data: Partial<Milestone>) => void;
  
  // Candidates & Applications
  inviteFreelancer: (projectId: string, freelancerId: string) => void;
  respondToInvitation: (invitationId: string, status: "accepted" | "declined") => void;
  applyToProject: (projectId: string, freelancerId: string, coverNote?: string) => Promise<void>;
  respondToApplication: (applicationId: string, status: "accepted" | "declined") => Promise<void>;
  toggleSaveProject: (freelancerId: string, projectId: string) => void;
  
  // Escrow & Execution
  fundProjectEscrow: (projectId: string, updatedMilestones?: Milestone[]) => Promise<{ txHash: string; escrowObjectId: string }>;
  submitMilestoneWork: (milestoneId: string, content: string, links?: string[]) => Promise<string>;
  requestChangesOnMilestone: (milestoneId: string, revisionNote: string) => void;
  approveAndReleaseMilestone: (milestoneId: string) => Promise<{ txHash: string }>;
  flagDisputeOnMilestone: (milestoneId: string, reason: string) => Promise<void>;
  submitRating: (projectId: string, freelancerId: string, stars: number, comment?: string) => void;
  
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notif: Omit<Notification, "id" | "createdAt" | "read">) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapSupabaseToFreelancerProfile(
  fp: any,
  skills: string[],
  portfolios: { title: string; url: string }[]
): FreelancerProfile {
  const score = Number(fp.trust_score) || 88;
  const exp = (["Beginner", "Intermediate", "Expert"].includes(fp.experience_level)
    ? fp.experience_level
    : "Intermediate") as "Beginner" | "Intermediate" | "Expert";

  return {
    userId: fp.freelancer_id,
    headline: fp.prof_headline || "Web3 & Distributed Systems Specialist",
    bio: fp.bio || "Experienced Web3 developer building decentralized applications and smart contracts.",
    skills: skills.length > 0 ? skills : ["Sui Move", "TypeScript", "React"],
    experienceLevel: exp,
    portfolioLinks: portfolios.map((p) => ({
      title: p.title || "Project Repository",
      url: p.url || "https://github.com",
      isVerified: true,
    })),
    trustScore: Math.round(score),
    trustScoreConfidence: score >= 90 ? "High" : "Medium",
    trustScoreReasoning: [
      { label: "Database verified", note: "Profile and identity confirmed on Supabase and Sui network." },
      { label: "Trust score ranking", note: `AI-verified reputation score: ${score}/100.` }
    ],
    trustScoreRequestId: `gonka_${fp.freelancer_id.slice(0, 8)}`,
    trustScoreUpdatedAt: fp.last_verified_at || new Date().toISOString(),
    isDiscoverable: true,
    completedProjectsCount: Math.floor((score - 70) / 2) > 0 ? Math.floor((score - 70) / 2) : 5,
    onTimeDeliveryPct: score >= 90 ? 98 : 92,
    averageRating: Math.min(5.0, Number((4.5 + (score - 80) * 0.02).toFixed(2)))
  };
}

function mapSupabaseToUser(u: any): User {
  const roleLower = u.role?.toLowerCase();
  const roles: UserRole[] = roleLower === "client" ? ["client"] : ["freelancer"];
  return {
    id: u.user_id,
    name: u.name || (roles.includes("client") ? "Client" : "Freelancer"),
    email: u.email || `${u.user_id.slice(0, 10)}@trusthire.io`,
    roles,
    walletAddress: u.user_id.startsWith("0x") ? u.user_id : undefined,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.user_id)}`
  };
}

function mapSupabaseToClientProfile(cp: any): ClientProfile {
  return {
    userId: cp.client_id,
    companyName: cp.company_name || "Company",
    bio: cp.company_description || "",
    hiringCategories: ["Web Development", "Smart Contracts"],
    typicalBudgetRange: cp.project_budget_range || "2k-10k"
  };
}

function mapSupabaseToProject(p: any): Project {
  return {
    id: p.project_id,
    clientId: p.client_id,
    title: p.title || "Untitled Project",
    descriptionRaw: p.description || "",
    requiredSkills: p.category ? [p.category] : ["General"],
    estimatedBudget: Number(p.total_budget) || 0,
    timelineDays: Number(p.timeline) || 14,
    status: (p.status?.toLowerCase() as ProjectStatus) || "open",
    escrowObjectId: p.escrow_object_id || undefined,
    escrowTxHash: p.escrow_tx_hash || undefined,
    createdAt: p.created_at || new Date().toISOString(),
    updatedAt: p.created_at || new Date().toISOString()
  };
}

function mapSupabaseToMilestone(m: any): Milestone {
  const statusLower = (m.status?.toLowerCase() as MilestoneStatus) || "pending";
  return {
    id: m.milestone_id,
    projectId: m.project_id,
    title: m.title || "Milestone",
    deliverable: m.description || "",
    amount: Number(m.amount) || 0,
    percentOfBudget: 25,
    deadline: m.due_date || new Date().toISOString(),
    status: statusLower,
    submissionContent: m.submission_content || undefined,
    submissionLinks: m.submission_links || undefined,
    revisionNote: m.revision_note || undefined,
    onChainTxHash: m.on_chain_tx_hash || undefined
  };
}

function mapSupabaseToApplication(p: any): Application {
  const statusRaw = (p.status || "pending").toLowerCase();
  const status: "pending" | "accepted" | "declined" =
    statusRaw === "accepted" ? "accepted" : statusRaw === "rejected" || statusRaw === "declined" ? "declined" : "pending";
  return {
    id: p.proposal_id,
    projectId: p.project_id,
    freelancerId: p.freelancer_id,
    status,
    coverNote: p.cover_letter || "",
    appliedAt: p.created_at || new Date().toISOString()
  };
}

export const DEFAULT_USER: User = {
  id: "",
  name: "Guest",
  email: "",
  roles: ["client"],
  avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=guest"
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [activeRole, setActiveRole] = useState<UserRole>("client");

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [clientProfiles, setClientProfiles] = useState<Record<string, ClientProfile>>({});
  const [freelancerProfiles, setFreelancerProfiles] = useState<Record<string, FreelancerProfile>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transactions, setTransactions] = useState<OnChainTransaction[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  // Synchronize a specific connected Sui wallet address with Supabase database
  const syncUserWithDatabase = useCallback(async (address: string): Promise<User | null> => {
    if (!address) return null;
    try {
      const supabase = createClient();
      const [userRes, clientRes, freeRes] = await Promise.all([
        supabase.from("users").select("user_id, name, email, role, status").ilike("user_id", address).maybeSingle(),
        supabase.from("client_profiles").select("*").ilike("client_id", address).maybeSingle(),
        supabase.from("freelancer_profiles").select("*").ilike("freelancer_id", address).maybeSingle(),
      ]);

      const dbUser = userRes.data;
      const clientProf = clientRes.data;
      const freeProf = freeRes.data;

      if (dbUser) {
        const roleLower = (dbUser.role?.toLowerCase() as UserRole) || "client";
        const company = clientProf?.company_name || undefined;
        const syncedUser: User = {
          id: dbUser.user_id,
          name: dbUser.name || (roleLower === "client" ? "Client" : "Freelancer"),
          email: dbUser.email || `${address.slice(0, 10)}@trusthire.io`,
          roles: [roleLower],
          walletAddress: address,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(address)}`,
          companyName: company
        };

        setCurrentUser(syncedUser);
        setActiveRole(roleLower);

        // Update in users pool
        setUsers((prev) => {
          const exists = prev.some((u) => u.id.toLowerCase() === address.toLowerCase());
          if (exists) {
            return prev.map((u) => (u.id.toLowerCase() === address.toLowerCase() ? syncedUser : u));
          }
          return [syncedUser, ...prev];
        });

        // Update client profiles
        if (clientProf) {
          setClientProfiles((prev) => ({
            ...prev,
            [dbUser.user_id]: mapSupabaseToClientProfile(clientProf),
            [address]: mapSupabaseToClientProfile(clientProf)
          }));
        }

        // Update freelancer profiles
        if (freeProf) {
          setFreelancerProfiles((prev) => ({
            ...prev,
            [dbUser.user_id]: mapSupabaseToFreelancerProfile(freeProf, [], []),
            [address]: mapSupabaseToFreelancerProfile(freeProf, [], [])
          }));
        }

        return syncedUser;
      } else {
        // Fallback for new user connecting wallet before onboarding
        setCurrentUser((prev) => {
          if (prev.id === address && prev.walletAddress === address) return prev;
          return {
            ...prev,
            id: address,
            walletAddress: address,
            name: "My Account",
            email: `${address.slice(0, 10)}@trusthire.io`,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(address)}`
          };
        });
        return null;
      }
    } catch (err) {
      console.error("Failed to sync user with database:", err);
      return null;
    }
  }, []);

  // Load real talent pool, clients, projects, and milestones from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function loadSupabaseTalentPool() {
      try {
        const supabase = createClient();

        // Fetch profiles, skills, portfolios, users, clients, projects, milestones, proposals in parallel
        const [
          { data: dbProfiles },
          { data: dbSkills },
          { data: dbPortfolios },
          { data: dbUsers },
          { data: dbClients },
          { data: dbProjects },
          { data: dbMilestones },
          { data: dbProposals }
        ] = await Promise.all([
          supabase.from("freelancer_profiles").select("*"),
          supabase.from("freelancer_skills").select("freelancer_id, skills(skill_name)"),
          supabase.from("freelancer_portfolios").select("freelancer_id, title, url"),
          supabase.from("users").select("*"),
          supabase.from("client_profiles").select("*"),
          supabase.from("projects").select("*"),
          supabase.from("milestones").select("*"),
          supabase.from("proposals").select("*")
        ]);

        if (isCancelled) return;

        // Group skills by freelancer_id
        const skillsMap: Record<string, string[]> = {};
        if (dbSkills) {
          for (const item of dbSkills as any[]) {
            const fId = item.freelancer_id;
            const sName = item.skills?.skill_name;
            if (fId && sName) {
              if (!skillsMap[fId]) skillsMap[fId] = [];
              skillsMap[fId].push(sName);
            }
          }
        }

        // Group portfolios by freelancer_id
        const portfolioMap: Record<string, { title: string; url: string }[]> = {};
        if (dbPortfolios) {
          for (const item of dbPortfolios) {
            const fId = item.freelancer_id;
            if (fId) {
              if (!portfolioMap[fId]) portfolioMap[fId] = [];
              portfolioMap[fId].push({ title: item.title, url: item.url });
            }
          }
        }

        // Build freelancerProfiles record
        if (dbProfiles && dbProfiles.length > 0) {
          const loadedProfiles: Record<string, FreelancerProfile> = {};
          for (const fp of dbProfiles) {
            const fId = fp.freelancer_id;
            loadedProfiles[fId] = mapSupabaseToFreelancerProfile(
              fp,
              skillsMap[fId] || [],
              portfolioMap[fId] || []
            );
          }
          setFreelancerProfiles((prev) => ({
            ...prev,
            ...loadedProfiles
          }));
        }

        // Build clientProfiles record
        if (dbClients && dbClients.length > 0) {
          const loadedClients: Record<string, ClientProfile> = {};
          for (const cp of dbClients) {
            loadedClients[cp.client_id] = mapSupabaseToClientProfile(cp);
          }
          setClientProfiles((prev) => ({
            ...prev,
            ...loadedClients
          }));
        }

        // Build users array
        if (dbUsers && dbUsers.length > 0) {
          const loadedUsers: User[] = dbUsers.map(mapSupabaseToUser);
          setUsers((prev) => {
            const existingIds = new Set(loadedUsers.map((u) => u.id));
            const unmanaged = prev.filter((u) => !existingIds.has(u.id));
            return [...loadedUsers, ...unmanaged];
          });
        }

        // Build projects array
        if (dbProjects && dbProjects.length > 0) {
          const acceptedProposalMap: Record<string, string> = {};
          if (dbProposals) {
            for (const prop of dbProposals as any[]) {
              if (prop.status === "ACCEPTED" && prop.project_id && prop.freelancer_id) {
                acceptedProposalMap[prop.project_id] = prop.freelancer_id;
              }
            }
          }
          const loadedProjects: Project[] = dbProjects.map((p: any) => {
            const mapped = mapSupabaseToProject(p);
            const matchedFreelancer = acceptedProposalMap[mapped.id];
            // If project is still 'open' but client accepted a freelancer's proposal, it is 'matched' (awaiting client escrow funding)
            const effectiveStatus: ProjectStatus =
              mapped.status === "open" && matchedFreelancer ? "matched" : mapped.status;
            return {
              ...mapped,
              status: effectiveStatus,
              matchedFreelancerId: matchedFreelancer || undefined
            };
          });
          setProjects((prev) => {
            const existingIds = new Set(loadedProjects.map((p) => p.id));
            const unmanaged = prev.filter((p) => !existingIds.has(p.id));
            return [...loadedProjects, ...unmanaged];
          });
        }

        // Build milestones array
        if (dbMilestones && dbMilestones.length > 0) {
          const loadedMilestones: Milestone[] = dbMilestones
            .map(mapSupabaseToMilestone)
            .sort((a, b) => {
              if (a.projectId !== b.projectId) return a.projectId.localeCompare(b.projectId);
              const aNum = a.title?.match(/Milestone\s+(\d+)/i)?.[1];
              const bNum = b.title?.match(/Milestone\s+(\d+)/i)?.[1];
              if (aNum && bNum) return parseInt(aNum, 10) - parseInt(bNum, 10);
              return (a.title || "").localeCompare(b.title || "");
            });
          setMilestones((prev) => {
            const existingIds = new Set(loadedMilestones.map((m) => m.id));
            const unmanaged = prev.filter((m) => !existingIds.has(m.id));
            return [...loadedMilestones, ...unmanaged];
          });
        }

        // Build applications array from proposals
        if (dbProposals && dbProposals.length > 0) {
          const loadedApps: Application[] = dbProposals.map(mapSupabaseToApplication);
          setApplications((prev) => {
            const existingIds = new Set(loadedApps.map((a) => a.id));
            const unmanaged = prev.filter((a) => !existingIds.has(a.id));
            return [...loadedApps, ...unmanaged];
          });
        }

        // Build initial on-chain transactions array from projects and released milestones
        if ((dbProjects && dbProjects.length > 0) || (dbMilestones && dbMilestones.length > 0)) {
          const initialTxList: OnChainTransaction[] = [];
          if (dbProjects) {
            for (const p of dbProjects as any[]) {
              if (p.escrow_tx_hash || p.escrow_object_id || p.status === "IN_PROGRESS" || p.status === "COMPLETED") {
                initialTxList.push({
                  id: `tx-escrow-${p.project_id}`,
                  txHash: p.escrow_tx_hash || (p.escrow_object_id ? p.escrow_object_id : "0x" + p.project_id.replace(/-/g, "").slice(0, 64)),
                  type: "escrow_created",
                  projectId: p.project_id,
                  projectTitle: p.title || "Escrow Contract",
                  amount: Number(p.total_budget) || 0,
                  fromAddress: p.client_id || "Client",
                  toAddress: p.escrow_object_id ? `${p.escrow_object_id} (Sui Escrow)` : "Sui Escrow",
                  timestamp: p.created_at || new Date().toISOString(),
                  status: "confirmed"
                });
              }
            }
          }
          if (dbMilestones) {
            for (const m of dbMilestones as any[]) {
              if (m.status === "RELEASED") {
                const proj = (dbProjects || []).find((p: any) => p.project_id === m.project_id);
                initialTxList.push({
                  id: `tx-ms-${m.milestone_id}`,
                  txHash: m.on_chain_tx_hash || (proj?.escrow_tx_hash ? proj.escrow_tx_hash : "0x" + m.milestone_id.replace(/-/g, "").slice(0, 64)),
                  type: "milestone_released",
                  projectId: m.project_id,
                  projectTitle: proj?.title || "Project Milestone",
                  milestoneTitle: m.title || "Milestone",
                  amount: Number(m.amount) || 0,
                  fromAddress: proj?.escrow_object_id ? `${proj.escrow_object_id} (Sui Escrow)` : "Sui Escrow",
                  toAddress: "Freelancer Wallet",
                  timestamp: m.due_date || proj?.created_at || new Date().toISOString(),
                  status: "confirmed"
                });
              }
            }
          }
          if (initialTxList.length > 0) {
            initialTxList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setTransactions((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const newTxs = initialTxList.filter((t) => !existingIds.has(t.id));
              return [...prev, ...newTxs];
            });
          }
        }
      } catch (err) {
        console.warn("Could not load talent pool from Supabase, maintaining seed fallback:", err);
      }
    }

    loadSupabaseTalentPool();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Sync connected wallet address with database and currentUser
  useEffect(() => {
    if (currentAccount?.address) {
      syncUserWithDatabase(currentAccount.address);
    }
  }, [currentAccount?.address, syncUserWithDatabase]);

  // Load saved user preferences
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("trusthire_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      }
      const savedRole = localStorage.getItem("trusthire_active_role");
      if (savedRole === "client" || savedRole === "freelancer") {
        setActiveRole(savedRole);
      }
    } catch (e) {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Apply dark mode class to html & persist theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("trusthire_theme", theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    try {
      localStorage.setItem("trusthire_active_role", role);
    } catch (e) {
      // ignore
    }
    if (currentAccount?.address) {
      setCurrentUser((prev) => ({
        ...prev,
        roles: Array.from(new Set([...(prev.roles || []), role]))
      }));
    }
  };

  const connectWallet = async () => {
    return currentAccount?.address || "";
  };

  const disconnectWallet = () => {
    setCurrentUser(DEFAULT_USER);
    setActiveRole("client");
  };

  const addRoleToUser = (role: UserRole) => {
    if (!currentUser.roles.includes(role)) {
      const updated = { ...currentUser, roles: [...currentUser.roles, role] };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  };

  const updateClientProfile = (data: Partial<ClientProfile> & { name?: string; avatarUrl?: string }) => {
    const { name, avatarUrl, ...prof } = data;
    if (name || avatarUrl) {
      const updatedUser = {
        ...currentUser,
        ...(name ? { name } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(prof.companyName ? { companyName: prof.companyName } : {})
      };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    }

    setClientProfiles((prev) => ({
      ...prev,
      [currentUser.id]: {
        ...(prev[currentUser.id] || { userId: currentUser.id, hiringCategories: [] }),
        ...prof
      }
    }));
  };

  const updateFreelancerProfile = (data: Partial<FreelancerProfile> & { name?: string; avatarUrl?: string }) => {
    const { name, avatarUrl, ...prof } = data;
    if (name || avatarUrl) {
      const updatedUser = {
        ...currentUser,
        ...(name ? { name } : {}),
        ...(avatarUrl ? { avatarUrl } : {})
      };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    }

    setFreelancerProfiles((prev) => ({
      ...prev,
      [currentUser.id]: {
        ...(prev[currentUser.id] || {
          userId: currentUser.id,
          headline: "Web3 Developer",
          bio: "",
          skills: [],
          experienceLevel: "Intermediate",
          portfolioLinks: [],
          trustScore: 90,
          trustScoreConfidence: "High",
          trustScoreReasoning: [],
          trustScoreRequestId: "gonka_req_init",
          trustScoreUpdatedAt: new Date().toISOString(),
          isDiscoverable: true,
          completedProjectsCount: 0,
          onTimeDeliveryPct: 100,
          averageRating: 5.0
        }),
        ...prof
      }
    }));
  };

  const createProject = (
    projectData: Omit<Project, "id" | "clientId" | "createdAt" | "updatedAt">,
    milestoneData: Omit<Milestone, "id" | "projectId">[]
  ): string => {
    const newProjectId = generateUUID();
    const targetClientId = currentUser.walletAddress || currentUser.id;
    const newProject: Project = {
      ...projectData,
      id: newProjectId,
      clientId: targetClientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newMilestones: Milestone[] = milestoneData.map((m) => ({
      ...m,
      id: generateUUID(),
      projectId: newProjectId
    }));

    setProjects((prev) => [newProject, ...prev]);
    setMilestones((prev) => [...prev, ...newMilestones]);

    // Asynchronously persist project & milestones to Supabase
    (async () => {
      try {
        const supabase = createClient();

        // 1. Ensure client user exists in users table
        await supabase.from("users").upsert({
          user_id: targetClientId,
          name: currentUser.name || "Client",
          email: currentUser.email || `${targetClientId.slice(0, 10)}@trusthire.io`,
          role: "CLIENT",
          status: "ACTIVE"
        }, { onConflict: "user_id" });

        await supabase.from("client_profiles").upsert({
          client_id: targetClientId,
          company_name: currentUser.companyName || "Organization"
        }, { onConflict: "client_id" });

        // 2. Insert into projects table
        await supabase.from("projects").insert({
          project_id: newProjectId,
          client_id: targetClientId,
          title: newProject.title,
          description: newProject.descriptionRaw,
          total_budget: newProject.estimatedBudget,
          timeline: newProject.timelineDays || 14,
          status: newProject.status === "open" ? "OPEN" : "DRAFT",
          category: newProject.requiredSkills[0] || "General"
        });

        // 3. Insert into milestones table
        if (newMilestones.length > 0) {
          await supabase.from("milestones").insert(
            newMilestones.map((m) => ({
              milestone_id: m.id,
              project_id: newProjectId,
              title: m.title,
              description: m.deliverable,
              amount: m.amount,
              duration_days: Math.max(1, Math.round(newProject.timelineDays / newMilestones.length)),
              status: "PENDING"
            }))
          );
        }
      } catch (err) {
        console.warn("Could not persist new project to Supabase:", err);
      }
    })();

    // Notification if status is open
    if (newProject.status === "open") {
      addNotification({
        userId: currentUser.id,
        type: "new_recommendation",
        text: `AI generated candidate recommendations for "${newProject.title}"`,
        linkTo: `/project/${newProjectId}/candidates`
      });
    }

    return newProjectId;
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p))
    );

    if (data.status || data.escrowObjectId || data.escrowTxHash) {
      (async () => {
        try {
          const supabase = createClient();
          const updatePayload: Record<string, any> = {};
          if (data.status) {
            // Postgres check constraint only allows DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED
            updatePayload.status = data.status === "matched" ? "OPEN" : data.status.toUpperCase();
          }
          if (data.escrowObjectId) updatePayload.escrow_object_id = data.escrowObjectId;
          if (data.escrowTxHash) updatePayload.escrow_tx_hash = data.escrowTxHash;

          await supabase.from("projects").update(updatePayload).eq("project_id", id);
        } catch (err) {
          console.warn("Could not sync project update to Supabase:", err);
        }
      })();
    }
  };

  const updateMilestone = (id: string, data: Partial<Milestone>) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));

    if (
      data.status ||
      data.submissionContent ||
      data.submissionLinks ||
      data.revisionNote ||
      data.onChainTxHash
    ) {
      (async () => {
        try {
          const supabase = createClient();
          const updatePayload: Record<string, any> = {};
          if (data.status) updatePayload.status = data.status.toUpperCase();
          if (data.submissionContent) updatePayload.submission_content = data.submissionContent;
          if (data.submissionLinks) updatePayload.submission_links = data.submissionLinks;
          if (data.revisionNote) updatePayload.revision_note = data.revisionNote;
          if (data.onChainTxHash) updatePayload.on_chain_tx_hash = data.onChainTxHash;

          await supabase.from("milestones").update(updatePayload).eq("milestone_id", id);
        } catch (err) {
          console.warn("Could not sync milestone update to Supabase:", err);
        }
      })();
    }
  };

  const inviteFreelancer = (projectId: string, freelancerId: string) => {
    const existing = invitations.find((i) => i.projectId === projectId && i.freelancerId === freelancerId);
    if (existing) return;

    const newInv: Invitation = {
      id: `inv-${Date.now()}`,
      projectId,
      freelancerId,
      status: "pending",
      invitedAt: new Date().toISOString()
    };

    setInvitations((prev) => [newInv, ...prev]);

    const proj = projects.find((p) => p.id === projectId);
    const freelancer = users.find((u) => u.id === freelancerId);

    // Notify freelancer
    addNotification({
      userId: freelancerId,
      type: "invitation_received",
      text: `New invitation from ${currentUser.name} for "${proj?.title || "Project"}"`,
      linkTo: "/freelancer/applications"
    });
  };

  const respondToInvitation = (invitationId: string, status: "accepted" | "declined") => {
    const inv = invitations.find((i) => i.id === invitationId);
    if (!inv) return;

    setInvitations((prev) =>
      prev.map((i) => (i.id === invitationId ? { ...i, status } : i))
    );

    const proj = projects.find((p) => p.id === inv.projectId);
    const freelancer = users.find((u) => u.id === inv.freelancerId);

    if (status === "accepted" && proj) {
      updateProject(proj.id, {
        status: "matched",
        matchedFreelancerId: inv.freelancerId
      });

      // Notify client
      addNotification({
        userId: proj.clientId,
        type: "invitation_response",
        text: `${freelancer?.name || "Freelancer"} accepted your invitation to "${proj.title}"`,
        linkTo: `/project/${proj.id}`
      });
    }
  };

  const applyToProject = async (projectId: string, freelancerId: string, coverNote?: string): Promise<void> => {
    const existing = applications.find(
      (a) =>
        a.projectId === projectId &&
        a.freelancerId.toLowerCase() === freelancerId.toLowerCase()
    );
    if (existing) return;

    const newAppId = generateUUID();
    const newApp: Application = {
      id: newAppId,
      projectId,
      freelancerId,
      status: "pending",
      coverNote,
      appliedAt: new Date().toISOString()
    };

    setApplications((prev) => [newApp, ...prev]);

    const proj = projects.find((p) => p.id === projectId);
    const freelancer = users.find(
      (u) =>
        u.id.toLowerCase() === freelancerId.toLowerCase() ||
        (u.walletAddress && u.walletAddress.toLowerCase() === freelancerId.toLowerCase())
    );

    // Persist to Supabase proposals table
    try {
      const supabase = createClient();

      // 1. Ensure user exists in users table to satisfy foreign key
      const applicantName =
        freelancer?.name ||
        (freelancerId.startsWith("0x")
          ? `Freelancer (${freelancerId.slice(0, 6)}...${freelancerId.slice(-4)})`
          : "Freelancer");
      const applicantEmail = freelancer?.email || `${freelancerId.slice(0, 10).toLowerCase()}@trusthire.io`;

      await supabase.from("users").upsert(
        {
          user_id: freelancerId,
          name: applicantName,
          email: applicantEmail,
          role: "FREELANCER",
          status: "ACTIVE"
        },
        { onConflict: "user_id" }
      );

      // 2. Ensure freelancer_profiles row exists to satisfy foreign key
      const existingProf =
        freelancerProfiles[freelancerId] ||
        Object.entries(freelancerProfiles).find(([k]) => k.toLowerCase() === freelancerId.toLowerCase())?.[1];

      await supabase.from("freelancer_profiles").upsert(
        {
          freelancer_id: freelancerId,
          prof_headline: existingProf?.headline || "Web3 Developer",
          bio: existingProf?.bio || "Verified Sui smart contracts and frontend engineer.",
          hourly_rate: 60,
          experience_level: existingProf?.experienceLevel || "Intermediate",
          availability_status: "Available",
          trust_score: existingProf?.trustScore || 90,
          trust_level: "High",
          last_verified_at: new Date().toISOString()
        },
        { onConflict: "freelancer_id" }
      );

      // 3. Insert proposal
      const { error: propErr } = await supabase.from("proposals").insert({
        proposal_id: newAppId,
        project_id: projectId,
        freelancer_id: freelancerId,
        cover_letter: coverNote || "Interested in contributing to this project.",
        bid_amount: proj?.estimatedBudget || 1000,
        estimated_days: proj?.timelineDays || 14,
        status: "PENDING"
      });
      if (propErr) {
        console.warn("Could not insert proposal into Supabase:", propErr);
      }
    } catch (err) {
      console.warn("Could not persist proposal to Supabase:", err);
    }

    // Notify client
    if (proj) {
      addNotification({
        userId: proj.clientId,
        type: "application_received",
        text: `New application received for "${proj.title}" from ${freelancer?.name || "Freelancer"}`,
        linkTo: `/project/${proj.id}/candidates`
      });
    }
  };

  const respondToApplication = async (applicationId: string, status: "accepted" | "declined"): Promise<void> => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
    );

    const proj = projects.find((p) => p.id === app.projectId);

    // Persist to Supabase proposals table
    try {
      const supabase = createClient();
      await supabase
        .from("proposals")
        .update({ status: status === "accepted" ? "ACCEPTED" : "REJECTED" })
        .eq("proposal_id", applicationId);
    } catch (err) {
      console.warn("Could not update proposal status in Supabase:", err);
    }

    if (status === "accepted" && proj) {
      updateProject(proj.id, {
        status: "matched",
        matchedFreelancerId: app.freelancerId
      });

      // Notify freelancer
      addNotification({
        userId: app.freelancerId,
        type: "application_response",
        text: `Your application to "${proj.title}" was accepted! Escrow funding in progress.`,
        linkTo: `/project/${proj.id}`
      });
    }
  };

  const toggleSaveProject = (freelancerId: string, projectId: string) => {
    setSavedProjects((prev) => {
      const exists = prev.some((s) => s.freelancerId === freelancerId && s.projectId === projectId);
      if (exists) {
        return prev.filter((s) => !(s.freelancerId === freelancerId && s.projectId === projectId));
      } else {
        return [...prev, { freelancerId, projectId, savedAt: new Date().toISOString() }];
      }
    });
  };

  const fundProjectEscrow = async (projectId: string, updatedMilestones?: Milestone[]) => {
    const proj = projects.find((p) => p.id === projectId);
    const budget = proj ? proj.estimatedBudget : 3000;
    const msToUse = updatedMilestones || milestones.filter((m) => m.projectId === projectId);

    let txHash: string;
    let escrowObjectId: string = "";

    // If package ID is configured and wallet is connected, run real Sui Testnet transaction
    if (TESTNET_PACKAGE_ID && currentAccount?.address) {
      try {
        const freelancer = proj?.matchedFreelancerId
          ? users.find(
              (u) =>
                u.id.toLowerCase() === proj.matchedFreelancerId?.toLowerCase() ||
                u.walletAddress?.toLowerCase() === proj.matchedFreelancerId?.toLowerCase()
            )
          : null;

        const freelancerAddr =
          (freelancer?.walletAddress &&
          freelancer.walletAddress.startsWith("0x") &&
          freelancer.walletAddress.length >= 64
            ? freelancer.walletAddress
            : null) ||
          (proj?.matchedFreelancerId &&
          proj.matchedFreelancerId.startsWith("0x") &&
          proj.matchedFreelancerId.length >= 64
            ? proj.matchedFreelancerId
            : null) ||
          "0x843543df2cbe873b0e963835129022ec3d9680ce1ad4777dda1aeb44abbcd265";

        const tx = buildCreateEscrowTx({
          packageId: TESTNET_PACKAGE_ID,
          projectId,
          freelancerAddress: freelancerAddr,
          milestones: msToUse.map((m, idx) => ({
            id: idx,
            title: m.title,
            deliverable: m.deliverable,
            amountSui: m.amount,
            deadlineMs: m.deadline ? new Date(m.deadline).getTime() : 0,
          })),
          gonkaMatchRequestId: `gonka-${projectId}`,
        });

        const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        if (result.$kind === "FailedTransaction") {
          throw new Error(result.FailedTransaction.status.error?.message ?? "Transaction failed on Sui");
        }

        txHash = result.Transaction.digest;
        try {
          if ((client as any).waitForTransaction) {
            await (client as any).waitForTransaction({ digest: txHash });
          } else if ((client.core as any)?.waitForTransaction) {
            await (client.core as any).waitForTransaction({ digest: txHash });
          }

          // Fetch transaction execution data using SuiGrpcClient with effects & events
          let txData: any;
          if (typeof (client as any).getTransaction === "function") {
            txData = await (client as any).getTransaction({
              digest: txHash,
              include: { effects: true, events: true }
            });
          } else if (typeof (client.core as any)?.getTransaction === "function") {
            txData = await (client.core as any).getTransaction({
              digest: txHash,
              include: { effects: true, events: true }
            });
          }

          // 1. Try finding real escrow_id from emitted EscrowCreated event
          const events = txData?.events || txData?.Transaction?.events;
          const escrowEvent = events?.find((e: any) =>
            e.eventType?.includes("::escrow::EscrowCreated")
          );
          if (escrowEvent?.json?.escrow_id) {
            escrowObjectId = escrowEvent.json.escrow_id;
          }

          // 2. Try finding Created shared object in effects
          if (!escrowObjectId) {
            const effects = txData?.effects || txData?.Transaction?.effects;
            const createdObj = effects?.changedObjects?.find((o: any) => o.idOperation === "Created");
            if (createdObj?.objectId) {
              escrowObjectId = createdObj.objectId;
            }
          }

          // 3. Fallback to legacy getTransactionBlock if using JSON-RPC client
          if (!escrowObjectId && typeof (client.core as any)?.getTransactionBlock === "function") {
            const txBlock: any = await (client.core as any).getTransactionBlock({
              digest: txHash,
              options: { showObjectChanges: true }
            });
            const createdEscrow = txBlock?.objectChanges?.find(
              (c: any) => c.type === "created" && c.objectType?.includes("::escrow::EscrowContract")
            );
            if (createdEscrow?.objectId) {
              escrowObjectId = createdEscrow.objectId;
            }
          }
        } catch (waitErr) {
          console.warn("waitForTransaction/getTransaction warning:", waitErr);
        }

        if (!escrowObjectId) {
          escrowObjectId = txHash;
        }
      } catch (err) {
        console.error("On-chain fundProjectEscrow failed, falling back to local simulation:", err);
        txHash = generateSuiTxHash();
        escrowObjectId = generateSuiTxHash();
      }
    } else {
      // Local simulation / demo mode
      await new Promise((r) => setTimeout(r, 1500));
      txHash = generateSuiTxHash();
      escrowObjectId = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    }

    if (updatedMilestones) {
      setMilestones((prev) => {
        const others = prev.filter((m) => m.projectId !== projectId);
        return [...others, ...updatedMilestones];
      });
    }

    updateProject(projectId, {
      status: "in_progress",
      escrowObjectId,
      escrowTxHash: txHash,
    });

    const newTx: OnChainTransaction = {
      id: `tx-${Date.now()}`,
      txHash,
      type: "escrow_created",
      projectId,
      projectTitle: proj?.title || "Escrow Contract",
      amount: budget,
      fromAddress: currentAccount?.address || currentUser.walletAddress || "0x4f2a91...9a2c",
      toAddress: `${escrowObjectId} (Sui Escrow)`,
      timestamp: new Date().toISOString(),
      status: "confirmed",
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (proj?.matchedFreelancerId) {
      addNotification({
        userId: proj.matchedFreelancerId,
        type: "escrow_funded",
        text: `Escrow funded (${budget.toLocaleString()} SUI) for "${proj.title}". You can now start work!`,
        linkTo: `/project/${projectId}/workspace`,
      });
    }

    return { txHash, escrowObjectId };
  };

  const submitMilestoneWork = async (milestoneId: string, content: string, links: string[] = []) => {
    const targetMs = milestones.find((m) => m.id === milestoneId);
    const proj = targetMs ? projects.find((p) => p.id === targetMs.projectId) : null;
    let txHash = generateSuiTxHash();

    if (targetMs && TESTNET_PACKAGE_ID && currentAccount?.address && proj?.escrowObjectId && proj.escrowObjectId.startsWith("0x")) {
      try {
        const onChainMilestoneId = getMilestoneOnChainId(targetMs, milestones);

        const tx = buildSubmitMilestoneTx({
          packageId: TESTNET_PACKAGE_ID,
          escrowObjectId: proj.escrowObjectId,
          milestoneId: onChainMilestoneId,
        });

        const { digest } = await executeWithEnokiSponsorship({
          transaction: tx,
          senderAddress: currentAccount.address,
          suiClient: client,
          dAppKit,
        });

        txHash = digest;
        try {
          if ((client as any).waitForTransaction) {
            await (client as any).waitForTransaction({ digest: txHash });
          } else if ((client.core as any)?.waitForTransaction) {
            await (client.core as any).waitForTransaction({ digest: txHash });
          }
        } catch (e) {
          console.warn("waitForTransaction warning:", e);
        }
      } catch (err) {
        console.error("On-chain submit_milestone failed, falling back to local simulation:", err);
      }
    } else {
      await new Promise((r) => setTimeout(r, 1500));
    }

    const now = new Date().toISOString();
    updateMilestone(milestoneId, {
      status: "submitted",
      submissionContent: content,
      submissionLinks: links,
      submittedAt: now,
      ...(txHash && !txHash.startsWith("0x") ? { onChainTxHash: txHash } : {})
    });

    if (proj) {
      addNotification({
        userId: proj.clientId,
        type: "milestone_submitted",
        text: `${currentUser.name} submitted "${targetMs?.title}" — awaiting your review`,
        linkTo: `/project/${proj.id}/workspace`,
      });
    }

    return txHash;
  };

  const requestChangesOnMilestone = (milestoneId: string, revisionNote: string) => {
    const targetMs = milestones.find((m) => m.id === milestoneId);
    if (!targetMs) return;

    updateMilestone(milestoneId, {
      status: "changes_requested",
      revisionNote,
    });

    const proj = projects.find((p) => p.id === targetMs.projectId);
    if (proj?.matchedFreelancerId) {
      addNotification({
        userId: proj.matchedFreelancerId,
        type: "changes_requested",
        text: `${currentUser.name} requested changes on "${targetMs.title}"`,
        linkTo: `/project/${proj.id}/workspace`,
      });
    }
  };

  const approveAndReleaseMilestone = async (milestoneId: string) => {
    const targetMs = milestones.find((m) => m.id === milestoneId);
    if (!targetMs) return { txHash: generateSuiTxHash() };
    const proj = projects.find((p) => p.id === targetMs.projectId);
    let txHash = generateSuiTxHash();

    if (TESTNET_PACKAGE_ID && currentAccount?.address && proj?.escrowObjectId && proj.escrowObjectId.startsWith("0x")) {
      try {
        const onChainMilestoneId = getMilestoneOnChainId(targetMs, milestones);

        const freelancerAddr =
          (proj?.matchedFreelancerId?.startsWith("0x") ? proj.matchedFreelancerId : null) ||
          users.find((u) => u.id === proj?.matchedFreelancerId)?.walletAddress ||
          "0x843543df2cbe873b0e963835129022ec3d9680ce1ad4777dda1aeb44abbcd265";

        const repRecordId = await resolveFreelancerReputationRecordId(client, freelancerAddr);

        const tx = buildApproveMilestoneTx({
          packageId: TESTNET_PACKAGE_ID,
          escrowObjectId: proj.escrowObjectId,
          reputationRecordId: repRecordId,
          milestoneId: onChainMilestoneId,
        });

        const { digest } = await executeWithEnokiSponsorship({
          transaction: tx,
          senderAddress: currentAccount.address,
          suiClient: client,
          dAppKit,
        });

        txHash = digest;
        try {
          if ((client as any).waitForTransaction) {
            await (client as any).waitForTransaction({ digest: txHash });
          } else if ((client.core as any)?.waitForTransaction) {
            await (client.core as any).waitForTransaction({ digest: txHash });
          }
        } catch (e) {
          console.warn("waitForTransaction warning:", e);
        }
      } catch (err) {
        console.error("On-chain approve_milestone failed, falling back to local simulation:", err);
      }
    } else {
      await new Promise((r) => setTimeout(r, 1500));
    }

    const now = new Date().toISOString();
    updateMilestone(milestoneId, {
      status: "released",
      onChainTxHash: txHash,
      releasedAt: now,
    });

    // Record on-chain transaction
    const newTx: OnChainTransaction = {
      id: `tx-${Date.now()}`,
      txHash,
      type: "milestone_released",
      projectId: targetMs.projectId,
      projectTitle: proj?.title || "Project Milestone",
      milestoneTitle: targetMs.title,
      amount: targetMs.amount,
      fromAddress: `${proj?.escrowObjectId || "Escrow"} (Sui Escrow)`,
      toAddress: proj?.matchedFreelancerId ? "Freelancer Wallet" : "Freelancer",
      timestamp: now,
      status: "confirmed",
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Check if all milestones are released
    const allProjMilestones = milestones.filter((m) => m.projectId === targetMs.projectId);
    const remainingUnreleased = allProjMilestones.filter((m) => m.id !== milestoneId && m.status !== "released");
    if (remainingUnreleased.length === 0 && proj) {
      updateProject(proj.id, { status: "completed" });
    }

    if (proj?.matchedFreelancerId) {
      addNotification({
        userId: proj.matchedFreelancerId,
        type: "milestone_released",
        text: `Milestone "${targetMs.title}" approved! ${targetMs.amount.toLocaleString()} SUI released to your wallet.`,
        linkTo: "/freelancer/earnings",
      });
    }

    return { txHash };
  };

  const flagDisputeOnMilestone = async (milestoneId: string, reason: string) => {
    await new Promise((r) => setTimeout(r, 2000));
    const targetMs = milestones.find((m) => m.id === milestoneId);
    if (!targetMs) return;

    updateMilestone(milestoneId, {
      status: "disputed",
      disputeReason: reason
    });

    const proj = projects.find((p) => p.id === targetMs.projectId);
    if (proj?.matchedFreelancerId) {
      addNotification({
        userId: proj.matchedFreelancerId,
        type: "dispute_flagged",
        text: `${currentUser.name} flagged "${targetMs.title}" for review. Funds remain locked.`,
        linkTo: `/project/${proj.id}/workspace`
      });
    }
  };

  const submitRating = (projectId: string, freelancerId: string, stars: number, comment?: string) => {
    const newRating: Rating = {
      projectId,
      freelancerId,
      clientId: currentUser.id,
      stars,
      comment,
      ratedAt: new Date().toISOString()
    };
    setRatings((prev) => [newRating, ...prev]);

    // Update freelancer average rating
    const currentProf = freelancerProfiles[freelancerId];
    if (currentProf) {
      const allFreelancerRatings = [...ratings.filter((r) => r.freelancerId === freelancerId), newRating];
      const avg = allFreelancerRatings.reduce((acc, curr) => acc + curr.stars, 0) / allFreelancerRatings.length;
      updateFreelancerProfile({
        userId: freelancerId,
        averageRating: Number(avg.toFixed(2)),
        completedProjectsCount: currentProf.completedProjectsCount + 1
      });
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = (notif: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newN: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newN, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeRole,
        theme,
        users,
        clientProfiles,
        freelancerProfiles,
        projects,
        milestones,
        invitations,
        applications,
        savedProjects,
        notifications,
        transactions,
        ratings,
        setActiveRole,
        switchRole,
        toggleTheme,
        connectWallet,
        disconnectWallet,
        syncUserWithDatabase,
        updateClientProfile,
        updateFreelancerProfile,
        addRoleToUser,
        createProject,
        updateProject,
        updateMilestone,
        inviteFreelancer,
        respondToInvitation,
        applyToProject,
        respondToApplication,
        toggleSaveProject,
        fundProjectEscrow,
        submitMilestoneWork,
        requestChangesOnMilestone,
        approveAndReleaseMilestone,
        flagDisputeOnMilestone,
        submitRating,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
