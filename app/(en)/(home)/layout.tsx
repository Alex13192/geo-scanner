import type { Metadata } from "next";

/**
 * The homepage's own metadata, and the only place the markdown twin is declared.
 *
 * WHY THIS IS A LAYOUT RATHER THAN THE ROOT LAYOUT: `alternates` declared on a layout is
 * inherited by every route below it unless that route declares its own. Only the homepage
 * has a markdown twin - the rule pages publish theirs from their own route handlers - so a
 * `text/markdown` alternate on the root layout would put a link to /markdown/ in the head of
 * every page on the site, telling a machine that a representation of somebody else's page
 * lives there. The `(home)` route group contains exactly one page, which makes this the
 * narrowest scope the declaration can be given.
 *
 * WHY `canonical` IS RESTATED, WHICH LOOKS REDUNDANT: a declared `alternates` object replaces
 * the parent's wholesale rather than deep-merging with it. Omitting `canonical` here would
 * therefore take the canonical link away from the homepage - the one page on the site whose
 * canonical is not in question. The merge rules are written out in app/(en)/layout.tsx, where
 * they explain why every other route has to declare its own alternates too.
 *
 * THE TWIN ITSELF IS SERVED BY ./markdown/route.ts FROM THE SAME MODULES THIS PAGE RENDERS,
 * so what this link points at cannot disagree with the page. The scanner's markdown-alternate
 * rule reads the declaration only; scripts/check-live.mjs is what follows it and proves it
 * resolves.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    types: { "text/markdown": "/markdown/" },
  },
};

export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  /*
   * A fragment, not a wrapper element: this layout exists for its metadata and must not
   * change the markup the page renders. The page owns its own <main> and <footer>; a <div>
   * here would be a new box in the layout for a declaration that needs none.
   */
  return <>{children}</>;
}
