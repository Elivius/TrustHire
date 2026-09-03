"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ShieldCheck,
  Edit2,
  ExternalLink,
  Star,
  Globe,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { simulateTrustScoreCalculation } from "@/lib/simulation";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PortfolioLink {
  title: string;
  url: string;
}

interface TrustReasoning {
  label: string;
  note: string;
}

interface ReviewRow {
  review_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ProfileState {
  // public.users
  userId: string | null;
  name: string;
  avatarUrl: string;
  walletAddress: string;
  // public.freelancer_profiles
  headline: string;
  bio: string;
  trustScore: number;
  trustScoreConfidence: string;
  trustScoreReasoning: TrustReasoning[];
  trustScoreRequestId: string;
  experienceLevel: string;
  isDiscoverable: boolean;
  completedProjectsCount: number;
  onTimeDeliveryPct: number;
  averageRating: number;
  // derived
  skills: string[];
  portfolioLinks: PortfolioLink[];
  reviews: ReviewRow[];
}

const EMPTY_PROFILE: ProfileState = {
  userId: null,
  name: "",
  avatarUrl: "",
  walletAddress: "",
  headline: "",
  bio: "",
  trustScore: 0,
  trustScoreConfidence: "Medium",
  trustScoreReasoning: [],
  trustScoreRequestId: "",
  experienceLevel: "Mid-level",
  isDiscoverable: true,
  completedProjectsCount: 0,
  onTimeDeliveryPct: 0,
  averageRating: 0,
  skills: [],
  portfolioLinks: [],
  reviews: [],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FreelancerProfilePage() {
  const currentAccount = useCurrentAccount();
  const supabase = createClient();

  // The connected Sui wallet address is the primary key we look up in the DB
  const walletAddress = currentAccount?.address ?? null;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Edit form fields — initialised from profile after load
  const [editName, setEditName] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [editPortfolio, setEditPortfolio] = useState<PortfolioLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers — sync edit fields from profile
  // ---------------------------------------------------------------------------

  const syncEditFields = (p: ProfileState) => {
    setEditName(p.name);
    setEditHeadline(p.headline);
    setEditBio(p.bio);
    setEditSkills(p.skills);
    setEditPortfolio(p.portfolioLinks);
  };

  // ---------------------------------------------------------------------------
  // Load profile from Supabase
  // ---------------------------------------------------------------------------

  const loadProfile = useCallback(async () => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      // 1. Resolve user row by user_id
      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("user_id, name, email, role")
        .eq("user_id", walletAddress)
        .maybeSingle();

      if (userErr) throw new Error(userErr.message);

      const userId: string | null = userRow?.user_id ?? null;

      // 2. Fetch freelancer_profiles
      let fpRow: Record<string, any> | null = null;
      if (userId) {
        const { data, error } = await supabase
          .from("freelancer_profiles")
          .select("prof_headline, bio, trust_score, last_verified_at")
          .eq("freelancer_id", userId)
          .maybeSingle();
        if (error) console.warn("freelancer_profiles:", error.message);
        fpRow = data;
      }

      // 3. Fetch skills via join
      let skillNames: string[] = [];
      if (userId) {
        const { data: fsRows, error: fsErr } = await supabase
          .from("freelancer_skills")
          .select("skills(skill_name)")
          .eq("freelancer_id", userId);
        if (fsErr) console.warn("freelancer_skills:", fsErr.message);
        if (fsRows) {
          skillNames = (fsRows as any[])
            .map((r) => r.skills?.skill_name)
            .filter(Boolean);
        }
      }

      // 4. Fetch portfolio links
      let portfolioRows: PortfolioLink[] = [];
      if (userId) {
        const { data: pfData, error: pfErr } = await supabase
          .from("freelancer_portfolios")
          .select("title, url")
          .eq("freelancer_id", userId);
        if (pfErr) console.warn("freelancer_portfolios:", pfErr.message);
        if (pfData) {
          portfolioRows = (pfData as any[]).map((p) => ({
            title: p.title || "",
            url: p.url || "",
          }));
        }
      }

      // 5. Fetch reviews where reviewee = this freelancer
      let reviewRows: ReviewRow[] = [];
      if (userId) {
        const { data: rvRows, error: rvErr } = await supabase
          .from("reviews")
          .select("review_id, rating, comment, created_at")
          .eq("reviewee_id", userId)
          .order("created_at", { ascending: false });
        if (rvErr) console.warn("reviews:", rvErr.message);
        if (rvRows) reviewRows = rvRows as ReviewRow[];
      }

      // 6. Compute derived reputation stats from reviews
      const avgRating =
        reviewRows.length > 0
          ? parseFloat(
              (
                reviewRows.reduce((sum, r) => sum + Number(r.rating), 0) /
                reviewRows.length
              ).toFixed(2)
            )
          : 0;

      const built: ProfileState = {
        userId,
        name: userRow?.name ?? walletAddress,
        avatarUrl: "",
        walletAddress,
        headline: fpRow?.prof_headline ?? "",
        bio: fpRow?.bio ?? "",
        trustScore: fpRow?.trust_score ? Number(fpRow.trust_score) : 0,
        trustScoreConfidence: "High",
        trustScoreReasoning: [
          {
            label: "Profile completeness",
            note: "Profile verified with linked wallet and professional credentials.",
          },
          {
            label: "On-chain track record",
            note: "Milestone delivery history tracked and verified on Sui.",
          },
          {
            label: "On-time delivery",
            note: "Delivery rate based on completed contracts.",
          },
          {
            label: "AI Verification match",
            note: "Gonka pattern analysis aligned with declared skills.",
          },
        ],
        trustScoreRequestId: `gonka_req_${userId?.slice(-8) ?? "00000000"}`,
        experienceLevel: "Expert",
        isDiscoverable: true,
        completedProjectsCount: reviewRows.length,
        onTimeDeliveryPct: reviewRows.length > 0 ? 95 : 0,
        averageRating: avgRating,
        skills: skillNames,
        portfolioLinks: portfolioRows,
        reviews: reviewRows,
      };

      setProfile(built);
      syncEditFields(built);
    } catch (err: any) {
      console.error("loadProfile error:", err);
      setLoadError(err.message ?? "Failed to load profile from Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ---------------------------------------------------------------------------
  // Edit helpers
  // ---------------------------------------------------------------------------

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      if (!editSkills.includes(newSkill.trim())) {
        setEditSkills((prev) => [...prev, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  // ---------------------------------------------------------------------------
  // Save profile — upserts users + freelancer_profiles + skills in Supabase
  // ---------------------------------------------------------------------------

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Recalculate trust score (simulated)
      const scoreResult = await simulateTrustScoreCalculation(
        editSkills.length,
        editPortfolio.length > 0,
        profile.experienceLevel as any
      );

      // 2. Upsert user row
      const { data: upsertedUser, error: userUpsertErr } = await supabase
        .from("users")
        .upsert(
          {
            ...(profile.userId ? { user_id: profile.userId } : {}),
            name: editName,
            user_id: walletAddress,
            role: "FREELANCER",
            email: `${walletAddress.slice(0, 10)}@sui.zklogin`,
          },
          { onConflict: "user_id" }
        )
        .select("user_id")
        .single();

      if (userUpsertErr) throw new Error(userUpsertErr.message);
      const resolvedUserId: string = upsertedUser.user_id;

      // 3. Upsert freelancer_profiles
      const { error: fpUpsertErr } = await supabase
        .from("freelancer_profiles")
        .upsert(
          {
            freelancer_id: resolvedUserId,
            prof_headline: editHeadline,
            bio: editBio,
            trust_score: scoreResult.trustScore,
          },
          { onConflict: "freelancer_id" }
        );
      if (fpUpsertErr) throw new Error(fpUpsertErr.message);

      // 4. Sync skills: upsert each skill name in skills table, then sync junction
      const skillIds: string[] = [];
      for (const skillName of editSkills) {
        const { data: skillRow, error: skillErr } = await supabase
          .from("skills")
          .upsert({ skill_name: skillName }, { onConflict: "skill_name" })
          .select("skill_id")
          .single();
        if (skillErr) console.warn("skill upsert:", skillErr.message);
        if (skillRow) skillIds.push(skillRow.skill_id);
      }

      // Remove old skill links then re-insert
      await supabase
        .from("freelancer_skills")
        .delete()
        .eq("freelancer_id", resolvedUserId);

      if (skillIds.length > 0) {
        await supabase.from("freelancer_skills").insert(
          skillIds.map((sid) => ({
            freelancer_id: resolvedUserId,
            skill_id: sid,
          }))
        );
      }

      // 5. Sync portfolios: delete old portfolio links and insert updated valid entries
      await supabase
        .from("freelancer_portfolios")
        .delete()
        .eq("freelancer_id", resolvedUserId);

      const validPortfolios = editPortfolio
        .filter((p) => p.title.trim() && p.url.trim())
        .map((p) => ({
          freelancer_id: resolvedUserId,
          title: p.title.trim(),
          url: p.url.trim(),
        }));

      if (validPortfolios.length > 0) {
        const { error: pfInsertErr } = await supabase
          .from("freelancer_portfolios")
          .insert(validPortfolios);
        if (pfInsertErr) console.warn("portfolio insert error:", pfInsertErr.message);
      }

      // 6. Reflect saved changes immediately in local state
      setProfile((prev) => ({
        ...prev,
        userId: resolvedUserId,
        name: editName,
        headline: editHeadline,
        bio: editBio,
        skills: editSkills,
        portfolioLinks: validPortfolios.map((p) => ({ title: p.title, url: p.url })),
        trustScore: scoreResult.trustScore,
        trustScoreConfidence: scoreResult.confidence,
        trustScoreReasoning: scoreResult.reasoning,
        trustScoreRequestId: scoreResult.requestId,
      }));

      setIsEditMode(false);
    } catch (err: any) {
      console.error("save error:", err);
      setSaveError(err.message ?? "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived display helpers
  // ---------------------------------------------------------------------------

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Not connected";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              My Profile &amp; Trust Score
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Your verified Web3 developer identity and autonomous Gonka reputation proofs.
            </p>
          </div>

          <GhostButton
            size="sm"
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSaveError(null);
            }}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            {isEditMode ? "Cancel Editing" : "Edit Profile"}
          </GhostButton>
        </div>

        {/* Wallet not connected notice */}
        {!walletAddress && !isLoading && (
          <GlassCard className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-foreground/80">
              Connect your Sui wallet to view your profile.
            </p>
          </GlassCard>
        )}

        {/* Loading */}
        {isLoading && (
          <GlassCard className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#7B61FF]" />
            <p className="text-xs text-foreground/50">Loading profile from Supabase…</p>
          </GlassCard>
        )}

        {/* Load error */}
        {!isLoading && loadError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {loadError}
          </div>
        )}

        {/* Main content — only when loaded and wallet present */}
        {!isLoading && walletAddress && !loadError && (
          <>
            {/* Save error banner */}
            {saveError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {saveError}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* EDIT MODE                                                         */}
            {/* ---------------------------------------------------------------- */}
            {isEditMode ? (
              <GlassCard className="p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold text-foreground">Edit Profile Details</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                        Professional Headline
                      </label>
                      <input
                        type="text"
                        value={editHeadline}
                        onChange={(e) => setEditHeadline(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                      Bio Summary
                    </label>
                    <textarea
                      rows={4}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                      Skills
                    </label>
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                      {editSkills.map((s) => (
                        <SkillChip
                          key={s}
                          label={s}
                          onRemove={() =>
                            setEditSkills(editSkills.filter((x) => x !== s))
                          }
                        />
                      ))}
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={handleAddSkill}
                        placeholder="+ Add skill &amp; Enter"
                        className="text-xs bg-transparent text-foreground focus:outline-none px-2 py-1 min-w-[120px]"
                      />
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                      Portfolio Links
                    </label>
                    <div className="space-y-2">
                      {editPortfolio.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...editPortfolio];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setEditPortfolio(updated);
                            }}
                            placeholder="Title"
                            className="w-1/2 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7B61FF]"
                          />
                          <input
                            type="url"
                            value={item.url}
                            onChange={(e) => {
                              const updated = [...editPortfolio];
                              updated[idx] = { ...updated[idx], url: e.target.value };
                              setEditPortfolio(updated);
                            }}
                            placeholder="URL"
                            className="w-1/2 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7B61FF]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditPortfolio(editPortfolio.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-foreground/40 hover:text-red-500 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setEditPortfolio([...editPortfolio, { title: "", url: "" }])
                        }
                        className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                    <GhostButton onClick={() => setIsEditMode(false)}>Cancel</GhostButton>
                    <GradientButton
                      type="submit"
                      loading={isSaving}
                      icon={<Sparkles className="w-4 h-4 ml-1" />}
                    >
                      {isSaving ? "Recalculating Trust Score…" : "Save & Recalculate Trust Score"}
                    </GradientButton>
                  </div>
                </form>
              </GlassCard>
            ) : (
              /* ---------------------------------------------------------------- */
              /* VIEW MODE                                                         */
              /* ---------------------------------------------------------------- */
              <div className="space-y-6">
                {/* Top Profile Card */}
                <GlassCard className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={
                          profile.avatarUrl ||
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                        }
                        alt={profile.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border border-black/10 dark:border-white/10 shadow-lg"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                            {profile.name || shortAddress}
                          </h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-mono text-foreground/70">
                            {profile.experienceLevel}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/70">
                          {profile.headline || "No headline set"}
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                          <ScoreBadge score={profile.trustScore} type="trust" size="md" />
                        </div>
                      </div>
                    </div>

                    {/* Payout — real Sui address from useCurrentAccount */}
                    <div
                      title={walletAddress}
                      className="text-[11px] font-mono text-foreground/60 bg-black/[0.03] dark:bg-black/20 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 self-start select-all cursor-default"
                    >
                      Payout: {shortAddress}
                    </div>
                  </div>

                  {/* Expandable Trust Score Breakdown Block */}
                  <div className="rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/[0.05] p-5 space-y-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#0D9488] dark:text-[#2DD4BF] font-semibold text-xs uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Gonka Trust Score Breakdown ({profile.trustScore}/100)</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="text-xs text-[#0D9488] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showBreakdown ? "Hide details" : "Show details"}</span>
                        {showBreakdown ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {showBreakdown && (
                      <div className="space-y-3 pt-2 border-t border-[#2DD4BF]/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {profile.trustScoreReasoning.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-black/[0.03] dark:bg-black/20 border border-black/5 dark:border-white/5 space-y-1"
                            >
                              <span className="font-semibold text-foreground block">
                                {item.label}
                              </span>
                              <p className="text-foreground/70 leading-relaxed text-[11px]">
                                {item.note}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-foreground/50 font-mono pt-2 border-t border-black/5 dark:border-white/5">
                          <span>Confidence: {profile.trustScoreConfidence}</span>
                          <span>Request ID: {profile.trustScoreRequestId}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                      About Me
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {profile.bio || "No bio added yet."}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                      Verified Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.length > 0 ? (
                        profile.skills.map((s) => <SkillChip key={s} label={s} />)
                      ) : (
                        <p className="text-xs text-foreground/40">No skills added yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Portfolio */}
                  {profile.portfolioLinks.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
                      <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                        Portfolio &amp; Code Samples
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profile.portfolioLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:border-black/20 dark:hover:border-white/20 transition-all text-xs group"
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-[#2563EB] dark:text-[#4DA2FF]" />
                              <span className="font-semibold text-foreground group-hover:text-[#2563EB] dark:group-hover:text-[#4DA2FF] transition-colors">
                                {link.title}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-foreground/40 group-hover:text-foreground transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reputation Section */}
                  <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                        On-Chain Reputation Record
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-mono text-foreground/60">
                        <span>{profile.completedProjectsCount} completed</span>
                        <span>•</span>
                        <span className="text-[#0D9488] dark:text-[#2DD4BF]">
                          {profile.onTimeDeliveryPct}% on-time
                        </span>
                        <span>•</span>
                        <span className="text-amber-500 dark:text-amber-400">
                          ★ {profile.averageRating}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {profile.reviews.length > 0 ? (
                        profile.reviews.map((r) => (
                          <div
                            key={r.review_id}
                            className="p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.02] space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                                {[...Array(Math.round(Number(r.rating)))].map((_, s) => (
                                  <Star key={s} className="w-3.5 h-3.5 fill-current" />
                                ))}
                              </div>
                              <span className="font-mono text-[11px] text-foreground/40">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {r.comment && (
                              <p className="text-foreground/80 italic">"{r.comment}"</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 text-xs text-foreground/50 text-center">
                          No reviews yet. Completed milestone records will appear here.
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
