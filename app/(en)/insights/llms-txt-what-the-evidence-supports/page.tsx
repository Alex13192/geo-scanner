import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { og } from "@/lib/og";

const insight = getInsight("llms-txt-what-the-evidence-supports");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: insightPath(insight.slug) },
  openGraph: og({
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
        title: "Questions about llms.txt",
        items: [
          {
            q: "Do I need an llms.txt to be cited by AI search?",
            a: "No. Nothing this site could measure shows the file being read, and the crawler documentation that exists points at robots.txt instead. Publish one if you want a machine-readable summary; do not expect it to move a score.",
          },
          {
            q: "Will publishing one hurt anything?",
            a: "Only if it says something false. A file that describes a product you do not have, or links to pages that do not exist, is a claim a reader or a model can check, and it costs more than the file is worth.",
          },
          {
            q: "Why does the scanner check it at all, then?",
            a: "Because it is cheap, because a site that publishes one has had to write down what it is, and because leaving it out would make the score blind to a convention a large part of this category has adopted.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("reading-a-failed-check"),
          label: "How to read a failed check and fix the right thing",
          note: "The llms.txt rule tests structure, not truth. That is the same gap every rule page has to state.",
        },
        {
          href: insightPath("entity-markup-gap"),
          label: "22 of 30 sites leave AI guessing who they are",
          note: "The file that costs more to skip: 12% of the score, and most of the sample does not have it.",
        },
      ]}
    >
      <p>
        llms.txt is a proposed markdown file at a domain root that describes the site for
        machines. It is cheap to publish, widely recommended, and supported by less evidence
        than almost anything else in this category — which is exactly why it is a good test of
        whether a tool is willing to say so.
      </p>
      <p>
        This site publishes one, checks for one, and weights it at{" "}
        <strong>3.3 of the 100 points</strong>. Those three facts are only consistent if the
        check is about the cost of publishing, not the value of being read. That is the position
        this piece argues for.
      </p>

      <h2>What is llms.txt?</h2>
      <p>
        A markdown file at <code>/llms.txt</code> containing a title, a one-line summary and a
        set of links, written for a language model rather than a browser.
      </p>
      <p>
        The convention is documented at{" "}
        <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">
          llmstxt.org
        </a>
        , which is the primary source and the only one worth reading before forming an opinion
        about it. The shape is deliberately simple: an H1 with the project name, a blockquote
        summary, then sections of links with one line of context each.
      </p>

      <h2>What does the scanner actually test?</h2>
      <p>
        Four structural properties: the file is larger than 20 bytes, it contains an H1, it
        contains a <code>&gt;</code> summary line, and it contains at least three markdown
        links. Missing any of them is a partial pass.
      </p>
      <p>
        What the file says is not judged. Three links to pages that do not exist pass the
        structure test, which is the clearest example on this site of a rule measuring the
        presence of a signal rather than its quality — and the rule page says so in as many
        words.
      </p>

      <h2>Does any crawler document reading it?</h2>
      <p>
        Not the ones we could open. OpenAI&rsquo;s help centre and Anthropic&rsquo;s crawler
        article both specify <code>robots.txt</code> as the control surface; neither commits to
        reading an llms.txt.
      </p>
      <p>
        That is a statement about documentation, not about behaviour, and the difference matters.
        A crawl policy can be documented and still be ignored, and an undocumented convention can
        be adopted quietly. What can be said honestly is narrower: no vendor has published a
        commitment, so a site owner cannot reason from evidence to an expected outcome.
      </p>

      <h2>Then why weight it at all?</h2>
      <p>
        Because it is nearly free to publish, and a small weight is the correct price for a
        signal whose effect is unmeasured. The arithmetic is published rather than hidden.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Points</th>
              <th>Dimension weight</th>
              <th>Ceiling on the total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>The llms.txt structure check</td>
              <td>4 of 6 in the dimension</td>
              <td>5%</td>
              <td>3.3 of 100</td>
            </tr>
            <tr>
              <td>robots.txt is readable</td>
              <td>1 of 6 in the dimension</td>
              <td>5%</td>
              <td>0.8 of 100</td>
            </tr>
            <tr>
              <td>For comparison: crawler access</td>
              <td>—</td>
              <td>16%</td>
              <td>16 of 100</td>
            </tr>
            <tr>
              <td>For comparison: machine readability</td>
              <td>—</td>
              <td>12%</td>
              <td>12 of 100</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        A perfect llms.txt is worth <strong>3.3</strong> points. Allowing the crawlers in is
        worth <strong>16%</strong> of the score, and getting the entity markup right is worth
        <strong>12%</strong>. A site deciding where to spend an afternoon has its answer in that
        comparison, and it is not the file.
      </p>

      <h2>What is the file genuinely good for?</h2>
      <p>
        Two things that have nothing to do with rankings: a readable summary for tools that do
        read it, and a forcing function for the site owner.
      </p>
      <ul>
        <li>
          <strong>Documentation sites and coding agents.</strong> A well-written llms.txt is a
          useful navigational summary for a tool summarising a repository or a docs tree, and
          that use does not depend on any search engine adopting it.
        </li>
        <li>
          <strong>Writing the summary is the exercise.</strong> Describing what the site is in
          one sentence, truthfully, exposes copy that cannot do it — and that sentence is needed
          in the meta description, the Organization node and the pitch anyway.
        </li>
        <li>
          <strong>It is cheap to keep correct.</strong> The links are the ones in the
          navigation, so a regeneration is a diff, not an essay.
        </li>
      </ul>

      <h2>What does a non-fictional one look like?</h2>
      <p>
        Short, and generated from the page rather than from a template. Every line below could be
        checked against the site it describes.
      </p>

      <pre>{`# Your Brand

> One sentence on what the product does, written for a reader who has
> never seen the site.

## Core pages

- [Product](https://your-domain.com/product/): what it does and who it is for
- [Pricing](https://your-domain.com/pricing/): what costs money and what does not
- [About](https://your-domain.com/about/): who runs it and how to reach them

## Notes

- The tool is free and requires no account.`}</pre>

      <p>
        The two failure modes are visible in that shape. A file generated from a template drifts
        the moment the site changes. A file generated from the page&rsquo;s real title,
        description and navigation cannot describe something the site does not contain — which
        is the property the{" "}
        <Link href="/llms-txt-studio/">llms.txt studio</Link> is built around, and the reason it
        reads the homepage instead of asking you to type.
      </p>

      <h2>What should I do instead of optimising the file?</h2>
      <p>
        Fix what the score actually weights. Crawler access, entity markup and answer-first
        structure together carry more than four times the weight of the context file.
      </p>
      <ol>
        <li>
          Check <code>robots.txt</code> admits the crawlers you want citations from. This is the
          16% dimension, and it is one file.
        </li>
        <li>
          Declare the entity and its <code>sameAs</code> profiles. That is the 12% dimension and a
          dozen lines of JSON.
        </li>
        <li>
          Rewrite headings as questions with a one-sentence answer underneath. That is the 10%
          dimension, and it costs editing rather than infrastructure.
        </li>
        <li>
          Publish the llms.txt after those, because it is a summary of a site you have already
          made describable.
        </li>
      </ol>
      <p>
        The method behind those weights, including the argument for weighting this file low, is
        on the <Link href="/methodology/">methodology page</Link>; the deployment details are in{" "}
        <Link href="/docs/llms-txt-deployment/">the llms.txt guide</Link>.
      </p>
    </PostShell>
  );
}
