"use client";

import React, { useState } from "react";
import { Edit3 } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { Milestone } from "@/types";

interface RequestChangesModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (revisionNote: string) => void;
}

export const RequestChangesModal: React.FC<RequestChangesModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!note.trim()) return;
    onSubmit(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151622] p-6 sm:p-8 shadow-2xl space-y-5 transition-colors">
        <div>
          <h3 className="text-xl font-bold text-foreground">Request Changes on {milestone.title}</h3>
          <p className="text-xs text-foreground/60 mt-1">
            Specify what revisions are required. The milestone will return to the freelancer for resubmission.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/80">
            Revision Instructions
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Please add integration tests for the multi-sig branch and update the README..."
            className="w-full p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#F59E0B] resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GradientButton
            variant="primary"
            disabled={!note.trim()}
            onClick={handleSubmit}
            icon={<Edit3 className="w-4 h-4 ml-1" />}
          >
            Send Revision Request
          </GradientButton>
        </div>
      </div>
    </div>
  );
};
