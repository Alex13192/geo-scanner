import type { Metadata } from "next";

/**
 * Scan result pages are generated per request from a ?domain= parameter.
 * They are thin, user-specific and would create near-infinite duplicate URLs,
 * so this route is explicitly excluded from indexing.
 * (Also disallowed in public/robots.txt - belt and braces.)
 *
 * THE CANONICAL IS SET HERE AND THAT IS NOT DECORATION. The root layout declares
 * `alternates: { canonical: "/" }`, and a child route that declares no alternates of
 * its own inherits it - so until this line existed, /report/ emitted a canonical
 * pointing at the site root, claiming to be the homepage. It was found by reading the
 * built HTML rather than the source, which is the only way that class of inheritance
 * shows up: nothing in this file, and nothing in the build output of the pages that
 * declare their own alternates, hints at it.
 *
 * The origin is deliberately not written out above. check-values.mjs greps for it and
 * is right to: a literal in an explanatory comment cannot be told apart from one in
 * working code, and the rule is that the origin is declared once, in lib/site.ts.
 *
 * The self-referencing canonical drops the query string on purpose, so the unbounded
 * set of ?domain= variants collapses onto one URL. noindex already covers the SEO
 * side; this is here so the page does not make a second, contradictory claim.
 */
export const metadata: Metadata = {
  title: "GEO Audit Report",
  alternates: {
    canonical: "/report/",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
