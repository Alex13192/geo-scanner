/**
 * Which /docs/ guide, if any, walks through the fix for a given rule.
 *
 * WHY THIS IS A MODULE. The check page needs to link the rule it is explaining to the
 * guide that shows the fix in full, and the alternatives were worse: an `if` chain inside
 * the page template is the same mapping written where nothing can count it, and a link
 * typed into each of forty pages is forty chances to point at the wrong guide.
 *
 * WHAT THIS IS NOT. It is not a claim about the rules. It is an editorial pairing between
 * two things this repository already publishes: the keys are check ids from
 * lib/geo/catalog.ts, and the values are the slugs of guides under app/(en)/docs/. The
 * guide's own title and description are deliberately NOT copied here - they are rendered
 * by app/(en)/docs/page.tsx, and a second copy of them is how the two would come to
 * describe different pages. What the check page prints next to the link is the guide's
 * slug turned into readable words, and the link itself is the claim.
 *
 * COVERAGE IS PARTIAL ON PURPOSE. Seventeen of the rules have a guide that covers the fix;
 * the rest have none, and a rule with no guide prints nothing about guides rather than
 * being pointed at one that only half applies. The guides cover the changes that are
 * mechanical and recur across sites - robots.txt, schema, headings, llms.txt - which is a
 * subset of the rule set rather than a summary of it.
 */
export const CHECK_GUIDE: Record<string, string> = {
  "robots-present": "allow-ai-crawlers",
  "robots-ai-allowed": "allow-ai-crawlers",
  "robots-ai-blocked": "allow-ai-crawlers",
  "robots-sitemap": "allow-ai-crawlers",
  "content-signal": "allow-ai-crawlers",
  "sitemap-valid": "allow-ai-crawlers",
  "jsonld-valid": "schema-org-jsonld",
  "jsonld-entity": "schema-org-jsonld",
  "jsonld-content": "schema-org-jsonld",
  "qa-headings": "qa-style-headings",
  "faq": "qa-style-headings",
  "answer-first": "qa-style-headings",
  "llms-txt": "llms-txt-deployment",
  "ai-context-robots": "llms-txt-deployment",
  "markdown-alternate": "llms-txt-deployment",
  "author": "ai-visibility-self-check",
  "authority-citations": "ai-visibility-self-check",
};

/**
 * The guide route for a check id, or null when no guide covers it.
 *
 * The route is built here rather than stored in the map so the trailing slash and the
 * /docs/ prefix - both of which this site depends on - are stated once.
 */
export function guidePathForCheck(checkId: string): string | null {
  const slug = CHECK_GUIDE[checkId];
  return slug ? `/docs/${slug}/` : null;
}
