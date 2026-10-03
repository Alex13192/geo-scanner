import type { Metadata } from "next";

import { og } from "@/lib/og";

const TITLE = "GEO Guides: llms.txt, JSON-LD and AI Crawler Access";
const DESCRIPTION =
  "Step-by-step guides to deploying /llms.txt, writing Q&A headings for AI citation, adding Schema.org JSON-LD, and unblocking AI crawlers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/docs/",
  },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/docs/",
  }),
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
