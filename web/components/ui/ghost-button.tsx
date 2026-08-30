import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  variant = "outline",
  size = "md",
  icon,
  className,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-medium rounded-xl gap-1.5",
    md: "px-4 py-2 text-sm font-medium rounded-xl gap-2",
    lg: "px-6 py-2.5 text-base font-medium rounded-2xl gap-2"
  }[size];

  const variantStyles = {
    outline: "border border-white/10 dark:border-white/15 bg-white/5 hover:bg-white/10 text-foreground",
    ghost: "bg-transparent hover:bg-white/5 text-foreground/80 hover:text-foreground",
    danger: "border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300"
  }[variant];

  return (
    <button
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-[0.98]",
          variantStyles,
          sizeClasses,
          disabled && "opacity-50 cursor-not-allowed transform-none hover:bg-transparent",
          className
        )
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};
