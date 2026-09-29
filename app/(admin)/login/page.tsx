"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <main data-admin-theme className="grid min-h-screen place-items-center bg-admin-canvas px-4 text-admin-fg">
      <form
        onSubmit={handleSubmit}
        aria-labelledby="login-title"
        className="w-full max-w-[22.5rem] space-y-4 rounded-lg border border-admin-line bg-admin-panel p-6"
      >
        <div className="space-y-1.5 pb-2">
          <p className="font-pixel text-2xl leading-none text-white">nonacola3</p>
          <h1 id="login-title" className="text-xs text-admin-fg-3">管理后台登录</h1>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-xs text-admin-fg-2">用户名</Label>
          <Input
            id="username"
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs text-admin-fg-2">密码</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9"
          />
        </div>
        {error ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-admin-danger">
            <CircleAlert aria-hidden="true" className="size-3.5" />
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-9 w-full" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </Button>
      </form>
    </main>
  );
}
