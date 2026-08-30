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
    default: "bg-[#151622]/90 dark:bg-[#151622]/90 border border-white/10 shadow-glass",
    "accent-ai": "bg-[#151622]/90 border-l-4 border-l-[#8B5CF6] border-y border-r border-white/10 shadow-ai-glow/20",
    "accent-trust": "bg-[#151622]/90 border-l-4 border-l-[#2DD4BF] border-y border-r border-white/10 shadow-trust-glow/20",
    subtle: "bg-white/[0.03] border border-white/5",
    interactive: "bg-[#151622]/80 border border-white/10 hover:border-white/20 hover:bg-[#151622] cursor-pointer transition-all duration-200"
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
