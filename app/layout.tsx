import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";

const theme = createTheme({
    primaryColor: "violet",
    fontFamily: "'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    defaultRadius: "lg",
    colors: {
        dark: [
            "#C1C2C5",
            "#A6A7AB",
            "#909296",
            "#5c5f66",
            "#373A40",
            "#2C2E33",
            "#25262b",
            "#1A1B1E",
            "#141517",
            "#101113",
        ],
    },
    headings: {
        fontFamily: "'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
});

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
        <html lang="ko" {...mantineHtmlProps}>
            <head>
                <ColorSchemeScript defaultColorScheme="dark" />
                <link
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
                    rel="stylesheet"
                />
            </head>
            <body>
                <MantineProvider theme={theme} defaultColorScheme="dark">
                    {children}
                </MantineProvider>
            </body>
        </html>
    );
}
