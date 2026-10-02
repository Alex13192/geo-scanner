import type { Metadata } from "next";
import "./globals.css";

/**
 * Single source of truth for the site origin.
 * Keep this in sync with app/sitemap.ts and public/robots.txt.
 */
const SITE_URL = "https://geo-scanner.ccie13192.com";
const BRAND = "LLMention";

/**
 * Bump this when the homepage content changes. It feeds dateModified in the
 * structured data, which the scanner's own Freshness checks look for.
 * Do NOT use `new Date()` here: a build-time date makes every deploy look like
 * a content change, which is the fastest way to have freshness ignored.
 */
const LAST_UPDATED = "2026-10-02";

const TAGLINE = `${BRAND} — GEO Scanner for AI Search Visibility`;
const DESCRIPTION =
  "Check whether ChatGPT, Claude and Perplexity can crawl, read and cite your website. Free AI crawler audit and /llms.txt generator, no signup required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TAGLINE,
    // Per-route layouts (app/docs/layout.tsx, etc.) export their own title,
    // which renders as "<page title> | LLMention".
    template: `%s | ${BRAND}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BRAND,
    title: TAGLINE,
    description: DESCRIPTION,
    locale: "en_US",
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
      "max-video-preview": -1,
    },
  },
};

/**
 * Entity markup.
 *
 * WHY THIS MATTERS FOR A GEO PRODUCT SPECIFICALLY:
 * The whole point of this site is to teach brands how to be recognised as an
 * entity by LLMs, so this site must itself be a working example. Consistent
 * `name` across <title>, <h1>, llms.txt and this JSON-LD is what lets an LLM
 * bind the string "LLMention" to this domain.
 *
 * NOTE: FAQPage schema is deliberately NOT included yet. Google requires
 * structured data to match content that is actually visible on the page.
 * Add a visible FAQ section first, then the matching schema.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: BRAND,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      description: DESCRIPTION,
      // sameAs is what lets a model resolve the brand to a single entity instead
      // of guessing whether the name and the domain are the same thing.
      sameAs: ["https://github.com/Alex13192/geo-scanner"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      // Declares who is accountable for the page and when it last changed.
      // A named person would be a stronger E-E-A-T signal than the
      // organisation; swap `author` for a Person node once one exists.
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: BRAND,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: LAST_UPDATED,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: BRAND,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${SITE_URL}/#organization` },
      description:
        "Audits whether AI search engines and LLM crawlers can access, parse and cite a website, and generates /llms.txt context files.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free GEO audit and /llms.txt generation.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
