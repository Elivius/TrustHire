"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Wallet, ArrowLeft, Loader2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { useWallets, useDAppKit, useCurrentAccount } from "@mysten/dapp-kit-react";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { GoogleLoginButton } from "@/components/ui/google-login-button";
import { createClient } from "@/lib/supabase/client";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthPage() {
  const router = useRouter();
  const { switchRole, syncUserWithDatabase } = useApp();
  const currentAccount = useCurrentAccount();
  const [isVerifying, setIsVerifying] = useState(false);
  const checkedAddressRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let isMounted = true; // Prevent memory leaks
    const address = currentAccount?.address;
    if (!address) return;

    if (checkedAddressRef.current === address) return;
    checkedAddressRef.current = address;

    const userAddress: string = address;

    async function verifyUserAndRoute() {
      setIsVerifying(true);

      try {
        const supabase = createClient();

        // 1. Synchronize user and profiles from Supabase into AppContext state
        const syncedUser = await syncUserWithDatabase(userAddress);

        if (!isMounted) return;

        let role = syncedUser?.roles?.[0];
        let companyName = syncedUser?.companyName;

        // Fallback query if syncUserWithDatabase returned null or timed out
        if (!role) {
          const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 3000)
          );

          const checkPromise = supabase
            .from("users")
            .select("user_id, name, email, role")
            .ilike("user_id", userAddress)
            .maybeSingle();

          const { data: userRow } = await Promise.race([checkPromise, timeoutPromise]);

          if (!isMounted) return;
          if (userRow?.role) {
            role = userRow.role.toLowerCase() as any;
          }
        }

        if (role === "client") {
          switchRole("client");
          if (!companyName) {
            const { data: clientProf } = await supabase
              .from("client_profiles")
              .select("client_id, company_name")
              .ilike("client_id", userAddress)
              .maybeSingle();
            companyName = clientProf?.company_name;
          }

          if (!isMounted) return;
          if (companyName) {
            router.push("/client/dashboard");
          } else {
            router.push("/client/onboarding");
          }
          return;
        } else if (role === "freelancer") {
          switchRole("freelancer");
          const { data: freelancerProf } = await supabase
            .from("freelancer_profiles")
            .select("freelancer_id, prof_headline")
            .ilike("freelancer_id", userAddress)
            .maybeSingle();

          if (!isMounted) return;
          if (freelancerProf?.prof_headline) {
            router.push("/freelancer/dashboard");
          } else {
            router.push("/freelancer/onboarding");
          }
          return;
        }

        // New user or no role found -> route to role selection
        router.push("/role-selection");
      } catch (err) {
        console.error("Auth routing verification failed:", err);
        if (isMounted) router.push("/role-selection");
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    }

    verifyUserAndRoute();

    return () => {
      isMounted = false;
    };
  }, [currentAccount?.address]);

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

        {isVerifying ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#4DA2FF] animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">Checking account in database...</p>
              <p className="text-xs text-foreground/50">Looking up role and profile status</p>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
