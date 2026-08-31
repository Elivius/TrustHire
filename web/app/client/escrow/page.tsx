"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Coins,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GhostButton } from "@/components/ui/ghost-button";

export default function ClientEscrowPage() {
  const { currentUser, projects, milestones, transactions } = useApp();
  const [filterProject, setFilterProject] = useState<string>("all");

  const clientProjects = projects.filter((p) => p.clientId === currentUser.id);

  const activeEscrowProjects = clientProjects.filter(
    (p) => p.status === "in_progress" || p.status === "completed"
  );

  const currentlyEscrowed = milestones
    .filter((m) => {
      const proj = clientProjects.find((p) => p.id === m.projectId);
      return proj?.status === "in_progress" && m.status !== "released";
    })
    .reduce((sum, m) => sum + m.amount, 0);

  const totalReleased = transactions
    .filter((t) => t.type === "milestone_released" && clientProjects.some((p) => p.id === t.projectId))
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingMilestonesCount = milestones.filter(
    (m) => clientProjects.some((p) => p.id === m.projectId) && m.status === "submitted"
  ).length;

  const filteredTransactions = transactions.filter((t) => {
    if (!clientProjects.some((p) => p.id === t.projectId)) return false;
    if (filterProject !== "all" && t.projectId !== filterProject) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Escrow & Payments Ledger
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Real-time on-chain accounting of locked deposits and released milestone disbursements.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Currently Escrowed</span>
            <div className="text-2xl sm:text-3xl font-bold text-[#2DD4BF] mt-1 font-mono">
              ${currentlyEscrowed.toLocaleString()} <span className="text-xs font-normal">USDC</span>
            </div>
            <span className="text-[11px] text-foreground/40 mt-1 block">Locked in Sui smart contracts</span>
          </GlassCard>

          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Total Released</span>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1 font-mono">
              ${totalReleased.toLocaleString()} <span className="text-xs font-normal">USDC</span>
            </div>
            <span className="text-[11px] text-foreground/40 mt-1 block">Paid out across completed milestones</span>
          </GlassCard>

          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Pending Review</span>
            <div className="text-2xl sm:text-3xl font-bold text-[#F59E0B] mt-1 font-mono">
              {pendingMilestonesCount}
            </div>
            <span className="text-[11px] text-foreground/40 mt-1 block">Milestones awaiting client release</span>
          </GlassCard>
        </div>

        {/* Per-Project Escrow Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2DD4BF]" />
            <span>Active Project Escrows</span>
          </h2>

          {activeEscrowProjects.length === 0 ? (
            <EmptyState
              title="You haven't funded any escrow yet"
              description="This is where you'll track locked and released funds once you match with a freelancer and fund smart contract escrow."
            />
          ) : (
            <div className="space-y-3">
              {activeEscrowProjects.map((proj) => {
                const projMs = milestones.filter((m) => m.projectId === proj.id);
                const total = projMs.reduce((s, m) => s + m.amount, 0);
                const released = projMs.filter((m) => m.status === "released").reduce((s, m) => s + m.amount, 0);
                const remaining = total - released;

                return (
                  <Link key={proj.id} href={`/project/${proj.id}/workspace`} className="block group">
                    <GlassCard hoverEffect className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-[#4DA2FF] transition-colors">
                          {proj.title}
                        </h3>
                        <span className="text-xs text-foreground/50 font-mono">
                          Object: {proj.escrowObjectId || "0x9182...fa01"}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-xs font-mono">
                        <div>
                          <span className="text-foreground/45 block text-[10px] uppercase">Locked</span>
                          <span className="text-[#2DD4BF] font-semibold">${remaining.toLocaleString()} USDC</span>
                        </div>
                        <div>
                          <span className="text-foreground/45 block text-[10px] uppercase">Released</span>
                          <span className="text-white font-semibold">${released.toLocaleString()} USDC</span>
                        </div>
                        <GhostButton size="sm">
                          <span>Workspace</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </GhostButton>
                      </div>
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Flat Transaction History Table */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#7B61FF]" />
              <span>Sui On-Chain Transaction Ledger</span>
            </h2>

            {/* Filter */}
            {clientProjects.length > 1 && (
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white focus:outline-none"
              >
                <option value="all" className="bg-[#151622]">All Projects</option>
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#151622]">{p.title}</option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#151622]/80 overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-foreground/50 uppercase font-mono text-[10px] border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Project & Milestone</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Tx Hash & Explorer</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-white capitalize font-sans">
                          {tx.type === "escrow_created" ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-[#2DD4BF]" />
                              <span>Escrow Deposit</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                              <span>Milestone Release</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans max-w-[220px]">
                        <span className="text-white truncate block font-medium">{tx.projectTitle}</span>
                        {tx.milestoneTitle && (
                          <span className="text-foreground/50 text-[11px] truncate block">{tx.milestoneTitle}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#2DD4BF] font-semibold">
                        ${tx.amount.toLocaleString()} USDC
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`https://suiscan.xyz/testnet/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#4DA2FF] hover:text-[#7B61FF] transition-colors"
                        >
                          <span>{tx.txHash}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-foreground/45 text-[11px]">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
