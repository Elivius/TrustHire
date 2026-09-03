import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "ai" | "trust";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs font-medium rounded-xl gap-1.5",
    md: "px-5 py-2.5 text-sm font-medium rounded-xl gap-2",
    lg: "px-7 py-3 text-base font-semibold rounded-2xl gap-2.5"
  }[size];

  const variantGradients = {
    primary: "bg-gradient-to-r from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] text-white hover:opacity-95 shadow-glass-glow",
    ai: "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white hover:opacity-95 shadow-ai-glow",
    trust: "bg-gradient-to-r from-[#2DD4BF] to-[#10B981] text-white hover:opacity-95 shadow-trust-glow"
  }[variant];

  return (
    <button
      className={twMerge(
        clsx(
          "relative inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer select-none active:scale-[0.98]",
          variantGradients,
          sizeClasses,
          (disabled || loading) && "opacity-50 cursor-not-allowed transform-none hover:opacity-50 active:scale-100",
          className
        )
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
