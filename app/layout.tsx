import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Burnout Buddy AI | 2030 직장인을 위한 마음챙김",
    description: "AI 음성 에이전트와 함께하는 실시간 스트레스 케어 & 명상 가이드",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
