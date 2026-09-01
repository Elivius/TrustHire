import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "ai";

interface StatusBadgeProps {
  status: string;
  variant?: "auto" | BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = "auto",
  size = "sm",
  className
}) => {
  let resolvedVariant: BadgeVariant = "neutral";
  if (variant === "auto") {
    const s = status.toLowerCase();
    if (
      s.includes("in_progress") ||
      s.includes("released") ||
      s.includes("accepted") ||
      s.includes("approved") ||
      s.includes("confirmed") ||
      s.includes("completed")
    ) {
      resolvedVariant = "success";
    } else if (
      s.includes("submitted") ||
      s.includes("pending") ||
      s.includes("changes") ||
      s.includes("matched")
    ) {
      resolvedVariant = "warning";
    } else if (s.includes("declined") || s.includes("failed") || s.includes("dispute")) {
      resolvedVariant = "danger";
    } else {
      resolvedVariant = "neutral";
    }
  } else {
    resolvedVariant = variant;
  }

  const styles: Record<BadgeVariant, string> = {
    neutral: "bg-black/5 dark:bg-white/10 text-foreground/80 dark:text-foreground/75 border-black/15 dark:border-white/10",
    success: "bg-emerald-500/10 dark:bg-[#10B981]/15 text-emerald-700 dark:text-[#10B981] border-emerald-500/30 dark:border-[#10B981]/30",
    warning: "bg-amber-500/10 dark:bg-[#F59E0B]/15 text-amber-700 dark:text-[#F59E0B] border-amber-500/30 dark:border-[#F59E0B]/30",
    danger: "bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    ai: "bg-purple-500/10 dark:bg-[#8B5CF6]/15 text-purple-700 dark:text-[#A78BFA] border-purple-500/30 dark:border-[#8B5CF6]/30"
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center font-medium border rounded-full capitalize whitespace-nowrap shrink-0",
          size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm",
          styles[resolvedVariant],
          className
        )
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {formatText(status)}
    </span>
  );
};
