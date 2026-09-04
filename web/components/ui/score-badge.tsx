import React from "react";
import { Sparkles, ShieldCheck, Clock, Star } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ScoreBadgeProps {
  score: number;
  type: "ai_match" | "trust" |"overall" | "pending";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  type,
  size = "md",
  showLabel = true,
  label,
  className
}) => {
  const configs = {
    overall: {
      color:
        "text-[#7C3AED] dark:text-[#C4B5FD] border-[#8B5CF6]/40 dark:border-[#A78BFA]/50 bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/15",
      ringColor: "#8B5CF6",
      icon: (
        <Star
          className={
            size === "sm"
              ? "w-3 h-3"
              : size === "md"
                ? "w-3.5 h-3.5"
                : "w-4 h-4"
          }
        />
      ),
      defaultLabel: "Overall"
    },
    ai_match: {
      color: "text-[#7C3AED] dark:text-[#A78BFA] border-purple-500/30 dark:border-[#8B5CF6]/40 bg-purple-500/10 dark:bg-[#8B5CF6]/10",
      ringColor: "#8B5CF6",
      icon: <Sparkles className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      defaultLabel: "AI Match"
    },
    trust: {
      color: "text-[#0D9488] dark:text-[#2DD4BF] border-teal-500/30 dark:border-[#2DD4BF]/40 bg-teal-500/10 dark:bg-[#2DD4BF]/10",
      ringColor: "#2DD4BF",
      icon: <ShieldCheck className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      defaultLabel: "Trust Score"
    },
    pending: {
      color: "text-[#D97706] dark:text-[#F59E0B] border-amber-500/30 dark:border-[#F59E0B]/40 bg-amber-500/10 dark:bg-[#F59E0B]/10",
      ringColor: "#F59E0B",
      icon: <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      defaultLabel: "Evaluating"
    }
  }[type];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1 rounded-lg",
    md: "text-sm px-2.5 py-1 gap-1.5 rounded-xl",
    lg: "text-base px-3.5 py-1.5 gap-2 rounded-xl"
  }[size];

  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center font-mono font-semibold border backdrop-blur-sm select-none whitespace-nowrap shrink-0",
          configs.color,
          sizeClasses,
          className
        )
      )}
    >
      {configs.icon}
      <span>{score}</span>
      {showLabel && (
        <span className="font-sans font-medium text-[11px] opacity-80 pl-0.5">
          {label || configs.defaultLabel}
        </span>
      )}
    </div>
  );
};
