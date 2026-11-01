import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/pwa";

// Brand type: IBM Plex Sans Arabic for Arabic, IBM Plex Sans for Latin text,
// Fraunces (a warm, sturdy display serif) for English headlines.
const sans = IBM_Plex_Sans({
  variable: "--font-ws-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ws-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-ws-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-ws-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "WebSide",
  appleWebApp: { capable: true, title: "WebSide", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  title: {
    default: "WebSide — Your web. Your side.",
    template: "%s · WebSide",
  },
  description:
    "WebSide is a calm, precise way to build a website: design it, preview it, save it, and submit it for review.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#b5482a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${arabic.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a href="#main" className="ws-skip">
          Skip to content
        </a>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
