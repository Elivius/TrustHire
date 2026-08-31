import React from "react";
import { ExternalLink, CheckCircle2, ShieldAlert, ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { OnChainTransaction } from "@/types";

interface TransactionCardProps {
  tx: OnChainTransaction | {
    txHash: string;
    amount?: number;
    fromAddress?: string;
    toAddress?: string;
    timestamp?: string;
    type?: string;
    status?: string;
  };
  className?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ tx, className }) => {
  const explorerUrl = `https://suiscan.xyz/testnet/tx/${tx.txHash}`;

  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/[0.05] p-4 text-xs font-mono backdrop-blur-md space-y-2.5",
          className
        )
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#0D9488] dark:text-[#2DD4BF]">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-semibold uppercase tracking-wider text-[11px] font-sans">
            Sui On-Chain Confirmed
          </span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#2563EB] dark:text-[#4DA2FF] hover:text-[#7B61FF] transition-colors"
        >
          <span>View on Sui Explorer</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-foreground/80 pt-1 border-t border-black/5 dark:border-white/5">
        <div>
          <span className="text-foreground/50 block text-[10px] uppercase font-sans">Tx Hash</span>
          <span className="text-foreground font-medium">{tx.txHash}</span>
        </div>
        {tx.amount !== undefined && (
          <div>
            <span className="text-foreground/50 block text-[10px] uppercase font-sans">Escrow Value</span>
            <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">${tx.amount.toLocaleString()} USDC</span>
          </div>
        )}
        {tx.fromAddress && (
          <div>
            <span className="text-foreground/50 block text-[10px] uppercase font-sans">From</span>
            <span className="truncate block">{tx.fromAddress}</span>
          </div>
        )}
        {tx.toAddress && (
          <div>
            <span className="text-foreground/50 block text-[10px] uppercase font-sans">To</span>
            <span className="truncate block">{tx.toAddress}</span>
          </div>
        )}
      </div>
    </div>
  );
};
