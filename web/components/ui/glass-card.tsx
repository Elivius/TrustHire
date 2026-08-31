import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "accent-ai" | "accent-trust" | "subtle" | "interactive";
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = "default",
  hoverEffect = false,
  className,
  ...props
}) => {
  const variantStyles = {
    default: "bg-white dark:bg-[#151622]/90 border border-black/[0.08] dark:border-white/10 shadow-sm dark:shadow-glass text-foreground",
    "accent-ai": "bg-white dark:bg-[#151622]/90 border-l-4 border-l-[#8B5CF6] border-y border-r border-black/[0.08] dark:border-white/10 shadow-sm dark:shadow-ai-glow/20 text-foreground",
    "accent-trust": "bg-white dark:bg-[#151622]/90 border-l-4 border-l-[#2DD4BF] border-y border-r border-black/[0.08] dark:border-white/10 shadow-sm dark:shadow-trust-glow/20 text-foreground",
    subtle: "bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-foreground",
    interactive: "bg-white/80 dark:bg-[#151622]/80 border border-black/[0.08] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#151622] cursor-pointer transition-all duration-200 text-foreground"
  }[variant];

  return (
    <div
      className={twMerge(
        clsx(
          "rounded-2xl p-5 sm:p-6 backdrop-blur-md",
          variantStyles,
          hoverEffect && "hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
