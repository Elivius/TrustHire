"use client";

import React, { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";import {
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
  Cpu,
  Github,
  Code,
  ExternalLink,
  Check,
  RefreshCw
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { SkillChip } from "@/components/ui/skill-chip";
import { simulateTrustScoreCalculation, simulateGithubRepoDiscovery } from "@/lib/simulation";
import { clsx } from "clsx";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { useCurrentAccount } from "@mysten/dapp-kit-react";

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, updateFreelancerProfile, addRoleToUser } = useApp();
  const currentAccount = useCurrentAccount();
  const payoutWallet = currentAccount?.address || currentUser.walletAddress || currentUser.id;

  const [step, setStep] = useState(1);
  const [name, setName] = useState(
    currentUser.name && currentUser.name !== "Alex Rivera" && currentUser.name !== "Elena Vance"
      ? currentUser.name
      : ""
  );
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  );

  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Sui Move", "Smart Contracts", "Tailwind CSS"]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Expert">("Expert");

  // GitHub Verification & Custom Links State
  const [githubUsername, setGithubUsername] = useState("alex-rivera-dev");
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isScanningGithub, setIsScanningGithub] = useState(false);
  const [verifiedRepos, setVerifiedRepos] = useState<{
    title: string;
    url: string;
    isVerified: boolean;
    repositoryName: string;
    commitsCount: number;
    primaryLanguage: string;
  }[]>([]);

  const [customLinks, setCustomLinks] = useState<{ title: string; url: string }[]>([
    { title: "Gonka AI Interface", url: "https://gonka-interface.vercel.app" }
  ]);

  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);

  useEffect(() => {
    const githubStatus = searchParams.get("github");
    const sessionId = searchParams.get("sessionId");
    const username = searchParams.get("username");
    const stepParam = searchParams.get("step");

    // Open the correct onboarding step
    if (stepParam === "3") {
      setStep(3);
    }

    if (githubStatus === "connected" && sessionId) {
      sessionStorage.setItem(
        "trusthire_github_session",
        sessionId
      );

      setIsGithubConnected(true);

      if (username) {
        setGithubUsername(username);
      }

      // Remove OAuth parameters after processing them
      router.replace("/freelancer/onboarding");
    }
  }, [searchParams, router]);

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

  const handleConnectGithub = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

    window.location.href = `${apiUrl}/auth/github`;
  };

  const handleAddCustomLink = () => {
    setCustomLinks([...customLinks, { title: "", url: "" }]);
  };

  const handleUpdateCustomLink = (index: number, field: "title" | "url", value: string) => {
    const updated = [...customLinks];
    updated[index][field] = value;
    setCustomLinks(updated);
  };

  const handleRemoveCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const handleFinishOnboarding = async () => {
    setIsCalculatingScore(true);

    const combinedPortfolio = [
      ...verifiedRepos.map((r) => ({
        title: r.title,
        url: r.url,
        isVerified: true,
        repositoryName: r.repositoryName,
        commitsCount: r.commitsCount,
        primaryLanguage: r.primaryLanguage
      })),
      ...customLinks.filter((c) => c.title.trim() && c.url.trim()).map((c) => ({
        title: c.title,
        url: c.url,
        isVerified: false
      }))
    ];

    try {
      const scoreResult = await simulateTrustScoreCalculation(
        skills.length,
        combinedPortfolio.length > 0,
        experienceLevel,
        isGithubConnected,
        githubUsername
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
        portfolioLinks: combinedPortfolio,
        githubUsername: isGithubConnected ? githubUsername : undefined,
        isGithubVerified: isGithubConnected,
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

      try {
        const supabase = createClient();
        const targetUserId = payoutWallet;

        // 1. Upsert public.users with role FREELANCER
        const userEmail = `${targetUserId.slice(0, 10).toLowerCase()}@trusthire.io`;
        await supabase.from("users").upsert({
          user_id: targetUserId,
          name: name.trim() || currentUser.name || "Freelancer",
          email: userEmail,
          role: "FREELANCER",
          status: "ACTIVE"
        }, { onConflict: "user_id" });

        // 2. Upsert freelancer profile
        await supabase.from("freelancer_profiles").upsert({
          freelancer_id: targetUserId,
          prof_headline: headline,
          bio: bio,
          trust_score: scoreResult.trustScore,
          experience_level: experienceLevel
        }, { onConflict: "freelancer_id" });
      } catch (e) {
        console.warn("Could not sync freelancer profile to Supabase:", e);
      }

      await new Promise((r) => setTimeout(r, 1200));
      router.push("/freelancer/dashboard");
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Full Screen Transition during Trust Score Calculation
  if (isCalculatingScore) {
    return (
      <div className="min-h-screen bg-bg-base text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#8B5CF6]/20 via-[#4DA2FF]/20 to-[#2DD4BF]/20 blur-[130px] rounded-full" />

        <div className="max-w-md w-full text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#8B5CF6] to-[#2DD4BF] text-white flex items-center justify-center mx-auto shadow-ai-glow animate-pulse">
            <Sparkles className="w-8 h-8 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Gonka AI is calculating your Trust Score…
            </h2>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed font-mono">
              Verifying {skills.length} technical skills, portfolio links, and cryptographic credentials.
            </p>
          </div>

          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#4DA2FF] to-[#2DD4BF] w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-foreground flex flex-col items-center justify-center p-4 relative transition-colors duration-200">
      {/* Top right controls */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-gradient-to-tr from-[#8B5CF6]/15 via-[#4DA2FF]/15 to-[#2DD4BF]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">
        {/* Step Indicator */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-xs text-[#7C3AED] dark:text-[#A78BFA]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Freelancer Setup • Step {step} of 4</span>
          </div>
          <div className="flex items-center justify-center gap-2 max-w-[200px] mx-auto pt-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={clsx(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  s <= step ? "bg-gradient-to-r from-[#8B5CF6] to-[#2DD4BF]" : "bg-black/10 dark:bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/90 dark:bg-[#151622]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Your Developer Profile</h2>
                <p className="text-xs text-foreground/60">Introduce your skills and experience to potential clients.</p>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const seed = Math.floor(Math.random() * 1000);
                      setAvatarUrl(`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80&sig=${seed}`);
                    }}
                    className="text-xs font-medium text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1.5"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1.5">Professional Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
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
                <h2 className="text-xl font-bold text-foreground mb-1">Skills & Technical Expertise</h2>
                <p className="text-xs text-foreground/60">Add at least 3 skills so Gonka AI can match you with the right projects.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-2">
                  Skills & Frameworks (min. 3 required)
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] min-h-[50px]">
                  {skills.map((s) => (
                    <SkillChip key={s} label={s} onRemove={() => handleRemoveSkill(s)} />
                  ))}
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="+ Add skill & Enter"
                    className="text-xs bg-transparent text-foreground focus:outline-none px-2 py-1 min-w-[130px]"
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
                          ? "border-[#7B61FF] bg-[#7B61FF]/15 text-[#7C3AED] dark:text-white shadow-sm"
                          : "border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-foreground/70 hover:border-black/20 dark:hover:border-white/20"
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

          {/* Step 3: GitHub Verification & Portfolio */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Portfolio & Verified Code Proof</h2>
                <p className="text-xs text-foreground/60">
                  Connect your GitHub profile so Gonka AI can verify your repository ownership, commit signatures, and tech stack.
                </p>
              </div>

              {/* GitHub OAuth Verification Card */}
              <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-foreground">
                      <Github className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">GitHub Account Verification</h3>
                      <p className="text-[11px] text-foreground/50">Autonomous commit signature & ownership verification</p>
                    </div>
                  </div>

                  {isGithubConnected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF] border border-[#2DD4BF]/30 font-mono">
                        Verified
                    </span>
                  )}
                </div>

                {!isGithubConnected ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/50 font-mono">github.com/</span>
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="username"
                        className="flex-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-xs text-foreground focus:outline-none focus:border-[#7B61FF]"
                      />
                    </div>

                    <GradientButton
                      loading={isScanningGithub}
                      onClick={handleConnectGithub}
                      className="w-full justify-center"
                      icon={<Github className="w-4 h-4" />}
                    >
                      {isScanningGithub ? "Gonka AI Scanning Public Repos…" : "Connect & Verify GitHub Profile"}
                    </GradientButton>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/70">Connected as <strong className="text-foreground">@{githubUsername}</strong></span>
                      <button
                        type="button"
                        onClick={handleConnectGithub}
                        className="text-[11px] text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Rescan Repos
                      </button>
                    </div>

                    {/* Auto-discovered Verified Repos */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-mono text-[#0D9488] dark:text-[#2DD4BF] block font-semibold">
                          GitHub Account Verified • Public Repositories ({verifiedRepos.length})
                        </span>
                      {verifiedRepos.map((repo, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 flex items-center justify-between gap-2 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{repo.repositoryName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-foreground/80 font-mono">
                                {repo.primaryLanguage}
                              </span>
                            </div>
                            <p className="text-[11px] text-foreground/60 font-mono">
                              Verified Contributor • {repo.commitsCount} commits signed
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-[#0D9488] dark:text-[#2DD4BF] bg-[#2DD4BF]/15 px-2 py-1 rounded-md shrink-0 font-semibold">
                            Verified ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Links Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground/90">
                    Additional Live DApp / Design Links (Optional)
                  </label>
                  <span className="text-[11px] text-foreground/50">Figma, Whitepapers, Live DApps</span>
                </div>

                {customLinks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateCustomLink(idx, "title", e.target.value)}
                      placeholder="Title (e.g. Live DApp Demo)"
                      className="w-1/2 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7B61FF]"
                    />
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => handleUpdateCustomLink(idx, "url", e.target.value)}
                      placeholder="https://..."
                      className="w-1/2 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7B61FF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomLink(idx)}
                      className="p-1 text-foreground/40 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddCustomLink}
                  className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add custom link</span>
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
                <h2 className="text-xl font-bold text-foreground mb-1">Connect Payout Wallet</h2>
                <p className="text-xs text-foreground/60">Connect your Sui address to receive direct milestone releases.</p>
              </div>

              <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs text-foreground/75 leading-relaxed">
                    <p className="font-semibold text-foreground">Direct Non-Custodial Releases</p>
                    <p>
                      Payments are released directly to this address the moment a client approves your milestone — no platform holding period.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                      <span className="text-xs font-semibold text-foreground shrink-0">Payout Address:</span>
                      <span className="font-mono text-xs text-[#0D9488] dark:text-[#2DD4BF] truncate">{payoutWallet}</span>
                    </div>
                    <span className="text-[11px] text-[#0D9488] dark:text-[#2DD4BF] font-semibold font-sans px-2.5 py-0.5 rounded bg-[#2DD4BF]/20 shrink-0">
                      Connected via Login ✓
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <GhostButton onClick={() => setStep(3)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </GhostButton>
                <GradientButton
                  onClick={handleFinishOnboarding}
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
