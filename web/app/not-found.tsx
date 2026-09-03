"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shadow-lg">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-sm text-foreground/60">
            The page or project you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link href="/">
          <GradientButton icon={<ArrowLeft className="w-4 h-4 mr-1" />}>
            Return Home
          </GradientButton>
        </Link>
      </div>
    </AppShell>
  );
}
