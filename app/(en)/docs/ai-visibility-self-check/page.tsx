import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";

import { og } from "@/lib/og";

const TITLE = "How to Check Whether AI Engines Mention Your Brand";
const DESCRIPTION =
  "A free self-check you run yourself: 20 questions to ask, the mechanical rule for scoring an answer, and why one run proves nothing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/docs/ai-visibility-self-check/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/docs/ai-visibility-self-check/",
    type: "article",
  }),
};

export default function Page() {
  return (
    <ArticleShell
      category="Method"
      title={TITLE}
      description={DESCRIPTION}
      readTime="6 min read"
      updated="October 2026"
      faq={{
        title: "Questions about checking AI visibility yourself",
        items: [
          { q: "How often should I run this check?", a: "Monthly, with the same questions. Ask each one three times on the day you run it. A single answer is an anecdote; three answers with the date and the model recorded are a baseline you can compare against." },
          { q: "Which engine should I test?", a: "The one your buyers actually use, reported on its own. Averaging ChatGPT and Perplexity into one number hides the fact that they retrieve differently — and with twenty questions the difference between two engines is usually noise rather than a finding." },
          { q: "Can this be automated?", a: "Only by calling the platforms. There is no free way to know what an AI engine answered: you either ask it, or you buy a tool that asks it for you. This method is the asking done by hand, which is why it costs nothing and why it cannot run while you sleep." },
        ],
      }}
    >
      <p>
        <strong>You can check whether AI engines mention your brand in about an hour, for free, and
        without any tool.</strong> What you cannot do is check it once and draw a conclusion. This
        page gives you the questions to ask, the mechanical rule for scoring an answer, and the
        recording discipline that separates a measurement from a story you tell yourself.
      </p>
      <p>
        One thing to be clear about before you start: <strong>the LLMention scanner does not do
        this.</strong> It reads your pages and scores them against 40 published checks, and it never
        asks an AI engine anything. That is a deliberate limit rather than a gap — measuring what an
        engine says means querying it, which costs money per run, and this site does not make claims
        it has not measured. The method below is what we recommend instead, and we would rather you
        run it yourself than buy a number from someone who cannot show you how it was produced.
      </p>

      <h2>Why is one AI answer not a measurement?</h2>
      <p>
        Because the same question does not produce the same answer twice. Three things move between
        runs: the <strong>model version</strong> (silently updated under a stable name), the{" "}
        <strong>date</strong>, and the <strong>session</strong> — a fresh conversation and an
        ongoing one differ, and personalisation and region change what is retrieved. Ask once and
        you have observed one sample from a distribution you cannot see.
      </p>
      <p>
        This is why the honest version of the measurement costs effort: ask each question three
        times, on the same day, and report the three results rather than a single one. If a brand
        appears in one of three answers, the finding is &ldquo;one of three&rdquo; — not
        &ldquo;33% of users see you&rdquo;, which is what a rate implies and what the sample cannot
        support.
      </p>

      <h2>What kinds of question should I ask?</h2>
      <p>
        Four kinds, and they measure different things. Keeping them apart is the difference between
        a useful check and a comforting one:
      </p>
      <ul>
        <li>
          <strong>Category questions</strong> — no brand name in them. &ldquo;Which vendors do X?&rdquo;
          This is the one that measures reach: whether you are found by someone who does not know you
          exist.
        </li>
        <li>
          <strong>Scenario questions</strong> — a problem, no brand name. &ldquo;How do I solve Y?&rdquo;
          These test whether a recommendation follows from a need rather than from a category list.
        </li>
        <li>
          <strong>Comparison questions</strong> — your brand against a named alternative. These show
          whether you can enter a shortlist at all, and they are the ones most often answered with
          &ldquo;it depends&rdquo;.
        </li>
        <li>
          <strong>Fact questions</strong> — your brand by name, about verifiable details: legal name,
          founding date, what the product does, who it is for. These measure accuracy rather than
          reach, and they are where errors are expensive.
        </li>
      </ul>
      <p>
        Category and scenario questions are the ones to watch for growth, because a mention there is
        a mention you did not pay for. Fact questions are the ones to watch for danger.
      </p>

      <h2>Which questions should I start with?</h2>
      <p>
        Twenty is enough to start and small enough to actually finish. Replace the bracketed parts
        with your own words — <code>[category]</code>, <code>[product type]</code>,{" "}
        <code>[competitor]</code> — and add the language your buyers use, because a question asked in
        English and the same question asked in Mandarin are two different measurements.
      </p>
      <pre>{`Category (no brand name)
1.  Which companies offer [product type] for [audience]?
2.  What are the best [category] tools in 2026?
3.  Who are the main vendors in [category]?
4.  Which [product type] is suitable for [size / region / industry]?
5.  What should I look for when choosing [category]?

Scenario (a problem, no brand name)
6.  How do I solve [problem the product solves]?
7.  What is the cheapest way to [outcome]?
8.  How do teams like mine handle [workflow]?
9.  What alternatives exist when [common constraint]?
10. How do I compare [approach A] and [approach B]?

Comparison (your brand against a named one)
11. [Your brand] vs [competitor]: which is better for [use case]?
12. Is [your brand] worth it compared with [competitor]?
13. What are the disadvantages of [your brand]?
14. Which is easier to set up, [your brand] or [competitor]?
15. If I need [requirement], should I choose [your brand]?

Fact (your brand by name)
16. What does [your brand] do?
17. Who owns [your brand] and when was it founded?
18. What does [your brand] cost?
19. Which company is behind [your product name]?
20. Does [your brand] handle [specific requirement]?`}</pre>

      <h2>How do I score an answer?</h2>
      <p>
        Six checks, all mechanical. They are written so that two people reading the same answer reach
        the same verdict, which is what makes the result worth recording:
      </p>
      <ol>
        <li>
          <strong>Mentioned</strong> — the brand name or a known alias appears anywhere in the
          answer.
        </li>
        <li>
          <strong>Mentioned early</strong> — the first mention is within roughly the first 300
          characters. An answer that names you in its last paragraph is not an answer that surfaces
          you.
        </li>
        <li>
          <strong>In the candidate list</strong> — the mention sits in a bulleted or numbered list of
          options, rather than in passing prose. Lists are where a reader makes a choice.
        </li>
        <li>
          <strong>Carries a recommendation</strong> — within about 120 characters of the mention there
          is a recommending verb: <em>recommend</em>, <em>best for</em>, <em>worth considering</em>,{" "}
          <em>a good fit</em>. A mention without one of these is a name, not a suggestion.
        </li>
        <li>
          <strong>Sources cited</strong> — collect the domains the answer links to. If your own domain
          is not among them, the engine is describing you from somewhere else, and you do not control
          how.
        </li>
        <li>
          <strong>Honest gap</strong> — for fact questions, &ldquo;I cannot confirm that&rdquo; is a
          pass, and a confident wrong answer is a fail. A blank is recoverable; a wrong number that a
          customer quotes back at you is not.
        </li>
      </ol>
      <p>
        Record the six results per question, not a feeling. The one that usually matters most is
        number five: sources are the part of an AI answer you can actually influence, and they are
        also the part most people never look at.
      </p>

      <h2>How do I record it so it is worth something?</h2>
      <p>
        <strong>Fix the conditions before you start, or the second run is not comparable to the
        first.</strong> Same questions, same model version, same language, same day, fresh session
        each time, and three runs per question inside a 24-hour window. Write down the date and the
        model name you were shown, and save the raw answer text — a screenshot or a paste, whichever
        you will still have in three months.
      </p>
      <p>
        Then compare runs to each other, not to a number from a vendor. A change from &ldquo;mentioned
        in 2 of 3 category questions&rdquo; to &ldquo;3 of 3&rdquo; is a real observation you can
        verify. &ldquo;Visibility went from 21% to 34%&rdquo; is arithmetic performed on twenty
        samples, and it will not survive being asked how it was calculated.
      </p>

      <h2>What can this method not tell you?</h2>
      <ul>
        <li>
          <strong>It cannot give you a rate.</strong> Twenty questions asked three times is sixty
          samples per engine. Enough to notice a change, nowhere near enough for a percentage that
          describes your market.
        </li>
        <li>
          <strong>It does not represent all users.</strong> Engines personalise by region, history and
          account, and a vendor console sees a different answer from your laptop.
        </li>
        <li>
          <strong>It cannot run while you sleep.</strong> Automation means paying per query, which is
          the whole reason this method exists in its manual form.
        </li>
        <li>
          <strong>Small differences between engines are noise.</strong> With twenty questions, a
          five-point gap between two platforms is not a finding about the platforms.
        </li>
      </ul>

      <h2>What should I do with the result?</h2>
      <p>
        <strong>Before you work on being mentioned, check whether you can be read.</strong> An engine
        cannot cite a page it cannot fetch, and no amount of content fixes a crawler that is refused
        at the edge. Run the <a href="/report/">free audit</a> on the pages you care about: it reports
        crawler access, whether the answer-bearing content is machine-legible, and whether the facts a
        model would repeat about you are consistent across your own pages.
      </p>
      <p>
        Then fix in this order, because each one makes the next cheaper:
      </p>
      <ol>
        <li>
          Access — see <a href="/checks/robots-ai-allowed/">the crawler access rule</a> and the guide
          to <a href="/docs/allow-ai-crawlers/">allowing AI crawlers through robots.txt and your
          firewall</a>.
        </li>
        <li>
          Retrievability — question-shaped headings with an immediate answer underneath, covered in{" "}
          <a href="/docs/qa-style-headings/">optimizing headings for direct AI citation</a>.
        </li>
        <li>
          Identity — entity markup so a model can tell your brand from a similarly named one, in{" "}
          <a href="/docs/schema-org-jsonld/">implementing Schema.org JSON-LD</a>.
        </li>
        <li>
          Evidence — the statistics, quotations and cited sources that the published GEO research
          measures as the largest single gain. Every rule is listed on the{" "}
          <a href="/methodology/">methodology page</a>.
        </li>
      </ol>
      <p>
        Run the twenty questions again a month later. If the fixes worked, the change you should see
        first is not more mentions — it is the fifth check, the sources, starting to include pages you
        control. That is the leading indicator, and it is the one this site can help with directly:{" "}
        <a href="/monitor/">the weekly report</a> re-runs the technical checks for you and tells you
        what changed, so that the hour you spend on the questions is spent on the part no scan can do.
      </p>
    </ArticleShell>
  );
}
