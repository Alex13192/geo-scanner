import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import Faq from "@/app/components/Faq";
import { social } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * /api-docs/ - the public scan endpoint, documented.
 *
 * WHY THIS PAGE EXISTS: the endpoint has been public since the site launched, the
 * published study was collected through it, and the README shows a curl one-liner - but
 * there was no page on the site that described it. An external audit pointed this out as
 * a real gap for developers and agencies ("no API documentation"), and the gap mattered
 * more than the missing description: an endpoint that is only mentioned in a repository is
 * an endpoint most visitors never learn exists.
 *
 * WHAT MAKES IT HONEST: every limit below is read from the code that enforces it
 * (lib/geo/scan.ts for the site-scope budget, lib/net/rate-limit.ts for the bucket,
 * app/api/scan/route.ts for the response shape), and the properties that are NOT
 * promised - uptime, versioning, a global rate limit - are named as not promised. The
 * sample response is a real one, captured on 2026-10-23, not an invented illustration.
 */
const TITLE = "Scan API: fetch the GEO score programmatically";
const DESCRIPTION =
  "One public endpoint, no key: the same analyser the site runs, with documented parameters, response fields, rate limits and the limits it does not fix.";
const UPDATED = "23 October 2026";

/** A real `?brief=1` response for example.com, captured 2026-10-23. Not a mock-up. */
const SAMPLE_BRIEF = `{
  "domain": "example.com",
  "status": 200,
  "browserStatus": null,
  "scoreBasis": "homepage",
  "truncated": false,
  "score": 16,
  "grade": "F",
  "checksRun": 40,
  "checksPassed": 5,
  "aiCrawlersBlocked": false,
  "hasJsonLdEntity": false,
  "hasSameAs": false,
  "hasRobotsTxt": false,
  "topIssue": "robots-present",
  "pageType": "homepage",
  "checksNotApplicable": 1
}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/api-docs/" },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/api-docs/",
  }),
};

export default function ApiDocsPage() {
  return (
    <ProsePage
      eyebrow="Scan API"
      title="Scan API: fetch the GEO score programmatically"
      description={
        <p>
          One public endpoint returns the same analysis the report page renders. No key, no
          account, no sign-up. This page documents the parameters, the response, the rate
          limit, and the limits the API itself does not fix.
        </p>
      }
      meta={`Documented ${UPDATED}. The endpoint is unversioned; see the limits below.`}
      action={{ href: "/api/scan?brief=1&domain=example.com", label: "Try it on example.com" }}
    >
      <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
        <h2>What does the endpoint do?</h2>
        <p>
          It fetches a domain the way a crawler would, reads <code>robots.txt</code>,{" "}
          <code>llms.txt</code> and <code>sitemap.xml</code> when they exist, and scores the
          page against the same published rule set the site describes on{" "}
          <Link href="/methodology/">/methodology/</Link>. The caller gets the score, the
          twelve dimension results and the issue list, not a screenshot of them.
        </p>
        <pre>{`GET ${SITE_URL}/api/scan?domain=example.com`}</pre>
        <p>
          The scan runs during the request, so a first call on a cold domain takes as long
          as fetching that domain takes. The same analyser powers{" "}
          <Link href="/report/">the report page</Link> and the{" "}
          <Link href="/study/">published study</Link>, which is why a score from here and a
          score from the interface are the same number.
        </p>

        <h2>What parameters does it accept?</h2>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Required</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>domain</code>
              </td>
              <td>Yes</td>
              <td>
                Hostname only. A pasted <code>https://</code> prefix, a path or a query string
                is stripped; a <code>www.</code> prefix is removed.
              </td>
            </tr>
            <tr>
              <td>
                <code>brief=1</code>
              </td>
              <td>No</td>
              <td>
                Returns headline numbers only - roughly 300 bytes instead of about 8 KB -
                without dimensions or the issue list. It is how a caller collecting many
                domains avoids pulling a full report per domain.
              </td>
            </tr>
            <tr>
              <td>
                <code>scope=site</code>
              </td>
              <td>No</td>
              <td>
                Adds a <code>site</code> block: the homepage plus pages named by the sitemap,
                each scored by the same analyser, with a site average and the issues that
                recur across pages.
              </td>
            </tr>
            <tr>
              <td>
                <code>pages=N</code>
              </td>
              <td>No</td>
              <td>
                The site-scope budget: pages beyond the homepage, default 5, maximum 10.
                Supplying it implies <code>scope=site</code>.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          <code>brief=1</code> wins over <code>scope=site</code> when both are sent. That is
          deliberate: the brief form exists to make bulk collection cheap, and a site block
          is the opposite trade.
        </p>

        <h2>What does the response contain?</h2>
        <p>
          A full scan returns <code>reachable</code>, <code>status</code>,{" "}
          <code>scheme</code>, <code>browserStatus</code>, <code>scoreBasis</code>,{" "}
          <code>truncated</code>, <code>score</code>, <code>grade</code>,{" "}
          <code>gradeLabel</code>, <code>dimensions</code>, <code>checksRun</code>,{" "}
          <code>checksPassed</code>, <code>pageType</code>,{" "}
          <code>checksNotApplicable</code>, <code>issues</code> and <code>metrics</code>.
        </p>
        <ul>
          <li>
            <strong>
              <code>scoreBasis</code>
            </strong>{" "}
            says what the score describes. It is <code>&quot;homepage&quot;</code> when the
            page answered 200, and <code>&quot;403 error response&quot;</code> and so on when
            it did not - an error response is not a page, and the field exists so a caller
            cannot mistake one for the other.
          </li>
          <li>
            <strong>
              <code>dimensions</code>
            </strong>{" "}
            carries all twelve weighted results, each with its earned and possible points and
            the published rationale.
          </li>
          <li>
            <strong>
              <code>issues</code>
            </strong>{" "}
            lists the failed and partial checks with the evidence that produced them and the
            fix the rule page publishes.
          </li>
          <li>
            <strong>
              <code>truncated</code>
            </strong>{" "}
            is true when the fetch stopped at the size cap, so the score describes what was
            read rather than the whole document.
          </li>
          <li>
            <strong>
              <code>checksNotApplicable</code>
            </strong>{" "}
            is the count of rules excluded for this page type or premise. A score of 39/39
            with one excluded is not a score of 39/40; see{" "}
            <Link href="/methodology/">the method</Link>.
          </li>
        </ul>

        <h2>What does a brief response look like?</h2>
        <p>
          This is a real response for <code>example.com</code>, captured on 23 October 2026.
          It is not an illustration: run the same request and you should get the same shape.
        </p>
        <pre>{SAMPLE_BRIEF}</pre>

        <h2>What are the rate limits?</h2>
        <p>
          A best-effort in-isolate token bucket: 20 requests per client address per minute.
          When it is exhausted the endpoint answers <code>429</code> with a{" "}
          <code>Retry-After</code> header. It is not a global limit - Cloudflare runs many
          isolates, each with its own counter - so a caller planning bulk work should pace
          itself rather than rely on the number. This is stated because an accurate warning
          is more useful than a promise the architecture cannot keep.
        </p>

        <h2>What status codes does it return?</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>200</code>
              </td>
              <td>
                A result. A site that refused the crawler still returns 200 with{" "}
                <code>reachable: true</code> and <code>status: 403</code> - the refusal is the
                finding.
              </td>
            </tr>
            <tr>
              <td>
                <code>400</code>
              </td>
              <td>
                The domain is not a valid hostname, or refuses to resolve to a public address.
                The body carries an <code>error</code> string.
              </td>
            </tr>
            <tr>
              <td>
                <code>429</code>
              </td>
              <td>Rate limited. Retry after the <code>Retry-After</code> value.</td>
            </tr>
          </tbody>
        </table>
        <p>
          If neither scheme answers at all, the response is <code>200</code> with{" "}
          <code>reachable: false</code>, <code>score: 0</code> and an empty issue list. An
          unreachable domain is a result about reachability, not a server error caused by the
          caller.
        </p>

        <h2>What does the endpoint not do?</h2>
        <ul>
          <li>
            <strong>It does not see a firewall.</strong> A request from this scanner comes
            from its own address, so a CDN rule aimed at bots can refuse it while serving a
            browser. That is reported as a partial result for the access checks, not as a
            pass.
          </li>
          <li>
            <strong>It does not execute JavaScript.</strong> A client-rendered page is scored
            as a crawler receives it.
          </li>
          <li>
            <strong>It does not ask an AI engine anything.</strong> The score describes
            whether a page can be cited, not whether it currently is; the{" "}
            <Link href="/compare/readiness-vs-mention-tracking/">comparison page</Link>{" "}
            explains the distinction.
          </li>
          <li>
            <strong>It does not store what it scans.</strong> There is no history and no key
            to lose.
          </li>
          <li>
            <strong>It is not a versioned contract.</strong> Fields may be added, and the
            route may change with the site; the published method is the stable part, not the
            JSON envelope. If you build on it, pin to the fields you read and re-check after
            a release.
          </li>
        </ul>

        <h2>How do I call it from a script?</h2>
        <pre>{`# Headline result for one domain
