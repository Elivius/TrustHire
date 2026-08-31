"use client";

import React, { useState } from "react";
import { Wallet, Copy, Check } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface WalletChipProps {
  address: string;
  onClick?: () => void;
  className?: string;
}

export const WalletChip: React.FC<WalletChipProps> = ({ address, onClick, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:border-black/25 text-xs font-mono text-foreground backdrop-blur-sm transition-all select-none cursor-pointer shadow-sm dark:shadow-none",
          className
        )
      )}
    >
      <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
      <Wallet className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF] shrink-0" />
      <span>{address}</span>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy address"
        className="text-foreground/40 hover:text-foreground p-0.5 rounded transition-colors"
      >
        {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
};
