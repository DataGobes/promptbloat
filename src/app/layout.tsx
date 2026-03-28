import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "PromptBloat — Your prompts are fat",
  description: "Free tool to analyze your LLM prompt efficiency. Paste your prompt, get a bloat score. 100% client-side.",
  metadataBase: new URL("https://promptbloat.com"),
  openGraph: {
    title: "PromptBloat — Your prompts are fat",
    description: "Free tool to analyze your LLM prompt efficiency. How bloated is your system prompt?",
    type: "website",
    url: "https://promptbloat.com",
    siteName: "PromptBloat",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptBloat — Your prompts are fat",
    description: "Free tool to analyze your LLM prompt efficiency.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} bg-[#0a0a0a] text-gray-200 antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
