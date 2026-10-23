import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("reading-a-failed-check");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* Translated into Chinese on 2026-10-23; the pair is claimed on both pages. */
    languages: {
      en: `/insights/${insight.slug}/`,
      "zh-Hans": `/zh/insights/${insight.slug}/`,
      "x-default": `/insights/${insight.slug}/`,
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
        title: "Questions about reading a failure",
        items: [
          {
            q: "Should I fix every failed check?",
            a: "No. Some rules do not apply to some page types, some are worth less than the edit costs, and one or two are deliberate trades. A failure is a claim about the page; whether to act on it is a decision with a price.",
          },
          {
            q: "What is the fastest way to tell a real failure from an artefact?",
            a: "Read the status and the evidence line. A non-200 status means the number describes the response; an evidence line that names what the scanner saw tells you whether the rule was applied to the thing you think it was.",
          },
          {
            q: "Does a partial pass matter?",
            a: "Sometimes. A partial pass is points left on the table, not a failure, and the arithmetic is published per rule. It matters when the missing points are cheap and not when the only way to get them is padding.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("llms-txt-what-the-evidence-supports"),
          label: "llms.txt: what the evidence actually supports",
          note: "One rule where the honest answer is to publish the file and stop expecting more from it.",
        },
        {
          href: insightPath("entity-markup-gap"),
          label: "22 of 30 sites leave AI guessing who they are",
          note: "One rule where the honest answer is to do the work: the markup is cheap and the gap is most of the sample.",
        },
      ]}
    >
      <p>
        A failed check is a claim about your page, not an instruction. The rule pages on this
        site publish four things for exactly that reason: the condition the scanner tests, what
        a failure means, what the check does not test, and the fix for each way it can fail.
        Reading three of those before editing is the difference between a fix and a rewrite.
      </p>
      <p>
        The failure itself is worth a number for context. In the study of 30 homepages,{" "}
        <strong>53%</strong> graded F and <strong>7%</strong> reached a B, and almost every one
        of the low scores came from several unrelated rules failing together rather than from one
        catastrophic problem.
      </p>

      <h2>What does a failed check actually tell me?</h2>
      <p>
        That one condition was not met, with the evidence the scanner saw when it tested it. It
        does not tell you why, and it does not tell you the fix — those are separate sentences on
        the rule page.
      </p>
      <p>
        Each rule page carries the same structure: what the check looks at, what a failure means,
        the steps to fix it, and a note on what the check does not test. The last one is the most
        useful and the most often skipped. It is where a rule admits it counts presence rather
        than quality — the quotation rule passes on any <code>blockquote</code>, and the entity
        rule passes on any declared type.
      </p>

      <h2>Does this check apply to a page like mine?</h2>
      <p>
        Usually, but not always. The scanner has page-type exemptions, and the report shows a
        count of checks that were not applicable rather than silently scoring them zero.
      </p>
      <p>
        Word count is the clearest example. A legal page or a contact page is not going to carry
        800 words of prose, and holding it to a content page&rsquo;s length would measure the
        page type rather than the writing. If a rule appears in your list, it applied; if the
        report says a check was not applicable, deleting content to satisfy it is the wrong
        response to a failure that never happened.
      </p>

      <h2>Is the number about my page or about the response?</h2>
      <p>
        Check the status first. A 401, 403, 429, 202 or 520 means the score describes an error
        response, and content work cannot move it.
      </p>
      <p>
        This is not a hypothetical: in the study, <strong>30%</strong> of the homepages never
        produced a page, and their scores measure the refusal. The scanner flags them as aborted
        and excludes them from the mean, but the number is still printed next to the domain, so
        the reader has to know which kind of number they are looking at. The piece on those nine
        rows goes through the codes one by one.
      </p>

      <h2>Is it asking for a real improvement or a padded number?</h2>
      <p>
        Sometimes it is a number. The word count rule passes at 800 words and gives a partial
        pass from 300 to 799, so a page at 796 words loses points for being four words short of a
        threshold.
      </p>
      <p>
        The honest responses are to say more that is worth saying, or to accept the partial
        pass. The dishonest one is filler, and it is worse than the missing points: a reader who
        notices padding trusts the rest of the page less, and the rules that follow — answer
        first, extractables, citations — only work on text that says something.
      </p>
      <p>
        This site publishes a page that fails its own word count rule rather than pad it, and
        says so in the rule page&rsquo;s note. That is the same trade stated in public, which is
        the only version of it a reader can check.
      </p>

      <h2>What does a good fix look like compared with a bad one?</h2>
      <p>
        The bad fix satisfies the condition. The good fix satisfies the reason the condition
        exists, and then the condition follows.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Failure</th>
              <th>Fix that satisfies the rule</th>
              <th>Fix that satisfies the reason</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Word count partial at 740 words</td>
              <td>Add 60 words of restatement</td>
              <td>Add the worked example readers keep asking for</td>
            </tr>
            <tr>
              <td>Crawler user-agent disallowed</td>
              <td>Add an Allow line to robots.txt</td>
              <td>Check the CDN, because the firewall may still return 403</td>
            </tr>
            <tr>
              <td>No quotations on the page</td>
              <td>Quote a sentence from the page itself</td>
              <td>Quote the primary source the claim rests on</td>
            </tr>
            <tr>
              <td>No markdown alternate</td>
              <td>Hand-write a twin that drifts within a month</td>
              <td>Generate it from the same source, or accept the miss</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The last row is this site&rsquo;s own example. The homepage has no markdown twin, the
        check fails, and the site publishes the failure rather than softening the rule or writing
        a copy that would disagree with the page it mirrors six weeks later. A rule the author
        cannot satisfy honestly is evidence about the rule, and it belongs in the notes rather
        than in a workaround.
      </p>

      <h2>When should I ignore a failed check?</h2>
      <p>
        Three cases, all of which should be written down: the rule does not apply, the trade is
        deliberate, or the fix costs more than the points are worth.
      </p>
      <ul>
        <li>
          <strong>It does not apply.</strong> A page type the rule exempts, or a rule that tests
          a signal your site has no reason to carry. The report says which.
        </li>
        <li>
          <strong>The trade is deliberate.</strong> Blocking an AI crawler is a policy decision;
          a site that has made it on purpose should expect the points to fall and should not
          undo the policy to recover them.
        </li>
        <li>
          <strong>The fix costs more than it buys.</strong> A rule weighted 2% that needs a
          week of work is not next after the 16% rule that needs an afternoon. The weights are
          published so this comparison can be made before the work.
        </li>
      </ul>

      <h2>How do I stop fixing the same thing twice?</h2>
      <p>
        Re-scan after the change and compare the failure list rather than the score. The score
        moves for several reasons at once; the list is the thing you edited.
      </p>
      <p>
        If the fix was real, the rule disappears from the list and stays gone. If it was padding,
        it tends to come back the next time the page changes — which is the practical argument
        against padding, independent of anyone&rsquo;s opinion about it.
      </p>
      <p>
        Every rule is published at <Link href="/checks/">the check reference</Link>, one page
        each, with its weight and its stated limits; the arithmetic across all 40 is on the{" "}
        <Link href="/methodology/">methodology page</Link>.
      </p>
    </PostShell>
  );
}
