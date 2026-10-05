import type { Metadata } from "next";

/**
 * The layout for a report link, and it exists for the two lines below.
 *
 * NOINDEX, because the URL contains a capability: anyone holding it can read the report, so it has
 * no business in an index. This is also disallowed in public/robots.txt - belt and braces, the same
 * pair the /report/ route uses. The two are not redundant and the difference is worth knowing: a
 * Disallow rule stops a crawler fetching the URL at all, which also means a crawler never reads this
 * noindex tag. Disallow is what actually protects a URL that is never linked publicly; the tag is
 * what protects it if the link is ever posted somewhere a crawler might follow it.
 *
 * THE CANONICAL IS DECLARED HERE AND THAT IS NOT DECORATION. The root layout declares
 * `alternates: { canonical: "/" }` and a child route without alternates of its own inherits it - so
 * without this line the report page would emit a canonical claiming to be the homepage. That was
 * found on /report/ by reading the built HTML rather than the source, and this route was written
 * with the lesson already applied. It is a self-reference with no query string and no token: the
 * token identifies a subscription, and two links to the same subscription should not compete as two
 * URLs.
 */
export const metadata: Metadata = {
  title: "Your GEO monitoring report",
  alternates: {
    canonical: "/monitor/report/",
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

export default function ReportLinkLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
