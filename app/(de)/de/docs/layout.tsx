import type { Metadata } from "next";

const TITLE = "GEO-Leitf\u00e4den: robots.txt, llms.txt und KI-Crawler";
const DESCRIPTION =
  "Technische Anleitungen zu Generative Engine Optimization auf Deutsch: KI-Crawler in robots.txt erlauben oder blockieren, llms.txt korrekt erstellen und einbinden, Inhalte f\u00fcr Zitate in KI-Antworten strukturieren.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/de/docs/",
    languages: {
      en: "/docs/",
      de: "/de/docs/",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/de/docs/",
    type: "article",
  },
};

export default function GermanDocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
