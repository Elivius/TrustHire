"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  UserRole,
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
import {
  SEED_USERS,
  SEED_CLIENT_PROFILES,
  SEED_FREELANCER_PROFILES,
  SEED_PROJECTS,
  SEED_MILESTONES,
  SEED_INVITATIONS,
  SEED_APPLICATIONS,
  SEED_SAVED_PROJECTS,
  SEED_NOTIFICATIONS,
  SEED_TRANSACTIONS,
  SEED_RATINGS
} from "@/mock/seed-data";
import { generateSuiTxHash, generateWalletAddress } from "@/lib/simulation";

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
  simulatedFailuresEnabled: boolean;
  
  // Actions
  setActiveRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  switchDemoAccount: (role: UserRole) => void;
  toggleTheme: () => void;
  toggleSimulatedFailures: () => void;
  resetDemoData: () => void;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  
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
  applyToProject: (projectId: string, freelancerId: string, coverNote?: string) => void;
  respondToApplication: (applicationId: string, status: "accepted" | "declined") => void;
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

const STORAGE_KEY = "trusthire_prototype_state_v1";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [activeRole, setActiveRole] = useState<UserRole>("client");
  const [simulatedFailuresEnabled, setSimulatedFailuresEnabled] = useState(false);

  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]);
  const [clientProfiles, setClientProfiles] = useState<Record<string, ClientProfile>>(SEED_CLIENT_PROFILES);
  const [freelancerProfiles, setFreelancerProfiles] = useState<Record<string, FreelancerProfile>>(SEED_FREELANCER_PROFILES);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [milestones, setMilestones] = useState<Milestone[]>(SEED_MILESTONES);
  const [invitations, setInvitations] = useState<Invitation[]>(SEED_INVITATIONS);
  const [applications, setApplications] = useState<Application[]>(SEED_APPLICATIONS);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(SEED_SAVED_PROJECTS);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
  const [transactions, setTransactions] = useState<OnChainTransaction[]>(SEED_TRANSACTIONS);
  const [ratings, setRatings] = useState<Rating[]>(SEED_RATINGS);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        if (parsed.activeRole) setActiveRole(parsed.activeRole);
        if (parsed.clientProfiles) setClientProfiles(parsed.clientProfiles);
        if (parsed.freelancerProfiles) setFreelancerProfiles(parsed.freelancerProfiles);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.milestones) setMilestones(parsed.milestones);
        if (parsed.invitations) setInvitations(parsed.invitations);
        if (parsed.applications) setApplications(parsed.applications);
        if (parsed.savedProjects) setSavedProjects(parsed.savedProjects);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.ratings) setRatings(parsed.ratings);
        if (parsed.theme) setTheme(parsed.theme);
      }
    } catch (e) {
      console.error("Failed to load persisted state", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        users,
        currentUser,
        activeRole,
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
        theme
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to persist state", e);
    }
  }, [
    isLoaded,
    users,
    currentUser,
    activeRole,
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
    theme
  ]);

  // Apply dark mode class to html
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSimulatedFailures = () => {
    setSimulatedFailuresEnabled((prev) => !prev);
  };

  const resetDemoData = () => {
    setUsers(SEED_USERS);
    setCurrentUser(SEED_USERS[0]);
    setActiveRole("client");
    setClientProfiles(SEED_CLIENT_PROFILES);
    setFreelancerProfiles(SEED_FREELANCER_PROFILES);
    setProjects(SEED_PROJECTS);
    setMilestones(SEED_MILESTONES);
    setInvitations(SEED_INVITATIONS);
    setApplications(SEED_APPLICATIONS);
    setSavedProjects(SEED_SAVED_PROJECTS);
    setNotifications(SEED_NOTIFICATIONS);
    setTransactions(SEED_TRANSACTIONS);
    setRatings(SEED_RATINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchDemoAccount = (role: UserRole) => {
    setActiveRole(role);
    if (role === "client") {
      const clientUser = users.find((u) => u.id === "user-client-1") || SEED_USERS[0];
      setCurrentUser(clientUser);
    } else {
      const freeUser = users.find((u) => u.id === "user-free-1") || SEED_USERS[1];
      setCurrentUser(freeUser);
    }
  };

  const switchRole = (role: UserRole) => {
    switchDemoAccount(role);
  };

  const connectWallet = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    const addr = generateWalletAddress();
    const updated = { ...currentUser, walletAddress: addr };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    return addr;
  };

  const disconnectWallet = () => {
    const updated = { ...currentUser, walletAddress: undefined };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
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
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      ...projectData,
      id: newProjectId,
      clientId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newMilestones: Milestone[] = milestoneData.map((m, idx) => ({
      ...m,
      id: `ms-${newProjectId}-${idx + 1}`,
      projectId: newProjectId
    }));

    setProjects((prev) => [newProject, ...prev]);
    setMilestones((prev) => [...prev, ...newMilestones]);

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
  };

  const updateMilestone = (id: string, data: Partial<Milestone>) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
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

  const applyToProject = (projectId: string, freelancerId: string, coverNote?: string) => {
    const existing = applications.find((a) => a.projectId === projectId && a.freelancerId === freelancerId);
    if (existing) return;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      projectId,
      freelancerId,
      status: "pending",
      coverNote,
      appliedAt: new Date().toISOString()
    };

    setApplications((prev) => [newApp, ...prev]);

    const proj = projects.find((p) => p.id === projectId);
    const freelancer = users.find((u) => u.id === freelancerId);

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

  const respondToApplication = (applicationId: string, status: "accepted" | "declined") => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
    );

    const proj = projects.find((p) => p.id === app.projectId);

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
    await new Promise((r) => setTimeout(r, 2000));
    const txHash = generateSuiTxHash();
    const escrowObjectId = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;

    if (updatedMilestones) {
      setMilestones((prev) => {
        const others = prev.filter((m) => m.projectId !== projectId);
        return [...others, ...updatedMilestones];
      });
    }

    const proj = projects.find((p) => p.id === projectId);
    const budget = proj ? proj.estimatedBudget : 3000;

    updateProject(projectId, {
      status: "in_progress",
      escrowObjectId,
      escrowTxHash: txHash
    });

    const newTx: OnChainTransaction = {
      id: `tx-${Date.now()}`,
      txHash,
      type: "escrow_created",
      projectId,
      projectTitle: proj?.title || "Escrow Contract",
      amount: budget,
      fromAddress: currentUser.walletAddress || "0x4f2a91...9a2c",
      toAddress: `${escrowObjectId} (Sui Escrow)`,
      timestamp: new Date().toISOString(),
      status: "confirmed"
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (proj?.matchedFreelancerId) {
      addNotification({
        userId: proj.matchedFreelancerId,
        type: "escrow_funded",
        text: `Escrow funded ($${budget.toLocaleString()} USDC) for "${proj.title}". You can now start work!`,
        linkTo: `/project/${projectId}/workspace`
      });
    }

    return { txHash, escrowObjectId };
  };

  const submitMilestoneWork = async (milestoneId: string, content: string, links: string[] = []) => {
    await new Promise((r) => setTimeout(r, 2000));
    const now = new Date().toISOString();

    const targetMs = milestones.find((m) => m.id === milestoneId);
    if (!targetMs) return "0x" + Math.random().toString(16).slice(2, 18);

    updateMilestone(milestoneId, {
      status: "submitted",
      submissionContent: content,
      submissionLinks: links,
      submittedAt: now
    });

    const proj = projects.find((p) => p.id === targetMs.projectId);
    if (proj) {
      addNotification({
        userId: proj.clientId,
        type: "milestone_submitted",
        text: `${currentUser.name} submitted "${targetMs.title}" — awaiting your review`,
        linkTo: `/project/${proj.id}/workspace`
      });
    }

    return "0x" + Math.random().toString(16).slice(2, 18);
  };

  const requestChangesOnMilestone = (milestoneId: string, revisionNote: string) => {
    const targetMs = milestones.find((m) => m.id === milestoneId);
    if (!targetMs) return;

    updateMilestone(milestoneId, {
      status: "changes_requested",
      revisionNote
    });

    const proj = projects.find((p) => p.id === targetMs.projectId);
    if (proj?.matchedFreelancerId) {
      addNotification({
        userId: proj.matchedFreelancerId,
        type: "changes_requested",
        text: `${currentUser.name} requested changes on "${targetMs.title}"`,
        linkTo: `/project/${proj.id}/workspace`
      });
    }
  };

  const approveAndReleaseMilestone = async (milestoneId: string) => {
    await new Promise((r) => setTimeout(r, 2000));
    const txHash = generateSuiTxHash();
    const now = new Date().toISOString();

    const targetMs = milestones.find((m) => m.id === milestoneId);
    if (!targetMs) return { txHash };

    updateMilestone(milestoneId, {
      status: "released",
      onChainTxHash: txHash,
      releasedAt: now
    });

    const proj = projects.find((p) => p.id === targetMs.projectId);

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
      toAddress: "0x8e3b22...4c19 (Freelancer)",
      timestamp: now,
      status: "confirmed"
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
        text: `Milestone "${targetMs.title}" approved! $${targetMs.amount.toLocaleString()} USDC released to your wallet.`,
        linkTo: "/freelancer/earnings"
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
        simulatedFailuresEnabled,
        setActiveRole,
        switchRole,
        switchDemoAccount,
        toggleTheme,
        toggleSimulatedFailures,
        resetDemoData,
        connectWallet,
        disconnectWallet,
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
