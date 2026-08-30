"use client";

import React, { useState } from "react";
import { Send, Trash2, Plus, ShieldCheck } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { Milestone } from "@/types";

interface MilestoneSubmissionModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, links: string[]) => Promise<void>;
}

export const MilestoneSubmissionModal: React.FC<MilestoneSubmissionModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [content, setContent] = useState(milestone.submissionContent || "");
  const [links, setLinks] = useState<string[]>(
    milestone.submissionLinks?.length ? milestone.submissionLinks : ["https://github.com/example/repo/pull/1"]
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onSubmit(content, links.filter(Boolean));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#151622] p-6 sm:p-8 shadow-2xl space-y-5">
        <div>
          <h3 className="text-xl font-bold text-white">Submit Deliverables: {milestone.title}</h3>
          <p className="text-xs text-foreground/60 mt-1">
            Payout upon client approval: <strong className="text-[#2DD4BF] font-mono">${milestone.amount.toLocaleString()} USDC</strong>
          </p>
        </div>

        {milestone.revisionNote && (
          <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B]">
            <strong>Client Note:</strong> "{milestone.revisionNote}"
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/80">
            Deliverable Summary & Release Notes
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your completed work, architectural choices, and test verification proof..."
            className="w-full p-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white focus:outline-none focus:border-[#2DD4BF] resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground/80">
            Deliverable Links (GitHub PRs, Figma, Live dApp)
          </label>
          {links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => {
                  const updated = [...links];
                  updated[idx] = e.target.value;
                  setLinks(updated);
                }}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white focus:outline-none focus:border-[#2DD4BF]"
                placeholder="https://..."
              />
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                  className="text-foreground/40 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLinks([...links, ""])}
            className="text-xs text-[#4DA2FF] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add another link</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-foreground/60 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
          <span>A cryptographic content hash is recorded on-chain for verification integrity.</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GradientButton
            loading={loading}
            disabled={!content.trim()}
            onClick={handleSubmit}
            icon={<Send className="w-4 h-4 ml-1" />}
          >
            {loading ? "Submitting on Sui…" : "Submit Milestone"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};
