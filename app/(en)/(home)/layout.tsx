import type { Metadata } from "next";

/**
 * Metadata for the homepage only.
 *
 * This nested route group exists so the homepage can declare hreflang
 * alternates without those alternates being inherited by /docs, /pricing and
 * every other English route, where they would be false. Metadata objects merge
 * down the tree in Next.js, so declaring alternates on the root layout leaks
 * them everywhere below it.
 *
 * Only languages that actually have a page are declared here. A hreflang
 * pointing at a page that does not exist is worse than no hreflang at all,
 * because it tells an engine that an alternate exists and then fails to
 * deliver it.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      de: "/de",
      "x-default": "/",
    },
  },
};

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
