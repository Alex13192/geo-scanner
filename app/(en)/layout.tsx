import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { BRAND, SITE_URL } from "@/lib/site";

/**
 * The site's typefaces.
 *
 * WHY THIS EXISTS: globals.css declared `--font-sans: var(--font-geist-sans)`,
 * but nothing ever defined that variable - there was no next/font import
 * anywhere in the repository, so every Tailwind `font-sans` / `font-mono`
 * utility resolved to an undefined custom property. The page therefore fell
 * back to the browser's generic `sans-serif`: Arial on Windows, Helvetica on
 * macOS, Roboto on Android, DejaVu Sans on Linux. The same site rendered in a
 * different typeface on every operating system, and `font-mono` - and with it
 * every code block - silently lost its monospace face too.
 *
 * Two further rules were pinning that fallback in place, and all three had to
 * be removed together: a `font-family: Arial, Helvetica, sans-serif` rule on
 * `body` in globals.css, and an inline `fontFamily: "sans-serif"` on <body> in
 * this file, which outranks any stylesheet.
 *
 * next/font self-hosts the files at build time, so the browser never requests
 * Google and there is no third-party connection to disclose. The two variable
 * names below are what make the `@theme` mapping in globals.css resolve - the
 * names are the contract between this file and that one, so if you rename one,
 * rename both.
 */
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Bump this when the homepage content changes. It feeds dateModified in the
 * structured data, which the scanner's own Freshness checks look for.
 * Do NOT use `new Date()` here: a build-time date makes every deploy look like
 * a content change, which is the fastest way to have freshness ignored.
 */
const LAST_UPDATED = "2026-10-02";

const TAGLINE = `${BRAND} \u2014 GEO Scanner for AI Search Visibility`;
const DESCRIPTION =
  "Check whether ChatGPT, Claude and Perplexity can crawl, read and cite your website. Free AI crawler audit and /llms.txt generator, no signup required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TAGLINE,
    // Per-route layouts (docs, pricing, ...) export their own title, which
    // renders as "<page title> | LLMention".
    template: `%s | ${BRAND}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND,

  // NOTE: `languages` is deliberately NOT set here.
  //
  // `alternates` declared on this root layout is INHERITED by every child route that
  // does not declare its own. That is not hypothetical: with only `canonical: "/"`
  // here, /report/ emitted a canonical pointing at the homepage until it was given a
  // self-referencing one. A `languages` block would have been inherited the same way,
  // making /docs/<slug>/ claim the homepage's alternates - and, once the German site
  // was removed, naming translations that no longer exist.
  //
  // This comment used to say "see app/(en)/(home)/layout.tsx for the homepage". That
  // file does not exist: the (home) route group holds page.tsx and no layout. The
  // correction first written here claimed the homepage was app/(en)/page.tsx, which is
  // also wrong - the group is real and the homepage lives at app/(en)/(home)/page.tsx.
  // Both errors are the same error, which is why it is worth a line: a claim about the
  // file tree that nobody opened the directory to check. It also described the mechanism
  // below as Next "merging nested metadata objects", which is backwards, and the two
  // halves behave differently enough to be worth stating correctly:
  //
  //   undeclared field  -> inherited from the parent (the /report/ canonical above)
  //   declared object   -> REPLACES the parent's wholesale, not deep-merged
  //
  // The second half is why every page's openGraph is built through lib/og.ts: a page
  // that declares its own loses siteName and locale unless it restates them.
  //
  // Alternates are therefore declared only where they are true, on each page.
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/*
        The inline style that used to sit here is gone. It hardcoded
        #0b0f19 / #ffffff and `font-family: sans-serif`, and because an inline
        style outranks any stylesheet it silently overrode globals.css - which
        is how the font fallback survived. The surface colours now live in
        :root in globals.css, so there is one place to change a colour.
        Nothing was lost by dropping margin/padding: Tailwind's preflight
        already resets both on <body>.
      */}
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
