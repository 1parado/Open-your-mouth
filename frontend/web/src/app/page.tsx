import Link from "next/link";
import { AudioLines, ChevronRight, MessageCircleMore, UserRound, Waves } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppHeader } from "@/components/app/app-header";

export default function Home() {
  return (
    <AuthGuard>
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16 md:px-10">
        <AppHeader />

        <section className="app-surface rounded-[1.75rem] p-7 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                today
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                先开口，再复盘。
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                从助教、发音、语音工具和个人中心里，直接进入今天需要的一步。
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5">
              <p className="text-sm font-medium text-slate-700">推荐顺序</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="soft-pill">助教</span>
                <span className="soft-pill">发音</span>
                <span className="soft-pill">记录</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={<MessageCircleMore className="h-5 w-5" />}
            title="口语助教"
            description="生成继续表达"
            href="/coach"
          />
          <FeatureCard
            icon={<Waves className="h-5 w-5" />}
            title="发音练习"
            description="一句英文快速评分"
            href="/practice"
          />
          <FeatureCard
            icon={<AudioLines className="h-5 w-5" />}
            title="语音工具"
            description="转写与播报"
            href="/tools"
          />
          <FeatureCard
            icon={<UserRound className="h-5 w-5" />}
            title="个人中心"
            description="资料与记录"
            href="/history"
          />
        </section>
      </main>
    </AuthGuard>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="module-card group rounded-[1.5rem] px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between">
        <span className="soft-pill bg-[rgba(var(--accent-soft-rgb),0.72)] text-slate-700">
          {icon}
          模块
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
