import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Crime Mania",
    template: "%s · Crime Mania",
  },
  description:
    "Histórias verdadeiras para maníacos de true crime — investigação, curiosidade e jornalismo pop sofisticado.",
  metadataBase: new URL("https://www.crimemania.com.br"),
};

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
