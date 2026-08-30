"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Edit2,
  ExternalLink,
  Star,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  RotateCcw,
  Cpu,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { simulateTrustScoreCalculation } from "@/lib/simulation";

export default function FreelancerProfilePage() {
  const {
    currentUser,
    freelancerProfiles,
    updateFreelancerProfile,
    ratings,
    projects
  } = useApp();

  const profile = freelancerProfiles[currentUser.id] || {
    userId: currentUser.id,
    headline: "Senior Move & Full-Stack Developer",
    bio: "5+ years in Web3. Specialized in Sui Move smart contract design, TypeScript SDK integration, and high-performance React frontends.",
    skills: ["React", "TypeScript", "Sui Move", "Smart Contracts", "Tailwind CSS"],
    experienceLevel: "Expert" as const,
    portfolioLinks: [
      { title: "Sui DEX Liquidity Router", url: "https://github.com/example/sui-dex-router" },
      { title: "Gonka AI Interface", url: "https://gonka-interface.vercel.app" }
    ],
    trustScore: 96,
    trustScoreConfidence: "High" as const,
    trustScoreReasoning: [
      { label: "Profile completeness", note: "100% verified credentials, wallet bound, rich portfolio history." },
      { label: "On-chain track record", note: "14 successfully released Sui milestones with 0 dispute flags." },
      { label: "On-time delivery", note: "98% on-time delivery rate across all historical contracts." },
      { label: "AI Verification match", note: "Gonka code pattern analysis verified top 2% Rust/Move idiom proficiency." }
    ],
    trustScoreRequestId: "gonka_req_89ab34ef",
    trustScoreUpdatedAt: "2026-08-20T10:15:00.000Z",
    isDiscoverable: true,
    completedProjectsCount: 14,
    onTimeDeliveryPct: 98,
    averageRating: 4.95
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Edit Form Fields
  const [editName, setEditName] = useState(currentUser.name);
  const [editHeadline, setEditHeadline] = useState(profile.headline);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editSkills, setEditSkills] = useState<string[]>(profile.skills);
  const [newSkill, setNewSkill] = useState("");
  const [editPortfolio, setEditPortfolio] = useState(profile.portfolioLinks);
  const [isSaving, setIsSaving] = useState(false);

  const myRatings = ratings.filter((r) => r.freelancerId === currentUser.id);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      if (!editSkills.includes(newSkill.trim())) {
        setEditSkills([...editSkills, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const scoreResult = await simulateTrustScoreCalculation(
        editSkills.length,
        editPortfolio.length > 0,
        profile.experienceLevel
      );

      updateFreelancerProfile({
        name: editName,
        headline: editHeadline,
        bio: editBio,
        skills: editSkills,
        portfolioLinks: editPortfolio.filter((p) => p.title && p.url),
        trustScore: scoreResult.trustScore,
        trustScoreConfidence: scoreResult.confidence,
        trustScoreReasoning: scoreResult.reasoning,
        trustScoreRequestId: scoreResult.requestId,
        trustScoreUpdatedAt: new Date().toISOString()
      });

      setIsEditMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Profile & Trust Score
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Your verified Web3 developer identity and autonomous Gonka reputation proofs.
            </p>
          </div>

          <GhostButton
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            {isEditMode ? "Cancel Editing" : "Edit Profile"}
          </GhostButton>
        </div>

        {/* Edit Mode View */}
        {isEditMode ? (
          <GlassCard className="p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-white">Edit Profile Details</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Professional Headline</label>
                  <input
                    type="text"
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Bio Summary</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Skills</label>
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                  {editSkills.map((s) => (
                    <SkillChip key={s} label={s} onRemove={() => setEditSkills(editSkills.filter((x) => x !== s))} />
                  ))}
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="+ Add skill & Enter"
                    className="text-xs bg-transparent text-white focus:outline-none px-2 py-1 min-w-[120px]"
                  />
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Portfolio Links</label>
                <div className="space-y-2">
                  {editPortfolio.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...editPortfolio];
                          updated[idx].title = e.target.value;
                          setEditPortfolio(updated);
                        }}
                        placeholder="Title"
                        className="w-1/2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white focus:outline-none focus:border-[#7B61FF]"
                      />
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => {
                          const updated = [...editPortfolio];
                          updated[idx].url = e.target.value;
                          setEditPortfolio(updated);
                        }}
                        placeholder="URL"
                        className="w-1/2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white focus:outline-none focus:border-[#7B61FF]"
                      />
                      <button
                        type="button"
                        onClick={() => setEditPortfolio(editPortfolio.filter((_, i) => i !== idx))}
                        className="p-1 text-foreground/40 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditPortfolio([...editPortfolio, { title: "", url: "" }])}
                    className="text-xs text-[#4DA2FF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <GhostButton onClick={() => setIsEditMode(false)}>Cancel</GhostButton>
                <GradientButton type="submit" loading={isSaving} icon={<Sparkles className="w-4 h-4 ml-1" />}>
                  {isSaving ? "Recalculating Trust Score…" : "Save & Recalculate Trust Score"}
                </GradientButton>
              </div>
            </form>
          </GlassCard>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Top Profile Card */}
            <GlassCard className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
                    alt={currentUser.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border border-white/10 shadow-lg"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">{currentUser.name}</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-foreground/70">
                        {profile.experienceLevel}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/70">{profile.headline}</p>

                    <div className="flex items-center gap-2 pt-2">
                      <ScoreBadge score={profile.trustScore} type="trust" size="md" />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-foreground/45 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5 self-start">
                  Payout: {currentUser.walletAddress || "0x8e3b22...4c19"}
                </div>
              </div>

              {/* Expandable Trust Score Breakdown Block */}
              <div className="rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/[0.05] p-5 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#2DD4BF] font-semibold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Gonka Trust Score Breakdown ({profile.trustScore}/100)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-xs text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showBreakdown ? "Hide details" : "Show details"}</span>
                    {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showBreakdown && (
                  <div className="space-y-3 pt-2 border-t border-[#2DD4BF]/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {profile.trustScoreReasoning.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                          <span className="font-semibold text-white block">{item.label}</span>
                          <p className="text-foreground/70 leading-relaxed text-[11px]">{item.note}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-foreground/50 font-mono pt-2 border-t border-white/5">
                      <span>Confidence: {profile.trustScoreConfidence}</span>
                      <span>Request ID: {profile.trustScoreRequestId}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  About Me
                </h3>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  {profile.bio}
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Verified Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <SkillChip key={s} label={s} />
                  ))}
                </div>
              </div>

              {/* Portfolio */}
              {profile.portfolioLinks.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Portfolio & Code Samples
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.portfolioLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-xs group"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#4DA2FF]" />
                          <span className="font-semibold text-white group-hover:text-[#4DA2FF] transition-colors">
                            {link.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-foreground/40 group-hover:text-white transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reputation Section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    On-Chain Reputation Record
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-mono text-foreground/60">
                    <span>{profile.completedProjectsCount} completed</span>
                    <span>•</span>
                    <span className="text-[#2DD4BF]">{profile.onTimeDeliveryPct}% on-time</span>
                    <span>•</span>
                    <span className="text-amber-400">? {profile.averageRating}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {myRatings.length > 0 ? (
                    myRatings.map((r, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[#2DD4BF]">
                            {[...Array(r.stars)].map((_, s) => (
                              <Star key={s} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="font-mono text-[11px] text-foreground/40">
                            {new Date(r.ratedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {r.comment && <p className="text-foreground/80 italic">"{r.comment}"</p>}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-xs text-foreground/50 text-center">
                      14 verified milestone delivery records secured on Sui smart contracts.
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
