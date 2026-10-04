/**
 * AdSense, declared once.
 *
 * WHY THE PUBLISHER ID LIVES HERE AND NOT IN THE LAYOUT:
 * The same reason lib/site.ts exists. `public/ads.txt` cannot import anything, so the
 * publisher id is necessarily written twice - once here and once in that file - and a
 * change to one without the other is precisely the silent divergence that
 * scripts/check-values.mjs was written to catch for robots.txt and llms.txt. That check
 * was extended to ads.txt in the same commit that created this file, so the second copy
 * fails a build rather than waiting to be noticed.
 *
 * WHY THE LOADER IS A PLAIN <script async> AND NOT next/script:
 * AdSense looks for its snippet in the HTML the server sends. `next/script` with the
 * default `afterInteractive` strategy injects the tag from JavaScript after hydration,
 * so the served HTML would contain no `ca-pub-` string at all and the site would look
 * to a reviewer as though the code was never installed. `beforeInteractive` does reach
 * the initial HTML, but it is documented for critical, render-blocking scripts; the
 * AdSense loader is neither, and Google's own snippet is `async`. A plain element with
 * that attribute is server-rendered unchanged, which is the property that matters here.
 *
 * WHAT IS STILL OWED BEFORE ADS MAY SERVE. Stated here because this file cannot enforce
 * it and /privacy/ already promises it:
 *
 *   /privacy/ tells readers in the EEA, the UK and Switzerland that no non-essential
 *   cookie is set and no personalised advertising is served before they consent, and
 *   that consent is requested through a Google-certified consent management platform.
 *   That platform is configured in the AdSense dashboard (Privacy & messaging), not in
 *   this repository.
 *
 *   Adding the loader is therefore safe in the state the account is actually in - a
 *   publisher with no approved site serves nothing, so no cookie and no ad exists yet -
 *   and the privacy wording is written in the conditional ("when an ad is served")
 *   precisely so that it is accurate both before and after the tag goes live. The
 *   consent platform must be enabled before the account is approved and ads begin, not
 *   before this commit.
 */
export const ADSENSE_CLIENT = "ca-pub-1747700617931627";

/**
 * The loader URL. The publisher id travels as a `client` query parameter on Google's
 * script rather than as a separate configuration step, which is why it is interpolated
 * here rather than written a second time.
 */
export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
