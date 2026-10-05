import type { Metadata } from "next";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import ProsePage from "@/app/components/ProsePage";
import { CONTACT_EMAIL } from "@/lib/site";

import MonitorForm from "./MonitorForm";
import { og } from "@/lib/og";

/**
 * The signup page for the weekly report.
 *
 * DO NOT MERGE THIS BEFORE THE CRON WORKER EXISTS. The page promises a report "on the next
 * weekly run", and there is no run yet - which is the failure OPERATIONS.md records in its
 * own words: "a page that describes a process you do not run is worse than a page that says
 * nothing". This branch is where both halves are being built; they merge together or not at
 * all, and until then this comment is the thing standing between the two.
 *
 * The content below is written to be checkable rather than persuasive. It says what the
 * report contains, which checks it runs, what is stored, and how to stop it - all of which
 * are either true already or become true in the same merge as the cron. Nothing here claims
 * a benefit the product does not have, because the audience is people who will open the
 * first email and compare it against this page.
 */

const TITLE = "Weekly GEO report";
const DESCRIPTION =
  "Get an email when a site's GEO score changes. It runs the same 40 published checks every week, names the checks that newly fail, and stops with one click.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/monitor/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/monitor/",
  }),
};

const FAQ_ITEMS = [
  {
    q: "What arrives in the email?",
    a: "The score, the grade, and what changed since the previous run: which checks newly pass, which newly fail, and the evidence the failing ones saw. A report with no change says so in one line rather than padding itself out.",
  },
  {
    q: "How often does it run, and when?",
    a: "Once a week, in a single batch, rather than on demand. The scan reads robots.txt, the homepage, llms.txt and the sitemap the same way the free scanner does, so a weekly report and a manual scan of the same site cannot disagree.",
  },
  {
    q: "Do I need an account?",
    a: "No. The email address is the whole subscription: confirming it starts the report, and the unsubscribe link in every message ends it. There is no password to set, no dashboard to log in to, and nothing to cancel.",
  },
  {
    q: "What is stored about me?",
    a: "The domain, the email address, and the score history for that domain. Nothing else, and nothing is sold or shared. The unsubscribe link is in every message and works with one click, months later, without logging in.",
  },
  {
    q: "Can I watch more than one domain?",
    a: "Yes, by signing up once per domain with the same address. Note that unsubscribing stops every report to that address rather than only the one the link came from, because a link that leaves other messages arriving is the thing recipients report as spam.",
  },
  {
    q: "Why does it need confirming?",
    a: "Because anyone can type an address that is not theirs. The confirmation proves the address asked for the report, which protects the person whose address it is and keeps the sending domain out of spam filters.",
  },
];

export default function MonitorPage() {
  return (
    <ProsePage
      eyebrow="Weekly report"
      title="Watch a site's GEO score, week by week"
      description={
        <p>
          The scanner answers whether AI search engines can reach, read and cite a page right
          now. This answers the other question: whether that changed. Enter a domain and an
          address, confirm it, and the same 40 checks run once a week.
        </p>
      }
      action={{ href: "/", label: "← Back to Scanner" }}
    >
      {/*
        The form sits above the prose, not inside it. Somebody who arrived from a newsletter
        or a link already knows what this is; making them read three paragraphs before they
        can act is how a signup page loses the signup.
      */}
      <section className="mb-14 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6 sm:p-7">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--ink-1)]">
          Start the weekly report
        </h2>
        <MonitorForm />
        <p className="mt-3 text-sm text-[var(--ink-3)]">
          Free, no account. The unsubscribe link in every message works without signing in.
        </p>
      </section>

      <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
        <h2>What the report contains</h2>
        <p>
          Each report carries the current score and grade, then the difference from the week
          before rather than the whole picture again. The interesting line is almost always
          the same one - <strong>a check that passed last week and fails now</strong> - and a
          report that buries it under twelve dimension tables is a report nobody reads after
          the third week.
        </p>
        <p>
          A failing check is named, along with the evidence behind the verdict and a link to
          the page that explains what it wants. The scanner publishes every rule it applies,
          so a report can be argued with rather than taken on trust: if a verdict looks wrong,
          the rule, its wording and its weight are all readable at{" "}
          <a href="/methodology/">methodology</a>.
        </p>
        <p>
          Nothing in the weekly run is scored differently from a manual scan. Both call the
          same engine over the same four files, which is the only way the two numbers can be
          compared to each other at all.
        </p>

        <h2>How the weekly run works</h2>
        <ol>
          <li>
            <strong>One batch a week.</strong> Every confirmed subscription is scanned in the
            same run, oldest-scan-first, so a slow week cannot starve one subscriber while
            another is served twice.
          </li>
          <li>
            <strong>The four files a GEO audit needs.</strong> robots.txt, the homepage,
            llms.txt and the sitemap, requested over whichever scheme answered. A site that
            refuses one of them is reported as refusing it rather than scored as if the file
            were absent - the two mean different things.
          </li>
          <li>
            <strong>Diffed against the last run.</strong> The previous score and the previous
            list of failing checks are stored precisely so the email can say what moved.
          </li>
          <li>
            <strong>Emailed, with a one-click unsubscribe.</strong> No confirmation step on
            the way out, and no reason asked for.
          </li>
        </ol>

        <h2>What is collected, and what happens to it</h2>
        <p>
          A subscription stores three things: the domain, the address to send to, and the
          score history for that domain. It is not sold, not shared, and not used to build a
          profile of anything. The withdrawal is recorded rather than the row deleted, so a
          request to know what was held can be answered after the fact - the detail is in the{" "}
          <a href="/privacy/">privacy policy</a>, which names the retention period rather than
          describing one in general terms.
        </p>
        <p>
          If the scanner reports something about a site that looks wrong, the same address
          that receives the report is the one that reaches the person who wrote the rule:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </article>

      <div className="mt-16 space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
        <Faq title="Questions about the weekly report" items={FAQ_ITEMS} />
        <Evidence
          quote={GEO_PRIMARY_QUOTE}
          attribution="Generative Engine Optimization, KDD 2024"
          attributionUrl="https://arxiv.org/abs/2311.09735"
          sources={GEO_PRIMARY_SOURCES}
          note="The weekly run applies the same weightings this research produced, which is why a change in citability moves the score further than a change in a missing viewport tag."
        />
      </div>
    </ProsePage>
  );
}
