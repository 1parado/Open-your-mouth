"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { AudioLines, MessageCircleMore, UserRound, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthResponse, User } from "@/types";

type AuthMode = "login" | "register";

interface AuthFormState {
  email: string;
  password: string;
  displayName: string;
}

function mapUser(user: User): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? null,
    createdAt: user.createdAt,
    avatar: user.avatar,
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.message ??
      "请求失败，请稍后再试"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后再试";
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthFormState>({
    email: "",
    password: "",
    displayName: "",
  });
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const endpoint =
        mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";

      const payload =
        mode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : {
              email: form.email,
              password: form.password,
              displayName: form.displayName,
            };

      const response = await apiClient.post<AuthResponse>(endpoint, payload);
      const auth = response.data;

      setAuth(mapUser(auth.user), auth.access_token);
      setMessage(mode === "login" ? "欢迎回来。" : "账号创建成功，欢迎开始练习。");
      router.push("/");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 md:px-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← 返回首页
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="app-surface">
          <CardHeader>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  mode === "login"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  mode === "register"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                注册
              </button>
            </div>
            <CardTitle>{mode === "login" ? "登录" : "注册"}</CardTitle>
            <CardDescription>开始今天的练习。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">邮箱</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
                  placeholder="test@example.com"
                  required
                />
              </label>

              {mode === "register" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">显示名称</span>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
                    placeholder="Test User"
                    required
                  />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">密码</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
                  placeholder="password123"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? "提交中..."
                  : mode === "login"
                    ? "登录"
                    : "注册并进入产品"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="app-surface">
          <CardHeader>
            <CardTitle>包含模块</CardTitle>
            <CardDescription>登录后可直接进入。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <MessageCircleMore className="h-4 w-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">口语助教</p>
                <p className="mt-1 leading-6 text-slate-600">生成自然回复</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <Waves className="h-4 w-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">发音练习</p>
                <p className="mt-1 leading-6 text-slate-600">一句英文快速评分</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <AudioLines className="h-4 w-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">语音工具</p>
                <p className="mt-1 leading-6 text-slate-600">转写与播报</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <UserRound className="h-4 w-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">个人中心</p>
                <p className="mt-1 leading-6 text-slate-600">资料与记录</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
