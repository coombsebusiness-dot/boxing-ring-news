import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AdcashAutoTag from "@/components/AdcashAutoTag";

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
  "https://boxingringnews.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      "Boxing Ring News | Boxing News, Fights & Results",
    template:
      "%s | Boxing Ring News",
  },

  description:
    "Independent boxing news covering fights, fighters, results, championships, promoters, rankings and the business of boxing.",

  applicationName:
    "Boxing Ring News",

  alternates: {
    canonical:
      siteUrl,

    types: {
      "application/rss+xml":
        `${siteUrl}/feed.xml`,
    },
  },

  openGraph: {
    type: "website",
    siteName: "Boxing Ring News",
    title:
      "Boxing Ring News | Boxing News, Fights & Results",
    description:
      "Independent boxing news covering fights, fighters, results, championships, promoters, rankings and the business of boxing.",
    url: siteUrl,
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Boxing Ring News | Boxing News, Fights & Results",
    description:
      "Independent boxing news covering fights, fighters, results, championships, promoters, rankings and the business of boxing.",
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
      <body className="min-h-full flex flex-col">
        {children}

        <AdcashAutoTag />
      </body>
    </html>
  );
}
