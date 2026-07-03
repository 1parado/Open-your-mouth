"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Sparkles, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/app-header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { appendPracticeHistory, readPracticeHistory, type PracticeHistoryItem } from "@/lib/practice-history";
import { formatDate } from "@/lib/utils";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8090";

interface PronunciationResult {
  id: string;
  object: string;
  model: string;
  language: string;
  reference_text?: string;
  scores: {
    accuracy: number;
    fluency: number;
    completeness: number;
    prosody: number;
    naturalness: number;
    overall: number;
  };
  issues: unknown[];
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.message ??
      "服务暂时不可用，请稍后再试"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "服务暂时不可用，请稍后再试";
}

export default function PracticePage() {
  const [referenceText, setReferenceText] = useState(
    "Hello world, I would like to practice my English speaking."
  );
  const [language, setLanguage] = useState("en-US");
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [historyItems, setHistoryItems] = useState<PracticeHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setHistoryItems(readPracticeHistory());
  }, []);

  const scoreCards = useMemo(() => {
    if (!result) {
      return [];
    }

    return [
      { label: "综合评分", value: result.scores.overall },
      { label: "准确度", value: result.scores.accuracy },
      { label: "流利度", value: result.scores.fluency },
      { label: "完整度", value: result.scores.completeness },
      { label: "韵律", value: result.scores.prosody },
      { label: "自然度", value: result.scores.naturalness },
    ];
  }, [result]);

  async function handlePronunciationAssess() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post<PronunciationResult>(
        `${GATEWAY_URL}/v1/pronunciation/assessments`,
        {
          reference_text: referenceText,
          language,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const nextResult = response.data;
      setResult(nextResult);
      setMessage("本次发音练习已完成。");

      const historyItem: PracticeHistoryItem = {
        id: nextResult.id,
        createdAt: new Date().toISOString(),
        referenceText,
        language,
        score: nextResult.scores.overall,
        accuracy: nextResult.scores.accuracy,
        fluency: nextResult.scores.fluency,
        completeness: nextResult.scores.completeness,
        prosody: nextResult.scores.prosody,
        naturalness: nextResult.scores.naturalness,
      };

      appendPracticeHistory(historyItem);
      setHistoryItems(readPracticeHistory());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
            <Waves className="h-4 w-4" />
            发音
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">发音练习</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
            输入一句英文，立即评分。
          </p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="app-surface rounded-[1.5rem] p-6">
            <h2 className="text-xl font-semibold text-slate-900">输入句子</h2>

            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">练习句子</span>
                <textarea
                  value={referenceText}
                  onChange={(event) => setReferenceText(event.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">语言</span>
                <input
                  type="text"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
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

            <div className="mt-6">
              <Button
                type="button"
                onClick={handlePronunciationAssess}
                disabled={isSubmitting}
              >
                {isSubmitting ? "评分中..." : "开始评分"}
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="app-surface rounded-[1.5rem] p-6">
              <h2 className="text-xl font-semibold text-slate-900">本次结果</h2>
              {result ? (
                <div className="mt-5 grid grid-cols-2 gap-4">
                  {scoreCards.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-3 text-sm leading-7 text-slate-500">
                  <Sparkles className="h-4 w-4" />
                  完成后显示评分。
                </div>
              )}
            </div>

            <div className="app-surface rounded-[1.5rem] p-6">
              <h2 className="text-xl font-semibold text-slate-900">最近练习</h2>
              {historyItems.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {historyItems.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-900">
                          {item.referenceText}
                        </p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                          {item.score}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDate(item.createdAt)} · {item.language}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  还没有记录。
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
