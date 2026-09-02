"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Briefcase, UserCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { useApp } from "@/context/app-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { clsx } from "clsx";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { switchRole } = useApp();
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer" | null>(null);

  const handleContinue = () => {
    if (!selectedRole) return;
    switchRole(selectedRole);
    if (selectedRole === "client") {
      router.push("/client/onboarding");
    } else {
      router.push("/freelancer/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Top Left: Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-foreground/75 hover:text-foreground bg-white/70 dark:bg-[#151622]/70 hover:bg-white dark:hover:bg-[#151622] border border-black/10 dark:border-white/10 backdrop-blur-md transition-all shadow-sm cursor-pointer select-none active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Top right controls */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#4DA2FF]/15 via-[#7B61FF]/15 to-[#2DD4BF]/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto space-y-8 relative z-10">
        {/* Title */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-xs text-foreground/75 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#7B61FF]" />
            <span>Step 1 of Setup</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            How will you use TrustHire?
          </h1>
          <p className="text-sm text-foreground/60 max-w-md mx-auto">
            Select your primary role to get started. You can always add the other role later from your settings.
          </p>
        </div>

        {/* 2 Selectable Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Client Card */}
          <div
            onClick={() => setSelectedRole("client")}
            className={clsx(
              "p-6 sm:p-8 rounded-3xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden group backdrop-blur-xl",
              selectedRole === "client"
                ? "border-[#4DA2FF] bg-white dark:bg-[#151622] shadow-lg dark:shadow-glass-glow ring-2 ring-[#4DA2FF]/20"
                : "border-black/[0.08] dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#151622]"
            )}
          >
            <div className="p-3.5 rounded-2xl bg-[#4DA2FF]/10 text-[#2563EB] dark:text-[#4DA2FF] w-fit mb-5 group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">I'm a Client</h3>
            <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
              Post projects, get matched with verified talent, fund smart contract escrow, and approve milestones.
            </p>
            <div className="mt-6 flex items-center text-xs font-semibold text-[#2563EB] dark:text-[#4DA2FF]">
              <span>Continue as Client</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Freelancer Card */}
          <div
            onClick={() => setSelectedRole("freelancer")}
            className={clsx(
              "p-6 sm:p-8 rounded-3xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden group backdrop-blur-xl",
              selectedRole === "freelancer"
                ? "border-[#7B61FF] bg-white dark:bg-[#151622] shadow-lg dark:shadow-ai-glow ring-2 ring-[#7B61FF]/20"
                : "border-black/[0.08] dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#151622]"
            )}
          >
            <div className="p-3.5 rounded-2xl bg-[#8B5CF6]/10 text-[#7C3AED] dark:text-[#A78BFA] w-fit mb-5 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">I'm a Freelancer</h3>
            <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
              Build an on-chain Trust Score, receive AI project matches, submit deliverables, and get paid automatically.
            </p>
            <div className="mt-6 flex items-center text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
              <span>Continue as Freelancer</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center pt-2">
          <GradientButton
            size="lg"
            disabled={!selectedRole}
            onClick={handleContinue}
            className="w-full sm:w-auto min-w-[200px]"
            icon={<ArrowRight className="w-4 h-4 ml-1" />}
          >
            Continue
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
