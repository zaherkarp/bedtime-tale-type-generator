import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Starfield from "@/components/Starfield";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bedtime Tale Generator",
  description:
    "Pick a tale type, add a hero, and drift off to a custom bedtime story that always ends in sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Starfield />
        {children}
      </body>
    </html>
  );
}
