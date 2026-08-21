import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import styles from "./layout.module.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,500&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className={styles.body}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
