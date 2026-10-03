import { CHECK_CATALOG, DIMENSION_CATALOG } from "./catalog.ts";
import { CHECK_COPY } from "./check-copy.ts";

/**
 * The title and meta description for a /checks/<id>/ page.
 *
 * WHY THIS IS A MODULE RATHER THAN TWO TEMPLATE LITERALS IN THE PAGE:
 * this site publishes a rule that a title must be 15-65 characters and a
 * description 50-160, and it scores other people against that rule. Its own pages
 * have to satisfy it, and the first version of the check page did not - it appended
 * " - GEO check" to a title the layout was already suffixing, and wrapped the
 * description's subject in quotation marks, which HTML-escaping turns into
 * `&quot;` and which added ten characters that the length check then counted.
 *
 * Both numbers are therefore built here, where scripts/test-analyze.mts can assert
 * that every one of them lands in range - and it must account for both the layout's
 * suffix and the escaping, because those are exactly what made the first version
 * look correct and render wrong.
 *
 * The description deliberately names the check and its dimension, so no two of the
 * 38 are identical: a set of near-duplicate descriptions is the signal that a page
 * family was generated without anything to say.
 */
export function checkPageTitle(id: string): string {
  return CHECK_COPY[id]?.title ?? id;
}

/** The suffix the root layout appends to every page title. */
export const TITLE_SUFFIX = " | LLMention";

export function checkPageDescription(id: string): string {
  const check = CHECK_CATALOG.find((c) => c.id === id);
  const label = DIMENSION_CATALOG.find((d) => d.id === check?.dimension)?.label ?? "GEO";
  return `How the ${checkPageTitle(id)} check works, what a failure means, and how to fix it in the ${label} dimension.`;
}

/** The title as it will actually appear, suffix included. */
export function renderedTitle(id: string): string {
  return `${checkPageTitle(id)}${TITLE_SUFFIX}`;
}

/** The description as it will actually be measured, HTML-escaping included. */
export function renderedDescription(id: string): string {
  return checkPageDescription(id).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** The bounds the scanner itself enforces, in one place so the guard cannot drift. */
export const TITLE_RANGE = { min: 15, max: 65 } as const;
export const DESCRIPTION_RANGE = { min: 50, max: 160 } as const;
