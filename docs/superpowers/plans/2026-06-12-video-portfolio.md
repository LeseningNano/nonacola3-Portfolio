# 视频作品集网站实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个暗色系电影感视频作品集网站，含 Hero 视频、分类筛选、后台管理

**Architecture:** Next.js 15 App Router 全栈应用，前台展示 + 后台管理分离路由，Prisma + SQLite 管理数据，Vercel Blob 存储 Hero 视频

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, NextAuth.js v5, Vercel Blob

---

## 文件结构总览

```
/portfolio
  /app
    /(public)/page.tsx              — 首页
    /(admin)/login/page.tsx         — 登录
    /(admin)/dashboard/page.tsx     — 后台首页
    /(admin)/videos/new/page.tsx    — 新增视频
    /(admin)/videos/[id]/edit/page.tsx — 编辑视频
    /api/auth/[...nextauth]/route.ts
    /api/videos/route.ts            — 视频 CRUD
    /api/videos/[id]/route.ts       — 单个视频操作
    /api/upload/route.ts            — Vercel Blob 上传
    /layout.tsx
  /components
    /hero-video.tsx
    /video-grid.tsx
    /video-card.tsx
    /video-modal.tsx
    /category-filter.tsx
    /contact-section.tsx
    /admin/video-form.tsx
    /admin/video-table.tsx
  /lib
    /db.ts
    /auth.ts
    /config.ts                      — 社交链接、邮箱等配置
  /prisma/schema.prisma
  /middleware.ts
  /next.config.ts
  /tailwind.config.ts
  /tsconfig.json
  /package.json
  /next-env.d.ts
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `app/layout.tsx`, `app/globals.css`, `next-env.d.ts`

- [ ] **Step 1: 创建 Next.js 项目**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-turbopack --use-npm
```

- [ ] **Step 2: 安装额外依赖**

```bash
npm install prisma @prisma/client next-auth@beta @vercel/blob lucide-react
npm install -D @types/node
```

- [ ] **Step 3: 初始化 shadcn/ui**

```bash
npx shadcn@latest init
```

选择：New York style, Zinc color, CSS variables: yes

```bash
npx shadcn@latest add button input card label switch dialog select
```

- [ ] **Step 4: 清理默认页面内容**

替换 `app/layout.tsx`：

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Video Portfolio",
  description: "Video portfolio website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

替换 `app/page.tsx`：

```tsx
export default function Home() {
  return <div className="min-h-screen">Hello</div>;
}
```

- [ ] **Step 5: 验证项目能启动**

```bash
npm run dev
```

访问 http://localhost:3000 确认页面显示 "Hello"

- [ ] **Step 6: 首次提交**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with Tailwind + shadcn/ui"
```

---

## Task 2: 数据库配置

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`

- [ ] **Step 1: 初始化 Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 2: 编写 Schema**

替换 `prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Video {
  id          String   @id @default(cuid())
  title       String
  description String?
  category    String
  embedUrl    String
  thumbnail   String?
  featured    Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model HeroVideo {
  id        String   @id @default("singleton")
  blobUrl   String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 3: 运行迁移**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 4: 创建 Prisma 客户端**

创建 `lib/db.ts`：

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 5: 更新 .gitignore**

在 `.gitignore` 中添加：

```
*.db
*.db-journal
```

- [ ] **Step 6: 提交**

```bash
git add .
git commit -m "feat: add Prisma schema with Video and HeroVideo models"
```

---

## Task 3: 配置文件与常量

**Files:**
- Create: `lib/config.ts`, `.env.example`

- [ ] **Step 1: 创建配置文件**

创建 `lib/config.ts`：

```ts
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

- [ ] **Step 2: 创建 .env.example**

创建 `.env.example`：

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-secret-here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

