"use client";

import React from "react";
import { MessageSquare, X, ShieldAlert } from "lucide-react";
import { GhostButton } from "@/components/ui/ghost-button";

interface MessagingModalStubProps {
  isOpen: boolean;
  onClose: () => void;
  counterpartyName?: string;
}

export const MessagingModalStub: React.FC<MessagingModalStubProps> = ({
  isOpen,
  onClose,
  counterpartyName = "user"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151622] p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7C3AED] dark:text-[#7B61FF]">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-semibold text-base text-foreground">Message {counterpartyName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2 text-xs text-foreground/75 leading-relaxed">
          <p className="font-medium text-foreground">Direct messaging is scheduled for an upcoming release.</p>
          <p>
            For this prototype, all milestone submissions, revisions, and approvals are coordinated directly through the on-chain milestone workspace.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <GhostButton onClick={onClose}>Understood</GhostButton>
        </div>
      </div>
    </div>
  );
};
