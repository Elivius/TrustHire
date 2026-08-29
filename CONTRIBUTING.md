# Project Structure & Git Workflow Guide

This guide outlines the recommended structure for the **TrustHire** project and the standard Git workflow for collaboration.

## 1. Recommended Project Structure

For a project involving a Web app (Next.js) and Smart Contracts, it is best practice to separate concerns into distinct directories at the root level.

```text
TrustHire/
├── web/
├── smart-contracts/
└── README.md
```

**Benefits:**
*   **No Conflicts:** Dependencies (like `package.json`) don't clash.
*   **Clear Deployment:** You can deploy just the `web` folder to Vercel easily.

---

## 2. Git Branching Strategy

**Rule:** Never work directly on `main`. Always create a new branch for every task.

### Naming Conventions
Prefix your branches to indicate the type of work:
*   `feat/login-page(web)` (New features)
*   `fix/wallet-connection(web)` (Bug fixes)
*   `chore/cleanup(smart-contracts)` (Maintenance/Configs)
*   `docs/updated-readme(web)` (Documentation only)
*   `refactor/simplify-logic(web)` (Code restructuring without behavior change)
*   `style/format-code(smart-contracts)` (Code formatting)

### How to Start a New Task
When you start a new task (e.g., building the web feature), run:

```bash
# 1. Make sure your local main is up to date
git checkout main
git pull

# 2. Create your new branch
git checkout -b feat/contracts-setup(smart-contracts)
```

---

## 3. Collaboration Workflow

### While Others are Working
*   **Do Nothing.** You do not need to pull or track their feature branches (`feat/login(web)`, `feat/zklogin(smart-contracts)`) while they are still working on them.
*   Focus entirely on your own branch (`feat/contracts-setup(smart-contracts)`).

### When Others Finish (They Merge to Main)
Once a teammate's code is merged into `main`, you must "sync" your branch to get their changes.

**Steps to Sync:**

```bash
# 1. Switch to main and download the latest changes
git checkout main
git pull origin main

# 2. Go back to your branch
git checkout feat/contracts-setup(smart-contracts)

# 3. Merge main into your branch
git merge main
```

**Why?** This ensures your Smart Contract code works correctly with the latest Web code they just added.

### When You Finish
1.  Push your branch: `git push -u origin feat/contracts-setup(smart-contracts)`
2.  Open a **Pull Request (PR)** on GitHub.
3.  Once approved, merge into `main`.