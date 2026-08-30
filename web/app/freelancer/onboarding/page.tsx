"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Upload,
  Globe,
  Plus,
  Trash2,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { SkillChip } from "@/components/ui/skill-chip";
import { simulateTrustScoreCalculation } from "@/lib/simulation";
import { clsx } from "clsx";

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const { currentUser, updateFreelancerProfile, connectWallet, addRoleToUser } = useApp();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(currentUser.name || "Marcus Vance");
  const [headline, setHeadline] = useState("Senior Full-Stack & Move Developer");
  const [bio, setBio] = useState("Specialized in Sui Move smart contract design, TypeScript SDK integration, and high-performance React frontends.");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80");

  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Sui Move", "Smart Contracts", "Tailwind CSS"]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Expert">("Expert");

  const [portfolioLinks, setPortfolioLinks] = useState<{ title: string; url: string }[]>([
    { title: "Sui DEX Liquidity Router", url: "https://github.com/example/sui-dex-router" },
    { title: "Gonka AI Interface", url: "https://gonka-interface.vercel.app" }
  ]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkillInput.trim())) {
        setSkills([...skills, newSkillInput.trim()]);
      }
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddPortfolio = () => {
    setPortfolioLinks([...portfolioLinks, { title: "", url: "" }]);
  };

  const handleUpdatePortfolio = (index: number, field: "title" | "url", value: string) => {
    const updated = [...portfolioLinks];
    updated[index][field] = value;
    setPortfolioLinks(updated);
  };

  const handleRemovePortfolio = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsCalculatingScore(true);

    try {
      const scoreResult = await simulateTrustScoreCalculation(
        skills.length,
        portfolioLinks.length > 0,
        experienceLevel
      );

      setCalculatedScore(scoreResult.trustScore);

      addRoleToUser("freelancer");
      updateFreelancerProfile({
        name,
        avatarUrl,
        headline,
        bio,
        skills,
        experienceLevel,
        portfolioLinks: portfolioLinks.filter((p) => p.title && p.url),
        trustScore: scoreResult.trustScore,
        trustScoreConfidence: scoreResult.confidence,
        trustScoreReasoning: scoreResult.reasoning,
        trustScoreRequestId: scoreResult.requestId,
        trustScoreUpdatedAt: new Date().toISOString(),
        isDiscoverable: true,
        completedProjectsCount: 14,
        onTimeDeliveryPct: 98,
        averageRating: 4.95
      });

      await new Promise((r) => setTimeout(r, 1200));
      router.push("/freelancer/dashboard");
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Full Screen Transition during Trust Score Calculation
  if (isCalculatingScore) {
    return (
      <div className="min-h-screen bg-[#0B0B12] text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#8B5CF6]/20 via-[#4DA2FF]/20 to-[#2DD4BF]/20 blur-[130px] rounded-full" />

        <div className="max-w-md w-full text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#8B5CF6] to-[#2DD4BF] text-white flex items-center justify-center mx-auto shadow-ai-glow animate-pulse">
            <Sparkles className="w-8 h-8 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Gonka AI is calculating your Trust Score…
            </h2>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed font-mono">
              Verifying {skills.length} technical skills, portfolio links, and cryptographic credentials.
            </p>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#4DA2FF] to-[#2DD4BF] w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12] text-foreground flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-gradient-to-tr from-[#8B5CF6]/15 via-[#4DA2FF]/15 to-[#2DD4BF]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">
        {/* Step Indicator */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-[#A78BFA]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Freelancer Setup • Step {step} of 4</span>
          </div>
          <div className="flex items-center justify-center gap-2 max-w-[200px] mx-auto pt-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={clsx(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  s <= step ? "bg-gradient-to-r from-[#8B5CF6] to-[#2DD4BF]" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-[#151622]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Your Developer Profile</h2>
                <p className="text-xs text-foreground/60">Introduce your skills and experience to potential clients.</p>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const seed = Math.floor(Math.random() * 1000);
                      setAvatarUrl(`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80&sig=${seed}`);
                    }}
                    className="text-xs font-medium text-[#4DA2FF] hover:underline flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change avatar photo</span>
                  </button>
                  <p className="text-[11px] text-foreground/40 mt-0.5">JPG, PNG or WebP</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1.5">Professional Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF]"
                    placeholder="e.g. Senior Sui Move & Full-Stack Developer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-foreground/80">Bio Summary</label>
                    <span className="text-[10px] text-foreground/40 font-mono">{bio.length}/300 chars</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={350}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <GradientButton
                  onClick={() => setStep(2)}
                  disabled={!name.trim() || !headline.trim()}
                  icon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Continue to Skills
                </GradientButton>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Experience */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Skills & Technical Expertise</h2>
                <p className="text-xs text-foreground/60">Add at least 3 skills so Gonka AI can match you with the right projects.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-2">
                  Skills & Frameworks (min. 3 required)
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-white/10 bg-white/[0.02] min-h-[50px]">
                  {skills.map((s) => (
                    <SkillChip key={s} label={s} onRemove={() => handleRemoveSkill(s)} />
                  ))}
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="+ Add skill & Enter"
                    className="text-xs bg-transparent text-white focus:outline-none px-2 py-1 min-w-[130px]"
                  />
                </div>
                {skills.length < 3 && (
                  <p className="text-[11px] text-[#F59E0B] mt-1.5">
                    Please add at least {3 - skills.length} more skill(s) to continue.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-2">Experience Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Beginner", "Intermediate", "Expert"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={clsx(
                        "py-3 px-3 rounded-xl border text-xs font-semibold transition-all",
                        experienceLevel === lvl
                          ? "border-[#7B61FF] bg-[#7B61FF]/15 text-white shadow-sm"
                          : "border-white/10 bg-white/[0.03] text-foreground/70 hover:border-white/20"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <GhostButton onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </GhostButton>
                <GradientButton
                  onClick={() => setStep(3)}
                  disabled={skills.length < 3}
                  icon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Continue to Portfolio
                </GradientButton>
              </div>
            </div>
          )}

          {/* Step 3: Portfolio */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Portfolio & Proof of Work</h2>
                <p className="text-xs text-foreground/60">
                  Adding verified code samples meaningfully improves your Gonka Trust Score and match frequency.
                </p>
              </div>

              <div className="space-y-3">
                {portfolioLinks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdatePortfolio(idx, "title", e.target.value)}
                      placeholder="Project Title (e.g. Sui DEX Router)"
                      className="w-1/2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white focus:outline-none focus:border-[#7B61FF]"
                    />
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => handleUpdatePortfolio(idx, "url", e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-1/2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white focus:outline-none focus:border-[#7B61FF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolio(idx)}
                      className="p-1 text-foreground/40 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPortfolio}
                  className="text-xs text-[#4DA2FF] hover:underline flex items-center gap-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another portfolio link</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <GhostButton onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </GhostButton>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-xs text-foreground/50 hover:text-foreground underline"
                  >
                    Skip for now
                  </button>
                  <GradientButton onClick={() => setStep(4)} icon={<ArrowRight className="w-4 h-4 ml-1" />}>
                    Continue to Wallet
                  </GradientButton>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Wallet Connect */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Connect Payout Wallet</h2>
                <p className="text-xs text-foreground/60">Connect your Sui address to receive direct milestone releases.</p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#2DD4BF]/10 text-[#2DD4BF] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs text-foreground/75 leading-relaxed">
                    <p className="font-semibold text-white">Direct Non-Custodial Releases</p>
                    <p>
                      Payments are released directly to this address the moment a client approves your milestone — no platform holding period.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {currentUser.walletAddress ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
                        <span className="text-xs font-semibold text-white">Payout Address:</span>
                        <span className="font-mono text-xs text-[#2DD4BF]">{currentUser.walletAddress}</span>
                      </div>
                      <span className="text-[11px] text-[#2DD4BF] font-medium font-sans">Sui Testnet</span>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <GradientButton
                        loading={isConnecting}
                        onClick={handleWalletConnect}
                        icon={<Lock className="w-4 h-4" />}
                      >
                        Connect Sui Payout Wallet (Simulated)
                      </GradientButton>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <GhostButton onClick={() => setStep(3)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </GhostButton>
                <GradientButton
                  onClick={handleFinishOnboarding}
                  disabled={!currentUser.walletAddress}
                  icon={<Sparkles className="w-4 h-4 ml-1" />}
                >
                  Calculate Trust Score & Finish
                </GradientButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
