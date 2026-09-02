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
            ? "bg-[#7B61FF]/20 text-[#A78BFA] border border-[#7B61FF]/50 shadow-sm"
            : highlighted
            ? "bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/40"
            : "bg-white/[0.06] text-foreground/80 border border-white/10 hover:border-white/20",
          isClickable && "cursor-pointer hover:bg-white/[0.1] active:scale-95",
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
