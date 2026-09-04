"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building,
  User,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Upload
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { SkillChip } from "@/components/ui/skill-chip";
import { WalletChip } from "@/components/ui/wallet-chip";
import { clsx } from "clsx";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
export default function ClientOnboardingPage() {
  const router = useRouter();
  const { currentUser, updateClientProfile } = useApp();
  const currentAccount = useCurrentAccount();
  const fundingWallet = currentAccount?.address || currentUser.walletAddress || currentUser.id;

  const [step, setStep] = useState(1);
  const [name, setName] = useState(
    currentUser.name && currentUser.name !== "Elena Vance" && currentUser.name !== "Alex Rivera"
      ? currentUser.name
      : ""
  );
  const [companyName, setCompanyName] = useState(currentUser.companyName || "");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  );
  
  const allCategories = [
    "Web Development",
    "Smart Contracts",
    "Design & UI/UX",
    "Writing & Content",
    "Marketing",
    "Security Audits",
    "Other"
  ];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Web Development", "Smart Contracts", "Design & UI/UX"]);
  const [budgetRange, setBudgetRange] = useState<"<500" | "500-2k" | "2k-10k" | "10k+">("2k-10k");
  const [walletError, setWalletError] = useState("");

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleFinish = async () => {
    updateClientProfile({
      name,
      avatarUrl,
      companyName,
      bio,
      hiringCategories: selectedCategories,
      typicalBudgetRange: budgetRange
    });

    try {
      const supabase = createClient();
      const targetUserId = fundingWallet;

      // 1. Ensure user row exists in public.users with role CLIENT
      const userEmail = `${targetUserId.slice(0, 10).toLowerCase()}@trusthire.io`;
      await supabase.from("users").upsert({
        user_id: targetUserId,
        name: name.trim() || currentUser.name || "Client",
        email: userEmail,
        role: "CLIENT",
        status: "ACTIVE"
      }, { onConflict: "user_id" });

      // 2. Upsert client profile
      await supabase.from("client_profiles").upsert({
        client_id: targetUserId,
        company_name: companyName,
        company_description: bio,
        project_budget_range: budgetRange
      }, { onConflict: "client_id" });
    } catch (e) {
      console.warn("Could not sync client profile to Supabase:", e);
    }

    router.push("/client/dashboard");
  };

  return (
    <div className="min-h-screen bg-bg-base text-foreground flex flex-col items-center justify-center p-4 relative transition-colors duration-200">
      {/* Top right controls */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-gradient-to-tr from-[#4DA2FF]/15 via-[#7B61FF]/15 to-[#2DD4BF]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">
        {/* Step Indicator */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-xs text-[#2563EB] dark:text-[#4DA2FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Client Setup • Step {step} of 3</span>
          </div>
          <div className="flex items-center justify-center gap-2 max-w-[200px] mx-auto pt-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={clsx(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  s <= step ? "bg-gradient-to-r from-[#4DA2FF] to-[#2DD4BF]" : "bg-black/10 dark:bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/90 dark:bg-[#151622]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Tell us about yourself & organization</h2>
                <p className="text-xs text-foreground/60">This information will be displayed to freelancers on your posted projects.</p>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const seed = Math.floor(Math.random() * 1000);
                      setAvatarUrl(`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80&sig=${seed}`);
                    }}
                    className="text-xs font-medium text-[#4DA2FF] hover:underline flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change avatar photo</span>
                  </button>
                  <p className="text-[11px] text-foreground/40 mt-0.5">JPG, PNG or WebP</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1.5">Your Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#4DA2FF]"
                    placeholder="e.g. Elena Vance"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1.5">
                    Company / DAO Name <span className="text-foreground/40 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#4DA2FF]"
                    placeholder="e.g. Nexus Web3 Labs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1.5">About your projects / mission</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#4DA2FF] resize-none"
                    placeholder="Briefly describe what you build..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <GradientButton
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  icon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Continue to Preferences
                </GradientButton>
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Hiring Preferences</h2>
                <p className="text-xs text-foreground/60">Help Gonka AI pre-tune candidate recommendations for your team.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-2">What skills or roles do you typically hire for?</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <SkillChip
                      key={cat}
                      label={cat}
                      selected={selectedCategories.includes(cat)}
                      onClick={() => toggleCategory(cat)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-2">Typical Project Budget Range</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["<500", "500-2k", "2k-10k", "10k+"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setBudgetRange(r)}
                      className={clsx(
                        "py-2.5 px-3 rounded-xl border text-xs font-mono font-medium transition-all",
                        budgetRange === r
                          ? "border-[#4DA2FF] bg-[#4DA2FF]/15 text-[#2563EB] dark:text-white"
                          : "border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-foreground/70 hover:border-black/20 dark:hover:border-white/20"
                      )}
                    >
                      {r === "<500" ? "< $500" : r === "500-2k" ? "$500 – $2k" : r === "2k-10k" ? "$2k – $10k" : "$10k+"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <GhostButton onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </GhostButton>
                <GradientButton onClick={() => setStep(3)} icon={<ArrowRight className="w-4 h-4 ml-1" />}>
                  Continue to Wallet
                </GradientButton>
              </div>
            </div>
          )}

          {/* Step 3: Wallet Connect */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Connect Escrow Wallet</h2>
                <p className="text-xs text-foreground/60">Connect your Sui address to fund milestone escrows when hiring.</p>
              </div>

              <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF] shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs text-foreground/75 leading-relaxed">
                    <p className="font-semibold text-foreground">Non-Custodial Escrow Assurance</p>
                    <p>
                      Your funds stay in your control until you approve a milestone — TrustHire never holds a balance on your behalf.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                      <span className="text-xs font-semibold text-foreground shrink-0">Connected Escrow Wallet:</span>
                      <span className="font-mono text-xs text-[#0D9488] dark:text-[#2DD4BF] truncate">{fundingWallet}</span>
                    </div>
                    <span className="text-[11px] text-[#0D9488] dark:text-[#2DD4BF] font-semibold font-sans px-2.5 py-0.5 rounded bg-[#2DD4BF]/20 shrink-0">
                      Connected via Login ✓
                    </span>
                  </div>
                </div>
              </div>

              {walletError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {walletError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <GhostButton onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </GhostButton>
                <GradientButton
                  onClick={handleFinish}
                  icon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Complete Setup & Open Dashboard
                </GradientButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
