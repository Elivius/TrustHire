"use client";

import React from "react";
import { TopNav } from "@/components/layout/top-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-foreground transition-colors duration-200">
      <TopNav />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <SidebarNav />
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
