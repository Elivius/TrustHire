"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  ShieldCheck,
  Settings,
  Compass,
  FileCheck2,
  Briefcase,
  Coins,
  User,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/app-context";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
}

const CLIENT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { label: "My Projects", href: "/client/projects", icon: FolderKanban },
  { label: "Post a Project", href: "/client/projects/new", icon: PlusCircle, highlight: true },
  { label: "Escrow & Payments", href: "/client/escrow", icon: ShieldCheck },
  { label: "Settings", href: "/client/settings", icon: Settings }
];

const FREELANCER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/freelancer/dashboard", icon: LayoutDashboard },
  { label: "Browse Projects", href: "/freelancer/browse", icon: Compass },
  { label: "My Applications", href: "/freelancer/applications", icon: FileCheck2 },
  { label: "Active Work", href: "/freelancer/active-work", icon: Briefcase },
  { label: "Earnings", href: "/freelancer/earnings", icon: Coins },
  { label: "My Profile", href: "/freelancer/profile", icon: User },
  { label: "Settings", href: "/freelancer/settings", icon: Settings }
];

function isItemActive(pathname: string, itemHref: string): boolean {
  if (pathname === itemHref) return true;
  if (itemHref === "/client/projects" && pathname.startsWith("/client/projects/new")) {
    return false;
  }
  if (itemHref !== "/client/dashboard" && itemHref !== "/freelancer/dashboard") {
    return pathname.startsWith(`${itemHref}/`);
  }
  return false;
}

export const SidebarNav: React.FC = () => {
  const pathname = usePathname();
  const { activeRole } = useApp();

  const items = activeRole === "client" ? CLIENT_NAV_ITEMS : FREELANCER_NAV_ITEMS;
  const portalLabel = activeRole === "client" ? "Client Portal" : "Freelancer Portal";

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-black/[0.08] dark:border-white/10 bg-white/60 dark:bg-[#0B0B12]/60 p-4 space-y-6 backdrop-blur-xl transition-colors">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-foreground/50 font-semibold">
            {portalLabel}
          </div>

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-gradient-to-r from-[#4DA2FF]/15 to-[#7B61FF]/15 text-[#2563EB] dark:text-white border border-[#7B61FF]/30 shadow-sm"
                      : "text-foreground/75 hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border border-transparent",
                    item.highlight && !isActive && "text-[#0D9488] dark:text-[#2DD4BF] bg-[#2DD4BF]/5 border-[#2DD4BF]/20"
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-[#4DA2FF]"
                        : item.highlight
                          ? "text-[#0D9488] dark:text-[#2DD4BF]"
                          : "text-foreground/50 group-hover:text-foreground/90"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* AI status banner in sidebar */}
        <div className="mt-auto p-3.5 rounded-xl border border-black/10 dark:border-[#8B5CF6]/20 bg-white/70 dark:bg-[#8B5CF6]/[0.06] text-xs shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 text-[#7C3AED] dark:text-[#A78BFA] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gonka AI Active</span>
          </div>
          <p className="text-foreground/70 dark:text-foreground/60 text-[11px] leading-relaxed">
            Real-time reputation verification & trust scoring enabled.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0B0B12]/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors",
                isActive ? "text-[#4DA2FF]" : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[56px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
