import type { Metadata } from "next";

const TITLE = "GEO Guides: llms.txt, Schema.org JSON-LD and AI Crawler Access";
const DESCRIPTION =
  "Step-by-step technical guides for Generative Engine Optimization: deploying /llms.txt, writing Q&A headings for direct AI citation, adding Schema.org JSON-LD for entity disambiguation, and configuring robots.txt and WAF rules for GPTBot and PerplexityBot.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/docs/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/docs/",
    type: "article",
  },
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
