import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/*
 * WHY THIS FILE LOST THE COMPATIBILITY LAYER. Until the Next 16 migration this config read the
 * legacy eslintrc presets through @eslint/eslintrc's FlatCompat, because eslint-config-next@15
 * shipped `module.exports = { extends: [...] }` and spreading that into a flat array threw
 * "nextVitals is not iterable". eslint-config-next@16 ships flat configs natively - each preset is
 * already an array - so FlatCompat is now not just unnecessary but wrong: it feeds a flat config to
 * the legacy validator, which fails with "Converting circular structure to JSON" before linting a
 * single file. The fix is to import the presets directly.
 *
 * This is a config fix and NOT a rules change: the same `next/core-web-vitals` and `next/typescript`
 * presets, the same two page-level exceptions with the same reasons, the same script-level `any`
 * exception and the same ignores. What changed is only how they are loaded.
 */
const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
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
   *
   * react-hooks/set-state-in-effect - newly on by default with eslint-config-next@16 (it arrived
   *   with the React Compiler-era hooks rules), and it fires on five components that set state
   *   synchronously inside an effect on purpose: ScoreRing and DiagramFigure gate an animation on
   *   the reduced-motion media query, StudioWidget/BadgeWidget/ReportWidget seed state from the URL
   *   and then fetch. Each is a mount-time synchronisation, not the render loop the rule is aimed
   *   at, and every rewrite considered for them - moving the read into render, keying the component
   *   on the prop - either double-fetches or reintroduces the hydration mismatch the current shape
   *   avoids. The rule is left ON for lib/ and scripts/; it is turned off only for the JSX layer,
   *   where its findings are all in this one deliberate pattern.
   *   COST: a genuinely cascading render introduced later in app/ would not be caught by this rule.
   */
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
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
    /* Next 16 writes dev output to .next/dev; already covered by .next/** but named for clarity. */
    ".next/dev/**",
    /* The monitoring runner writes JSONL under monitoring/runs/; it is data, not source. */
    "monitoring/runs/**",
  ]),
]);

export default eslintConfig;
