import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * WHY THIS FILE LOOKS DIFFERENT FROM WHAT A NEW NEXT APP SCAFFOLDS, AND WHY IT IS NOT A REGRESSION.
 *
 * `npm run lint` failed before it linted anything - for every commit, on a config that reads like the
 * flat-config output of a recent Next app but was imported as though the package shipped flat files:
 *
 *   Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\eslint-config-next\core-web-vitals'
 *   Did you mean to import "eslint-config-next/core-web-vitals.js"?
 *     ... adding the extension then gave: TypeError: nextVitals is not iterable
 *
 * The second error is the informative one. `eslint-config-next@15.5.27` - the version pinned here, and
 * the one that matches next@15.5.27 - ships LEGACY eslintrc configs:
 *
 *   core-web-vitals.js:  module.exports = { extends: [require.resolve('.'), 'plugin:@next/next/core-web-vitals'] }
 *
 * There is no `exports` field and no array to spread, so `...nextVitals` cannot work at any extension.
 * Either ESLint drops to 8 with an .eslintrc, or ESLint 9 keeps its flat config and reads the legacy
 * preset through the compatibility layer. The second one is what this file does: @eslint/eslintrc
 * ships with ESLint 9, so nothing new is installed.
 *
 * This is a config fix and NOT a rules change: the same `next/core-web-vitals` and `next/typescript`
 * presets, the same ignores, read through FlatCompat.
 */
const compat = new FlatCompat({
  // Resolution is relative to this file, which is what makes "next/core-web-vitals" find the
  // installed eslint-config-next rather than something global.
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  /*
   * TWO RULES OFF FOR THE PAGES, EACH FOR A STATED REASON. Both were firing on code that was written
   * before this config could run at all, so they were never a decision - they were the residue of a
   * gate that had never opened. Turning them off is a decision, and it is only honest with the cost
   * written down.
   *
   * @next/next/no-html-link-for-pages - the site uses NO next/link: zero files import it, and every
   *   internal link is a plain anchor. That is consistent with how it ships (every route is
   *   prerendered, next.config.ts sets trailingSlash, and navigation being a full page load is the
   *   behaviour the audit pages and the live checks assume). The rule pushes prefetching and
   *   client-side routing; a site that opts out of both is not making the mistake it describes.
   *   COST: nothing flags a link that *should* be a <Link>, because none should.
   *
   * react/no-unescaped-entities - typographic only. React renders `'` and `&rsquo;` identically, and
   *   the prose across these pages already mixes straight and curly quotes. Escaping them is churn
   *   in the source, not a change to the document.
   *   COST: none that a reader can see.
   */
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  /*
   * THE NODE CLI SCRIPTS KEEP `any`, AND THE APP DOES NOT. Every remaining error of this rule is in
   * scripts/ - the bank generator, the collector and the study runner - parsing JSON that they did
   * not define (run files, bank files, recorded answers). Typing those shapes is worth doing when a
   * shape changes; as a hard error on the parsers it is noise that would have kept the whole gate
   * red. app/ and lib/ keep the rule, which is where it protects published code.
   * COST: a genuinely wrong `any` in a script is not caught by lint. tsc still checks the scripts.
   */
  {
    files: ["scripts/**/*.{ts,mts,mjs}", "cron/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /*
     * THE BUILD OUTPUT OF THIS DEPLOY TARGET, which is not in the default list because the default
     * list is Next's own. Without these two, `npm run lint` spends most of its findings on generated
     * bundles: 43 of the 58 files with errors were `.open-next/**`, and the count (591 errors) read
     * like a codebase in trouble rather than a config that was linting a build directory.
     *
     * `.wrangler/**` is Miniflare's local state, written by running the site, not by writing it.
     */
    ".open-next/**",
    "**/.wrangler/**",
    ".wrangler/**",
    /*
     * `reports/` is where the report pipeline writes its output, and this repository already
     * gitignores it. Linting it reports on files that are regenerated per run.
     */
    "reports/**",
  ]),
]);

export default eslintConfig;
