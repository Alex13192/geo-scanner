import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("faqpage-schema-after-rich-results");
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
        title: "Questions about FAQPage markup",
        items: [
          {
            q: "Do FAQ rich results still exist?",
            a: "For most sites, no. Google restricted FAQ rich results in August 2023 to a small set of well-known authoritative government and health sites. The markup is still supported and still valid, but the visible rich result is not something most sites should expect.",
          },
          {
            q: "If there is no rich result, why add FAQPage at all?",
            a: "Because the value is not only the rich result. A page with real question-and-answer pairs is easier to extract from, and FAQPage is the machine-readable version of that structure. It is a low-cost way to state explicitly what the page already shows. It is not a citation guarantee.",
          },
          {
            q: "Can I mark up questions that are not visible on the page?",
            a: "You can produce markup that validates, but you should not: it makes a claim the page does not support, and it is the kind of structured-data spam that gets ignored or penalised. The questions and answers in the markup should match the words a reader can see.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("entity-graph-organization-website-softwareapplication"),
          label: "The entity graph: Organization vs WebSite vs SoftwareApplication",
          note: "The other structured-data layer: who the page is about, rather than what it answers.",
        },
        {
          href: insightPath("reading-a-failed-check"),
          label: "How to read a failed check",
          note: "Why a passed markup check and a useful page are different claims.",
        },
        {
          href: "/checks/faq/",
          label: "The rule this article is about",
          note: "Three points for a FAQPage node, a partial pass for disclosure markup, and what the check does not compare.",
        },
      ]}
    >
      <p>
        FAQPage is the schema most likely to be added by habit. For years it was the reliable way
        to get a rich result: mark up a few questions, and the search result grew a list of
        expandable answers. Then Google restricted the rich result, and the markup was left in
        place on a lot of sites without anyone asking what it still does. This article is about
        what it still does, what it does not, and how to use it without producing the kind of
        markup that only exists to satisfy a checklist.
      </p>

      <h2>What changed</h2>
      <p>
        In August 2023, Google limited FAQ rich results to a small set of well-known authoritative
        government and health sites. For most sites the markup is still supported and still valid,
        but it no longer produces the expandable rich result that motivated it. Google&rsquo;s{" "}
        <a
          href="https://developers.google.com/search/docs/appearance/structured-data/faqpage"
          rel="noopener noreferrer"
        >
          FAQPage documentation
        </a>{" "}
        is the place to confirm the current policy; the important part for a site owner is that
        "markup present" and "rich result shown" stopped being the same thing.
      </p>
      <p>
        That does not make the markup worthless. It changes the reason to use it. If the only
        reason was the rich result, the reason is mostly gone. If the reason is that the page
        genuinely contains a set of buyer questions and answers, and stating that structure
        explicitly helps a machine parse it, the markup is still a cheap and honest signal.
      </p>

      <h2>What a FAQ page is actually good for now</h2>
      <ul>
        <li>
          <strong>Extraction.</strong> A question followed by a direct answer is the shape an
          answer engine wants. The markup makes that boundary explicit instead of leaving it to a
          parser to infer from headings.
        </li>
        <li>
          <strong>Consistency.</strong> Writing the questions down as structured data forces the
          page to answer them in visible text. A FAQPage whose questions appear nowhere in the body
          is a claim the page cannot support.
        </li>
        <li>
          <strong>Support and documentation.</strong> On help pages, a real question list is
          useful to readers first; the markup is a description of that list, not a substitute.
        </li>
        <li>
          <strong>Small cost.</strong> A handful of <code>Question</code>/
          <code>acceptedAnswer</code> pairs is a few hundred bytes. The risk is not the size; it is
          the temptation to mark up questions no one asked.
        </li>
      </ul>

      <h2>The shape of a valid, honest FAQPage</h2>
      <p>
        The visible content comes first. The markup repeats what is already there, with the same
        wording, on the same page.
      </p>
      <pre>{`{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Does a FAQPage still produce a rich result?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For most sites, no. Google restricted FAQ rich results in 2023 to a small set of authoritative government and health sites."
      }
    }
  ]
}`}</pre>
      <p>
        Three details matter more than the JSON syntax. One: one <code>FAQPage</code> per page,
        covering the questions on that page, not a copy of the site-wide FAQ on every URL. Two:
        the <code>name</code> and <code>text</code> should match the visible question and answer,
        including the qualifying sentence that stops the answer being over-read. Three: the
        questions should be ones a reader would actually ask — the test is whether the page is
        better because the answer is written down, not whether the markup validates.
      </p>

      <h2>What the scanner checks — and what it does not</h2>
      <p>
        The rule is <Link href="/checks/faq/">faq</Link>, worth 3 points in the answer readiness
        dimension. The condition is a parsed <code>FAQPage</code> node. A page that uses{" "}
        <code>&lt;details&gt;</code>/<code>&lt;summary&gt;</code> without the schema gets a partial
        pass, because the Q&amp;A structure exists but is not machine-labelled.
      </p>
      <p>
        The rule page is explicit about the limit: a FAQPage with an empty <code>mainEntity</code>{" "}
        list, or one whose questions appear nowhere in the visible text, still passes. Comparing
        the markup with the page is a judgement the scanner does not make. That is the same trade
        as the other markup checks — cheap presence, honest note — and it is why a green check here
        means "there is a node", not "there is a useful FAQ".
      </p>

      <h2>What to do instead of adding FAQPage everywhere</h2>
      <p>
        Markup is not the first move. If a page has no real questions, adding FAQPage does not give
        it any; it gives it a structure with nothing behind it. The order that works is:
      </p>
      <ol>
        <li>
          <strong>Find the questions people actually ask</strong> — from support mail, sales calls,
          search queries and the questions a buyer asks before paying. Five to ten is enough.
        </li>
        <li>
          <strong>Write the answers on the page</strong>, in the same words the markup will use.
          Short, specific, with the limits stated.
        </li>
        <li>
          <strong>Mark up those pairs</strong>, with one FAQPage node for the page.
        </li>
        <li>
          <strong>Validate</strong> the markup and compare the visible questions with the schema;
          remove any pair that exists only in the JSON.
        </li>
      </ol>

      <h2>How to check a page you already have</h2>
      <pre>{`# 1. Is there a FAQPage node in the server response?
curl -sS https://your-domain.com/page/ | grep -c 'FAQPage'

# 2. Count how many questions the markup claims
curl -sS https://your-domain.com/page/ \\
  | python -c "import sys,json,re; html=sys.stdin.read(); \\
      blocks=re.findall(r'<script[^>]*application/ld\\\\+json[^>]*>(.*?)</script>', html, re.S); \\
      pages=[json.loads(b) for b in blocks]; \\
      print(sum(len(p.get('mainEntity', [])) for p in pages))"

# 3. Count the visible question headings on the page (by hand is fine)
grep -o '<h[23][^>]*>[^<]*?</h[23]>' <<< "$(curl -sS https://your-domain.com/page/)" | wc -l`}</pre>
      <p>
        If the schema count is higher than the number of visible questions, the page is claiming
        more than it shows. That is the failure to look for; it does not show up in a validator,
        because the JSON is valid either way.
      </p>

      <h2>What FAQPage does not do</h2>
      <p>
        It does not restore the rich result for most sites, it does not make a page rank, and it
        does not guarantee that an AI engine reads or quotes the answers. What it does is describe
        a structure that is already useful when the questions are real. That is a small, honest
        benefit — which is exactly the right size for a markup property that costs a few hundred
        bytes.
      </p>
      <p>
        The general rule from the rest of this series applies here too: add the markup because the
        page already earns it, not because a check expects it. A FAQ written for a check is a FAQ
        nobody asked.
      </p>
    </PostShell>
  );
}
