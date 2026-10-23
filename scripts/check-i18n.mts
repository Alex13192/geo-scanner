/**
 * Localization gate.
 *
 * WHY THIS EXISTS: a language that exists in the switcher but has no page, or a translation
 * that is missing a string, is the class of failure this repository refuses everywhere else -
 * it looks finished from the outside and is broken for exactly the reader it was built for.
 * The check has three jobs:
 *
 *   1. every prefixed locale has a complete dictionary (no empty string, anywhere),
 *   2. the hreflang matrix covers every locale plus x-default, with unique paths,
 *   3. the localized page files actually exist for the routes the switcher links to.
 *
 * Run: node scripts/check-i18n.mts   (npm run check:i18n)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  LOCALES,
  PREFIXED_LOCALES,
  homePath,
  languageAlternates,
  pricingPath,
} from "../lib/i18n/config.ts";
import { DICTIONARIES } from "../lib/i18n/dictionaries.ts";

const ROOT = process.cwd();
let failures = 0;

function check(ok: boolean, pass: string, fail: string) {
  if (ok) {
    console.log(`  PASS  ${pass}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${fail}`);
  }
}

/** Walk an object and collect every path whose value is an empty/whitespace string. */
function emptyStrings(value: unknown, path = ""): string[] {
  if (typeof value === "string") {
    return value.trim() === "" ? [path || "(root)"] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => emptyStrings(item, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      emptyStrings(child, path ? `${path}.${key}` : key)
    );
  }
  return [];
}

console.log("=== i18n ===");

/* 1. Complete dictionaries. */
for (const locale of PREFIXED_LOCALES) {
  const dict = DICTIONARIES[locale];
  if (!dict) {
    check(false, "", `${locale} has no dictionary`);
    continue;
  }
  const empty = emptyStrings(dict);
  check(
    empty.length === 0,
    `${locale} dictionary is complete`,
    `${locale} has ${empty.length} empty string(s): ${empty.slice(0, 6).join(", ")}`
  );

  const features = {
    signal: dict.pricing.products.signal.features,
    pro: dict.pricing.products.pro.features,
  };
  check(
    features.signal.length === 4 && features.pro.length === 4,
    `${locale} product feature lists have four items`,
    `${locale} product feature lists have ${features.signal.length}/${features.pro.length} items`
  );
  check(
    dict.faq.items.length === 3 && dict.evidence.stats.length === 3,
    `${locale} FAQ and evidence keep the shared shape`,
    `${locale} FAQ=${dict.faq.items.length}, stats=${dict.evidence.stats.length}`
  );
}

/* 2. The hreflang matrix. */
for (const [name, page] of [
  ["home", homePath],
  ["pricing", pricingPath],
] as const) {
  const alternates = languageAlternates(page);
  const codes = Object.keys(alternates);
  const expectedCodes = LOCALES.length + 1; // every locale + x-default
  const localePaths = LOCALES.map((locale) => alternates[locale === "zh" ? "zh-Hans" : locale]);
  check(
    codes.length === expectedCodes && codes.includes("x-default"),
    `${name} hreflang covers ${LOCALES.length} locales + x-default`,
    `${name} hreflang has ${codes.length} entries (${codes.join(", ")})`
  );
  /*
   * x-default deliberately duplicates one locale's URL - it is a marker for "no language
   * matched", not a sixth translation. Uniqueness is therefore asserted across the actual
   * locale entries only; asserting it over every key would force a bogus seventh URL.
   */
  check(
    new Set(localePaths).size === localePaths.length,
    `${name} hreflang points at ${localePaths.length} distinct locale URLs`,
    `${name} hreflang has duplicate locale URLs: ${localePaths.join(", ")}`
  );
}

/* 3. The localized routes exist. */
const required = [
  join(ROOT, "app", "(locales)", "[locale]", "layout.tsx"),
  join(ROOT, "app", "(locales)", "[locale]", "page.tsx"),
  join(ROOT, "app", "(locales)", "[locale]", "pricing", "page.tsx"),
];
for (const file of required) {
  check(
    existsSync(file),
    `exists: ${file.replace(ROOT + "\\", "").replace(ROOT + "/", "")}`,
    `missing localized route file: ${file}`
  );
}

console.log(failures === 0 ? "\nAll locale checks passed." : `\n${failures} locale check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
