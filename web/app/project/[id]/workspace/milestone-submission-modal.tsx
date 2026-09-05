"use client";

import React, { useState, useMemo } from "react";
import {
  Send,
  Trash2,
  Plus,
  Lock,
  Github,
  GitPullRequest,
  ExternalLink,
  ChevronDown,
  FolderGit2,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { Milestone } from "@/types";
import { useApp } from "@/context/app-context";

interface MilestoneSubmissionModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, links: string[]) => Promise<void>;
}

interface MockRepo {
  id: string;
  name: string;
  branch: string;
  pullRequests: {
    number: number;
    title: string;
    url: string;
    branch: string;
  }[];
}

const DEFAULT_REPOSITORIES: MockRepo[] = [
  {
    id: "repo-1",
    name: "Travooli_System",
    branch: "main",
    pullRequests: [
      {
        number: 42,
        title: "Implement User Authentication",
        url: "https://github.com/alex-rivera-dev/Travooli_System/pull/42",
        branch: "feature/auth-service",
      },
      {
        number: 38,
        title: "Add In-Store Pickup Order Tracking",
        url: "https://github.com/alex-rivera-dev/Travooli_System/pull/38",
        branch: "feature/store-pickup",
      },
      {
        number: 29,
        title: "Setup Admin Management Dashboard",
        url: "https://github.com/alex-rivera-dev/Travooli_System/pull/29",
        branch: "feature/admin-panel",
      },
    ],
  },
  {
    id: "repo-2",
    name: "sui-smart-contract-escrow",
    branch: "main",
    pullRequests: [
      {
        number: 15,
        title: "Milestone Escrow Lock & Release Implementation",
        url: "https://github.com/alex-rivera-dev/sui-smart-contract-escrow/pull/15",
        branch: "move/escrow-v2",
      },
      {
        number: 11,
        title: "Add Sui Move Verification Test Suite",
        url: "https://github.com/alex-rivera-dev/sui-smart-contract-escrow/pull/11",
        branch: "test/move-consensus",
      },
    ],
  },
  {
    id: "repo-3",
    name: "trusthire-web-dapp",
    branch: "develop",
    pullRequests: [
      {
        number: 24,
        title: "Freelancer Milestone Deliverables Submission UI",
        url: "https://github.com/alex-rivera-dev/trusthire-web-dapp/pull/24",
        branch: "feat/workspace-modal",
      },
      {
        number: 19,
        title: "Consensus Checks & Gonka Reasoning Modal",
        url: "https://github.com/alex-rivera-dev/trusthire-web-dapp/pull/19",
        branch: "feat/reasoning-terminal",
      },
    ],
  },
];

