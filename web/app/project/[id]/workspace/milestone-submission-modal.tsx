"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Loader2,
  RefreshCw,
  CheckCircle2,
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

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  private: boolean;
  owner?: {
    login: string;
  };
}

interface GitHubPullRequest {
  number: number;
  title: string;
  html_url: string;
  state: string;
  draft: boolean;
  head?: {
    ref: string;
  };
  base?: {
    ref: string;
  };
}

export const MilestoneSubmissionModal: React.FC<
  MilestoneSubmissionModalProps
> = ({
  milestone,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { currentUser } = useApp();

  const [content, setContent] = useState(
    milestone.submissionContent || "",
  );

  const [repositories, setRepositories] = useState<
    GitHubRepository[]
  >([]);

  const [pullRequests, setPullRequests] = useState<
    GitHubPullRequest[]
  >([]);

  const [selectedRepoId, setSelectedRepoId] =
    useState<string>("");

  const [selectedPrNumber, setSelectedPrNumber] =
    useState<number | null>(null);

  const [githubSession, setGithubSession] =
    useState<string | null>(null);

  const [githubUsername, setGithubUsername] =
    useState<string | null>(null);

  const [loadingRepositories, setLoadingRepositories] =
    useState(false);

  const [loadingPullRequests, setLoadingPullRequests] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [githubError, setGithubError] =
    useState<string | null>(null);

  const [additionalLinks, setAdditionalLinks] =
    useState<string[]>([]);

  /*
   * API URL
   */
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3010";

  /*
   * ----------------------------------------
   * Read GitHub OAuth session
   * ----------------------------------------
   *
   * The onboarding flow stores the GitHub
   * session here after OAuth completes.
   */
useEffect(() => {
  if (!isOpen) return;

  if (typeof window === "undefined") return;

  const params = new URLSearchParams(
    window.location.search,
  );

  const urlGithubStatus =
    params.get("github");

  const urlSessionId =
    params.get("sessionId");

  const urlUsername =
    params.get("username");

  const storedSessionId =
    sessionStorage.getItem(
      "trusthire_github_session",
    );

  const storedUsername =
    sessionStorage.getItem(
      "trusthire_github_username",
    );

  console.log(
    "[Milestone GitHub] Session check:",
    {
      urlGithubStatus,
      urlSessionId,
      urlUsername,
      storedSessionId,
      storedUsername,
    },
  );

  /*
   * If OAuth returned a session ID in the URL,
   * save it immediately.
   */
  if (
    urlGithubStatus === "connected" &&
    urlSessionId
  ) {
    sessionStorage.setItem(
      "trusthire_github_session",
      urlSessionId,
    );

    if (urlUsername) {
      sessionStorage.setItem(
        "trusthire_github_username",
        urlUsername,
      );
    }

    setGithubSession(urlSessionId);

    setGithubUsername(
      urlUsername ||
        storedUsername ||
        null,
    );

    console.log(
      "[Milestone GitHub] OAuth session saved:",
      urlSessionId,
    );

    return;
  }

  /*
   * Otherwise use an existing session.
   */
  setGithubSession(
    storedSessionId,
  );

  setGithubUsername(
    storedUsername || null,
  );

  if (!storedSessionId) {
    setRepositories([]);
    setPullRequests([]);
    setSelectedRepoId("");
    setSelectedPrNumber(null);
  }
}, [isOpen]);

  /*
   * ----------------------------------------
   * Load repositories
   * ----------------------------------------
   */
const loadRepositories = async (
  sessionId: string,
) => {
  setLoadingRepositories(true);
  setGithubError(null);

  try {
    const response = await fetch(
      `${apiUrl}/github/repositories?sessionId=${encodeURIComponent(
        sessionId,
      )}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    // Read the response as text first so we can
    // see exactly what the backend returned.
    const rawResponse = await response.text();

    console.log(
      "[Milestone GitHub] Repository API response:",
      {
        status: response.status,
        ok: response.ok,
        contentType:
          response.headers.get("content-type"),
        body: rawResponse,
      },
    );

    let data: any;

    try {
      data = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error(
        "[Milestone GitHub] Invalid JSON from repository API:",
        {
          parseError,
          status: response.status,
          body: rawResponse,
        },
      );

      throw new Error(
        `GitHub repository API returned invalid JSON (${response.status}).`,
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to retrieve GitHub repositories",
      );
    }

    const repos: GitHubRepository[] =
      Array.isArray(data.repositories)
        ? data.repositories
        : [];

    console.log(
      "[Milestone GitHub] Repositories received:",
      repos.length,
    );

    setRepositories(repos);

    /*
     * Select the first repository automatically.
     */
    if (repos.length > 0) {
      setSelectedRepoId(
        String(repos[0].id),
      );
    } else {
      setSelectedRepoId("");
      setPullRequests([]);
      setSelectedPrNumber(null);
    }
  } catch (error) {
    console.error(
      "[Milestone GitHub] Repository loading failed:",
      error,
    );

    setRepositories([]);
    setPullRequests([]);
    setSelectedRepoId("");
    setSelectedPrNumber(null);

    setGithubError(
      error instanceof Error
        ? error.message
        : "Unable to load GitHub repositories",
    );
  } finally {
    setLoadingRepositories(false);
  }
};

  /*
   * Load repositories whenever a valid
   * GitHub session becomes available.
   */
  useEffect(() => {
    if (!isOpen) return;
    if (!githubSession) return;

    void loadRepositories(
      githubSession,
    );
  }, [isOpen, githubSession]);

  /*
   * ----------------------------------------
   * Load Pull Requests
   * ----------------------------------------
   */
const loadPullRequests = async (
  repository: GitHubRepository,
) => {
  if (!githubSession) return;

  setLoadingPullRequests(true);
  setGithubError(null);

  setPullRequests([]);
  setSelectedPrNumber(null);

  try {
    const owner =
      repository.owner?.login ||
      repository.full_name.split("/")[0];

    const repoName =
      repository.name;

    const response = await fetch(
      `${apiUrl}/github/repositories/${encodeURIComponent(
        owner,
      )}/${encodeURIComponent(
        repoName,
      )}/pulls?sessionId=${encodeURIComponent(
        githubSession,
      )}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    // Read as text first so we can inspect exactly
    // what the backend returned.
    const rawResponse = await response.text();

    console.log(
      "[Milestone GitHub] Pull request API response:",
      {
        status: response.status,
        ok: response.ok,
        contentType:
          response.headers.get("content-type"),
        body: rawResponse,
      },
    );

    let data: any;

    try {
      data = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error(
        "[Milestone GitHub] Invalid JSON from pull request API:",
        {
          parseError,
          status: response.status,
          body: rawResponse,
        },
      );

      throw new Error(
        `GitHub pull request API returned invalid JSON (${response.status}).`,
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to retrieve GitHub Pull Requests",
      );
    }

    const prs: GitHubPullRequest[] =
      Array.isArray(data.pullRequests)
        ? data.pullRequests
        : [];

    console.log(
      "[Milestone GitHub] Pull requests received:",
      prs.length,
    );

    setPullRequests(prs);

    /*
     * Prefer an open PR as the default.
     */
    const firstOpenPr =
      prs.find(
        (pr) =>
          pr.state === "open" &&
          !pr.draft,
      ) ||
      prs.find(
        (pr) =>
          pr.state === "open",
      ) ||
      prs[0];

    if (firstOpenPr) {
      setSelectedPrNumber(
        firstOpenPr.number,
      );
    }
  } catch (error) {
    console.error(
      "[Milestone GitHub] Pull request loading failed:",
      error,
    );

    setPullRequests([]);
    setSelectedPrNumber(null);

    setGithubError(
      error instanceof Error
        ? error.message
        : "Unable to load GitHub pull requests",
    );
  } finally {
    setLoadingPullRequests(false);
  }
};

  /*
   * Load PRs whenever repository changes.
   */
  useEffect(() => {
    if (!isOpen) return;
    if (!githubSession) return;
    if (!selectedRepoId) return;

    const repository =
      repositories.find(
        (repo) =>
          String(repo.id) ===
          selectedRepoId,
      );

    if (!repository) return;

    void loadPullRequests(
      repository,
    );
  }, [
    isOpen,
    githubSession,
    selectedRepoId,
  ]);

  /*
   * ----------------------------------------
   * Selected repository
   * ----------------------------------------
   */
  const selectedRepo = useMemo(
    () =>
      repositories.find(
        (repo) =>
          String(repo.id) ===
          selectedRepoId,
      ) || null,
    [
      repositories,
      selectedRepoId,
    ],
  );

  /*
   * ----------------------------------------
   * Selected PR
   * ----------------------------------------
   */
  const selectedPr = useMemo(
    () =>
      pullRequests.find(
        (pr) =>
          pr.number ===
          selectedPrNumber,
      ) || null,
    [
      pullRequests,
      selectedPrNumber,
    ],
  );

  /*
   * ----------------------------------------
   * Connect GitHub
   * ----------------------------------------
   *
   * Uses the same OAuth endpoint as
   * freelancer onboarding.
   *
   * We provide returnTo so the user can
   * come back to the workspace.
   */
const handleConnectGithub = () => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3010";

  /*
   * Return to the current project workspace after
   * GitHub OAuth finishes.
   */
  const returnTo =
    window.location.pathname;

  const githubUrl =
    `${apiUrl}/auth/github?returnTo=${encodeURIComponent(
      returnTo,
    )}`;

  console.log(
    "[Milestone GitHub] Starting OAuth:",
    {
      returnTo,
      githubUrl,
    },
  );

  window.location.href = githubUrl;
};

  /*
   * ----------------------------------------
   * Refresh GitHub
   * ----------------------------------------
   */
  const handleRefreshGithub = async () => {
    if (!githubSession) {
      return;
    }

    await loadRepositories(
      githubSession,
    );
  };

  /*
   * ----------------------------------------
   * Repository change
   * ----------------------------------------
   */
  const handleRepoChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedRepoId(
      e.target.value,
    );
  };

  /*
   * ----------------------------------------
   * Submit milestone
   * ----------------------------------------
   */
  const handleSubmit = async () => {
    if (!content.trim()) {
      return;
    }

    /*
     * We require GitHub connection.
     */
    if (!githubSession) {
      setGithubError(
        "Please connect your GitHub account before submitting the milestone.",
      );

      return;
    }

    /*
     * We require an actual selected PR.
     */
    if (!selectedPr) {
      setGithubError(
        "Please select a GitHub Pull Request for this submission.",
      );

      return;
    }

    setLoading(true);
    setGithubError(null);

    try {
      const allLinks = [
        selectedPr.html_url,
        ...additionalLinks.filter(
          (link) =>
            link.trim().length > 0,
        ),
      ];

      await onSubmit(
        content,
        allLinks,
      );

      onClose();
    } catch (error) {
      console.error(
        "[Milestone Submission] Submit failed:",
        error,
      );

      setGithubError(
        error instanceof Error
          ? error.message
          : "Failed to submit milestone",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------
   * Additional links
   * ----------------------------------------
   */
  const handleAddLink = () => {
    setAdditionalLinks([
      ...additionalLinks,
      "",
    ]);
  };

  const handleUpdateLink = (
    index: number,
    value: string,
  ) => {
    const updated = [
      ...additionalLinks,
    ];

    updated[index] = value;

    setAdditionalLinks(
      updated,
    );
  };

  const handleRemoveLink = (
    index: number,
  ) => {
    setAdditionalLinks(
      additionalLinks.filter(
        (_, i) =>
          i !== index,
      ),
    );
  };

  if (!isOpen) {
    return null;
  }

  /*
   * ----------------------------------------
   * UI
   * ----------------------------------------
   */
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
            For:{" "}
            <strong className="text-foreground">
              {milestone.title}
            </strong>
          </p>

          <p className="text-xs text-foreground/60 mt-0.5">
            Payout upon client approval:{" "}
            <strong className="text-[#0D9488] dark:text-[#2DD4BF] font-mono">
              {milestone.amount.toLocaleString()} SUI
            </strong>
          </p>
        </div>

        {/* Revision note */}
        {milestone.revisionNote && (
          <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#D97706] dark:text-[#F59E0B]">
            <strong>
              Client Note:
            </strong>{" "}
            &ldquo;
            {milestone.revisionNote}
            &rdquo;
          </div>
        )}

        {/* Deliverable Summary */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/90">
            Deliverable Summary &amp;
            Release Notes
          </label>

          <textarea
            rows={3}
            value={content}
            onChange={(e) =>
              setContent(
                e.target.value,
              )
            }
            placeholder="Describe your completed work..."
            className="w-full p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7C3AED] dark:focus:border-[#A78BFA] resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* GitHub Evidence */}
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
                  GitHub Pull Request
                  verification
                </p>
              </div>
            </div>

            {githubSession ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />

                Connected
                {githubUsername
                  ? `: @${githubUsername}`
                  : ""}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                Not connected
              </span>
            )}
          </div>

          {/* Not connected */}
          {!githubSession && (
            <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Github className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />

                <div>
                  <p className="text-xs font-semibold text-foreground">
                    GitHub account is
                    not connected
                  </p>

                  <p className="text-[11px] text-foreground/55 mt-1 leading-relaxed">
                    Connect your GitHub
                    account to select a
                    real repository and
                    Pull Request for this
                    milestone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleConnectGithub
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold py-2.5 transition-colors"
              >
                <Github className="w-4 h-4" />

                Connect GitHub
              </button>
            </div>
          )}

          {/* Connected GitHub */}
          {githubSession && (
            <>
              {/* Refresh */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={
                    handleRefreshGithub
                  }
                  disabled={
                    loadingRepositories ||
                    loadingPullRequests
                  }
                  className="inline-flex items-center gap-1.5 text-[10px] text-foreground/50 hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${
                      loadingRepositories
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  Refresh GitHub
                </button>
              </div>

              {/* Repository */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-foreground/50" />

                  <span>
                    Repository
                  </span>
                </label>

                {loadingRepositories ? (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-xs text-foreground/50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />

                    Loading repositories...
                  </div>
                ) : repositories.length ===
                  0 ? (
                  <div className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-xs text-foreground/50">
                    No GitHub repositories
                    found.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={
                        selectedRepoId
                      }
                      onChange={
                        handleRepoChange
                      }
                      className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1D2B] text-xs font-medium text-foreground focus:outline-none focus:border-[#7C3AED] transition-colors cursor-pointer"
                    >
                      {repositories.map(
                        (repo) => (
                          <option
                            key={
                              repo.id
                            }
                            value={String(
                              repo.id,
                            )}
                          >
                            {repo.name}
                            {repo.private
                              ? " 🔒"
                              : ""}
                          </option>
                        ),
                      )}
                    </select>

                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {selectedRepo && (
                  <a
                    href={
                      selectedRepo.html_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#2563EB] dark:text-[#4DA2FF] hover:underline inline-flex items-center gap-1"
                  >
                    View repository
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Pull Request */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <GitPullRequest className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />

                  <span>
                    Pull Request
                  </span>
                </label>

                {loadingPullRequests ? (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-xs text-foreground/50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />

                    Loading pull requests...
                  </div>
                ) : pullRequests.length ===
                  0 ? (
                  <div className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-xs text-foreground/50">
                    No pull requests
                    found for this
                    repository.
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <select
                        value={
                          selectedPrNumber ??
                          ""
                        }
                        onChange={(e) =>
                          setSelectedPrNumber(
                            e.target.value
                              ? Number(
                                  e.target
                                    .value,
                                )
                              : null,
                          )
                        }
                        className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1D2B] text-xs font-medium text-foreground focus:outline-none focus:border-[#7C3AED] transition-colors cursor-pointer"
                      >
                        {pullRequests.map(
                          (pr) => (
                            <option
                              key={
                                pr.number
                              }
                              value={
                                pr.number
                              }
                            >
                              #{pr.number}{" "}
                              –{" "}
                              {pr.title}
                              {pr.draft
                                ? " (Draft)"
                                : ""}
                            </option>
                          ),
                        )}
                      </select>

                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {selectedPr && (
                      <div className="pt-1 flex items-center justify-between gap-3 text-[11px] font-mono text-foreground/50">
                        <span className="truncate text-[10px]">
                          Branch:{" "}
                          {selectedPr.head
                            ?.ref ||
                            "Unknown"}
                        </span>

                        <a
                          href={
                            selectedPr.html_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1 text-[11px] shrink-0"
                        >
                          <span>
                            View PR
                          </span>

                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Error */}
          {githubError && (
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-[11px] text-red-500 dark:text-red-400">
              {githubError}
            </div>
          )}
        </div>

        {/* Additional Links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-foreground/80">
              Additional Deliverable
              Links
            </label>

            <span className="text-[10px] text-foreground/40 font-mono">
              Figma, Live dApp, Docs
            </span>
          </div>

          {additionalLinks.map(
            (link, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2"
              >
                <input
                  type="url"
                  value={link}
                  onChange={(e) =>
                    handleUpdateLink(
                      idx,
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7C3AED]"
                  placeholder="https://figma.com/... or https://mydapp.com"
                />

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveLink(
                      idx,
                    )
                  }
                  className="text-foreground/40 hover:text-red-400 p-1 transition-colors"
                  title="Remove link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          )}

          <button
            type="button"
            onClick={
              handleAddLink
            }
            className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1.5 font-medium pt-0.5"
          >
            <Plus className="w-3.5 h-3.5" />

            <span>Add link</span>
          </button>
        </div>

        {/* Integrity */}
        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-[11px] text-foreground/70 flex items-center gap-2 font-mono">
          <Lock className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />

          <span>
            Submission integrity protected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <GhostButton
            onClick={onClose}
          >
            Cancel
          </GhostButton>

          <GradientButton
            loading={loading}
            disabled={
              !content.trim() ||
              !githubSession ||
              !selectedPr ||
              loadingRepositories ||
              loadingPullRequests
            }
            onClick={
              handleSubmit
            }
            icon={
              <Send className="w-4 h-4 ml-1" />
            }
          >
            {loading
              ? "Submitting on Sui…"
              : "Submit Milestone"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};