同时创建实际的 `.env` 文件，从 `.env.example` 复制并填入值：

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-change-in-production"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
BLOB_READ_WRITE_TOKEN=""
```

- [ ] **Step 3: 提交**

```bash
git add .
git commit -m "feat: add site config and env example"
```

---

## Task 4: 认证系统

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

- [ ] **Step 1: 配置 NextAuth**

创建 `lib/auth.ts`：

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials.username === process.env.ADMIN_USERNAME &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      return session;
    },
  },
});
```

- [ ] **Step 2: 创建 API 路由**

创建 `app/api/auth/[...nextauth]/route.ts`：

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: 创建 Middleware 保护后台路由**

创建 `middleware.ts`：

```ts
import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/videos")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/videos/:path*"],
};
```

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add NextAuth with credentials provider and route protection"
```

---

## Task 5: 后台登录页

**Files:**
- Create: `app/(admin)/login/page.tsx`

- [ ] **Step 1: 创建登录页**

创建 `app/(admin)/login/page.tsx`：

```tsx
"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("用户名或密码错误");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px] bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-center">管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 验证登录功能**

```bash
npm run dev
```

访问 http://localhost:3000/login，输入 admin/admin，确认跳转到 /dashboard

- [ ] **Step 3: 提交**

```bash
git add .
git commit -m "feat: add admin login page"
```

---

## Task 6: 后台 Dashboard

**Files:**
- Create: `app/(admin)/dashboard/page.tsx`, `components/admin/video-table.tsx`

- [ ] **Step 1: 创建视频表格组件**

创建 `components/admin/video-table.tsx`：

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  title: string;
  category: string;
  featured: boolean;
  order: number;
}

