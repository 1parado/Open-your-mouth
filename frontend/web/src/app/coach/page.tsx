"use client";

import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { MessageCircleMore, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/app-header";
import { AuthGuard } from "@/components/auth/auth-guard";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8090";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.message ??
      "当前暂时无法生成回复，请稍后再试"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "当前暂时无法生成回复，请稍后再试";
}

export default function CoachPage() {
  const [scenario, setScenario] = useState("自我介绍");
  const [userInput, setUserInput] = useState(
    "Please help me practice a short self introduction for an interview."
  );
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGenerateReply() {
    setIsSubmitting(true);
    setError("");

    try {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content:
            "You are a concise English speaking coach. Reply in natural English, keep the conversation moving, and help the learner continue speaking.",
        },
        {
          role: "user",
          content: `Scene: ${scenario}\n\nLearner says: ${userInput}`,
        },
      ];

      const response = await axios.post<ChatCompletionResponse>(
        `${GATEWAY_URL}/v1/chat/completions`,
        {
          model: "gpt-4o-mini",
          messages,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const content =
        response.data.choices?.[0]?.message?.content?.trim() || "";

      setReply(content || "本次没有返回可展示的回复。");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setReply("");
    } finally {
      setIsSubmitting(false);
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
            <MessageCircleMore className="h-4 w-4" />
            对话
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">口语助教</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
            给一个场景，生成一句更自然的继续表达。
          </p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="app-surface rounded-[1.5rem] p-6">
            <h2 className="text-xl font-semibold text-slate-900">输入内容</h2>

            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">场景</span>
                <input
                  type="text"
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">你的表达</span>
                <textarea
                  value={userInput}
                  onChange={(event) => setUserInput(event.target.value)}
                  rows={7}
                  className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6">
              <Button
                type="button"
                onClick={handleGenerateReply}
                disabled={isSubmitting}
              >
                {isSubmitting ? "生成中..." : "生成教练回复"}
              </Button>
            </div>
          </div>

          <div className="app-surface rounded-[1.5rem] p-6">
            <h2 className="text-xl font-semibold text-slate-900">建议回复</h2>
            {reply ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {reply}
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                <Sparkles className="h-4 w-4" />
                生成后显示在这里。
              </div>
            )}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