export const MilestoneSubmissionModal: React.FC<MilestoneSubmissionModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { currentUser, freelancerProfiles } = useApp();
  const myFreelancerProfile = freelancerProfiles[currentUser.id];
  const githubUsername = myFreelancerProfile?.githubUsername || "alex-rivera-dev";

  const [content, setContent] = useState(milestone.submissionContent || "");
  const [selectedRepoId, setSelectedRepoId] = useState<string>(
    DEFAULT_REPOSITORIES[0].id
  );
  const [selectedPrNumber, setSelectedPrNumber] = useState<number>(
    DEFAULT_REPOSITORIES[0].pullRequests[0]?.number || 42
  );

  const [additionalLinks, setAdditionalLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedRepo = useMemo(
    () =>
      DEFAULT_REPOSITORIES.find((r) => r.id === selectedRepoId) ||
      DEFAULT_REPOSITORIES[0],
    [selectedRepoId]
  );

  const selectedPr = useMemo(
    () =>
      selectedRepo.pullRequests.find((pr) => pr.number === selectedPrNumber) ||
      selectedRepo.pullRequests[0],
    [selectedRepo, selectedPrNumber]
  );

  if (!isOpen) return null;

  const handleRepoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRepoId = e.target.value;
    setSelectedRepoId(newRepoId);
    const repo = DEFAULT_REPOSITORIES.find((r) => r.id === newRepoId);
    if (repo && repo.pullRequests.length > 0) {
      setSelectedPrNumber(repo.pullRequests[0].number);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);

    try {
      const allLinks = [
        selectedPr?.url,
        ...additionalLinks.filter((link) => link.trim().length > 0),
      ].filter(Boolean) as string[];

      await onSubmit(content, allLinks);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    setAdditionalLinks([...additionalLinks, ""]);
  };

  const handleUpdateLink = (index: number, val: string) => {
    const updated = [...additionalLinks];
    updated[index] = val;
    setAdditionalLinks(updated);
  };

  const handleRemoveLink = (index: number) => {
    setAdditionalLinks(additionalLinks.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151622] p-6 sm:p-7 shadow-2xl space-y-5 transition-colors">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            <h3 className="text-xl font-bold text-foreground">
              Submit Deliverables
            </h3>
          </div>
          <p className="text-xs text-foreground/60">
            For: <strong className="text-foreground">{milestone.title}</strong>
          </p>
          <p className="text-xs text-foreground/60 mt-0.5">
            Payout upon client approval:{" "}
            <strong className="text-[#0D9488] dark:text-[#2DD4BF] font-mono">
              {milestone.amount.toLocaleString()} SUI
            </strong>
          </p>
        </div>

        {milestone.revisionNote && (
          <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#D97706] dark:text-[#F59E0B]">
            <strong>Client Note:</strong> &ldquo;{milestone.revisionNote}&rdquo;
          </div>
        )}

        {/* Deliverable Summary & Release Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/90">
            Deliverable Summary &amp; Release Notes
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your completed work..."
            className="w-full p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7C3AED] dark:focus:border-[#A78BFA] resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* Submission Evidence Card */}
        <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center">
                <Github className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Submission Evidence
                </h4>
                <p className="text-[10px] text-foreground/50">
                  GitHub Pull Request verification
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              Connected: @{githubUsername}
            </span>
          </div>

          {/* Repository Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-foreground/50" />
              <span>Repository</span>
            </label>
            <div className="relative">
              <select
                value={selectedRepoId}
                onChange={handleRepoChange}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1D2B] text-xs font-medium text-foreground focus:outline-none focus:border-[#7C3AED] transition-colors cursor-pointer"
              >
                {DEFAULT_REPOSITORIES.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Pull Request Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80 flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>Pull Request</span>
            </label>
            <div className="relative">
              <select
                value={selectedPrNumber}
                onChange={(e) => setSelectedPrNumber(Number(e.target.value))}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1D2B] text-xs font-medium text-foreground focus:outline-none focus:border-[#7C3AED] transition-colors cursor-pointer"
              >
                {selectedRepo.pullRequests.map((pr) => (
                  <option key={pr.number} value={pr.number}>
                    #{pr.number} – {pr.title}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {selectedPr && (
              <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-foreground/50">
                <span className="truncate max-w-[260px] text-[10px]">
                  Branch: {selectedPr.branch}
                </span>
                <a
                  href={selectedPr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1 text-[11px] shrink-0"
                >
                  <span>View PR on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Additional Deliverable Links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-foreground/80">
              Additional Deliverable Links
            </label>
            <span className="text-[10px] text-foreground/40 font-mono">
              Figma, Live dApp, Docs
            </span>
          </div>

          {additionalLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => handleUpdateLink(idx, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7C3AED]"
                placeholder="https://figma.com/... or https://mydapp.com"
              />
              <button
                type="button"
                onClick={() => handleRemoveLink(idx)}
                className="text-foreground/40 hover:text-red-400 p-1 transition-colors"
                title="Remove link"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddLink}
            className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1.5 font-medium pt-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add link</span>
          </button>
        </div>

        {/* Submission Integrity Protected */}
        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-[11px] text-foreground/70 flex items-center gap-2 font-mono">
          <Lock className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <span>Submission integrity protected</span>
        </div>

        {/* Action Buttons */}
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
