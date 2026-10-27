import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("sitemap-lastmod-false-freshness");
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
        title: "Questions about sitemap lastmod",
        items: [
          {
            q: "Is lastmod a ranking signal?",
            a: "No. It is a crawl-priority hint: a sitemap that reliably reports changes can be fetched more efficiently, and a field that is visibly wrong is likely to be ignored. It does not make a page rank, and it does not guarantee a recrawl.",
          },
          {
            q: "Would omitting lastmod be safer than a wrong one?",
            a: "Often, yes. A wrong date is worse than no date because it makes a claim the site does not honour. If the content pipeline cannot produce a truthful per-URL date, omitting the field and relying on normal crawling is an honest option; a frozen date is not.",
          },
          {
            q: "Why compare against git instead of file mtimes?",
            a: "A fresh clone or a CI checkout stamps every file with the checkout time. Comparing mtimes would fail on every run and train everyone to ignore the check. Git history records when the content actually changed; that is the comparison that can be trusted in CI.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("datepublished-datemodified-ai-freshness"),
          label: "datePublished, dateModified and AI freshness",
          note: "The same claim at page level: a date is a statement about history, not a build artifact.",
        },
        {
          href: insightPath("canonical-urls-split-citations"),
          label: "Canonical URLs: the mistakes that split citations",
          note: "The other head-level signal that is easy to emit and never check.",
        },
        {
          href: "/checks/sitemap-valid/",
          label: "The rule this article is about",
          note: "What the scanner's sitemap check verifies, and what it leaves to a crawl.",
        },
      ]}
    >
      <p>
        A sitemap lastmod is a promise that something changed on a date. It is easy to emit, hard to
        keep true, and uniquely damaging when it is wrong: a sitemap that always claims freshness
        teaches a crawler that the field carries no information, and the site loses the one signal it
        added the field to send.
      </p>
      <p>
        This article is about the three ways a lastmod goes wrong, why "no date" can be better than
        a false one, and how this site made the stale case fail a test instead of waiting for a
        search-console graph to notice.
      </p>

      <h2>What lastmod is for</h2>
      <p>
        A sitemap lists URLs. <code>lastmod</code> adds one claim per URL: when the page last
        changed. A crawler that trusts the claim can prioritise pages that changed since the last
        crawl and skip pages that did not. That is the whole mechanism — efficiency in recrawling,
        not a ranking boost.
      </p>
      <p>
        The mechanism only works if the claim is accurate. A crawler that finds the field unreliable
        learns to ignore it, at which point the sitemap still lists URLs and still gets read, but the
        freshness hint is gone. The loss is quiet: no error, no warning, just a field that stops
        being used.
      </p>

      <h2>The three ways it goes wrong</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Failure</th>
              <th>What it looks like</th>
              <th>Why it is worse than no date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Computed now</td>
              <td>
                <code>lastModified: new Date()</code> in the sitemap generator
              </td>
              <td>Every URL looks freshly modified on every deploy; the field carries no information and trains the crawler to ignore it.</td>
            </tr>
            <tr>
              <td>Frozen</td>
              <td>A hand-maintained date that nobody bumps</td>
              <td>The site changes for weeks while the sitemap says nothing did; pages sit as "Discovered - currently not indexed" while the field insists there is no news.</td>
            </tr>
            <tr>
              <td>Future or invalid</td>
              <td>A timezone slip or a manual typo ahead of today</td>
              <td>A page cannot have changed tomorrow. The claim is self-refuting and cannot be read as conservative.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The second one is the hardest to notice because nothing fails. A computed date is at least
        visibly noisy; a frozen date looks disciplined. This site lived through exactly that: the
        constant sat at one date through a week of real content changes, and Search Console ended up
        reporting 27 rule pages as discovered but not indexed while the sitemap told Google nothing
        had moved.
      </p>

      <h2>Three designs, and what each costs</h2>
      <ol>
        <li>
          <strong>A single hand-maintained date for the whole sitemap.</strong> Simple, and
          accurate only if someone remembers. The cost is discipline; the mitigation is a test that
          fails when content changes and the date does not. That is the design this site uses.
        </li>
        <li>
          <strong>A per-URL date from the content system.</strong> More accurate, and more work: the
          date has to come from the same source that decides the page changed, not from the build
          clock. If the content is file-based, a frontmatter date; if it is a database, a
          <code>updated_at</code> that is only written on real edits.
        </li>
        <li>
          <strong>No lastmod at all.</strong> Honest when the pipeline cannot produce a truthful
          date. A sitemap without the field still lists URLs; it just does not make a freshness
          claim it cannot keep.
        </li>
      </ol>
      <p>
        What does not work is the fourth option people reach for: a date that moves with every
        deploy because it is easy. That is not a freshness signal; it is a build artifact wearing
        one.
      </p>

      <h2>Making the stale case fail</h2>
      <p>
        The test in this repository does four things, and each one exists because the naive version
        failed in practice. It is <code>scripts/test-sitemap.mts</code>, run as{" "}
        <code>npm run test:sitemap</code>.
      </p>
      <pre>{`// 1. LAST_MODIFIED must still be a literal, not a computed date.
const literal = source.match(/const LAST_MODIFIED = new Date\\(\\s*'([^']+)'\\s*\\)/);

// 2. No bare new Date() anywhere in the sitemap (comments stripped first,
//    because the comment forbidding it contains the same characters).
const bareCalls = (code.match(/new Date\\(\\s*\\)/g) ?? []).length;

// 3. The declared date must not be in the future.
// 4. Content under app/ or lib/ must not have changed after the date.
git log -1 --format=%cs -- app lib`}</pre>
      <p>
        Two details are worth stealing. The comment-stripping in step 2 is not tidiness: the comment
        above the constant says "Do NOT use <code>new Date()</code> here", and the first version of
        the check matched its own prohibition and reported a failure that did not exist. A check
        that fires on the rule's explanation teaches people to ignore red lines.
      </p>
      <p>
        The git comparison in step 4 is the other one. File mtimes would be stamped by the checkout
        on every CI run, so the test would fail constantly and be disabled within a week. Git history
        records when the content actually changed; the check compares against that, with a half-day
        grace for timezone overlap.
      </p>

      <h2>How to audit a sitemap you did not write</h2>
      <pre>{`# 1. Does every URL carry a lastmod, and are they all identical?
curl -sS https://your-domain.com/sitemap.xml \\
  | grep -oE '<lastmod>[^<]+' | sort | uniq -c | sort -rn | head

# 2. Is any date in the future?
curl -sS https://your-domain.com/sitemap.xml \\
  | grep -oE '<lastmod>[^<]+' | sed 's/<lastmod>//' | while read d; do
      [ "$d" \\> "$(date -u +%Y-%m-%d)" ] && echo "FUTURE: $d"
    done

# 3. Does the sitemap contain URLs that redirect or 404?
curl -sS https://your-domain.com/sitemap.xml \\
  | grep -oE '<loc>[^<]+' | sed 's/<loc>//' | head -5 \\
  | while read u; do curl -sS -o /dev/null -w "%{http_code} %{url_effective}\\n" "$u"; done`}</pre>
      <p>
        The first command is the tell. If every URL carries the same date because the date is global,
        that can be honest — but only if a test moves it when content changes. If every URL carries
        the build date, the field is decorative.
      </p>

      <h2>What lastmod does not do</h2>
      <p>
        It does not make a page rank, it does not guarantee that a changed page is recrawled, and it
        does not make an AI engine treat the content as new. It is a hint that costs a line and
        returns a small efficiency gain, which is exactly why the failure mode — a false claim —
        costs more than the gain is worth.
      </p>
      <p>
        The standard is the same as for the date fields on a page: a claim about history should be
        true, checkable, and not moved by a deploy. If it cannot be, omit it. A sitemap without
        <code>lastmod</code> is a list; a sitemap with a false <code>lastmod</code> is a list with a
        lie attached.
      </p>
    </PostShell>
  );
}
