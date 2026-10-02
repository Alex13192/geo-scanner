import type { Metadata } from "next";
import "../globals.css";

/**
 * German root layout.
 *
 * This exists as a separate root layout because Next.js allows only one
 * component to render <html>, and the German pages must declare lang="de".
 * Route groups are invisible in the URL, so /de/... is served from here while
 * the English site is untouched at the root.
 *
 * NOTE: this comment is deliberately ASCII-safe. Windows tooling in this
 * project previously re-encoded a source file as ANSI and broke the build, so
 * non-ASCII characters in code are written as escapes. German body copy lives
 * in the page files, which are written by tooling that guarantees UTF-8.
 */
const SITE_URL = "https://geo-scanner.ccie13192.com";
const BRAND = "LLMention";

const TAGLINE = `${BRAND} \u2014 GEO-Scanner f\u00fcr Sichtbarkeit in der KI-Suche`;
const DESCRIPTION =
  "Pr\u00fcfen Sie, ob ChatGPT, Claude und Perplexity Ihre Website crawlen, lesen und zitieren k\u00f6nnen. Kostenloser KI-Crawler-Check und llms.txt-Generator, ohne Anmeldung.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TAGLINE,
    template: `%s | ${BRAND}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND,

  alternates: {
    canonical: "/de/",
    languages: {
      en: "/",
      de: "/de/",
      "x-default": "/",
    },
  },

  openGraph: {
    type: "website",
    url: `${SITE_URL}/de/`,
    siteName: BRAND,
    title: TAGLINE,
    description: DESCRIPTION,
    locale: "de_DE",
  },

  twitter: {
    card: "summary_large_image",
    title: TAGLINE,
    description: DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: BRAND,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      sameAs: ["https://github.com/Alex13192/geo-scanner"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "de",
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/de/#webpage`,
      url: `${SITE_URL}/de/`,
      name: TAGLINE,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "de",
      dateModified: "2026-10-02",
    },
  ],
};

export default function GermanRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0b0f19",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
