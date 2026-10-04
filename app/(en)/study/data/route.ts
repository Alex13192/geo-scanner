import {
  ANSWERED,
  AVERAGE,
  BLOCKED,
  NEWS,
  NEWS_BLOCKED,
  REFUSED,
  SCAN_DATE,
  STUDY_ROWS,
  gradeCount,
} from "@/lib/study-data";
import { SITE_URL } from "@/lib/site";

/**
 * /study/data/ - the published study as data, in JSON or CSV.
 *
 *   /study/data/                 JSON
 *   /study/data/?format=csv      CSV
 *
 * WHY IT EXISTS. The study is the most citable thing this project produces, and until now it
 * existed only as a rendered table: anybody who wanted to check the arithmetic, chart it or
 * quote a row had to scrape the HTML. A dataset whose only form is a web page is a dataset
 * nobody can use, and one whose prose cannot be diffed against its own rows is one that rots
 * quietly.
 *
 * Every number here is derived from lib/study-data.ts rather than written down, so this
 * cannot disagree with the page it publishes alongside. The counts, the average and the grade
 * distribution are all computed from the same array the table renders.
 *
 * `scannerPublishedChecks` records a real caveat rather than hiding it: the rows were
 * collected when the scanner published 38 checks, and it publishes 40 today. Scores in this
 * file are therefore not directly comparable with a fresh scan of the same domain.
 */
export const dynamic = "force-dynamic";
// No `runtime = "edge"` - the edge runtime is not supported by @opennextjs/cloudflare, and
// scripts/test-analyze.mts asserts that no source file declares it.

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format");

  const counts = {
    scanned: STUDY_ROWS.length,
    answered: ANSWERED.length,
    blocked: BLOCKED.length,
    refused: REFUSED.length,
    news: NEWS.length,
    newsBlocked: NEWS_BLOCKED.length,
  };

  if (format === "csv") {
    const columns = [
      "domain",
      "category",
      "status",
      "browserStatus",
      "score",
      "grade",
      "aborted",
      "blocked",
      "refused",
      "entity",
      "sameAs",
    ] as const;

    const lines = [
      // A comment header, so a downloaded file explains itself without the page.
      `# GEO scanner study, 30 homepages, collected ${SCAN_DATE}`,
      `# Reproduce with: npm run study:run   Source: ${SITE_URL}/api/scan?brief=1&domain=`,
      `# Scores were produced when the scanner published 38 checks; it publishes 40 today.`,
      columns.join(","),
      ...STUDY_ROWS.map((row) =>
        columns
          .map((column) => {
            const value = row[column];
            return value === null ? "" : String(value);
          })
          .join(",")
      ),
    ];

    return new Response(lines.join("\n") + "\n", {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'inline; filename="geo-scanner-study.csv"',
      },
    });
  }

  const payload = {
    study: "GEO scanner study over 30 homepages",
    scannedOn: SCAN_DATE,
    site: SITE_URL,
    source: `${SITE_URL}/api/scan?brief=1&domain=`,
    method: `${SITE_URL}/methodology/`,
    rules: `${SITE_URL}/checks/`,
    reproduce: "npm run study:run",
    scannerPublishedChecks: 40,
    /**
     * The rows were collected under the 38-check model, so a score here and a score from a
     * fresh scan are not the same measurement. Stated in the payload because a consumer
     * cannot infer it from the numbers.
     */
    scannerPublishedChecksWhenCollected: 38,
    counts,
    average: AVERAGE,
    grades: {
      A: gradeCount("A"),
      B: gradeCount("B"),
      C: gradeCount("C"),
      D: gradeCount("D"),
      F: gradeCount("F"),
    },
    rows: STUDY_ROWS,
  };

  return new Response(JSON.stringify(payload, null, 2) + "\n", {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}
