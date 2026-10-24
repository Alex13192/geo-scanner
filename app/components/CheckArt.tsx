import { SITE_HOST } from "@/lib/site";

/**
 * The three art panels on the "Three questions decide..." cards.
 *
 * WHY THESE EXIST: the sticky card puts the copy in the left half and, without an object on the
 * right, that half is ~500px of nearly empty surface. A large icon at 14% opacity filled the space
 * without saying anything. Each panel below is the *thing the card is about*, drawn from the same
 * tokens as the rest of the site: a robots.txt file with allow/disallow lines, a JSON-LD graph whose
 * sameAs list joins one entity, and the badge itself with the snippet that embeds it.
 *
 * WHY THEY ARE aria-hidden: the paragraph beside each panel is the accessible content, and these are
 * pictures of the same claim. Reading the labels twice is noise for a screen reader, so the panels
 * carry aria-hidden and the card's copy carries the meaning.
 *
 * WHY NO IMAGES: an <img> would need a light and a dark source, an alt text that repeats the
 * paragraph, and a build asset for three illustrations. These are markup, so the theme tokens apply
 * and the panels cannot drift out of sync with the palette (which is the failure check:colours
 * exists to catch).
 */

/** A robots.txt viewer: the file the AI-crawler card is about, with its verdicts. */
export function CrawlerArt() {
  const rows = [
    { agent: "GPTBot", rule: "Allow: /", verdict: "allowed", tone: "ok" },
    { agent: "ClaudeBot", rule: "Disallow: /admin", verdict: "blocked", tone: "warn" },
    { agent: "PerplexityBot", rule: "Allow: /", verdict: "allowed", tone: "ok" },
  ] as const;

  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[430px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
        <span className="font-mono text-[11px] text-[var(--ink-2)]">robots.txt</span>
        <span className="rounded-full bg-[var(--ok-bg)] px-2 py-0.5 font-mono text-[10px] text-[var(--ok)]">
          200 OK
        </span>
      </div>
      <div className="space-y-2.5 px-4 py-4">
        {rows.map((row) => (
          <div key={row.agent} className="flex items-center justify-between gap-3">
            <div className="min-w-0 font-mono text-[11.5px] leading-relaxed">
              <span className="text-[var(--ink-3)]">User-agent: </span>
              <span className="text-[var(--ink-1)]">{row.agent}</span>
              <div className="text-[var(--ink-2)]">{row.rule}</div>
            </div>
            <span
              className={
                row.tone === "ok"
                  ? "shrink-0 rounded-full bg-[var(--ok-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ok)]"
                  : "shrink-0 rounded-full bg-[var(--warn-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--warn)]"
              }
            >
              {row.verdict}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--line)] px-4 py-2.5 font-mono text-[10.5px] text-[var(--ink-3)]">
        2 of 3 crawlers allowed at root
      </div>
    </div>
  );
}

/** A JSON-LD snippet: the sameAs list is the join the Entity card describes. */
export function EntityArt() {
  const line = "font-mono text-[11.5px] leading-relaxed";
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[430px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
        <span className="font-mono text-[11px] text-[var(--ink-2)]">application/ld+json</span>
        <span className="rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)]">
          valid
        </span>
      </div>
      <div className="px-4 py-4">
        <p className={line}>
          <span className="text-[var(--ink-3)]">{"{"}</span>
        </p>
        <p className={`${line} pl-3`}>
          <span className="text-[var(--accent)]">&quot;@type&quot;</span>
          <span className="text-[var(--ink-3)]">: </span>
          <span className="text-[var(--ink-1)]">&quot;Organization&quot;</span>
          <span className="text-[var(--ink-3)]">,</span>
        </p>
        <p className={`${line} pl-3`}>
          <span className="text-[var(--accent)]">&quot;@id&quot;</span>
          <span className="text-[var(--ink-3)]">: </span>
          <span className="text-[var(--ink-1)]">&quot;#organization&quot;</span>
          <span className="text-[var(--ink-3)]">,</span>
        </p>
        <p className={`${line} pl-3`}>
          <span className="text-[var(--accent)]">&quot;sameAs&quot;</span>
          <span className="text-[var(--ink-3)]">: [</span>
        </p>
        <p className={`${line} pl-6 text-[var(--ink-2)]`}>&quot;github.com/Alex13192&quot;,</p>
        <p className={`${line} pl-6 text-[var(--ink-2)]`}>&quot;x.com/llmention&quot;</p>
        <p className={`${line} pl-3`}>
          <span className="text-[var(--ink-3)]">]</span>
        </p>
        <p className={line}>
          <span className="text-[var(--ink-3)]">{"}"}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--line)] px-4 py-2.5">
        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--ink-2)]">
          Organization
        </span>
        <span className="text-[10px] text-[var(--ink-3)]">→</span>
        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--ink-2)]">
          sameAs
        </span>
        <span className="text-[10px] text-[var(--ink-3)]">→</span>
        <span className="rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--accent)]">
          one entity
        </span>
      </div>
    </div>
  );
}

/** The readiness badge, as it appears when embedded, plus the snippet that puts it there. */
export function BadgeArt() {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[430px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
        <span className="font-mono text-[11px] text-[var(--ink-2)]">README.md</span>
        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-3)]">
          preview
        </span>
      </div>
      <div className="flex items-center justify-center px-4 py-7">
        <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-4 py-2 shadow-sm">
          <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[var(--ok)] text-[11px] font-bold text-[var(--ok)]">
            100
          </span>
          <span className="text-sm font-semibold text-[var(--ink-1)]">A</span>
          <span className="text-[11px] text-[var(--ink-2)]">LLMention · GEO readiness</span>
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-4 py-3">
        <p className="truncate font-mono text-[10.5px] text-[var(--ink-3)]">
          [![GEO 100/100]({SITE_HOST}/badge.svg)]({SITE_HOST}/…)
        </p>
        <p className="mt-1.5 text-[10.5px] text-[var(--ink-3)]">
          The number is read from a live scan — it cannot be typed in.
        </p>
      </div>
    </div>
  );
}
