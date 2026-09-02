"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { Milestone } from "@/types";

interface DisputeModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onSubmit(reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-red-500/30 bg-white dark:bg-[#151622] p-6 sm:p-8 shadow-2xl space-y-5 transition-colors">
        <div className="flex items-center gap-3 text-red-500 dark:text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-foreground">Flag Milestone Dispute</h3>
            <p className="text-xs text-foreground/60">Milestone: {milestone.title}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-300 space-y-1 leading-relaxed">
          <p className="font-semibold">Notice before escalating:</p>
          <p>
            This will lock the milestone for manual review. Only use this if you and the freelancer cannot resolve the deliverables directly.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/80">
            Reason for Dispute
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the unresolvable issue or violation..."
            className="w-full p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-red-400 resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GradientButton
            variant="trust"
            loading={loading}
            disabled={!reason.trim() || loading}
            onClick={handleSubmit}
          >
            {loading ? "Confirming Dispute on Sui…" : "Confirm Dispute Escalation"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};
