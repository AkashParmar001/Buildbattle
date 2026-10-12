import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsightFlow — Customer feedback intelligence",
  description:
    "Turn raw customer feedback into insights, priorities, and decisions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body
        className={`${inter.variable} ${geistMono.variable} min-h-full font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