export function VideoTable({ videos }: { videos: Video[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("确定删除这个视频吗？")) return;
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="py-3 px-4 text-zinc-400 font-medium">标题</th>
            <th className="py-3 px-4 text-zinc-400 font-medium">分类</th>
            <th className="py-3 px-4 text-zinc-400 font-medium">精选</th>
            <th className="py-3 px-4 text-zinc-400 font-medium">排序</th>
            <th className="py-3 px-4 text-zinc-400 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id} className="border-b border-zinc-800/50">
              <td className="py-3 px-4">{video.title}</td>
              <td className="py-3 px-4 text-zinc-400">{video.category}</td>
              <td className="py-3 px-4">{video.featured ? "是" : "否"}</td>
              <td className="py-3 px-4 text-zinc-400">{video.order}</td>
              <td className="py-3 px-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/videos/${video.id}/edit`)}
                >
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(video.id)}
                >
                  删除
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: 创建 Dashboard 页面**

创建 `app/(admin)/dashboard/page.tsx`：

```tsx
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoTable } from "@/components/admin/video-table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const videos = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">后台管理</h1>
        <div className="space-x-4">
          <Link href="/videos/new">
            <Button>添加视频</Button>
          </Link>
        </div>
      </div>
      {videos.length === 0 ? (
        <p className="text-zinc-500">暂无视频，点击"添加视频"开始。</p>
      ) : (
        <VideoTable videos={videos} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: 验证**

访问 http://localhost:3000/dashboard，确认显示空列表

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add admin dashboard with video list"
```

---

## Task 7: 视频 CRUD API

**Files:**
- Create: `app/api/videos/route.ts`, `app/api/videos/[id]/route.ts`

- [ ] **Step 1: 创建视频列表/创建 API**

创建 `app/api/videos/route.ts`：

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const videos = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const video = await db.video.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      embedUrl: body.embedUrl,
      thumbnail: body.thumbnail,
      featured: body.featured ?? false,
      order: body.order ?? 0,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
```

- [ ] **Step 2: 创建单个视频操作 API**

创建 `app/api/videos/[id]/route.ts`：

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(video);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const video = await db.video.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      embedUrl: body.embedUrl,
      thumbnail: body.thumbnail,
      featured: body.featured,
      order: body.order,
    },
  });

  return NextResponse.json(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.video.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: 验证 API**

```bash
curl http://localhost:3000/api/videos
```

预期返回 `[]`

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add video CRUD API endpoints"
```

---

## Task 8: 添加/编辑视频表单

**Files:**
- Create: `components/admin/video-form.tsx`, `app/(admin)/videos/new/page.tsx`, `app/(admin)/videos/[id]/edit/page.tsx`

- [ ] **Step 1: 创建表单组件**

创建 `components/admin/video-form.tsx`：

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VideoData {
  id?: string;
  title: string;
  description: string;
  category: string;
  embedUrl: string;
  thumbnail: string;
  featured: boolean;
  order: number;
}

export function VideoForm({
  initialData,
  mode,
}: {
  initialData?: VideoData;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<VideoData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    embedUrl: initialData?.embedUrl ?? "",
    thumbnail: initialData?.thumbnail ?? "",
    featured: initialData?.featured ?? false,
    order: initialData?.order ?? 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url =
      mode === "edit" ? `/api/videos/${initialData?.id}` : "/api/videos";
    const method = mode === "edit" ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    router.push("/dashboard");
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle>{mode === "edit" ? "编辑视频" : "添加视频"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">分类 *</Label>
            <Input
              id="category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="如：商业广告、短片、纪录片"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedUrl">嵌入链接 *</Label>
            <Input
              id="embedUrl"
              required
              value={form.embedUrl}
              onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
              placeholder="YouTube 或 Bilibili 嵌入链接"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnail">封面图 URL（选填）</Label>
            <Input
              id="thumbnail"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述（选填）</Label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="featured">精选</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="order">排序权重</Label>
              <Input
                id="order"
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                className="w-24 bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 创建新增页面**

创建 `app/(admin)/videos/new/page.tsx`：

```tsx
import { VideoForm } from "@/components/admin/video-form";

export default function NewVideoPage() {
  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <VideoForm mode="create" />
    </div>
  );
}
```

- [ ] **Step 3: 创建编辑页面**

创建 `app/(admin)/videos/[id]/edit/page.tsx`：

```tsx
import { db } from "@/lib/db";
import { VideoForm } from "@/components/admin/video-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });

  if (!video) notFound();

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <VideoForm
        mode="edit"
        initialData={{
          id: video.id,
          title: video.title,
          description: video.description ?? "",
          category: video.category,
          embedUrl: video.embedUrl,
          thumbnail: video.thumbnail ?? "",
          featured: video.featured,
          order: video.order,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: 验证**

访问 http://localhost:3000/videos/new，填写表单提交，确认视频出现在 dashboard

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: add video create/edit form pages"
```

---

## Task 9: Hero 视频上传

**Files:**
- Create: `app/api/upload/route.ts`, `app/api/hero/route.ts`, 修改 `app/(admin)/dashboard/page.tsx`

- [ ] **Step 1: 创建上传 API**

创建 `app/api/upload/route.ts`：

```ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const blob = await put(`hero-${Date.now()}.mp4`, file, {
    access: "public",
    contentType: "video/mp4",
  });

  return NextResponse.json({ url: blob.url });
}
```

- [ ] **Step 2: 创建 Hero 视频 API**

创建 `app/api/hero/route.ts`：

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const hero = await db.heroVideo.findUnique({
    where: { id: "singleton" },
  });
  return NextResponse.json(hero);
}

export async function PUT(req: NextRequest) {
  const { blobUrl } = await req.json();

  const hero = await db.heroVideo.upsert({
    where: { id: "singleton" },
    update: { blobUrl },
    create: { id: "singleton", blobUrl },
  });

  return NextResponse.json(hero);
}
```

- [ ] **Step 3: 在 Dashboard 添加 Hero 上传区域**

修改 `app/(admin)/dashboard/page.tsx`，在顶部添加 Hero 上传：

```tsx
// 在文件顶部添加 "use client" 改为客户端组件，或拆出一个 HeroUpload 子组件
// 推荐拆出子组件

// 创建 components/admin/hero-upload.tsx
```

创建 `components/admin/hero-upload.tsx`：

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function HeroUpload() {
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const { url } = await res.json();

    await fetch("/api/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blobUrl: url }),
    });

    setCurrentUrl(url);
    setUploading(false);
  }

  return (
    <div className="p-4 border border-zinc-800 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Hero 背景视频</h3>
      {currentUrl && (
        <video src={currentUrl} className="w-full rounded mb-2" muted />
      )}
      <div>
        <input
          type="file"
          accept="video/mp4"
          onChange={handleUpload}
          className="text-sm"
        />
        {uploading && <p className="text-sm text-zinc-500 mt-1">上传中...</p>}
      </div>
    </div>
  );
}
```

然后在 Dashboard 页面引入：

```tsx
import { HeroUpload } from "@/components/admin/hero-upload";

// 在页面中添加：
<HeroUpload />
```

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add hero video upload with Vercel Blob"
```

---

## Task 10: 首页 Hero 区域

**Files:**
- Create: `components/hero-video.tsx`, 修改 `app/(public)/page.tsx`

- [ ] **Step 1: 创建 Hero 组件**

创建 `components/hero-video.tsx`：

```tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export function HeroVideo() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        if (data?.blobUrl) setVideoUrl(data.blobUrl);
      });
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]" />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4">
          Your Name
        </h1>
        <p className="text-xl md:text-2xl text-zinc-400">
          Videographer & Director
        </p>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="w-8 h-8 text-zinc-400" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 在首页引入 Hero**

