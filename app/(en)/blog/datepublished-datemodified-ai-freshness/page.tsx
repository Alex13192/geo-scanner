import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("datepublished-datemodified-ai-freshness");
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
        title: "Questions about dates and freshness",
        items: [
          {
            q: "Should dateModified change on every deploy?",
            a: "No. A deploy is not an edit. If the date moves every time the site is rebuilt, it stops describing the content and starts describing the build pipeline; readers and engines both learn to ignore it. Change it when the page's substance changed, and leave it alone when only the layout did.",
          },
          {
            q: "What if datePublished is recent but dateModified is old?",
            a: "The scanner reads the first date it finds in source order, and dateModified is checked before datePublished. A stale dateModified therefore wins over a fresh datePublished and the page is read as stale. That is a useful failure to know about: the two fields are not compared, so keeping both honest is the only way to avoid it.",
          },
          {
            q: "Is the visible copyright year enough?",
            a: "No. The copyright-year check looks for the current year anywhere in the visible text, including a site-wide footer that no individual page updates. A page whose content is from an old year can pass on the footer alone; that is why the check is worth 2 points and why the rule page says so.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("faqpage-schema-after-rich-results"),
          label: "FAQPage schema after the rich-result changes",
          note: "The other markup property sites keep out of habit, and what it still does.",
        },
        {
          href: insightPath("entity-graph-organization-website-softwareapplication"),
          label: "The entity graph: Organization vs WebSite vs SoftwareApplication",
          note: "Dates sit on the page and article nodes; the entity graph says who is behind them.",
        },
        {
          href: "/checks/date-machine/",
          label: "The rule this article is about",
          note: "The exact precedence, the 12-month window, and the partial passes.",
        },
      ]}
    >
      <p>
        Every page on the web is claiming something about its own age. The byline says when it was
        published, the markup says when it changed, the server says when it was last written, and
        the footer says what year it is. In an AI answer, those claims are inputs to a judgement
        about whether the page is current — and they are also the easiest thing on a site to fake
        accidentally, by bumping a date on every deploy until it means nothing.
      </p>
      <p>
        This article is about the three dates that matter, what each one is allowed to say, how the
        scanner reads them, and how to keep them honest without turning every typo fix into a
        freshness claim.
      </p>

      <h2>The three dates, and what each one means</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Signal</th>
              <th>What it is allowed to say</th>
              <th>What it should never say</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>datePublished</code>
              </td>
              <td>The first time this page was published.</td>
              <td>A new date because the page was edited; it is not an edit date.</td>
            </tr>
            <tr>
              <td>
                <code>dateModified</code>
              </td>
              <td>The last time the substance of the page changed.</td>
              <td>A build timestamp, a deploy time, or a date moved by a template.</td>
            </tr>
            <tr>
              <td>
                <code>article:modified_time</code>
              </td>
              <td>The same claim as <code>dateModified</code>, in an older meta-tag form.</td>
              <td>A second, different date that contradicts the JSON-LD.</td>
            </tr>
            <tr>
              <td>
                <code>Last-Modified</code> header
              </td>
              <td>When the response was generated or the resource last changed, depending on the stack.</td>
              <td>A guarantee about content; it is a server fact, not an editorial one.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The distinction that matters is between <em>publication</em> and <em>revision</em>. A page
        has one first publication; it can have many revisions. Collapsing the two into a single
        "last updated" that moves for cosmetic reasons leaves a reader unable to tell whether
        anything substantive changed, and leaves a machine unable to tell whether the page is
        current or merely rebuilt.
      </p>

      <h2>What the scanner actually checks</h2>
      <p>
        The rule is <Link href="/checks/date-machine/">date-machine</Link>, worth 3 points in the
        freshness dimension. It looks for a machine-readable date in this order:{" "}
        <code>dateModified</code>, then <code>datePublished</code>, then{" "}
        <code>article:modified_time</code>. The first one found wins; the fields are not compared
        with each other. A date within twelve months is a full pass, an older date is a partial
        pass, an unparseable date is the minimum, and a page whose only date is the HTTP{" "}
        <code>Last-Modified</code> header gets a partial pass.
      </p>
      <p>
        That precedence has a practical consequence: a page with a fresh{" "}
        <code>datePublished</code> and a stale <code>dateModified</code> is read as stale. If your
        content system bumps one and not the other, the older one wins. The fix is not to remove
        the field; it is to keep both truthful so the order does not matter.
      </p>
      <p>
        The second freshness rule is <code>copyright-year</code>, worth 2 points. It looks for the
        current calendar year anywhere in the visible text. The rule page admits the weakness
        plainly: a site-wide footer that prints the current year lets an old page pass. That is a
        cheap check doing a cheap thing; adding the year to every page is not evidence that every
        page is current.
      </p>

      <h2>The failures that are easy to create and hard to notice</h2>
      <ul>
        <li>
          <strong>The build-timestamp date.</strong> <code>dateModified = new Date()</code> in a
          template moves the claim on every deploy. It is the most common way to make a date
          meaningless without lying in any single commit.
        </li>
        <li>
          <strong>The orphaned pair.</strong> A new <code>datePublished</code> with an old{" "}
          <code>dateModified</code>, or the reverse. Both are dates; only one is read. Keep them
          consistent.
        </li>
        <li>
          <strong>Future dates.</strong> A timezone mistake or a manual entry can put a date ahead
          of the current time. A page cannot have been modified tomorrow; the claim is
          self-refuting.
        </li>
        <li>
          <strong>The footer year.</strong> A current copyright year on a page whose content is
          three years old passes the cheapest freshness check and misleads the reader.
        </li>
        <li>
          <strong>The reviewed/updated collapse.</strong> "Reviewed" can mean "read and confirmed";
          "updated" means "changed". If the page was re-read but not changed, say reviewed; do not
          move the modified date.
        </li>
        <li>
          <strong>The single visible date.</strong> A human-readable date in the byline but no
          machine-readable date in the markup gives an engine less to work with than the page
          already displays.
        </li>
      </ul>

      <h2>An honest policy for a publishing schedule</h2>
      <p>
        The rule this site follows is simple enough to state in one paragraph: a page has a{" "}
        <code>published</code> date that never moves, an optional <code>updated</code> date that
        moves only when the page&rsquo;s substance changes, and a sitemap <code>lastmod</code> that
        is a hand-maintained value checked by a test rather than{" "}
        <code>new Date()</code>. A new daily post therefore has a publication date and no updated
        date; an old post that gets a correction gets an updated date and keeps its original
        published date.
      </p>
      <p>
        This is also why the blog byline shows "Updated" only when a revision happened. A field
        that always equals the publication date is not freshness information; it is decoration that
        trains a reader to ignore the field. The same standard applies to the structured data:
        <code>dateModified</code> uses the revision date when there is one, and the publication
        date otherwise.
      </p>

      <h2>How to check a page's dates</h2>
      <pre>{`# 1. Extract the machine-readable dates from the server response
curl -sS https://your-domain.com/page/ \\
  | grep -oE '"(datePublished|dateModified)"\\s*:\\s*"[^"]+"'

# 2. Compare with the visible byline; they should agree
curl -sS https://your-domain.com/page/ | grep -oE '<time[^>]*>[^<]*</time>' | head

# 3. Reject a future date programmatically
curl -sS https://your-domain.com/page/ \\
  | python -c "import sys,re,datetime; html=sys.stdin.read(); \\
      dates=re.findall(r'\\"(?:datePublished|dateModified)\\"\\s*:\\s*\\"([^\\"]+)\\"', html); \\
      [print(d, 'FUTURE' if datetime.datetime.fromisoformat(d.replace('Z','+00:00')) > datetime.datetime.now(datetime.timezone.utc) else 'ok') for d in dates]"`}</pre>
      <p>
        The third check is worth putting in CI: a future date is a hard error, and a date that
        moves on a deploy with no content change is a review question. The first two are the ones a
        human can answer in a glance.
      </p>

      <h2>What dates do not decide</h2>
      <p>
        A recent date is not a ranking factor on its own, and an AI engine&rsquo;s treatment of
        freshness varies and is not published. What the date does is give an engine something to
        reason with: whether the page is current, whether a cited figure is from this run or a
        previous one, whether an answer built from it is likely to still hold. That is a
        precondition for being read correctly, not a guarantee of being cited.
      </p>
      <p>
        The smallest useful version is also the most durable: one publication date, one revision
        date that moves only when something changed, and a machine-readable copy of both. Everything
        else is a build pipeline pretending to be an editor.
      </p>
    </PostShell>
  );
}
