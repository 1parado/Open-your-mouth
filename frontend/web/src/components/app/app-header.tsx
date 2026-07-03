"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AudioLines, LayoutGrid, MessageCircleMore, UserRound, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/", label: "工作台", icon: LayoutGrid },
  { href: "/coach", label: "助教", icon: MessageCircleMore },
  { href: "/practice", label: "发音", icon: Waves },
  { href: "/tools", label: "语音", icon: AudioLines },
  { href: "/history", label: "我的", icon: UserRound },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="app-surface mb-8 flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          AI Oral Teacher
        </p>
        <h1 className="mt-1.5 text-xl font-semibold text-slate-900">
          {user?.displayName || "欢迎回来"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          你的口语空间
        </p>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="hidden md:inline">{user?.email}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            退出登录
          </Button>
        </div>
      </div>
    </header>
  );
}