curl -s "${SITE_URL}/api/scan?brief=1&domain=example.com"

# Full report, including every dimension and issue
curl -s "${SITE_URL}/api/scan?domain=example.com" | jq '{score, grade, issues: [.issues[].id]}'

# Homepage plus up to five sitemap pages
curl -s "${SITE_URL}/api/scan?domain=example.com&scope=site" | jq '.site.siteScore'`}</pre>
        <p>
          The parameters and response are implemented in{" "}
          <a
            href="https://github.com/Alex13192/geo-scanner/blob/main/app/api/scan/route.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            app/api/scan/route.ts
          </a>
          , and the site-scope budget in{" "}
          <a
            href="https://github.com/Alex13192/geo-scanner/blob/main/lib/geo/scan.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            lib/geo/scan.ts
          </a>
          . Both are readable, because a documented API that cannot be checked is a claim.
        </p>

        <h2>Can I use it commercially?</h2>
        <p>
          The endpoint is free and unauthenticated, and the source is MIT licensed. There is
          no service-level agreement: this is a small independent project, not a platform,
          and calling it in a loop is what the rate limit and the absence of a key exist to
          discourage. For bulk or agency work,{" "}
          <Link href="/pricing/">the paid measurement report</Link> is the supported path -
          and <Link href="/contact/">email</Link> if the shape of your work is not listed
          there.
        </p>

        <h2>Why is this endpoint not on the homepage?</h2>
        <p>
          Because the site is for people who want to know whether their pages can be cited,
          and most of them do not want a JSON envelope. The API is the same measurement for
          the readers who do - developers, agencies and anyone collecting data at a scale the
          interface does not serve. It is linked from the tools index, the navigation and{" "}
          <code>/llms.txt</code> so it is not a secret.
        </p>

        <Faq
          title="Questions about the scan API"
          level="h3"
          items={[
            {
              q: "Do I need an API key?",
              a: "No. The endpoint is public and unauthenticated, and the scanner stores no scan history. The rate limit is the only gate, and it is a best-effort one.",
            },
            {
              q: "Why is the rate limit not exact?",
              a: "Because it is enforced inside a Worker isolate, and Cloudflare runs many isolates. The counter stops one caller hammering one isolate; it is not a global quota. The honest limit is the published one rather than a number the architecture cannot deliver.",
            },
            {
              q: "Can I get every page of a site?",
              a: "Not every page. scope=site reads the homepage plus up to ten pages named by the sitemap, chosen section by section; five is the default. That is a budget rather than a sample, and the response states how many pages were considered and capped.",
            },
            {
              q: "Is the score the same as the report page shows?",
              a: "Yes. Both call the same analyser against the same support files, which is why the published study was collected through this endpoint. What differs is the presentation, not the measurement.",
            },
          ]}
        />
      </article>
    </ProsePage>
  );
}
