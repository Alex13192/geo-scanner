import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("canonical-urls-split-citations");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English-first series; translations add their own hreflang keys when they ship. */
    languages: {
      en: `/blog/${insight.slug}/`,
      "x-default": `/blog/${insight.slug}/`,
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: insightPath(insight.slug),
    type: "article",
  }),
};

export default function Page() {
  return (
    <PostShell
      insight={insight}
      faq={{
        title: "Questions about canonical URLs",
        items: [
          {
            q: "Does a canonical tag redirect the duplicate?",
            a: "No. It is a hint that one URL is the preferred version; the duplicate keeps resolving and serving its own page. If you want the other URL to stop existing, use a 301. If you want it to exist but not compete, a canonical is the tool.",
          },
          {
            q: "Should every page canonical to itself?",
            a: "Yes, for a normal page. The self-referential canonical states that this URL, after redirects, is the one to consolidate. The mistakes are canonicals that point at a different page, at a redirect, at a 404, or at a language the page is not in.",
          },
          {
            q: "What does the scanner check about canonicals?",
            a: "Only that a rel=canonical link is present. It is worth 1 point, and the rule page says the address is read and not compared: a page pointing at a different page or at a 404 passes. The comparison is the work this article is about.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("heading-hierarchy-for-extraction"),
          label: "Heading hierarchy for extraction, not just SEO",
          note: "The other structural rule set: the outline inside the page.",
        },
        {
          href: insightPath("datepublished-datemodified-ai-freshness"),
          label: "datePublished, dateModified and AI freshness",
          note: "The sibling mistake: a signal that says something the site does not deliver.",
        },
        {
          href: "/checks/canonical/",
          label: "The rule this article is about",
          note: "One point for a rel=canonical link, and the rule page's admission that nothing compares it.",
        },
      ]}
    >
      <p>
        A canonical tag is the cheapest way to lie to yourself about duplicates. It is one line in
        the head, every framework emits one by default, and the check most scanners run is
        "does it exist". The interesting failures are all in the address it contains, which is the
        part a presence check never reads.
      </p>
      <p>
        This article is about what a canonical is allowed to claim, the mistakes that split signals
        instead of consolidating them, and how to audit the address rather than the tag.
      </p>

      <h2>What a canonical does, and does not do</h2>
      <p>
        <code>rel=&quot;canonical&quot;</code> is a hint that one URL is the preferred version of a
        piece of content. It is not a redirect: the duplicate URL still resolves and still serves.
        It is not a noindex, and it is not an instruction an engine must follow. It is a statement
        that, after redirects, this is the URL whose signals should be consolidated.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>What it does</th>
              <th>When it is the right one</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>301 redirect</td>
              <td>Moves the URL permanently; the old address stops serving.</td>
              <td>The old URL should not exist any more.</td>
            </tr>
            <tr>
              <td>rel=canonical</td>
              <td>Names the preferred URL; both addresses keep serving.</td>
              <td>The duplicate must stay reachable (tracking links, syndication, printed URLs).</td>
            </tr>
            <tr>
              <td>noindex</td>
              <td>Asks that the page not appear in search results.</td>
              <td>The page exists for users but not for search.</td>
            </tr>
            <tr>
              <td>hreflang</td>
              <td>Declares language and region versions of the same page.</td>
              <td>The content is translated, not duplicated.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Mixing them is where most of the damage happens. A canonical that points at a redirect, a
        canonical on a page that is also noindex, or a canonical that disagrees with the hreflang
        group all ask an engine to resolve contradictory instructions. The engine chooses; the site
        rarely likes the choice.
      </p>

      <h2>The mistakes that split citations</h2>
      <ul>
        <li>
          <strong>Missing entirely.</strong> Two URLs for one page, no statement about which is
          preferred. Search engines pick one; an answer engine may pick the other; a link may point
          at a third.
        </li>
        <li>
          <strong>Pointing at the homepage.</strong> A canonical to <code>/</code> from an article
          says the article is a variant of the homepage. The article's own signals are handed to the
          wrong page.
        </li>
        <li>
          <strong>Pointing at a 404 or a redirect.</strong> The canonical target should be a 200 at
          the address it names. A canonical to a URL that redirects is a hint that resolves
          somewhere else, which is two instructions instead of one.
        </li>
        <li>
          <strong>http vs https, www vs apex, trailing slash variants.</strong> The canonical must
          name the final URL, not a variant that redirects to it. This site uses trailing slashes
          everywhere and canonicalises the slash form, so the two never disagree.
        </li>
        <li>
          <strong>Cross-language canonical.</strong> A Chinese page canonicalising to the English
          page, or an hreflang group whose members canonicalise to one language, tells an engine the
          translations are duplicates of each other. They are not.
        </li>
        <li>
          <strong>Multiple canonical tags.</strong> Two tags mean the engine has to pick; the
          outcome is not something the page controls. One tag per page.
        </li>
        <li>
          <strong>Client-side canonical.</strong> A tag injected after hydration is absent from the
          response a crawler parses. The same failure as client-only content, one tag up.
        </li>
        <li>
          <strong>Canonical plus noindex.</strong> The two instructions conflict: consolidate here,
          but do not show this here. Pick one.
        </li>
        <li>
          <strong>Paginated pages canonicalised to page one.</strong> Page 2 is not a duplicate of
          page 1; it is a different set of items. Canonical each page to itself unless the pagination
          is genuinely cosmetic.
        </li>
      </ul>

      <h2>What the scanner checks — and what it does not</h2>
      <p>
        The rule is <Link href="/checks/canonical/">canonical</Link>, worth 1 point in the
        citability dimension. The condition is that a <code>rel=canonical</code> link exists. The
        rule page is explicit: the address is read and not compared, nothing follows it, and a page
        pointing its canonical at another page or at a 404 passes.
      </p>
      <p>
        That is the right size for a single-request check. Comparing the canonical with the fetched
        URL would be cheap for the scanner, but following it is a second request and judging
        language or pagination is a judgement. The score says "a tag is present"; the audit below is
        what says whether it is true.
      </p>

      <h2>Auditing the address, not the tag</h2>
      <pre>{`# 1. What canonical does the server response declare?
curl -sS https://your-domain.com/page/ \\
  | grep -oE '<link[^>]+rel="canonical"[^>]*>'

# 2. How many canonical tags are there? One is the answer.
curl -sS https://your-domain.com/page/ | grep -c 'rel="canonical"'

# 3. Is the canonical target itself a 200 with a self-referential canonical?
CANON=$(curl -sS https://your-domain.com/page/ | grep -oE 'rel="canonical"[^>]*href="[^"]+"' | grep -oE 'https?://[^"]+')
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\\n" "$CANON"
curl -sS "$CANON" | grep -oE '<link[^>]+rel="canonical"[^>]*>'

# 4. Do the hreflang members agree with the canonical strategy?
curl -sS https://your-domain.com/page/ | grep -oE 'hreflang="[^"]+" href="[^"]+"'`}</pre>
      <p>
        Read the four outputs together. The canonical should be absolute, should name the final URL
        after redirects, should return 200, and should be the same URL the hreflang group and the
        sitemap use. A canonical that is merely present but disagrees with the rest of the site is
        the failure this check cannot see.
      </p>

      <h2>How this site does it</h2>
      <p>
        Every page declares an absolute self-referential canonical built from its own path, and the
        localized pages declare their own language URL rather than the English one. The hreflang
        group lists the same URLs, the sitemap lists them, and the redirects move old aliases to the
        final address rather than leaving a canonical pointing at a redirect. These are not separate
        features; they are one statement repeated in the places an engine looks.
      </p>
      <p>
        The point is not that the site is perfect. It is that the statement is checkable: a crawler
        can fetch a page and compare four things — requested URL, canonical, hreflang membership and
        sitemap entry — and see whether they agree.
      </p>

      <h2>What a canonical does not buy</h2>
      <p>
        It does not merge two pages into one ranking, it does not guarantee that an answer engine
        quotes the canonical URL rather than the duplicate, and it does not fix a page whose content
        is duplicated because the site genuinely has two versions. It is a hint that makes the
        preferred address unambiguous; the engine still decides what to do with it.
      </p>
      <p>
        The useful standard is the one the rest of this series keeps applying: make the signal
        checkable, make it agree with the other signals, and do not use it to claim something the
        site does not deliver.
      </p>
    </PostShell>
  );
}
