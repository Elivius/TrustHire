import React from "react";
import { Check, Clock, Edit3, AlertCircle, Circle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Milestone, MilestoneStatus } from "@/types";

interface MilestoneStepperProps {
  milestones: Milestone[];
  activeMilestoneId?: string;
  onSelectMilestone?: (milestone: Milestone) => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export const MilestoneStepper: React.FC<MilestoneStepperProps> = ({
  milestones,
  activeMilestoneId,
  onSelectMilestone,
  orientation = "vertical",
  className
}) => {
  const getStepIcon = (status: MilestoneStatus) => {
    switch (status) {
      case "released":
      case "approved":
        return (
          <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-trust-glow/30">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        );
      case "submitted":
        return (
          <div className="w-7 h-7 rounded-full bg-[#F59E0B] text-black flex items-center justify-center shadow-lg animate-pulse">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case "changes_requested":
        return (
          <div className="w-7 h-7 rounded-full border-2 border-[#F59E0B] bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
        );
      case "disputed":
        return (
          <div className="w-7 h-7 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case "pending":
      default:
        return (
          <div className="w-7 h-7 rounded-full border border-black/15 dark:border-white/20 bg-black/5 dark:bg-white/5 text-foreground/40 flex items-center justify-center">
            <Circle className="w-2.5 h-2.5 fill-current opacity-40" />
          </div>
        );
    }
  };

  const getStatusLabel = (status: MilestoneStatus) => {
    switch (status) {
      case "released":
        return <span className="text-[#0D9488] dark:text-[#10B981] font-medium">Released & Paid</span>;
      case "approved":
        return <span className="text-[#0D9488] dark:text-[#10B981] font-medium">Approved</span>;
      case "submitted":
        return <span className="text-[#D97706] dark:text-[#F59E0B] font-medium">Submitted for Review</span>;
      case "changes_requested":
        return <span className="text-[#D97706] dark:text-[#F59E0B] font-medium">Changes Requested</span>;
      case "disputed":
        return <span className="text-red-500 dark:text-red-400 font-medium">Disputed</span>;
      case "pending":
      default:
        return <span className="text-foreground/50">Upcoming</span>;
    }
  };

  if (orientation === "horizontal") {
    return (
      <div className={twMerge(clsx("flex items-center gap-3 overflow-x-auto py-2", className))}>
        {milestones.map((m, idx) => (
          <div key={m.id} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {getStepIcon(m.status)}
              <div className="text-xs">
                <p className="font-semibold text-foreground truncate max-w-[130px]">{m.title}</p>
                <p className="text-[11px] font-mono text-foreground/60">{m.amount.toLocaleString()} SUI</p>
              </div>
            </div>
            {idx < milestones.length - 1 && (
              <div className="w-6 h-0.5 bg-black/10 dark:bg-white/10 mx-1" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={twMerge(clsx("space-y-3", className))}>
      {milestones.map((m, idx) => {
        const isSelected = activeMilestoneId === m.id;
        const isClickable = !!onSelectMilestone;

        return (
          <div
            key={m.id}
            onClick={() => isClickable && onSelectMilestone(m)}
            className={clsx(
              "relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200",
              isSelected
                ? "border-[#7B61FF]/60 bg-[#7B61FF]/[0.08] shadow-sm"
                : "border-black/10 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:border-black/20 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none",
              isClickable && "cursor-pointer"
            )}
          >
            <div className="shrink-0 mt-0.5">{getStepIcon(m.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  <span className="text-foreground/40 font-mono mr-1.5">M{idx + 1}.</span>
                  {m.title}
                </h4>
                <span className="font-mono text-xs font-semibold text-foreground/90 shrink-0">
                  {m.amount.toLocaleString()} <span className="text-[10px] text-foreground/50">SUI</span>
                </span>
              </div>
              <p className="text-xs text-foreground/60 line-clamp-2 mb-2 leading-relaxed">
                {m.deliverable}
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-black/5 dark:border-white/5">
                <div>{getStatusLabel(m.status)}</div>
                <div className="text-foreground/40 font-mono">
                  {m.deadline && !isNaN(new Date(m.deadline).getTime())
                    ? `Due ${new Date(m.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "No Due Date"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
