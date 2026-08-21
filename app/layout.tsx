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
      <body className={styles.body}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
