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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://informantwire.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      "Informant Wire | Entertainment News",
    template:
      "%s | Informant Wire",
  },

  description:
    "Independent entertainment news covering film, television, streaming, music, gaming, celebrity, awards, industry and culture.",

  applicationName:
    "Informant Wire",

  alternates: {
    types: {
      "application/rss+xml":
        `${siteUrl}/feed.xml`,
    },
  },

  openGraph: {
    type: "website",
    siteName: "Informant Wire",
    title:
      "Informant Wire | Entertainment News",
    description:
      "Independent entertainment news covering film, television, streaming, music, gaming, celebrity, awards, industry and culture.",
    url: siteUrl,
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Informant Wire | Entertainment News",
    description:
      "Independent entertainment news covering film, television, streaming, music, gaming, celebrity, awards, industry and culture.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
