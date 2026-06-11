# Task 3: Configuration Files and Constants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create configuration files (site config, env example) and ensure .env has all required values for the video portfolio project.

**Architecture:** Simple configuration constants exported from a TypeScript module, plus environment variable templates and actual values for development.

**Tech Stack:** TypeScript, Next.js environment variables

---

### Task 1: Create lib/config.ts with site configuration

**Files:**
- Create: `lib/config.ts`

- [ ] **Step 1: Create the config file with site configuration**

```typescript
export const siteConfig = {
  name: "Your Name",
  title: "Video Portfolio",
  description: "Video portfolio website",
  email: "your-email@example.com",
};

export const socialLinks = [
  { name: "Bilibili", url: "https://bilibili.com/your-id", icon: "bilibili" },
  { name: "YouTube", url: "https://youtube.com/@your-id", icon: "youtube" },
  { name: "小红书", url: "https://xiaohongshu.com/user/your-id", icon: "xiaohongshu" },
  { name: "X", url: "https://x.com/your-id", icon: "twitter" },
] as const;
```

- [ ] **Step 2: Verify file was created correctly**

Run: `cat lib/config.ts`
Expected: File contains the siteConfig and socialLinks exports

---

### Task 2: Create .env.example with environment variable template

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create the env example file**

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-secret-here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

- [ ] **Step 2: Verify file was created correctly**

Run: `cat .env.example`
Expected: File contains all 5 environment variable placeholders

---

### Task 3: Update .env with all required values

**Files:**
- Modify: `.env`

- [ ] **Step 1: Read current .env file**

Run: `cat .env`
Expected: Currently only contains `DATABASE_URL="file:./dev.db"`

- [ ] **Step 2: Update .env with missing values**

Add the following lines to .env:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-change-in-production"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
BLOB_READ_WRITE_TOKEN=""
```

- [ ] **Step 3: Verify .env has all required values**

Run: `cat .env`
Expected: File contains all 5 environment variables with development values

---

### Task 4: Commit changes

**Files:**
- Commit: `lib/config.ts`, `.env.example`, `.env`

- [ ] **Step 1: Stage all changes**

Run: `git add lib/config.ts .env.example .env`

- [ ] **Step 2: Commit with descriptive message**

Run: `git commit -m "feat: add site config and env example"`

- [ ] **Step 3: Verify commit**

Run: `git log --oneline -1`
Expected: Shows the new commit with the feat message

---

## Verification Checklist

After completing all tasks, verify:

1. [ ] `lib/config.ts` exists and exports `siteConfig` and `socialLinks`
2. [ ] `.env.example` exists with all 5 environment variable placeholders
3. [ ] `.env` exists with all 5 environment variables set to development values
4. [ ] Changes are committed with the correct message
5. [ ] No TypeScript errors in config file (run `npx tsc --noEmit` if needed)
