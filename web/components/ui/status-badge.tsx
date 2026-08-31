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
    neutral: "bg-white/10 text-foreground/75 border-white/10",
    success: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30",
    warning: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    ai: "bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30"
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center font-medium border rounded-full capitalize",
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
