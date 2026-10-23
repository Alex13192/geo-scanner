import Link from "next/link";
import { AUTHOR } from "@/lib/author";
import { formatDate } from "@/lib/insights";

/**
 * The byline that stands under the title of a page whose claim is a measurement.
 *
 * WHY A NAMED, DATED BYLINE IS THE POINT OF THE WHOLE CHANGE: an unattributed figure is an
 * assertion - something the site says - while a figure with a person and a date attached is
 * a claim somebody is accountable for and can be asked about afterwards. /study/ and
 * /methodology/ carry the most load-bearing numbers on this site and neither said whose
 * numbers they were or when they were taken, so both answered "what" and left "who, and as
 * of when" to a page the reader had no reason to visit. The two pages this renders on are
 * the two that answer that question, and they have to answer it where the numbers are.
 *
 * WHY IT IS NOT POSTSHELL'S BYLINE: that one is part of an article header and carries a
 * category and a read time, because an article is a piece of writing with a publication
 * date. These pages are not writing on a schedule - the date that matters is the day the
 * measurement or the method is anchored to, and the line has to sit inside a prose column
 * rather than in a hero band. Same voice as PostShell's, different fact.
 *
 * `updated` exists because those two dates genuinely differ here. The study's rows were
 * measured on one day and the rules that turn a page into a score were revised after it,
 * and a reader who is about to re-run those rows is owed both dates rather than one date
 * and an inference. Where the dates are the same, omit it rather than printing twice.
 *
 * The author link goes to /author/ rather than to GitHub for PostShell's reason: a reader
 * checking whether to trust a number belongs on the page that says who makes the numbers,
 * and the repository is one click further on for the reader who wants the source.
 */
type AuthorLineProps = {
  /** ISO date the page's claim is anchored to - the measurement or the revision. */
  date: string;
  /** What that date refers to, for example "Measurements taken". */
  label?: string;
  /** ISO date the method itself last changed, when it is later than `date`. */
  updated?: string;
};

export default function AuthorLine({ date, label = "Published", updated }: AuthorLineProps) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
      <span>
        By{" "}
        <Link href={AUTHOR.path} className="text-[var(--accent)] hover:opacity-75">
          {AUTHOR.name}
        </Link>
      </span>
      <span aria-hidden="true">·</span>
      <span>
        {label} <time dateTime={date}>{formatDate(date)}</time>
      </span>
      {updated ? (
        <>
          <span aria-hidden="true">·</span>
          <span>
            method last revised <time dateTime={updated}>{formatDate(updated)}</time>
          </span>
        </>
      ) : null}
    </p>
  );
}
