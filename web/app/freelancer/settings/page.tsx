"use client";

import React, { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";

export default function FreelancerSettingsPage() {
  const router = useRouter();
  const {
    currentUser,
    freelancerProfiles,
    updateFreelancerProfile,
    disconnectWallet,
    connectWallet,
    projects
  } = useApp();

  const profile =
    freelancerProfiles[currentUser.id] ||
    (currentUser.walletAddress ? freelancerProfiles[currentUser.walletAddress] : undefined) ||
    Object.entries(freelancerProfiles).find(
      ([k]) =>
        k.toLowerCase() === currentUser.id.toLowerCase() ||
        (currentUser.walletAddress && k.toLowerCase() === currentUser.walletAddress.toLowerCase())
    )?.[1] || {
      isDiscoverable: true
    };

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [isDiscoverable, setIsDiscoverable] = useState(profile.isDiscoverable !== false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email);
  }, [currentUser.name, currentUser.email]);

  const [notifToggles, setNotifToggles] = useState({
    invitations: true,
    recommendations: true,
    milestones: true,
    trustScore: true,
    disputes: true
  });

  const myProjects = projects.filter(
    (p) =>
      Boolean(p.matchedFreelancerId) &&
      (p.matchedFreelancerId === currentUser.id ||
        (currentUser.walletAddress &&
          p.matchedFreelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
        p.matchedFreelancerId?.toLowerCase() === currentUser.id.toLowerCase())
  );
  const activeContractsCount = myProjects.filter((p) => p.status === "in_progress" || p.status === "matched").length;

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateFreelancerProfile({ name, isDiscoverable });

    try {
      const supabase = createClient();
      const targetId = currentUser.walletAddress || currentUser.id;

      await supabase.from("users").upsert({
        user_id: targetId,
        name: name.trim(),
        email: email.trim(),
        role: "FREELANCER",
        status: "ACTIVE"
      }, { onConflict: "user_id" });

      await supabase.from("freelancer_profiles").upsert({
        freelancer_id: targetId,
        prof_headline: (profile as any).headline || "Web3 Developer",
        bio: (profile as any).bio || "",
        experience_level: (profile as any).experienceLevel || "Intermediate",
        trust_score: (profile as any).trustScore || 90,
        last_verified_at: new Date().toISOString()
      }, { onConflict: "freelancer_id" });
    } catch (err) {
      console.warn("Could not sync updated freelancer settings to Supabase:", err);
    } finally {
      setIsSaving(false);
    }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Freelancer Settings
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Manage your payout wallet, talent discoverability, and role settings.
          </p>
        </div>

        {/* Section 1: Account */}
        {/* <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <User className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-[#10B981] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Settings updated successfully!</span>
                </span>
              ) : <div />}

              <GradientButton size="sm" type="submit" loading={isSaving}>
                {savedSuccess ? "Saved ✓" : "Save Account Changes"}
              </GradientButton>
            </div>
          </form>
        </GlassCard> */}

        {/* Section 2: Payout Wallet */}
        {/* <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <Wallet className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
            <h2 className="text-base font-bold text-foreground">Payout Wallet (Sui)</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div>
              <span className="text-xs font-semibold text-foreground block mb-1">Active Payout Address</span>
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
        </GlassCard> */}

        {/* Section 3: Privacy & Discoverability */}
        <GlassCard className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <Eye className="w-4 h-4 text-[#2563EB] dark:text-[#4DA2FF]" />
            <h2 className="text-base font-bold text-foreground">Talent Pool Discoverability</h2>
          </div>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
            <div className="space-y-1 pr-4">
              <span className="text-sm font-semibold text-foreground block">Make profile visible to AI matching</span>
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
              className="rounded border-black/20 dark:border-white/20 text-[#7B61FF] focus:ring-0 w-5 h-5 shrink-0"
            />
          </label>
        </GlassCard>

        {/* Section 4: Dual Role Switch */}
        {/* <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
            <ArrowLeftRight className="w-4 h-4 text-[#7C3AED] dark:text-[#7B61FF]" />
            <h2 className="text-base font-bold text-foreground">Dual Role Setup</h2>
          </div>

          <div className="p-5 rounded-2xl border border-[#4DA2FF]/30 bg-[#4DA2FF]/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-foreground">
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
        </GlassCard> */}

        {/* Danger Zone */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-red-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </div>

          <p className="text-xs text-foreground/60 leading-relaxed">
            {activeContractsCount > 0
              ? `You have ${activeContractsCount} active project contracts. Locked escrow funds are tied to your connected address.`
              : "Signing out will disconnect your active wallet session from this browser."}
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
