import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext build configuration.
 *
 * Deliberately empty. The only thing worth configuring here today is
 * `incrementalCache`, and enabling it means adding an R2 bucket and an
 * r2IncrementalCache override - which buys caching for a site whose pages are almost
 * all produced at build time. The placeholder is the point: when there is a measured
 * reason, the change is one import and one property, and the reasoning for waiting is
 * written down here rather than in somebody's memory.
 *
 *   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
 *   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
 *
 * Note that the OpenNextConfig type is not imported, because doing so requires
 * @opennextjs/aws as a devDependency purely for the type. Not worth a package.
 */
export default defineCloudflareConfig({});
