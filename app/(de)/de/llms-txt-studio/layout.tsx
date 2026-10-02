import type { Metadata } from "next";

const TITLE = "llms.txt-Generator \u2014 kostenloser KI-Kontextdatei-Ersteller";
const DESCRIPTION =
  "Erzeugt eine llms.txt aus Ihrer echten Startseite: Titel, Beschreibung und interne Links werden gelesen und zu einem Entwurf zusammengesetzt. Kostenlos, ohne Anmeldung.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/de/llms-txt-studio/",
    languages: {
      en: "/llms-txt-studio/",
      de: "/de/llms-txt-studio/",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/de/llms-txt-studio/",
  },
};

export default function GermanStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
