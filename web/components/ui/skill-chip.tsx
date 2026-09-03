import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface SkillChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  highlighted?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const SkillChip: React.FC<SkillChipProps> = ({
  label,
  selected = false,
  onClick,
  onRemove,
  highlighted = false,
  size = "md",
  className
}) => {
  const isClickable = !!onClick;

  return (
    <span
      onClick={onClick}
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all select-none",
          size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm",
          selected
            ? "bg-[#7B61FF]/15 dark:bg-[#7B61FF]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#7B61FF]/40 dark:border-[#7B61FF]/50 shadow-sm"
            : highlighted
            ? "bg-[#2DD4BF]/15 text-[#0D9488] dark:text-[#2DD4BF] border border-[#2DD4BF]/40"
            : "bg-black/[0.04] dark:bg-white/[0.06] text-foreground/85 border border-black/15 dark:border-white/10 hover:border-black/30 dark:hover:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none",
          isClickable && "cursor-pointer hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-95",
          className
        )
      )}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-red-400 p-0.5 rounded ml-0.5 transition-colors"
        >
          ×
        </button>
      )}
    </span>
  );
};
