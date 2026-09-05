"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Sparkles,
  ArrowLeftRight,
  Shield,
  Settings,
  User as UserIcon,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { NotificationsSlideOver } from "@/components/layout/notifications-slideover";

export const TopNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dAppKit = useDAppKit();
  const {
    currentUser,
    activeRole,
    switchRole,
    connectWallet,
    disconnectWallet,
    notifications
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const unreadCount = notifications.filter(
    (n) => n.userId === currentUser.id && !n.read
  ).length;

  const handleWalletClick = async () => {
    if (!currentUser.walletAddress) {
      setIsConnectingWallet(true);
      await connectWallet();
      setIsConnectingWallet(false);
    }
  };

  const handleToggleRole = () => {
    const nextRole = activeRole === "client" ? "freelancer" : "client";
    switchRole(nextRole);
    if (nextRole === "client") {
      router.push("/client/dashboard");
    } else {
      router.push("/freelancer/dashboard");
    }
  };

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    try {
      await dAppKit.disconnectWallet();
    } catch (err) {
      console.error("Wallet disconnect error:", err);
    }
    disconnectWallet();
    router.replace("/");
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#0B0B12]/80 backdrop-blur-xl transition-colors">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] flex items-center justify-center shadow-glass-glow group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                TrustHire
              </span>
            </Link>

            {/* Quick Role Switcher pill in header */}
            {/* <button
              type="button"
              onClick={handleToggleRole}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:border-black/25 text-foreground transition-all ml-4 shadow-sm dark:shadow-none cursor-pointer"
              title="Click to switch between Client (Elena) and Freelancer (Alex) demo accounts"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#7B61FF]" />
              <span>Demo Account:</span>
              <span className="font-semibold text-[#0D9488] dark:text-[#2DD4BF]">
                {activeRole === "client" ? "Elena Vance (Client)" : "Alex Rivera (Freelancer)"}
              </span>
            </button> */}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Wallet Button */}
            <div className="shrink-0">
              <WalletConnectButton variant="nav" />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:border-black/25 text-foreground/80 hover:text-foreground transition-all shadow-sm dark:shadow-none cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2563EB] dark:bg-[#4DA2FF] text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:border-black/25 transition-all shadow-sm dark:shadow-none cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <ChevronDown className="w-3.5 h-3.5 text-foreground/60 hidden sm:block mr-1" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151622] p-2 text-xs shadow-2xl z-50 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-black/5 dark:border-white/5 mb-1">
                      <p className="font-semibold text-foreground truncate">{currentUser.name}</p>
                      <p className="text-foreground/50 truncate text-[11px]">{currentUser.email}</p>
                      <span className="inline-block text-[10px] font-mono text-[#0D9488] dark:text-[#2DD4BF] mt-0.5">
                        Active Role: {activeRole.toUpperCase()}
                      </span>
                    </div>

                    {/* <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleToggleRole();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-foreground hover:bg-black/5 dark:hover:bg-white/5 text-left transition-colors font-medium"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF]" />
                      <span>
                        Switch to {activeRole === "client" ? "Freelancer Mode" : "Client Mode"}
                      </span>
                    </button> */}

                    <Link
                      href={activeRole === "client" ? "/client/settings" : "/freelancer/profile"}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-foreground hover:bg-black/5 dark:hover:bg-white/5 text-left transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                      <span>My Profile & Settings</span>
                    </Link>

                    <div className="border-t border-black/5 dark:border-white/5 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-foreground/60 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Slideover */}
      <NotificationsSlideOver
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
};
