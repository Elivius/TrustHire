"use client";

import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface AIReasoningCalloutProps {
  reasoning: string;
  requestId: string;
  detailedTrace?: string;
  confidence?: "Low" | "Medium" | "High";
  className?: string;
}

export const AIReasoningCallout: React.FC<AIReasoningCalloutProps> = ({
  reasoning,
  requestId,
  detailedTrace,
  confidence,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/[0.08] p-4 text-sm backdrop-blur-md transition-all duration-200",
          className
        )
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] mt-0.5 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs uppercase tracking-wider text-[#A78BFA] flex items-center gap-1.5">
              <span>Gonka AI Reasoning</span>
              {confidence && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 font-mono normal-case">
                  Confidence: {confidence}
                </span>
              )}
            </span>
            {detailedTrace && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-[#A78BFA] hover:text-[#C084FC] inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isExpanded ? "Less" : "Trace"}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <p className="text-foreground/90 leading-relaxed text-xs sm:text-sm">
            {reasoning}
          </p>

          {isExpanded && detailedTrace && (
            <div className="mt-2.5 pt-2.5 border-t border-[#8B5CF6]/20 text-xs text-foreground/75 leading-relaxed font-mono bg-black/20 p-2.5 rounded-lg">
              {detailedTrace}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between text-[11px] text-foreground/50 font-mono">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#8B5CF6]" />
              <span>Gonka Router v2.4</span>
            </span>
            <span className="bg-black/30 px-2 py-0.5 rounded border border-white/5 text-[#A78BFA]/80">
              {requestId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
