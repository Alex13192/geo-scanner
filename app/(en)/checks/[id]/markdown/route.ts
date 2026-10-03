import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { checkPageDescription } from "@/lib/geo/check-meta";
import { SITE_URL } from "@/lib/site";

/**
 * /checks/<id>/markdown/ - the markdown twin of a check page.
 *
 * WHY THIS IS GENERATED AND NOT A FILE IN public/:
 * a hand-written .md next to every page is a second copy of the content that drifts
 * the first time somebody edits one of them. This renders from the same catalogue and
 * the same generated copy the HTML page reads, so the twin cannot disagree with the
 * page it mirrors - which is the only reason a twin is worth having. It is the same
 * reasoning as /methodology/ being driven by the catalogue.
 *
 * WHY A ROUTE AND NOT A .md FILE NAME: the App Router has no segment syntax that
 * maps a dynamic id onto `<id>.md`, and inventing a static file per page would put
 * 38 generated artefacts into the repository. The URL shape is not part of the
 * convention - the declaration on the page is - so /markdown/ is used and the
 * rel="alternate" link points here.
 *
 * The scanner's markdown-alternate check reads the DECLARATION only, so serving this
 * correctly is what makes the declaration honest rather than what makes it score.
 * That distinction is in the catalog note.
 */
export function generateStaticParams() {
  return CHECK_CATALOG.filter((check) => !check.alias).map((check) => ({ id: check.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = CHECK_CATALOG.find((c) => c.id === id && !c.alias);
  const copy = CHECK_COPY[id];
  if (!check || !copy) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const dimension = DIMENSION_CATALOG.find((d) => d.id === check.dimension);
  const siblings = CHECK_CATALOG.filter(
    (c) => c.dimension === check.dimension && !c.alias && c.id !== check.id
  );

  const lines = [
    `# ${copy.title}`,
    "",
    checkPageDescription(check.id),
    "",
    `- Dimension: ${dimension?.label ?? check.dimension}${dimension ? ` (${dimension.weight}% of the total score)` : ""}`,
    `- This check: ${check.points} ${check.points === 1 ? "point" : "points"}`,
    `- Check id: \`${check.id}\``,
    "",
    "## What does this check look at?",
    "",
    check.rule,
    "",
  ];

  if (check.onFail) {
    lines.push("## What does a failure mean?", "", check.onFail, "");
    if (check.note) lines.push("> " + check.note.replace(/\n+/g, " "), "");
  }

  lines.push("## How do I fix it?", "");
  for (const fix of copy.fixes) {
    const prefix = fix.when === "fail" ? "" : `**${fix.when}** — `;
    lines.push(`- ${prefix}${fix.text}`);
  }
  lines.push("");

  if (dimension) {
    lines.push(`## Why is it worth ${check.points} points?`, "", dimension.weighting, "");
  }

  if (siblings.length > 0) {
    lines.push("## What else is measured in this dimension?", "");
    for (const sibling of siblings) {
      lines.push(
        `- [${CHECK_COPY[sibling.id]?.title ?? sibling.id}](${SITE_URL}/checks/${sibling.id}/) — ${sibling.points} ${sibling.points === 1 ? "point" : "points"}`
      );
    }
    lines.push("");
  }

  lines.push(
    "## How do I see my own result?",
    "",
    `Run a free scan on your own domain at ${SITE_URL}/ - the report lists every failed check with the evidence that produced it.`,
    "",
    `The full method is published at ${SITE_URL}/methodology/`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // The HTML page is the canonical version; this is a representation of it.
      "x-markdown-twin-of": `/checks/${check.id}/`,
    },
  });
}
