import type { Metadata } from "next";

const TITLE = "GEO Readiness Badge for GitHub READMEs and Websites";
const DESCRIPTION =
  "Generate an embeddable GEO readiness badge showing how well AI search engines can crawl, parse and cite your site. Markdown and HTML snippets for GitHub READMEs and site footers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/readiness-badge/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/readiness-badge/",
  },
};

export default function ReadinessBadgeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
