import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ADSENSE_SCRIPT_SRC } from "@/lib/ads";
import { AUTHOR, personNode } from "@/lib/author";
import { OG_IMAGE } from "@/lib/og";
import { BRAND, BRAND_FULL, CONTACT_EMAIL, SITE_URL } from "@/lib/site";

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
const LAST_UPDATED = "2026-10-23";

/**
 * The homepage title doubles as the browser tab, the OG card and the Twitter card, so it is
 * written once. Two constraints hold it here: it carries the full product name (the short brand
 * alone is the string that gets confused with DataForSEO's "LLM Mentions API"), and it stays
 * under 60 characters so it is not truncated in a result or a tab.
 */
const TAGLINE = `${BRAND_FULL} \u2014 AI search readiness audit`;
/**
 * The meta description makes the same distinction the title cannot: what the product does is
 * audit readiness, and what it does not do is track mentions. Search snippets truncate around
 * 160 characters, and a promise the scanner cannot keep is the worst thing to put in one.
 */
const DESCRIPTION =
  "Check whether ChatGPT, Claude and Perplexity can crawl, read and cite your site. A readiness audit, not a mention tracker. Free, no signup.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TAGLINE,
    // Per-route layouts (docs, about, ...) export their own title, which
    // renders as "<page title> | LLMention".
    template: `%s | ${BRAND}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND_FULL,

  // NOTE: `languages` is deliberately NOT set here.
  //
  // `alternates` declared on this root layout is INHERITED by every child route that
  // does not declare its own. That is not hypothetical: with only `canonical: "/"`
  // here, /report/ emitted a canonical pointing at the homepage until it was given a
  // self-referencing one. A `languages` block would have been inherited the same way,
  // making /docs/<slug>/ claim the homepage's alternates - and, once the German site
  // was removed, naming translations that no longer exist.
  //
  // This comment used to describe the file tree wrongly twice over: it said "see
  // app/(en)/(home)/layout.tsx for the homepage" when that file did not exist, then
  // corrected itself to claim the homepage was app/(en)/page.tsx, which was also wrong.
  // The group is real, the homepage lives at app/(en)/(home)/page.tsx, and since the
  // markdown twin was added there is now genuinely a layout in that group that declares
  // its own alternates - canonical plus <link rel="alternate" type="text/markdown">.
  // That is the route-specific exception, not a second default.
  //
  // It also described the mechanism below as Next "merging nested metadata objects",
  // which is backwards, and the two halves behave differently enough to be worth
  // stating correctly:
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
    // The card itself is declared in lib/og.ts, because every route's openGraph
    // block comes from `og()` there and a second literal would drift from it.
    images: [OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    title: TAGLINE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
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
 * entity by LLMs, so this site must itself be a working example. The two names are
 * split on purpose: the Organization keeps the short `BRAND` that readers see in the
 * nav and say aloud, while `alternateName` carries the full `BRAND_FULL` used by the
 * <title>, the SoftwareApplication node and llms.txt. A model that sees either string
 * can reach this domain from the other; without that link, "LLMention" is close enough
 * to DataForSEO's "LLM Mentions API" that the two can be merged into one entity, which
 * is what `disambiguatingDescription` exists to prevent.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: BRAND,
      // The two names are one entity, not two products. The full name is the string a
      // model is most likely to confuse with DataForSEO's product, so it is declared as
      // an alias here rather than left to be inferred from the page title.
      alternateName: [BRAND_FULL],
      disambiguatingDescription:
        "An independent GEO readiness audit. Not affiliated with, connected to, or partnered with DataForSEO's LLM Mentions API (llm.dataforseo.com), which measures brand mentions - a different measurement.",
      url: SITE_URL,
      // A real 512px mark rather than the favicon: the audit that prompted this found the
      // Organization node pointing at favicon.ico, which is a 16-32px browser icon rather
      // than the logo an entity graph is supposed to name. The file is the same asset the
      // social card and the footer use.
      logo: `${SITE_URL}/logo.png`,
      email: CONTACT_EMAIL,
      description: DESCRIPTION,
      // sameAs is what lets a model resolve the brand to a single entity instead
      // of guessing whether the name and the domain are the same thing. All three URLs
      // are profiles the project already publishes under; none is invented.
      sameAs: [
        AUTHOR.github,
        AUTHOR.githubRepo,
        "https://aiagentsdirectory.com/agent/llmention",
      ],
      /*
       * The person is now a node of its own rather than being folded into the
       * organisation. The comment that used to sit here said a named Person would be a
       * stronger E-E-A-T signal and to swap it in "once one exists" - this is that swap.
       * `founder` is the relation that binds the two: an organisation with no person
       * attached is a logo, and a byline with no organisation attached is an orphan.
       */
      founder: { "@id": `${SITE_URL}/#author` },
      author: { "@id": `${SITE_URL}/#author` },
    },
    personNode(SITE_URL),
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
      // The author is the Person node rather than the organisation: a page is written by
      // somebody, and pointing at the collective noun was the weaker of the two claims.
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: BRAND,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      author: { "@id": `${SITE_URL}/#author` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: LAST_UPDATED,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: BRAND_FULL,
      url: SITE_URL,
      // The public repository is the only profile this application has. It is what lets
      // a model confirm the software exists and who publishes it, so it is the sameAs
      // rather than a logo or a landing page that says the same thing.
      sameAs: [AUTHOR.githubRepo],
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
        {/*
          AdSense loader, on every page.

          Site-wide rather than opt-in per route, deliberately: the review that
          decides whether this publisher is approved looks for the snippet on the
          pages it fetches, and a smaller footprint weakens the thing the site is
          waiting on. Where an ad may not sit is a placement question, and it is
          answered in the AdSense dashboard rather than here - Auto ads page
          exclusions are what keep advertising off a page an ad would cheapen.
          /pricing/ and /refund/ are such pages, and they exist again as of
          2026-10-08: add both to that exclusion list, because nothing in this
          repository can turn an ad off for a single route. If another page is
          added that an ad would cheapen, exclude it there rather than splitting
          this loader.

          See lib/ads.ts for why this is a plain async element rather than
          `next/script`, and for the consent platform that must be enabled before
          the account is approved.
        */}
        <script async src={ADSENSE_SCRIPT_SRC} crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
