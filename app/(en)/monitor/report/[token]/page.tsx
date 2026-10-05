import { Suspense } from "react";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";

import ReportLinkWidget from "./ReportLinkWidget";

/**
 * /monitor/report/<token>/ — the stable URL a subscriber can forward.
 *
 * WHY A PAGE RATHER THAN A LINK STRAIGHT TO /report/. Three differences, and each one is the reason
 * this route exists at all:
 *
 *   1. It needs no domain typed. The weekly email used to link to the subscriber's own homepage,
 *      because the reader's next question is what their site looks like now - but that makes the
 *      email's only "see more" link point away from the product. A token names the subscription, so
 *      the link can open the history instead.
 *   2. It shows what the stored rows contain across weeks, which no other page does. /report/ is a
 *      live single scan with no memory; this is the same subscription over time.
 *   3. It is shareable without being guessable, which is what makes it usable as a deliverable: a
 *      report that cannot be forwarded is a report somebody has to paste into an email by hand.
 *
 * THE COPY BELOW IS SERVER-RENDERED ON PURPOSE. The widget is the only client-side part of this
 * route, and everything a reader or a crawler sees without JavaScript is written here. This is not
 * a stylistic preference: /llms-txt-studio/ once prerendered to the string "Loading Studio..." and
 * shipped two words of HTML because the whole page was a client component, and that is the failure
 * check-built-pages was written to catch.
 *
 * THE TOKEN IS NOT VALIDATED HERE. The page renders the same shell for a link that works and one
 * that ended, and the widget says which - because validating in the page would mean a database read
 * in a server component, which nothing else in this project does. See the note in the route.
 */
export default async function ReportLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <ProsePage
      eyebrow="Weekly monitoring"
      title="Your GEO monitoring report"
      description="Every weekly scan this subscription has recorded, what has changed, and which checks are failing — with the fix for each one."
      action={{ href: "/report/", label: "Run a live audit →" }}
      width="4xl"
      footerWidth="4xl"
    >
      <Suspense
        fallback={
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 text-sm text-[var(--ink-2)]">
            Reading your scan history…
          </div>
        }
      >
        <ReportLinkWidget token={token} />
      </Suspense>

      <section className="mt-12 space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink-1)]">What this page is</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-2)]">
            It reports what the weekly scan recorded for one site: a score out of 100, the grade, how
            many of the published checks passed, and which ones failed — each with the date it started
            failing. The checks and their pass conditions are published in full on the{" "}
            <Link href="/methodology/" className="text-[var(--accent)] hover:opacity-75">
              methodology page
            </Link>
            , and every failing check links to its own rule page, so a verdict here can be argued with
            rather than taken on trust.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--ink-1)]">
            What this page does not tell you
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[var(--ink-2)]">
            <li>
              <strong>It does not ask any AI engine about you.</strong> No mention rate, no
              recommendation rate, no competitor comparison. Those require actually querying the
              platforms, and this scanner does not.
            </li>
            <li>
              <strong>It measures the homepage.</strong> Interior pages are outside a single-URL scan
              entirely.
            </li>
            <li>
              <strong>A high score is not a promise of a citation.</strong> It says the page is in a
              state that makes being cited possible.
            </li>
            <li>
              <strong>It shows no per-scan evidence.</strong> The weekly run stores the score and
              which checks failed; the sentence each check produced is not kept. The live audit below
              re-runs the scan and shows the evidence for every check.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--ink-1)]">Why the link is unguessable</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-2)]">
            The URL contains a token that stands for one subscription, which is what lets you forward
            it to a colleague without them typing a domain. It is not a password and it is not your
            email address: whoever holds the link can read this page, so treat it like a document you
            sent. It is a different secret from the unsubscribe link in the email, deliberately —
            otherwise forwarding this page would end the subscription it describes. If a link stops
            working, the subscription behind it has ended, and{" "}
            <Link href="/monitor/" className="text-[var(--accent)] hover:opacity-75">
              subscribing again
            </Link>{" "}
            issues a new one.
          </p>
        </div>
      </section>
    </ProsePage>
  );
}
