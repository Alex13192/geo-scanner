import type { Metadata } from "next";

/**
 * Scan result pages are generated per request from a ?domain= parameter.
 * They are thin, user-specific and would create near-infinite duplicate URLs,
 * so this route is explicitly excluded from indexing.
 * (Also disallowed in public/robots.txt - belt and braces.)
 */
export const metadata: Metadata = {
  title: "GEO Audit Report",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
