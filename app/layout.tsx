import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import styles from "./layout.module.css";

// Display serif for headings, dates, and titles — the "ledger" voice.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

// Body/UI sans — labels, inputs, buttons.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Monospace for times, uppercase micro-labels — the ledger-book feel.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Minimal Calendar",
  description: "A clean, shared agenda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} ${styles.body}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
