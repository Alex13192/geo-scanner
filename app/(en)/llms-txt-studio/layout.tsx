import type { Metadata } from "next";
import { BRAND } from "@/lib/site";

import { og } from "@/lib/og";

const TITLE = "llms.txt Generator — Free AI Context File Builder";
/**
 * Kept inside 160 characters on purpose: the scanner's own `description` check
 * rejects anything outside 50-160, and the previous wording was 164 - four
 * characters over a rule this site publishes.
 */
const DESCRIPTION =
  "Generate a standardized /llms.txt context file so ChatGPT, Claude and Perplexity can digest your content cleanly. Free, no signup required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/llms-txt-studio/",
  },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/llms-txt-studio/",
  }),
};

export default function LlmsTxtStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