修改 `app/(public)/page.tsx`：

```tsx
import { HeroVideo } from "@/components/hero-video";

export default function Home() {
  return (
    <main>
      <HeroVideo />
    </main>
  );
}
```

- [ ] **Step 3: 验证**

访问首页，确认显示 Hero 区域（无视频时显示渐变背景）

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add hero video section to homepage"
```

---

## Task 11: 视频网格与分类筛选

**Files:**
- Create: `components/video-card.tsx`, `components/category-filter.tsx`, `components/video-grid.tsx`, `components/video-modal.tsx`

- [ ] **Step 1: 创建视频卡片**

创建 `components/video-card.tsx`：

```tsx
"use client";

import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
}

export function VideoCard({
  video,
  onClick,
}: {
  video: Video;
  onClick: () => void;
}) {
  return (
    <div
      className="group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <Play className="w-12 h-12 text-zinc-600" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <h3 className="font-semibold text-lg">{video.title}</h3>
        {video.description && (
          <p className="text-zinc-400 text-sm line-clamp-2">
            {video.description}
          </p>
        )}
        <span className="text-xs text-zinc-500 mt-1">{video.category}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建分类筛选**

创建 `components/category-filter.tsx`：

```tsx
"use client";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect("全部")}
        className={`px-4 py-2 rounded-full text-sm transition-colors ${
          selected === "全部"
            ? "bg-white text-black"
            : "bg-zinc-800 text-zinc-400 hover:text-white"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            selected === cat
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 创建视频 Modal**

创建 `components/video-modal.tsx`：

```tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Bilibili
  const biliMatch = url.match(
    /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/
  );
  if (biliMatch) {
    return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}`;
  }
  return url;
}

export function VideoModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-zinc-400 hover:text-white"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="aspect-video w-full">
          <iframe
            src={getEmbedUrl(video.embedUrl)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-semibold">{video.title}</h3>
          <span className="text-sm text-zinc-500">{video.category}</span>
          {video.description && (
            <p className="text-zinc-400 mt-2">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建视频网格**

创建 `components/video-grid.tsx`：

```tsx
"use client";

import { useState, useEffect } from "react";
import { VideoCard } from "./video-card";
import { VideoModal } from "./video-modal";
import { CategoryFilter } from "./category-filter";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
}

export function VideoGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => setVideos(data));
  }, []);

  const categories = [
    ...new Set(videos.map((v) => v.category)),
  ];

  const filteredVideos =
    selectedCategory === "全部"
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">作品展示</h2>
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {filteredVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => setSelectedVideo(video)}
          />
        ))}
      </div>
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 5: 在首页引入 VideoGrid**

修改 `app/(public)/page.tsx`：

```tsx
import { HeroVideo } from "@/components/hero-video";
import { VideoGrid } from "@/components/video-grid";

export default function Home() {
  return (
    <main>
      <HeroVideo />
      <VideoGrid />
    </main>
  );
}
```

- [ ] **Step 6: 验证**

添加几个视频到后台，访问首页确认：网格显示、分类筛选工作、点击弹出 Modal

- [ ] **Step 7: 提交**

```bash
git add .
git commit -m "feat: add video grid with category filter and modal player"
```

---

## Task 12: 联系区块与社交媒体

**Files:**
- Create: `components/contact-section.tsx`

- [ ] **Step 1: 创建联系区块**

创建 `components/contact-section.tsx`：

```tsx
import { siteConfig, socialLinks } from "@/lib/config";

export function ContactSection() {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto border-t border-zinc-800">
      <h2 className="text-3xl font-bold mb-8">联系我</h2>
      <div className="flex flex-col md:flex-row gap-12">
        <div>
          <p className="text-zinc-400 mb-4">期待与你合作</p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-xl hover:text-zinc-300 transition-colors"
          >
            {siteConfig.email}
          </a>
        </div>
        <div>
          <p className="text-zinc-400 mb-4">社交媒体</p>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 在首页引入**

修改 `app/(public)/page.tsx`：

```tsx
import { HeroVideo } from "@/components/hero-video";
import { VideoGrid } from "@/components/video-grid";
import { ContactSection } from "@/components/contact-section";

export default function Home() {
  return (
    <main>
      <HeroVideo />
      <VideoGrid />
      <ContactSection />
    </main>
  );
}
```

- [ ] **Step 3: 验证**

访问首页底部，确认显示邮箱和社交链接

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add contact section with social links"
```

---

## Task 13: 布局与导航

**Files:**
- Create: `components/navbar.tsx`, 修改 `app/layout.tsx`

- [ ] **Step 1: 创建导航栏**

创建 `components/navbar.tsx`：

```tsx
"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6">
          <a href="#works" className="text-sm text-zinc-400 hover:text-white transition-colors">
            作品
          </a>
          <a href="#contact" className="text-sm text-zinc-400 hover:text-white transition-colors">
            联系
          </a>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            管理
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 在 Layout 引入 Navbar**

修改 `app/layout.tsx`，在 `<body>` 中添加：

```tsx
import { Navbar } from "@/components/navbar";

// body 内：
<Navbar />
{children}
```

- [ ] **Step 3: 给区块添加 id**

修改首页各区块，添加对应 id：

- `<section id="works" ...>`（VideoGrid 外层）
- `<section id="contact" ...>`（ContactSection）

需要将 VideoGrid 和 ContactSection 包裹在带 id 的 div 中，或修改组件添加 id prop。

- [ ] **Step 4: 验证**

点击导航链接确认跳转到对应区块

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: add navigation bar with smooth scroll"
```

---

## Task 14: 最终验证

- [ ] **Step 1: 完整流程测试**

```bash
npm run dev
```

测试清单：
1. 首页 Hero 显示（有/无视频两种情况）
2. 视频网格显示，分类筛选正常
3. 点击视频弹出 Modal，ESC 关闭
4. 登录页正常，admin/admin 可登录
5. Dashboard 显示视频列表
6. 添加视频 → 列表更新
7. 编辑视频 → 数据回填
8. 删除视频 → 列表更新
9. Hero 视频上传成功
10. 联系区块显示邮箱和社交链接

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

确认无构建错误

- [ ] **Step 3: 最终提交**

```bash
git add .
git commit -m "feat: complete video portfolio website"
```
