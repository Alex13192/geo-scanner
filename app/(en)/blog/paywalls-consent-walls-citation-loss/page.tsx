import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("paywalls-consent-walls-citation-loss");
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
        title: "Questions about paywalls and consent walls",
        items: [
          {
            q: "Can a paywalled page still be cited?",
            a: "It can be referenced from its title, summary or another source, but an engine that cannot read the body cannot quote it accurately. The practical outcome is fewer and less precise citations, not zero: a page can be named without being read.",
          },
          {
            q: "Is a consent banner the same as a paywall?",
            a: "No, but both can hide content. A consent banner is a legal workflow; if the article text is rendered only after consent, the effect on a crawler is the same as a wall. The fix is to keep the text in the response and gate the tracking, not the reading.",
          },
          {
            q: "Should I serve crawlers different content from users?",
            a: "No. Serving a bot the full text while users get a wall is cloaking, and it is the kind of shortcut that turns a visibility problem into a policy problem. Decide what is public, then serve that consistently.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("what-a-crawler-sees-without-javascript"),
          label: "What a crawler sees when your page needs JavaScript",
          note: "The mechanism behind most consent walls that hide content.",
        },
        {
          href: insightPath("content-signal-and-robots-policies"),
          label: "Content-Signal and robots.txt content policies",
          note: "Where a site states its access policy, including for AI.",
        },
        {
          href: "/privacy/",
          label: "This site's privacy policy",
          note: "How consent and advertising are handled here, and what is deliberately not gated.",
        },
      ]}
    >
      <p>
        A paywall and a consent wall are different products of different pressures — one protects
        revenue, the other protects privacy — but they can produce the same technical result: the
        words are not in the response. A reader sees a page; a crawler sees a prompt, an overlay, or
        a script that would have fetched the text if it had run. The citation consequence is the
        same in both cases, and it is easy to miss because the browser looks fine.
      </p>
      <p>
        This article is about where the loss happens, how to tell whether your page is affected, and
        what the honest options are when the content really should be paid for or consented to.
      </p>

      <h2>Three ways content ends up behind a wall</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Mechanism</th>
              <th>What the response contains</th>
              <th>What a non-rendering crawler gets</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hard paywall (server-gated)</td>
              <td>A teaser, a login prompt, or a 401/403 page.</td>
              <td>The teaser or the error; the article is absent.</td>
            </tr>
            <tr>
              <td>Soft paywall (client-gated)</td>
              <td>The full HTML, with the body hidden or replaced after script runs.</td>
              <td>Often the full text; the wall is a browser behaviour.</td>
            </tr>
            <tr>
              <td>Consent wall</td>
              <td>Either the full HTML with an overlay, or a shell that loads the text after consent.</td>
              <td>Full text in the first case, nothing in the second.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The middle row is the one people misread. A soft paywall that hides text with CSS or replaces
        it after hydration can leave the full article in the response, where a parser reads it while
        a person cannot. That is a different risk: it is not citation loss, it is content exposure
        that the business did not intend. The row above and the second consent case are the citation
        problem.
      </p>

      <h2>What citation loss actually looks like</h2>
      <p>
        An engine that cannot read the body can still know the page exists: from the title, the meta
        description, links, social cards, or another site quoting it. What it cannot do is quote the
        passage, verify the claim, or summarise the argument. The result is a page that is
        <em>named</em> but not <em>read</em> — and a named page with no read passage is a weak
        citation, easily replaced by a source that was readable.
      </p>
      <p>
        There is a second, quieter loss: the page cannot correct anything. If another source
        misstates what is behind the wall, the page&rsquo;s own corrections are invisible to the
        engine, because they are behind the same wall.
      </p>

      <h2>Consent walls: gate the tracking, not the reading</h2>
      <p>
        A consent management platform exists to obtain permission before non-essential cookies and
        trackers run. That is a legal workflow and it should stay. What it should not do is decide
        whether the article&rsquo;s words are in the HTML. The clean shape is:
      </p>
      <ol>
        <li>The article text is server-rendered in the response, as it would be without a CMP.</li>
        <li>The consent banner renders on top; trackers are loaded only after consent.</li>
        <li>No article content is fetched or revealed by the consent script.</li>
      </ol>
      <p>
        If the CMP is configured to hide content until consent, the effect is a wall. The fix is in
        the CMP configuration and the template, not in a new robots rule: keep the body in the HTML
        and gate the scripts.
      </p>

      <h2>Paywalls: decide what is public, then be consistent</h2>
      <p>
        A paywall is a legitimate business decision. What is not legitimate is serving crawlers the
        full text while showing people a wall, or letting the marketing page claim the article is
        open when the body is gated. The consistent options are:
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>What it gives</th>
              <th>What it costs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Metered access</td>
              <td>Some free reads; some exposure; a path to citation for the free views.</td>
              <td>Complex to implement; inconsistent by design.</td>
            </tr>
            <tr>
              <td>Free summary, paid body</td>
              <td>A citable summary with a clear boundary; the body is the product.</td>
              <td>You must write a summary worth citing.</td>
            </tr>
            <tr>
              <td>Full paywall</td>
              <td>Content protection.</td>
              <td>Accept that the body is not citable; keep the public metadata honest.</td>
            </tr>
            <tr>
              <td>Licensed access for AI</td>
              <td>A controlled path for engines that pay or agree to terms.</td>
              <td>Depends on the crawler; not a general solution.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How to test your own page</h2>
      <pre>{`# 1. Is the article text in the raw response?
curl -sS https://your-domain.com/article/ | sed 's/<[^>]*>/ /g' | tr -s ' ' | head -c 1500

# 2. What does a non-browser client get?
curl -sS -A "GPTBot" -o body.txt -w "%{http_code} %{size_download}\\n" https://your-domain.com/article/

# 3. Does the page declare a paywall (if you use the structured-data pattern)?
curl -sS https://your-domain.com/article/ | grep -oE '"isAccessibleForFree"\\s*:\\s*[^,}]+'

# 4. Does the consent script block the body before it runs?
#    Compare the response with the rendered DOM (view-source vs Elements).`}</pre>
      <p>
        The first command is the decisive one. If the body is not in the response, the page is gated
        for every non-rendering crawler regardless of what the browser shows. The second shows what
        a crawler-shaped request receives; it is diagnostic, not a way to serve different content.
      </p>

      <h2>What this site does</h2>
      <p>
        This site has no paywall on its articles. The paid product is a delivered report, not a
        gated page: the free scan, the rules, the methodology and the blog are all in the response,
        and the paid measurement is a document the buyer receives. That is a product decision, and it
        keeps the citation path open.
      </p>
      <p>
        The privacy policy still handles consent and advertising; the difference is that the article
        text does not depend on a consent click. The rule is simple: a legal workflow can gate a
        tracker, and it should not gate the reading.
      </p>

      <h2>What walls do not change</h2>
      <p>
        A paywall does not make a page unciteable by decree; the page can still be named from its
        metadata, and other sources can quote it. It does make accurate quotation less likely, and it
        removes the page&rsquo;s ability to correct a misstatement. A consent wall adds no protection
        to the content at all — it protects privacy, and if it hides the body, it costs visibility
        for no privacy gain.
      </p>
      <p>
        The honest summary: decide what is public, serve that consistently to people and machines,
        and gate the tracking rather than the text. The rest is a business trade, and it should be
        made deliberately rather than discovered when a citation does not arrive.
      </p>
    </PostShell>
  );
}
