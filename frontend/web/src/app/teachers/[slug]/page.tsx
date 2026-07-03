"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  MessageCircleMore,
  Mic,
  MicOff,
  Play,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/app-header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { getTeacherBySlug, type TeacherProfile } from "@/lib/teachers";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8090";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
}

interface ConversationTurn {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: null | (() => void);
  onerror: null | (() => void);
  onresult: null | ((event: SpeechRecognitionEventLike) => void);
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

function createTurn(role: ConversationTurn["role"], content: string): ConversationTurn {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return { id, role, content };
}

function buildSystemPrompt(teacher: TeacherProfile): string {
  return `${teacher.personaPrompt}

Conversation rules:
- The learner is practicing spoken English.
- Keep the exchange natural and voice-friendly.
- Prefer follow-up questions that make the learner continue.
- When the learner makes a mistake, give concise feedback instead of a long explanation.
- Stay consistent with the teacher's persona and tone.`;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.message ??
      "老师暂时没有回应，请稍后再试"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "老师暂时没有回应，请稍后再试";
}

export default function TeacherConversationPage({
  params,
}: {
  params: { slug: string };
}) {
  const teacher = getTeacherBySlug(params.slug);
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioText, setAudioText] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("先让老师开场，或者直接开始说话。");
  const [isListening, setIsListening] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesRef = useRef<ConversationTurn[]>([]);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!teacher) {
    return (
      <AuthGuard>
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-16 md:px-10">
          <AppHeader />
          <section className="app-surface rounded-[1.75rem] p-8 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">老师不存在</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              当前没有找到这个老师配置，请返回首页重新选择。
            </p>
            <div className="mt-6">
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
                ← 返回老师首页
              </Link>
            </div>
          </section>
        </main>
      </AuthGuard>
    );
  }

  const teacherProfile = teacher;

  async function requestTeacherReply(history: ConversationTurn[]): Promise<string> {
    const response = await axios.post<ChatCompletionResponse>(
      `${GATEWAY_URL}/v1/chat/completions`,
      {
        model: teacherProfile.chatModel,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(teacherProfile),
          },
          ...history.map((item) => ({
            role: item.role,
            content: item.content,
          })),
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices?.[0]?.message?.content?.trim() || "";
  }

  function stopCurrentAudio() {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
  }

  async function speakTeacherReply(text: string) {
    stopCurrentAudio();
    setStatus("老师正在说话...");

    const response = await axios.post(
      `${GATEWAY_URL}/v1/audio/speech`,
      {
        model: teacherProfile.ttsModel,
        voice: teacherProfile.voice,
        input: text,
        format: "mp3",
      },
      {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const nextUrl = URL.createObjectURL(response.data);
    setAudioUrl(nextUrl);
    setAudioText(text);

    const player = new Audio(nextUrl);
    audioPlayerRef.current = player;
    player.onended = () => {
      if (audioPlayerRef.current === player) {
        audioPlayerRef.current = null;
      }
      setStatus("轮到你说了。");
    };

    try {
      await player.play();
    } catch {
      setStatus("老师回复已生成，可以手动点击播放器播放。");
    }
  }

  async function handleAssistantTurn(text: string) {
    const assistantTurn = createTurn("assistant", text);
    const nextHistory = [...messagesRef.current, assistantTurn];
    setMessages(nextHistory);
    messagesRef.current = nextHistory;
    await speakTeacherReply(text);
  }

  async function handleUserTurn(content: string) {
    const cleanContent = content.trim();
    if (!cleanContent || isReplying) {
      return;
    }

    setError("");
    setStatus("老师正在思考...");
    setIsReplying(true);

    const userTurn = createTurn("user", cleanContent);
    const nextHistory = [...messagesRef.current, userTurn];
    setMessages(nextHistory);
    messagesRef.current = nextHistory;

    try {
      const reply = await requestTeacherReply(nextHistory);
      const assistantReply =
        reply || "I heard you. Try saying that one more time with a little more detail.";
      await handleAssistantTurn(assistantReply);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setStatus("这次没有成功，可以再试一次。");
    } finally {
      setIsReplying(false);
    }
  }

  async function handleTeacherOpening() {
    if (messagesRef.current.length > 0 || isReplying) {
      return;
    }

    setError("");
    setStatus("老师正在开场...");
    setIsReplying(true);

    try {
      await handleAssistantTurn(teacherProfile.welcomeMessage);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setStatus("老师开场失败，可以稍后重试。");
    } finally {
      setIsReplying(false);
    }
  }

  function handleStartListening() {
    if (!speechSupported) {
      setError("当前浏览器不支持语音识别，请改用文字输入。");
      return;
    }

    if (isListening || isReplying) {
      return;
    }

    setError("");
    setLiveTranscript("");
    setStatus("正在听你说话...");
    stopCurrentAudio();

    const RecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      setError("当前浏览器不支持语音识别，请改用文字输入。");
      return;
    }

    const recognition = new RecognitionConstructor();
    recognitionRef.current = recognition;
    recognition.lang = teacherProfile.language;
    recognition.interimResults = true;
    recognition.continuous = false;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += transcript;
        }
      }

      setLiveTranscript(`${finalTranscript}${interimTranscript}`.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
      setStatus("语音识别失败，可以再试一次或改用文字输入。");
      setError("没有成功识别到语音，请检查麦克风权限。");
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;

      const transcript = finalTranscript.trim();
      if (transcript) {
        setLiveTranscript("");
        void handleUserTurn(transcript);
      } else {
        setStatus("没有收到清晰语音，可以再试一次。");
      }
    };

    setIsListening(true);
    recognition.start();
  }

  function handleStopListening() {
    recognitionRef.current?.stop();
    setStatus("已停止收听。");
  }

  async function handleManualSubmit() {
    const text = manualInput.trim();
    if (!text) {
      return;
    }

    setManualInput("");
    await handleUserTurn(text);
  }

  return (
    <AuthGuard>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 md:px-10">
        <AppHeader />

        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← 返回老师首页
          </Link>
        </div>

        <section className="app-surface rounded-[1.9rem] overflow-hidden">
          <div className={`grid gap-0 lg:grid-cols-[0.95fr_1.05fr]`}>
            <div className={`bg-gradient-to-br ${teacherProfile.heroGradient}`}>
              <div className="aspect-[4/5] h-full min-h-[420px] overflow-hidden bg-slate-100">
                <img
                  src={teacherProfile.imageSrc}
                  alt={teacherProfile.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {teacherProfile.portraitLabel}
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">
                {teacherProfile.name}
              </h1>
              <p className="mt-3 text-lg text-slate-700">{teacherProfile.title}</p>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                {teacherProfile.summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="soft-pill">{teacherProfile.teachingStyle}</span>
                <span className="soft-pill">{teacherProfile.correctionStyle}</span>
                <span className="soft-pill">voice: {teacherProfile.voice}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="h-4 w-4" />
                当前状态：{status}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={handleTeacherOpening} disabled={isReplying}>
                  <Play className="mr-2 h-4 w-4" />
                  让老师先开场
                </Button>
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={isListening ? handleStopListening : handleStartListening}
                  disabled={isReplying}
                >
                  {isListening ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      停止说话
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      开始语音对话
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-700">开口提示</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {teacherProfile.starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setManualInput(prompt)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="app-surface rounded-[1.7rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">对话记录</h2>
              <span className="text-sm text-slate-500">
                {messages.length === 0 ? "还没开始" : `${messages.length} 条消息`}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-[1.35rem] px-4 py-4 text-sm leading-7 ${
                      message.role === "assistant"
                        ? "bg-slate-50 text-slate-700"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    <p className="mb-2 text-xs uppercase tracking-[0.14em] opacity-70">
                      {message.role === "assistant" ? teacherProfile.name : "You"}
                    </p>
                    <p>{message.content}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-slate-200 px-4 py-6 text-sm leading-7 text-slate-500">
                  点击“让老师先开场”后，这里会显示完整的对话记录。
                </div>
              )}

              {liveTranscript ? (
                <div className="rounded-[1.35rem] border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-7 text-sky-800">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-sky-500">
                    Listening
                  </p>
                  <p>{liveTranscript}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="app-surface rounded-[1.7rem] p-6">
              <div className="flex items-center gap-2">
                <MessageCircleMore className="h-4 w-4 text-slate-500" />
                <h2 className="text-xl font-semibold text-slate-900">文字输入兜底</h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                如果当前浏览器不支持语音识别，或者你想先测试回复逻辑，可以直接用文字输入。
              </p>

              <textarea
                value={manualInput}
                onChange={(event) => setManualInput(event.target.value)}
                rows={6}
                className="mt-5 w-full rounded-[1.1rem] border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="Type your message in English..."
              />

              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">
                  语音识别支持：{speechSupported ? "当前浏览器可用" : "当前浏览器不可用"}
                </span>
                <Button type="button" onClick={handleManualSubmit} disabled={isReplying}>
                  发送给老师
                </Button>
              </div>
            </div>

            <div className="app-surface rounded-[1.7rem] p-6">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-slate-500" />
                <h2 className="text-xl font-semibold text-slate-900">老师语音回放</h2>
              </div>

              {audioUrl ? (
                <div className="mt-5 rounded-[1.2rem] bg-slate-50 p-4">
                  <audio controls className="w-full" src={audioUrl} />
                  <p className="mt-3 text-sm leading-7 text-slate-600">{audioText}</p>
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-slate-500">
                  老师回复后，这里会保留最近一次语音，方便你反复听和模仿。
                </p>
              )}
            </div>

            {error ? (
              <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
