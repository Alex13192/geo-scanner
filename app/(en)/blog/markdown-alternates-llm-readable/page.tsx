import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("markdown-alternates-llm-readable");
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
        title: "Questions about markdown alternates",
        items: [
          {
            q: "Is there a standard for markdown alternates?",
            a: "No. The convention is a link element with rel=\"alternate\" and type=\"text/markdown\" pointing at a representation of the page. It is not an HTML standard, not a search-engine requirement, and not something an engine has to read. It is a useful convention, not a contract.",
          },
          {
            q: "Should the markdown twin be indexed?",
            a: "Usually not as a separate page. The HTML page is the canonical version; the twin is a representation for machines. If the twin is indexable it can compete with the page it describes, which is the opposite of what the alternate is for. Decide explicitly and make the headers agree.",
          },
          {
            q: "Does the scanner verify that the markdown link resolves?",
            a: "No. The rule is worth 1 point and reads the declaration only; it does not follow the link, so a page pointing at a 404 passes. The verification is a fetch you do yourself, which is one of the tests below.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("hreflang-for-machine-translated-sites"),
          label: "Hreflang for a site that machine-translates",
          note: "The other head-level declaration that has to be scoped to pages that exist.",
        },
        {
          href: insightPath("what-a-crawler-sees-without-javascript"),
          label: "What a crawler sees when your page needs JavaScript",
          note: "Why a representation that is not in the response is not available to a crawler.",
        },
        {
          href: "/checks/markdown-alternate/",
          label: "The rule this article is about",
          note: "One point for the declaration, and the rule page's admission that nothing is followed.",
        },
      ]}
    >
      <p>
        A markdown alternate is a low-tech answer to a real problem: a page built for people is full
        of navigation, scripts and layout, and an engine that wants the text has to strip all of it.
        Publishing a plain-text representation and pointing at it with a link element is cheap. The
        hard part is not the representation; it is keeping it true, scoped to the pages that have
        one, and not accidentally creating a second indexable copy of the site.
      </p>
      <p>
        This article is about the declaration, the twin behind it, and the rules that keep the two
        from drifting.
      </p>

      <h2>What the declaration looks like</h2>
      <p>
        The convention is a link in the document head:
      </p>
      <pre>{`<link rel="alternate" type="text/markdown" href="/page/markdown/" />`}</pre>
      <p>
        The scanner&rsquo;s rule is <Link href="/checks/markdown-alternate/">markdown-alternate</Link>,
        worth 1 point: the head contains a <code>rel=&quot;alternate&quot;</code> link with{" "}
        <code>type=&quot;text/markdown&quot;</code>, in either attribute order. It reads the
        declaration only and does not follow it, which the rule page states: a page can pass while
        pointing at a link that 404s.
      </p>
      <p>
        One point is the right weight. The declaration is cheap, the convention is not standardised,
        and no engine has committed to reading it. A site that publishes twins because they are
        useful is making a different decision from a site that adds the link to satisfy a check.
      </p>

      <h2>Two ways to serve the representation</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Approach</th>
              <th>How it works</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Separate URL</td>
              <td>A route such as <code>/page/markdown/</code> returns <code>text/markdown</code>; the HTML page links to it.</td>
              <td>Cacheable, linkable, easy to test; two URLs to keep in sync.</td>
            </tr>
            <tr>
              <td>Content negotiation</td>
              <td>The same URL returns HTML or markdown depending on the <code>Accept</code> header.</td>
              <td>One URL; needs <code>Vary: Accept</code> and cache discipline, and clients that do not send the header get HTML.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        This site uses the separate URL. The homepage twin is served by a route, the rule pages
        publish theirs from their own handlers, and the responses carry a{" "}
        <code>x-markdown-twin-of</code> header naming the HTML page they represent. The header is not
        required; it is a debugging aid that makes the relationship visible in a response without
        parsing the body.
      </p>
      <p>
        The separate URL is also why the declaration is scoped. The site&rsquo;s homepage declares
        the twin in the homepage layout, not the root layout, because an inherited declaration would
        put a link to <code>/markdown/</code> in the head of every page and tell a machine that a
        representation of somebody else&rsquo;s page lives there. A declaration should be as narrow
        as the set of pages that actually have a twin.
      </p>

      <h2>The twin has to come from the same source</h2>
      <p>
        The failure that matters is drift. If the markdown is written by hand next to the HTML, the
        two disagree within a release: a price changes, a claim is corrected, a section is removed,
        and the twin keeps serving the old version. An engine that reads the twin then quotes
        something the page no longer says.
      </p>
      <p>
        The fix is to generate both from the same data. On this site the twins are rendered from the
        same modules the pages use, which is why a check that compares the two is meaningful rather
        than decorative. The general rule: the markdown should be a rendering of the content, not a
        second authoring of it.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li>
          <strong>Declaring a twin that does not exist.</strong> The scanner does not fetch it; a
          reader does. A 404 behind a perfect declaration is worse than no declaration.
        </li>
        <li>
          <strong>Wrong type or wrong rel.</strong> A link with <code>type=&quot;text/plain&quot;</code>{" "}
          or <code>rel=&quot;alternate&quot;</code> missing is not the declaration; it is a link.
        </li>
        <li>
          <strong>Declaring it on every page from a shared layout.</strong> The link then claims a
          twin for pages that do not have one. Scope it to the pages that do.
        </li>
        <li>
          <strong>Serving HTML at the markdown URL.</strong> A catch-all route returns the app shell
          with a 200; the content type and the body are wrong, and the declaration points at a page.
        </li>
        <li>
          <strong>Letting the twin compete in search.</strong> If it is indexable, it can be treated
          as a separate page. The HTML page is the canonical version; make the twin&rsquo;s indexing
          signals agree with that decision.
        </li>
        <li>
          <strong>Losing the structure.</strong> A twin that flattens headings, tables and lists into
          a wall of text throws away the thing that made the HTML extractable.
        </li>
        <li>
          <strong>Requiring the chrome.</strong> A markdown representation that starts with the
          navigation and cookie banner is not a representation; it is the page with the tags
          stripped.
        </li>
      </ul>

      <h2>How to test a twin</h2>
      <pre>{`# 1. The declaration, from the head
curl -sS https://your-domain.com/page/ \\
  | grep -oE '<link[^>]+type="text/markdown"[^>]*>'

# 2. The twin resolves, with the right content type
curl -sS -D - -o /dev/null https://your-domain.com/page/markdown/

# 3. The twin starts with markdown, not HTML
curl -sS https://your-domain.com/page/markdown/ | head -n 5

# 4. The two agree on the main heading and roughly on length
curl -sS https://your-domain.com/page/ | grep -oE '<h1[^>]*>[^<]*'
curl -sS https://your-domain.com/page/markdown/ | head -n 1`}</pre>
      <p>
        The fourth comparison is crude and useful: the H1 and the first heading should match, and
        the markdown should not be an order of magnitude shorter. A twin that lost half the page is
        the failure mode; a twin that is slightly shorter because it dropped the chrome is the point.
      </p>

      <h2>What a markdown alternate buys</h2>
      <p>
        It buys efficiency for a reader that wants text: fewer tokens, no chrome, no parsing of
        layout. It also buys a testable representation — you can diff it, validate it, and check it
        in CI. It does not buy a ranking, a citation, or a guarantee that an engine reads it. It is a
        convenience offered to a machine, and the machine may decline.
      </p>
      <p>
        The standard from the rest of this series applies: declare only what exists, generate it from
        the same source as the page, and make the relationship checkable. A twin nobody can verify is
        just a second copy waiting to disagree.
      </p>
    </PostShell>
  );
}
