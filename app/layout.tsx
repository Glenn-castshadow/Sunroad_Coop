import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import NavBar from "@/app/components/NavBar";

export const metadata: Metadata = {
  title: "Sunroad Co-op Manager",
  description: "Co-op fund management — Pilot: Kia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex flex-col bg-[#18191f]" style={{ height: "100dvh" }}>
        <NavBar />
        <main className="flex-1 min-h-0 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
