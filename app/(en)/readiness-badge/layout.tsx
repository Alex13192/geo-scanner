import type { Metadata } from "next";
import { BRAND } from "@/lib/site";

import { og } from "@/lib/og";

const TITLE = "GEO Readiness Badge for GitHub READMEs and Websites";
/**
 * Kept inside 160 characters on purpose. The scanner's own `description` check
 * rejects anything outside 50-160, and the previous wording was 190 - thirty
 * characters over a rule this site publishes and scores other people against.
 */
const DESCRIPTION =
  "Embed a GEO readiness badge showing how well AI search engines can read, parse and cite your site. Markdown and HTML snippets for READMEs and footers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/readiness-badge/",
  },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/readiness-badge/",
  }),
};

export default function ReadinessBadgeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
