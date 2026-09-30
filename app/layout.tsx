import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Readiness Scanner - Free AI Search & llms.txt Audit Tool",
  description: "Instantly audit ChatGPT & Perplexity access, detect crawler blocks, and generate your site's llms.txt in seconds.",
  openGraph: {
    title: "GEO Readiness Scanner - Is Your Site Ready for AI Search?",
    description: "Audit AI search access and generate llms.txt dynamically.",
    url: "https://geo-scanner.ccie13192.com",
    siteName: "GEO Readiness Scanner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEO Readiness Scanner",
    description: "Audit ChatGPT & Perplexity access and generate your llms.txt in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}