"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, ArrowLeft } from "lucide-react";
import { useApp } from "@/context/app-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthPage() {
  const router = useRouter();
  const { currentUser, activeRole, users } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("elena@vanceholdings.xyz");
  const [password, setPassword] = useState("••••••••");
  const [loading, setLoading] = useState(false);

  const handleSignInOrUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (isSignUp) {
      router.push("/role-selection");
    } else {
      // Returning user directly lands on dashboard
      router.push(activeRole === "client" ? "/client/dashboard" : "/freelancer/dashboard");
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (isSignUp) {
      router.push("/role-selection");
    } else {
      router.push(activeRole === "client" ? "/client/dashboard" : "/freelancer/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Top Left: Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
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
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-xs text-foreground/60">
            {isSignUp
              ? "Join TrustHire to hire or get hired with AI trust verification"
              : "Sign in with your demo account to continue"}
          </p>
        </div>

        {/* Continue with Google (Mock) */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-sm font-medium text-foreground transition-all cursor-pointer select-none active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Centered Divider with symmetric lines */}
        <div className="flex items-center gap-3 my-1">
          <div className="h-px bg-black/[0.08] dark:bg-white/10 flex-1" />
          <span className="text-[11px] font-mono text-foreground/45 uppercase tracking-wider whitespace-nowrap">
            or continue with email
          </span>
          <div className="h-px bg-black/[0.08] dark:bg-white/10 flex-1" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignInOrUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-foreground/40 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]/60 transition-colors"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-foreground/80">Password</label>
              {!isSignUp && (
                <span className="text-[11px] text-[#2563EB] dark:text-[#4DA2FF] cursor-pointer hover:underline">
                  Forgot?
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-foreground/40 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]/60 transition-colors font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <GradientButton
            type="submit"
            className="w-full justify-center"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4 ml-1" />}
          >
            {isSignUp ? "Continue to Role Selection" : "Sign In to Dashboard"}
          </GradientButton>
        </form>

        {/* Toggle sign in / sign up */}
        <div className="text-center pt-2 text-xs text-foreground/60">
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#2563EB] dark:text-[#4DA2FF] hover:underline font-semibold ml-1 cursor-pointer"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
