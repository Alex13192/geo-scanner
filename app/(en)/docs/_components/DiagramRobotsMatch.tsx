"use client";

import { useEffect, useRef, useState } from "react";

/**
 * How robots.txt actually decides.
 *
 * WHY THIS IS A DIAGRAM AND NOT ANOTHER PARAGRAPH. The article explains in prose that robots.txt
 * is a first-match lookup and that an unlisted agent is allowed by default - and that sentence is
 * the one readers get wrong, because the intuition is the opposite: most people assume a crawler
 * has to be permitted. A picture of the two branches makes the default visible, and the default is
 * the part that matters.
 *
 * WHY INLINE SVG RATHER THAN AN IMAGE. An inline diagram cannot go stale. The three tool
 * screenshots already in public/shots/ will be wrong the next time those interfaces change; a
 * diagram explaining a file format will not. It is also crawlable markup rather than a binary,
 * costs no request, and reads the same CSS tokens as the rest of the site.
 *
 * WHY THIS IS A CLIENT COMPONENT, AND WHY NOT SCROLL-DRIVEN CSS. The obvious way to assemble a
 * diagram as the reader reaches it is `animation-timeline: view()`, which the rest of the site's
 * motion uses. MEASURED, IT DOES NOT WORK HERE: SVG children accept `animation-name` and
 * `animation-timeline: view()` and then never animate - all thirty-four of them stayed at opacity
 * 1 with the figure centred in the viewport. HTML elements honour the timeline; their SVG
 * counterparts do not.
 *
 * So the trigger is an IntersectionObserver and the animation is time-based, which SVG does
 * honour. One observer, one class, and the delays live in CSS.
 *
 * THE DIAGRAM IS READABLE UNTIL THE OBSERVER FIRES, which is the property worth keeping. The
 * animation only plays forward from a state that is already visible, so a browser without
 * IntersectionObserver, a reader with reduced motion, or a script that fails all get the finished
 * diagram rather than an empty box. The version this replaced would have been worse: with
 * `animation-fill-mode: both` over a scroll timeline, a timeline that did not apply would have
 * held every element at opacity 0.
 */
export default function DiagramRobotsMatch() {
  const figure = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  /*
   * Armed means "JavaScript has taken over and the diagram may hide itself". It is separate from
   * `shown` because those are two different moments: armed happens on mount, shown happens when
   * the reader arrives. Without it the elements would be visible, then jump to opacity 0, then
   * fade in - a flash. With it they are hidden from the first frame that JavaScript controls, and
   * a browser where the script never runs keeps them visible the whole time.
   */
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = figure.current;
    if (!el) return;

    setArmed(true);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      /*
       * MOST OF THE FIGURE, NOT A SLIVER. This was 0.35 and it was reported as "it does not move at
       * all" - because 0.35 fires while the figure is still arriving, so the whole sequence played
       * out during the scroll and had finished by the time the reader stopped and looked at it.
       * The measurement showed it working perfectly; the problem was that nobody could be looking
       * at the right moment.
       *
       * 0.65 means the observer waits until the diagram has mostly settled into the viewport,
       * which is a reasonable proxy for the reader having stopped.
       */
      { threshold: 0.65 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const node = "var(--surface-2)";
  const line = "var(--line)";
  const inkStrong = "var(--ink-1)";
  const inkSoft = "var(--ink-2)";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <figure ref={figure} className="my-10">
      <svg
        viewBox="0 0 720 430"
        role="img"
        aria-labelledby="robots-match-title robots-match-desc"
        className={`diagram-build h-auto w-full${armed ? " is-armed" : ""}${shown ? " is-shown" : ""}`}
      >
        <title id="robots-match-title">How robots.txt decides whether a crawler may fetch a page</title>
        <desc id="robots-match-desc">
          A request from GPTBot leads to reading robots.txt, where groups are tried in order. If a
          group names the agent, that group&apos;s Allow and Disallow rules apply. If no group names
          it, the request is allowed, because robots.txt is an opt-out file.
        </desc>

        {/* 1. The request. */}
        <g style={{ animationDelay: "0ms" }}>
          <rect x="210" y="8" width="300" height="44" rx="12" fill={node} stroke={line} />
          <text x="360" y="36" textAnchor="middle" fontSize="14" fill={inkStrong} fontFamily={mono}>
            GPTBot requests /pricing/
          </text>
          <line x1="360" y1="52" x2="360" y2="80" stroke={line} strokeWidth="1.5" />
          <path d="M360 88 l-5 -9 h10 z" fill={inkSoft} />
        </g>

        {/* 2. The lookup. */}
        <g style={{ animationDelay: "140ms" }}>
          <rect x="200" y="88" width="320" height="58" rx="12" fill={node} stroke={line} />
          <text x="360" y="112" textAnchor="middle" fontSize="14" fill={inkStrong}>
            Read robots.txt
          </text>
          <text x="360" y="132" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
            groups are tried in order — first match wins
          </text>
        </g>

        {/* 3. The fork. */}
        <g style={{ animationDelay: "280ms" }}>
          <line x1="360" y1="146" x2="360" y2="170" stroke={line} strokeWidth="1.5" />
          <line x1="170" y1="170" x2="550" y2="170" stroke={line} strokeWidth="1.5" />
          <line x1="170" y1="170" x2="170" y2="196" stroke={line} strokeWidth="1.5" />
          <line x1="550" y1="170" x2="550" y2="196" stroke={line} strokeWidth="1.5" />
          <path d="M170 204 l-5 -9 h10 z" fill={inkSoft} />
          <path d="M550 204 l-5 -9 h10 z" fill={inkSoft} />
        </g>

        {/* 4. Branch one: a group names the agent. */}
        <g style={{ animationDelay: "420ms" }}>
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
        </g>

        {/* 5. Branch two, which is the one readers get backwards, so it lands last. */}
        <g style={{ animationDelay: "560ms" }}>
          <rect x="420" y="204" width="260" height="46" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
          <text x="550" y="224" textAnchor="middle" fontSize="13.5" fill={inkStrong}>
            No group names it
          </text>
          <text x="550" y="241" textAnchor="middle" fontSize="12" fill={inkSoft} fontFamily={mono}>
            no GPTBot, no *
          </text>
          <line x1="550" y1="250" x2="550" y2="276" stroke={line} strokeWidth="1.5" />
          <path d="M550 284 l-5 -9 h10 z" fill={inkSoft} />
          <rect x="430" y="284" width="240" height="58" rx="12" fill="var(--ok-bg)" stroke="var(--ok)" />
          <text x="550" y="308" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink-1)">
            Allowed
          </text>
          <text x="550" y="327" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
            robots.txt is opt-out, not opt-in
          </text>
        </g>

        {/* 6. The sentence the whole diagram exists to land. */}
        <g style={{ animationDelay: "700ms" }}>
          <rect x="70" y="372" width="580" height="46" rx="12" fill="none" stroke={line} />
          <text x="360" y="393" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
            An unlisted agent is allowed — unless a <tspan fontFamily={mono}>User-agent: *</tspan> group
            disallows the path.
          </text>
          <text x="360" y="409" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
            So &quot;we never blocked GPTBot&quot; is not the same claim as &quot;GPTBot is allowed&quot;.
          </text>
        </g>
      </svg>

      <figcaption className="mt-3 text-center text-[13px] leading-relaxed text-[var(--ink-3)]">
        The default is the part readers get backwards: an agent that no group names is allowed,
        because robots.txt is a list of refusals rather than a list of permissions.
      </figcaption>
    </figure>
  );
}
