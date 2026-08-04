import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Starfield from "@/components/Starfield";
import ServiceWorker from "@/components/ServiceWorker";
import ReadingPrefsBoot from "@/components/ReadingPrefsBoot";
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
  appleWebApp: {
    capable: true,
    title: "Bedtime Tales",
    // The status bar is drawn over the page so the night sky runs under it.
    statusBarStyle: "black-translucent",
  },
};

/**
 * `viewport` is a server-component export, which is why it lives here and not
 * in any of the "use client" pages.
 *
 * `viewportFit: "cover"` lets the starfield run under the notch and the home
 * indicator; `.page-shell` in globals.css puts the content back inside them
 * with `env(safe-area-inset-*)`.
 *
 * `maximumScale`/`userScalable` are deliberately left alone. Locking zoom is a
 * common thing to do to make an app "feel native" and it takes pinch-to-zoom
 * away from anyone who needs it — which, for a page of prose read in the dark,
 * is exactly the wrong trade. The A−/A+ control is an addition to that, not a
 * replacement for it.
 */
export const viewport: Viewport = {
  themeColor: "#0b1026",
  colorScheme: "dark",
  viewportFit: "cover",
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
        <ReadingPrefsBoot />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
