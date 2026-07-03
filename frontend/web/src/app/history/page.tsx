"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/app-header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { readPracticeHistory, type PracticeHistoryItem } from "@/lib/practice-history";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";

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

function mapUser(user: User): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? null,
    createdAt: user.createdAt,
    avatar: user.avatar,
  };
}

export default function HistoryPage() {
  const { user, token, logout } = useAuth();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverUser, setServerUser] = useState<User | null>(null);
  const [historyItems, setHistoryItems] = useState<PracticeHistoryItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setHistoryItems(readPracticeHistory());
  }, []);

  async function handleRefreshProfile() {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.get<User>(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/auth/me`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        }
      );

      const nextUser = mapUser(response.data);
      setServerUser(nextUser);

      if (token) {
        setAuth(nextUser, token);
      }

      setMessage("资料已更新。");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthGuard>
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 md:px-10">
        <AppHeader />

        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← 返回工作台
          </Link>
        </div>

        <section className="app-surface rounded-[1.75rem] p-7 shadow-sm">
          <div className="soft-pill bg-[rgba(var(--accent-soft-rgb),0.72)] text-slate-700">
            <UserRound className="h-4 w-4" />
            账户
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">个人中心</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
            查看资料和最近记录。
          </p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="app-surface rounded-[1.5rem] p-6">
            <h2 className="text-xl font-semibold text-slate-900">账号资料</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-slate-400">显示名称</p>
                <p className="mt-1 text-base font-medium text-slate-900">
                  {user?.displayName || "未设置"}
                </p>
              </div>
              <div>
                <p className="text-slate-400">邮箱</p>
                <p className="mt-1 text-base font-medium text-slate-900">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-slate-400">创建时间</p>
                <p className="mt-1 text-base font-medium text-slate-900">
                  {user?.createdAt ? formatDate(user.createdAt) : "未知"}
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleRefreshProfile}
                disabled={isLoading}
              >
                {isLoading ? "更新中..." : "刷新资料"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={logout}
              >
                退出登录
              </Button>
            </div>

            {serverUser ? (
              <pre className="mt-5 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
                {JSON.stringify(serverUser, null, 2)}
              </pre>
            ) : null}
          </div>

          <div className="app-surface rounded-[1.5rem] p-6">
            <h2 className="text-xl font-semibold text-slate-900">最近练习</h2>
            {historyItems.length > 0 ? (
              <div className="mt-5 space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.referenceText}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(item.createdAt)} · {item.language}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {item.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-slate-500">
                还没有记录。
                </p>
              )}
            </div>
        </section>
      </main>
    </AuthGuard>
  );
}
