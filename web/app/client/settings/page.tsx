"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Wallet,
  ArrowLeftRight,
  Bell,
  Trash2,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { WalletChip } from "@/components/ui/wallet-chip";
import { createClient } from "@/lib/supabase/client";

export default function ClientSettingsPage() {
  const router = useRouter();
  const {
    currentUser,
    clientProfiles,
    updateClientProfile,
    disconnectWallet,
    connectWallet,
    switchRole,
    projects,
    milestones
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [companyName, setCompanyName] = useState(currentUser.companyName || "");
  const [email, setEmail] = useState(currentUser.email);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setCompanyName(currentUser.companyName || "");
    setEmail(currentUser.email);
  }, [currentUser.name, currentUser.companyName, currentUser.email]);

  // Notification settings (mock toggles)
  const [notifToggles, setNotifToggles] = useState({
    applications: true,
    milestones: true,
    recommendations: true,
    escrow: true
  });

  const clientProjects = projects.filter((p) => p.clientId === currentUser.id || p.clientId === currentUser.walletAddress);
  const activeEscrowSum = milestones
    .filter((m) => {
      const proj = clientProjects.find((p) => p.id === m.projectId);
      return proj?.status === "in_progress" && m.status !== "released";
    })
    .reduce((sum, m) => sum + m.amount, 0);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    updateClientProfile({ name, companyName });

    try {
      const supabase = createClient();
      const targetId = currentUser.walletAddress || currentUser.id;

      await supabase.from("users").upsert({
        user_id: targetId,
        name: name.trim(),
        email: email.trim(),
        role: "CLIENT",
        status: "ACTIVE"
      }, { onConflict: "user_id" });

      await supabase.from("client_profiles").upsert({
        client_id: targetId,
        company_name: companyName.trim()
      }, { onConflict: "client_id" });
    } catch (err) {
      console.warn("Could not sync updated client settings to Supabase:", err);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSetupAsFreelancer = () => {
    router.push("/freelancer/onboarding");
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Client Settings
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Manage your organization profile, connected wallet, and dual-role credentials.
          </p>
        </div>

        {/* Section 1: Account Info */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <User className="w-4 h-4 text-[#2563EB] dark:text-[#4DA2FF]" />
            <h2 className="text-base font-bold text-foreground">Account Information</h2>
          </div>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#4DA2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#4DA2FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#4DA2FF]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-[#10B981] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profile updated successfully!</span>
                </span>
              ) : <div />}

              <GradientButton size="sm" type="submit">
                Save Account Changes
              </GradientButton>
            </div>
          </form>
        </GlassCard>

        {/* Section 2: Wallet Management */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <Wallet className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
            <h2 className="text-base font-bold text-foreground">Sui Escrow Wallet</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div>
              <span className="text-xs font-semibold text-foreground block mb-1">Active Connected Address</span>
              {currentUser.walletAddress ? (
                <WalletChip address={currentUser.walletAddress} />
              ) : (
                <span className="text-xs text-foreground/50">No wallet connected</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentUser.walletAddress ? (
                <>
                  <GhostButton
                    size="sm"
                    onClick={() => {
                      if (confirm("Switch to a newly generated testnet wallet?")) {
                        connectWallet();
                      }
                    }}
                  >
                    Switch Wallet
                  </GhostButton>
                  <GhostButton
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm("Are you sure you want to disconnect your wallet?")) {
                        disconnectWallet();
                      }
                    }}
                  >
                    Disconnect
                  </GhostButton>
                </>
              ) : (
                <GradientButton size="sm" onClick={() => connectWallet()}>
                  Connect Sui Wallet
                </GradientButton>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Section 3: Dual Roles Switch */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <ArrowLeftRight className="w-4 h-4 text-[#7C3AED] dark:text-[#7B61FF]" />
            <h2 className="text-base font-bold text-foreground">Roles & Account Modes</h2>
          </div>

          <div className="p-5 rounded-2xl border border-[#7B61FF]/30 bg-[#7B61FF]/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-foreground">
                You're currently in Client Mode
              </h3>
              <p className="text-xs text-foreground/70">
                Want to pick up freelance work or build an on-chain Trust Score? You can activate Freelancer capabilities on this same account.
              </p>
            </div>

            <GradientButton
              size="md"
              variant="ai"
              onClick={handleSetupAsFreelancer}
              icon={<ArrowLeftRight className="w-4 h-4 ml-1" />}
            >
              Also Set Up as Freelancer
            </GradientButton>
          </div>
        </GlassCard>

        {/* Section 4: Notifications */}
        <GlassCard className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <Bell className="w-4 h-4 text-[#D97706] dark:text-[#F59E0B]" />
            <h2 className="text-base font-bold text-foreground">Notification Preferences</h2>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: "applications", label: "New candidate applications and match proposals" },
              { key: "milestones", label: "Milestone deliverables submitted by freelancers" },
              { key: "recommendations", label: "Autonomous Gonka AI recommendation updates" },
              { key: "escrow", label: "On-chain escrow confirmations and release receipts" }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                <span className="text-foreground/80">{label}</span>
                <input
                  type="checkbox"
                  checked={(notifToggles as any)[key]}
                  onChange={() =>
                    setNotifToggles((prev) => ({ ...prev, [key]: !(prev as any)[key] }))
                  }
                  className="rounded border-black/20 dark:border-white/20 text-[#7B61FF] focus:ring-0 w-4 h-4"
                />
              </label>
            ))}
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-red-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </div>

          <p className="text-xs text-foreground/60 leading-relaxed">
            {activeEscrowSum > 0
              ? `You currently have $${activeEscrowSum.toLocaleString()} USDC locked across active escrow contracts. These funds remain protected on-chain.`
              : "Prototype state can be reset to restore original demo seed values at any time."}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <GhostButton
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm("Sign out and return to landing page?")) {
                  router.push("/");
                }
              }}
              icon={<LogOut className="w-3.5 h-3.5 mr-1" />}
            >
              Sign Out
            </GhostButton>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
