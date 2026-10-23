/**
 * Who writes this site, declared once.
 *
 * WHY A NAMED PERSON EXISTS AT ALL: the root layout carried a comment saying that a
 * Person node would be a stronger E-E-A-T signal than the Organization node and that
 * the swap should happen "once one exists". Every page said "the LLMention team",
 * which is not a person, cannot be looked up, and is the same sentence a site with
 * no author writes. A reader who is about to trust a measurement needs to know whose
 * measurement it is, and a crawler that wants to attach a claim to an entity needs a
 * name rather than a collective noun.
 *
 * WHY THIS IS ONE MODULE RATHER THAN A STRING PER PAGE: the same reason lib/site.ts
 * exists. The name appeared in the About page, the layout's JSON-LD and the article
 * bylines, and three copies of an identity is how a byline ends up naming one person
 * and the structured data naming another. The articles import this module, the
 * layouts import this module, and the `/author/` route renders from it.
 *
 * WHAT TO CHANGE IF A LEGAL NAME SHOULD BE PUBLIC: set `name` and `legalName` below.
 * The display name is deliberately not fabricated - "Alex" is the handle this project
 * already publishes on GitHub, and inventing a full legal name for an author page
 * would be a worse signal than a pseudonym a reader can verify against a public
 * repository. If the operator's real name is preferred, it belongs here and nowhere
 * else.
 */
import { CONTACT_EMAIL } from "./site";

export const AUTHOR = {
  /**
   * The public byline. Short, the same everywhere: byline, Person node, masthead.
   */
  name: "Alex",
  /** The handle the project is published under, so the byline is verifiable. */
  handle: "Alex13192",
  role: "Maintainer, LLMention",
  /**
   * Two sentences, not a CV. It says what qualifies the author to run the measurement,
   * which is the thing a reader is actually asking, and it does not claim credentials
   * that would need checking.
   */
  bio: "I build and maintain LLMention: the scanner, the rule set and the study behind it. The work is published as source, so the method can be checked rather than taken on trust.",
  github: "https://github.com/Alex13192",
  githubRepo: "https://github.com/Alex13192/geo-scanner",
  email: CONTACT_EMAIL,
  /** Site-relative; every absolute URL is built from SITE_URL by the caller. */
  path: "/author/",
} as const;

/**
 * The Person node for the root layout's JSON-LD graph.
 *
 * `@id` is a fragment on the origin rather than a separate URL, so every page can
 * reference this one node instead of restating the person. `sameAs` names the GitHub
 * account the work is actually published under, which is the one property that lets a
 * model decide the byline and the repository are the same author.
 */
export function personNode(siteUrl: string) {
  return {
    "@type": "Person",
    "@id": `${siteUrl}/#author`,
    name: AUTHOR.name,
    alternateName: AUTHOR.handle,
    url: `${siteUrl}${AUTHOR.path}`,
    jobTitle: AUTHOR.role,
    description: AUTHOR.bio,
    email: AUTHOR.email,
    sameAs: [AUTHOR.github, AUTHOR.githubRepo],
  };
}
