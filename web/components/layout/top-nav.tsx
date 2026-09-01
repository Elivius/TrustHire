"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Sparkles,
  ArrowLeftRight,
  Shield,
  RotateCcw,
  Settings,
  User as UserIcon,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { NotificationsSlideOver } from "@/components/layout/notifications-slideover";

export const TopNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    activeRole,
    switchRole,
    connectWallet,
    resetDemoData,
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

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#0B0B12]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] flex items-center justify-center shadow-glass-glow group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                TrustHire
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#2DD4BF] font-normal tracking-wider">
                  Prototype
                </span>
              </span>
            </Link>

            {/* Quick Role Switcher pill in header */}
            <button
              type="button"
              onClick={handleToggleRole}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-foreground/90 transition-all ml-4"
              title="Click to switch between Client (Elena) and Freelancer (Alex) demo accounts"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#7B61FF]" />
              <span>Demo Account:</span>
              <span className="font-semibold text-[#2DD4BF]">
                {activeRole === "client" ? "Elena Vance (Client)" : "Alex Rivera (Freelancer)"}
              </span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Wallet Button */}
            <div className="min-w-[160px]">
              <WalletConnectButton />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-foreground/80 hover:text-foreground transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4DA2FF] text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
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
                className="flex items-center gap-1.5 p-1 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all"
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
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#151622] p-2 text-xs shadow-2xl z-50 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="font-semibold text-foreground truncate">{currentUser.name}</p>
                      <p className="text-foreground/50 truncate text-[11px]">{currentUser.email}</p>
                      <span className="inline-block text-[10px] font-mono text-[#2DD4BF] mt-0.5">
                        Active Role: {activeRole.toUpperCase()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleToggleRole();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-foreground/90 hover:text-white hover:bg-white/5 text-left transition-colors font-medium"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#7B61FF]" />
                      <span>
                        Switch to {activeRole === "client" ? "Alex Rivera (Freelancer)" : "Elena Vance (Client)"}
                      </span>
                    </button>

                    <Link
                      href={activeRole === "client" ? "/client/settings" : "/freelancer/profile"}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-foreground/80 hover:text-white hover:bg-white/5 text-left transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#2DD4BF]" />
                      <span>My Profile & Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        if (confirm("Reset all prototype state to original demo seed data?")) {
                          resetDemoData();
                          router.push(activeRole === "client" ? "/client/dashboard" : "/freelancer/dashboard");
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10 text-left transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Demo Data</span>
                    </button>

                    <div className="border-t border-white/5 mt-1 pt-1">
                      <Link
                        href="/auth"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-foreground/60 hover:text-red-400 hover:bg-red-500/10 text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Switch Demo</span>
                      </Link>
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
