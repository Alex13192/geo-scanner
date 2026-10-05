/**
 * How robots.txt actually decides.
 *
 * WHY THIS IS A DIAGRAM AND NOT ANOTHER PARAGRAPH. The article explains in prose that robots.txt
 * is a first-match lookup and that an unlisted agent is allowed by default - and that sentence is
 * the one readers get wrong, because the intuition is the opposite: most people assume a crawler
 * has to be permitted. A picture of the two branches makes the default visible, and the default is
 * the part that matters.
 *
 * WHY INLINE SVG RATHER THAN AN IMAGE FILE. Four reasons, and the first is the one that decided
 * it: an inline diagram cannot go stale. The three tool screenshots already in public/shots/ will
 * be wrong the next time those interfaces change, and a diagram that explains a file format will
 * not. The others: it is crawlable markup rather than a binary, it costs no request, and it reads
 * the same CSS tokens as the rest of the site, so it follows the theme instead of fighting it.
 *
 * The colours are the site's own tokens, so nothing here needs a dark-mode variant.
 */
export default function DiagramRobotsMatch() {
  const node = "var(--surface-2)";
  const line = "var(--line)";
  const inkStrong = "var(--ink-1)";
  const inkSoft = "var(--ink-2)";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <figure className="my-10">
      <svg
        viewBox="0 0 720 430"
        role="img"
        aria-labelledby="robots-match-title robots-match-desc"
        className="h-auto w-full"
      >
        <title id="robots-match-title">How robots.txt decides whether a crawler may fetch a page</title>
        <desc id="robots-match-desc">
          A request from GPTBot leads to reading robots.txt, where groups are tried in order. If a
          group names the agent, that group&apos;s Allow and Disallow rules apply. If no group names
          it, the request is allowed, because robots.txt is an opt-out file.
        </desc>

        {/* The request. */}
        <rect x="210" y="8" width="300" height="44" rx="12" fill={node} stroke={line} />
        <text x="360" y="36" textAnchor="middle" fontSize="14" fill={inkStrong} fontFamily={mono}>
          GPTBot requests /pricing/
        </text>

        <line x1="360" y1="52" x2="360" y2="80" stroke={line} strokeWidth="1.5" />
        <path d="M360 88 l-5 -9 h10 z" fill={inkSoft} />

        {/* The lookup. */}
        <rect x="200" y="88" width="320" height="58" rx="12" fill={node} stroke={line} />
        <text x="360" y="112" textAnchor="middle" fontSize="14" fill={inkStrong}>
          Read robots.txt
        </text>
        <text x="360" y="132" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
          groups are tried in order — first match wins
        </text>

        <line x1="360" y1="146" x2="360" y2="170" stroke={line} strokeWidth="1.5" />
        {/* Fork into the two branches. */}
        <line x1="170" y1="170" x2="550" y2="170" stroke={line} strokeWidth="1.5" />
        <line x1="170" y1="170" x2="170" y2="196" stroke={line} strokeWidth="1.5" />
        <line x1="550" y1="170" x2="550" y2="196" stroke={line} strokeWidth="1.5" />
        <path d="M170 204 l-5 -9 h10 z" fill={inkSoft} />
        <path d="M550 204 l-5 -9 h10 z" fill={inkSoft} />

        {/* Branch one: a group names the agent. */}
        <rect x="40" y="204" width="260" height="46" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="170" y="224" textAnchor="middle" fontSize="13.5" fill={inkStrong}>
          A group names it
        </text>
        <text x="170" y="241" textAnchor="middle" fontSize="12" fill={inkSoft} fontFamily={mono}>
          User-agent: GPTBot
        </text>

        <line x1="170" y1="250" x2="170" y2="276" stroke={line} strokeWidth="1.5" />
        <path d="M170 284 l-5 -9 h10 z" fill={inkSoft} />

        <rect x="60" y="284" width="220" height="58" rx="12" fill={node} stroke={line} />
        <text x="170" y="308" textAnchor="middle" fontSize="13.5" fill={inkStrong}>
          Its Allow / Disallow
        </text>
        <text x="170" y="327" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
          applies to this request
        </text>

        {/* Branch two: nothing names it. */}
        <rect x="420" y="204" width="260" height="46" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="550" y="224" textAnchor="middle" fontSize="13.5" fill={inkStrong}>
          No group names it
        </text>
        <text x="550" y="241" textAnchor="middle" fontSize="12" fill={inkSoft} fontFamily={mono}>
          no GPTBot, no *
        </text>

        <line x1="550" y1="250" x2="550" y2="276" stroke={line} strokeWidth="1.5" />
        <path d="M550 284 l-5 -9 h10 z" fill={inkSoft} />

        {/* The verdict, coloured, because this is the one people get backwards. */}
        <rect x="430" y="284" width="240" height="58" rx="12" fill="var(--ok-bg)" stroke="var(--ok)" />
        <text x="550" y="308" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink-1)">
          Allowed
        </text>
        <text x="550" y="327" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
          robots.txt is opt-out, not opt-in
        </text>

        {/* The closing line, which is the sentence the whole diagram exists to land. */}
        <rect x="70" y="372" width="580" height="46" rx="12" fill="none" stroke={line} />
        <text x="360" y="393" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
          An unlisted agent is allowed — unless a <tspan fontFamily={mono}>User-agent: *</tspan> group
          disallows the path.
        </text>
        <text x="360" y="409" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
          So &quot;we never blocked GPTBot&quot; is not the same claim as &quot;GPTBot is allowed&quot;. Check which one you have.
        </text>
      </svg>

      <figcaption className="mt-3 text-center text-[13px] leading-relaxed text-[var(--ink-3)]">
        The default is the part readers get backwards: an agent that no group names is allowed,
        because robots.txt is a list of refusals rather than a list of permissions.
      </figcaption>
    </figure>
  );
}
