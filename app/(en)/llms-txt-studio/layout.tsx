import type { Metadata } from "next";

const TITLE = "llms.txt Generator — Free AI Context File Builder";
const DESCRIPTION =
  "Generate a standardized /llms.txt markdown context file for your domain so ChatGPT, Claude and Perplexity can digest your content cleanly. Free, no signup required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/llms-txt-studio/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/llms-txt-studio/",
  },
};

export default function LlmsTxtStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
