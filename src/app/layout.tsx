import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${openSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
