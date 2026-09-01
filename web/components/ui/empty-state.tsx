import React from "react";
import { FolderOpen } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FolderOpen className="w-10 h-10 text-foreground/30" />,
  title,
  description,
  action,
  className
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]",
          className
        )
      )}
    >
      <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 mb-4 text-foreground/60 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-foreground/60 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
