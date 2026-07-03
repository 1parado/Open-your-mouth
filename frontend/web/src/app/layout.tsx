import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Oral Teacher - 智能口语练习",
  description: "AI驱动的英语口语练习平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={plusJakartaSans.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
