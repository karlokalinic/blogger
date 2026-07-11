import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://karlolegendblog.vercel.app"),
  title: {
    default: "VEO ZAVOD — Development Archive",
    template: "%s — VEO ZAVOD",
  },
  description:
    "A living game-development journal, world archive and production signal from Prudina.",
  openGraph: {
    title: "VEO ZAVOD — Development Archive",
    description: "The town changes when the build does.",
    images: [{ url: "/images/prudina-bus-stop.png", width: 1915, height: 829 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/prudina-bus-stop.png"],
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0d0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
