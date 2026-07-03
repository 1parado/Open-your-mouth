"use client";

import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/app-header";
import { AuthGuard } from "@/components/auth/auth-guard";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8090";

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

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<"transcription" | "speech">(
    "transcription"
  );
  const [transcriptionFile, setTranscriptionFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>("");
  const [speechText, setSpeechText] = useState(
    "Hello, welcome to your English speaking practice."
  );
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleTranscription() {
    if (!transcriptionFile) {
      setError("请先选择一段音频文件。");
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", transcriptionFile);
      formData.append("model", "whisper-1");

      const response = await axios.post(
        `${GATEWAY_URL}/v1/audio/transcriptions`,
        formData
      );

      setTranscriptionResult(JSON.stringify(response.data, null, 2));
      setMessage("转写已完成。");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSpeech() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        `${GATEWAY_URL}/v1/audio/speech`,
        {
          model: "tts-1",
          voice: "alloy",
          input: speechText,
          format: "mp3",
        },
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
      setMessage("语音已生成。");
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
            <AudioLines className="h-4 w-4" />
            语音
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">语音工具</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
            用于转写和播报。
          </p>
        </section>

        <section className="app-surface mt-10 rounded-[1.5rem] p-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("transcription")}
              className={`rounded-md px-4 py-2 text-sm transition ${
                activeTab === "transcription"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              语音转写
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("speech")}
              className={`rounded-md px-4 py-2 text-sm transition ${
                activeTab === "speech"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              文本播报
            </button>
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

          {activeTab === "transcription" ? (
            <div className="mt-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  选择音频文件
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(event) =>
                    setTranscriptionFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-slate-600"
                />
              </label>
              <div className="mt-5">
                <Button
                  type="button"
                  onClick={handleTranscription}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "处理中..." : "开始转写"}
                </Button>
              </div>

              {transcriptionResult ? (
                <pre className="mt-5 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
                  {transcriptionResult}
                </pre>
              ) : (
                <p className="mt-5 text-sm leading-7 text-slate-500">
                  结果会显示在这里。
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  需要播报的文本
                </span>
                <textarea
                  value={speechText}
                  onChange={(event) => setSpeechText(event.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <div className="mt-5">
                <Button
                  type="button"
                  onClick={handleSpeech}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "生成中..." : "生成语音"}
                </Button>
              </div>

              {audioUrl ? (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/mpeg" />
                  </audio>
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-slate-500">
                  生成后可直接播放。
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
