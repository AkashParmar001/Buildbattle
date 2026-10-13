import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";
import { CustomCursor } from "@/components/custom-cursor";
import { Preloader } from "@/components/preloader";
import { SmoothScroll } from "@/components/smooth-scroll";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsightFlow — Customer feedback intelligence",
  description:
    "Turn raw customer feedback into insights, priorities, and decisions. 7,000 reports → 320 unique texts → 10 named themes → one ranked queue of what to fix first.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "InsightFlow — Customer feedback intelligence",
    description:
      "Every review, grouped into named themes and ranked by what to fix first — with the evidence attached.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InsightFlow — Customer feedback intelligence",
    description:
      "Every review, grouped into named themes and ranked by what to fix first — with the evidence attached.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDE9E0" },
    { media: "(prefers-color-scheme: dark)", color: "#161614" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body
        className={`${instrumentSerif.variable} ${interTight.variable} ${jetbrainsMono.variable} min-h-full font-sans`}
      >
        <Providers>
          <SmoothScroll>
            <Preloader />
            <CustomCursor />
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
