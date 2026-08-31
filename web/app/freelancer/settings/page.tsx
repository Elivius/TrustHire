"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Wallet,
  ArrowLeftRight,
  Bell,
  Eye,
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

export default function FreelancerSettingsPage() {
  const router = useRouter();
  const {
    currentUser,
    freelancerProfiles,
    updateFreelancerProfile,
    disconnectWallet,
    connectWallet,
    resetDemoData,
    projects
  } = useApp();

  const profile = freelancerProfiles[currentUser.id] || {
    isDiscoverable: true
  };

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [isDiscoverable, setIsDiscoverable] = useState(profile.isDiscoverable !== false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [notifToggles, setNotifToggles] = useState({
    invitations: true,
    recommendations: true,
    milestones: true,
    trustScore: true,
    disputes: true
  });

  const myProjects = projects.filter((p) => p.matchedFreelancerId === currentUser.id);
  const activeContractsCount = myProjects.filter((p) => p.status === "in_progress" || p.status === "matched").length;

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    updateFreelancerProfile({ name, isDiscoverable });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSetupAsClient = () => {
    router.push("/client/onboarding");
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Freelancer Settings
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Manage your payout wallet, talent discoverability, and role settings.
          </p>
        </div>

        {/* Section 1: Account */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <User className="w-4 h-4 text-[#A78BFA]" />
            <h2 className="text-base font-bold text-white">Account Information</h2>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Settings updated successfully!</span>
                </span>
              ) : <div />}

              <GradientButton size="sm" type="submit">
                Save Account Changes
              </GradientButton>
            </div>
          </form>
        </GlassCard>

        {/* Section 2: Payout Wallet */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <Wallet className="w-4 h-4 text-[#2DD4BF]" />
            <h2 className="text-base font-bold text-white">Payout Wallet (Sui)</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white block mb-1">Active Payout Address</span>
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
                      if (confirm("Switch to a new Sui payout address?")) {
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
                      if (confirm("Disconnecting your wallet will pause future payout releases.")) {
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

        {/* Section 3: Privacy & Discoverability */}
        <GlassCard className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <Eye className="w-4 h-4 text-[#4DA2FF]" />
            <h2 className="text-base font-bold text-white">Talent Pool Discoverability</h2>
          </div>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
            <div className="space-y-1 pr-4">
              <span className="text-sm font-semibold text-white block">Make profile visible to AI matching</span>
              <p className="text-xs text-foreground/60">
                When enabled, Gonka AI recommends your profile to relevant client project specs. Turning this off does not affect active contracts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isDiscoverable}
              onChange={(e) => {
                const val = e.target.checked;
                setIsDiscoverable(val);
                updateFreelancerProfile({ isDiscoverable: val });
              }}
              className="rounded border-white/20 text-[#7B61FF] focus:ring-0 w-5 h-5 shrink-0"
            />
          </label>
        </GlassCard>

        {/* Section 4: Dual Role Switch */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <ArrowLeftRight className="w-4 h-4 text-[#7B61FF]" />
            <h2 className="text-base font-bold text-white">Dual Role Setup</h2>
          </div>

          <div className="p-5 rounded-2xl border border-[#4DA2FF]/30 bg-[#4DA2FF]/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-white">
                You're currently in Freelancer Mode
              </h3>
              <p className="text-xs text-foreground/70">
                Need to hire talent for your own startup or DAO? You can activate Client hiring capabilities on this same account.
              </p>
            </div>

            <GradientButton
              size="md"
              onClick={handleSetupAsClient}
              icon={<ArrowLeftRight className="w-4 h-4 ml-1" />}
            >
              Also Set Up as Client
            </GradientButton>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-red-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </div>

          <p className="text-xs text-foreground/60 leading-relaxed">
            {activeContractsCount > 0
              ? `You have ${activeContractsCount} active project contracts. Locked escrow funds are tied to your connected address.`
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

            <GhostButton
              size="sm"
              onClick={() => {
                if (confirm("Reset all prototype state to seed defaults?")) {
                  resetDemoData();
                  router.push("/freelancer/dashboard");
                }
              }}
            >
              Reset Demo Seed Data
            </GhostButton>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
