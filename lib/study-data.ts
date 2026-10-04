/**
 * The published 30-site study, as data rather than as JSX.
 *
 * WHY THIS IS ITS OWN MODULE. The rows used to live inside app/(en)/study/page.tsx, which
 * meant the study existed only as rendered HTML: nobody could fetch it, nobody could diff it
 * between runs, and the prose around it could drift from the table underneath it with nothing
 * to notice. The page, the machine-readable endpoint at /study/data/ and the assertions in
 * scripts/test-analyze.mts now all read this one array, so a claim in the prose that the data
 * does not support fails the test suite.
 *
 * The three boolean fields are deliberately not one field. `blocked` is a policy answer
 * (robots.txt disallows a tracked agent at root, or the server refused a crawler-shaped
 * request); `refused` is the narrower and more interesting case of a server turning away a
 * crawler-shaped request while serving a browser-shaped one to the same URL, which is a block
 * that happens before robots.txt is read and that no robots.txt line can express; and
 * `aborted` means the response was not a 200 at all, so the score describes that response
 * rather than a page. Collapsing them would make the study easier to read and wrong.
 */

export type StudyRow = {
  domain: string;
  status: number;
  /**
   * What a browser-shaped request to the same URL returned, or null when the homepage
   * answered 200 and no second request was needed.
   */
  browserStatus: number | null;
  score: number;
  grade: string;
  /** A non-200 answer, so the score describes that response rather than a page. */
  aborted: boolean;
  /** AI crawlers are not admitted, by robots.txt or by refusal. See `refused`. */
  blocked: boolean;
  /** Refused to a crawler-shaped request while the same URL served a browser-shaped one. */
  refused: boolean;
  entity: boolean;
  sameAs: boolean;
  category: string;
};

/** The date the rows were collected. Stated on the page and in the JSON, never implied. */
export const SCAN_DATE = "3 October 2026";

/**
 * Raw results, transcribed from /api/scan?brief=1, re-run on 3 October 2026.
 *
 * Ordered by score so the table reads as a ranking, which is how a reader will look for
 * their own site.
 *
 * `app/(en)/study/page.tsx` states three things about these rows in its own description:
 * that none of the 30 scored an A, that the average was 62, and that every news publisher
 * disallows AI crawlers. All three are asserted against this array in
 * scripts/test-analyze.mts, because prose about a dataset is the part that rots.
 */
export const STUDY_ROWS: StudyRow[] = [
  { domain: "salesforce.com", status: 200, browserStatus: null, score: 83, grade: "B", aborted: false, blocked: false, refused: false, entity: true, sameAs: false, category: "Enterprise software" },
  { domain: "siemens.com", status: 200, browserStatus: null, score: 80, grade: "B", aborted: false, blocked: false, refused: false, entity: true, sameAs: false, category: "Industry" },
  { domain: "vercel.com", status: 200, browserStatus: null, score: 79, grade: "C", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Developer platform" },
  { domain: "cloudflare.com", status: 200, browserStatus: null, score: 77, grade: "C", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Infrastructure" },
  { domain: "stripe.com", status: 200, browserStatus: null, score: 75, grade: "C", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Payments" },
  { domain: "shopify.com", status: 200, browserStatus: null, score: 72, grade: "C", aborted: false, blocked: false, refused: false, entity: false, sameAs: true, category: "Commerce" },
  { domain: "apple.com", status: 200, browserStatus: null, score: 69, grade: "D", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Consumer hardware" },
  { domain: "developer.mozilla.org", status: 200, browserStatus: null, score: 64, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Documentation" },
  { domain: "anthropic.com", status: 200, browserStatus: null, score: 62, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "AI lab" },
  { domain: "notion.so", status: 200, browserStatus: null, score: 62, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Software" },
  { domain: "figma.com", status: 200, browserStatus: null, score: 62, grade: "D", aborted: false, blocked: true, refused: false, entity: true, sameAs: true, category: "Design software" },
  { domain: "bbc.com", status: 200, browserStatus: null, score: 61, grade: "D", aborted: false, blocked: true, refused: false, entity: false, sameAs: true, category: "News" },
  { domain: "nvidia.com", status: 200, browserStatus: null, score: 61, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: true, category: "Semiconductors" },
  { domain: "github.com", status: 200, browserStatus: null, score: 60, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Developer platform" },
  { domain: "spiegel.de", status: 200, browserStatus: null, score: 56, grade: "F", aborted: false, blocked: true, refused: false, entity: true, sameAs: true, category: "News" },
  { domain: "telekom.com", status: 200, browserStatus: null, score: 54, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Telecoms" },
  { domain: "bahn.de", status: 200, browserStatus: null, score: 52, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Transport" },
  { domain: "microsoft.com", status: 200, browserStatus: null, score: 48, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Enterprise software" },
  { domain: "theguardian.com", status: 200, browserStatus: null, score: 47, grade: "F", aborted: false, blocked: true, refused: false, entity: false, sameAs: false, category: "News" },
  { domain: "wikipedia.org", status: 200, browserStatus: null, score: 47, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Reference" },
  { domain: "sap.com", status: 200, browserStatus: null, score: 41, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Enterprise software" },
  { domain: "zeit.de", status: 403, browserStatus: 200, score: 26, grade: "F", aborted: true, blocked: true, refused: true, entity: false, sameAs: false, category: "News" },
  { domain: "google.com", status: 429, browserStatus: 429, score: 26, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "Search" },
  { domain: "perplexity.ai", status: 403, browserStatus: 403, score: 19, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "AI search" },
  { domain: "amazon.com", status: 202, browserStatus: 202, score: 14, grade: "F", aborted: true, blocked: true, refused: false, entity: false, sameAs: false, category: "Commerce" },
  { domain: "openai.com", status: 403, browserStatus: 200, score: 13, grade: "F", aborted: true, blocked: true, refused: true, entity: false, sameAs: false, category: "AI lab" },
  { domain: "stackoverflow.com", status: 403, browserStatus: 403, score: 12, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "Developer Q&A" },
  { domain: "nytimes.com", status: 403, browserStatus: 403, score: 12, grade: "F", aborted: true, blocked: true, refused: false, entity: false, sameAs: false, category: "News" },
  { domain: "reuters.com", status: 401, browserStatus: 401, score: 12, grade: "F", aborted: true, blocked: true, refused: false, entity: false, sameAs: false, category: "News" },
  { domain: "bmw.com", status: 520, browserStatus: 520, score: 8, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "Automotive" },
];

/** A 200 that describes a page, as opposed to an error page whose score is about the error. */
export const ANSWERED = STUDY_ROWS.filter((row) => !row.aborted);

export const BLOCKED = STUDY_ROWS.filter((row) => row.blocked);
export const REFUSED = STUDY_ROWS.filter((row) => row.refused);
export const NEWS = STUDY_ROWS.filter((row) => row.category === "News");
export const NEWS_BLOCKED = NEWS.filter((row) => row.blocked);

/**
 * The mean score of the sites that answered, rounded. The nine that did not answer are
 * excluded rather than counted as zero, because a 403 is not a measurement of the page.
 */
export const AVERAGE = Math.round(
  ANSWERED.reduce((sum, row) => sum + row.score, 0) / ANSWERED.length
);

export const gradeCount = (grade: string) => STUDY_ROWS.filter((row) => row.grade === grade).length;

/**
 * Where the rows are published as data rather than as a table. Quoted on the page so a
 * reader who wants to check the arithmetic does not have to scrape the HTML to do it.
 */
export const STUDY_DATA_PATH = "/study/data/";
