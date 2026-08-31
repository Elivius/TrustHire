"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { clsx } from "clsx";

interface CompletionRatingModalProps {
  isOpen: boolean;
  freelancerName?: string;
  onClose: () => void;
  onSubmit: (stars: number, comment?: string) => void;
}

export const CompletionRatingModal: React.FC<CompletionRatingModalProps> = ({
  isOpen,
  freelancerName = "the freelancer",
  onClose,
  onSubmit
}) => {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(stars, comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151622] p-6 sm:p-8 shadow-2xl space-y-5 text-center transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-[#2DD4BF]/20 text-[#0D9488] dark:text-[#2DD4BF] flex items-center justify-center mx-auto">
          <Star className="w-6 h-6 fill-current" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground">Project Complete!</h3>
          <p className="text-xs text-foreground/60">
            Rate your experience with {freelancerName} to update their on-chain Trust Score.
          </p>
        </div>

        {/* Star selector */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStars(s)}
              className="p-1 text-[#0D9488] dark:text-[#2DD4BF] hover:scale-110 transition-transform cursor-pointer"
            >
              <Star
                className={clsx(
                  "w-8 h-8",
                  s <= stars ? "fill-current" : "stroke-current fill-transparent opacity-40"
                )}
              />
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional review note (e.g. Excellent communication, delivered high-quality code ahead of schedule)..."
          className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#2DD4BF] resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2">
          <GhostButton size="sm" onClick={onClose}>
            Skip for now
          </GhostButton>
          <GradientButton size="md" onClick={handleSubmit}>
            Submit Rating
          </GradientButton>
        </div>
      </div>
    </div>
  );
};
