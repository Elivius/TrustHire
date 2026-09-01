"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Wallet, ArrowLeft } from "lucide-react";
import { useApp } from "@/context/app-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { useWallets, useDAppKit, useCurrentAccount } from "@mysten/dapp-kit-react";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { GoogleLoginButton } from "@/components/ui/google-login-button";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthPage() {
  const router = useRouter();
  const { currentUser, activeRole, users } = useApp();
  
  const currentAccount = useCurrentAccount();
  
  React.useEffect(() => {
    if (currentAccount) {
      if (activeRole) {
        router.push(`/${activeRole}/dashboard`);
      } else {
        // Fallback if no role is selected, default to client
        router.push("/client/dashboard");
      }
    }
  }, [currentAccount, activeRole, router]);

  return (
    <div className="min-h-screen bg-bg-base text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Top Left: Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          onClick={() => router.push("/")}
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

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#4DA2FF]/15 via-[#7B61FF]/15 to-[#2DD4BF]/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Logo */}
      <div className="text-center mb-8 relative z-10 space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] flex items-center justify-center shadow-glass-glow group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">TrustHire</span>
        </Link>
        <p className="text-xs sm:text-sm text-foreground/60">
          AI-matched talent, smart contract escrow
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-[420px] rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/90 dark:bg-[#151622]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Welcome to TrustHire
          </h2>
          <p className="text-xs text-foreground/60">
            Sign in with Google or connect your Sui wallet to continue
          </p>
        </div>

        {/* Continue with Google (zkLogin) */}
        <GoogleLoginButton />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-[#151622] px-3 text-[11px] font-mono text-foreground/40 uppercase">
              or connect wallet
            </span>
          </div>
        </div>

        {/* Connect Wallet */}
        <div className="space-y-3 relative z-50">
          <WalletConnectButton />
        </div>
      </div>
    </div>
  );
}
