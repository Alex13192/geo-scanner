"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The frame every explanatory diagram in /docs/ is built from: the figure, the inline SVG, the
 * caption, and the one IntersectionObserver that assembles the drawing as the reader arrives.
 *
 * WHY THIS EXISTS NOW, AND WHY IT DID NOT BEFORE. It was written twice, and DiagramFileRoles
 * recorded the trade rather than leaving the repetition for somebody to notice: twenty copied
 * lines are cheaper than a third component that has to be understood before either diagram can be
 * read, and "that trade flips on the third diagram". This is the third. The flip is worth stating
 * exactly: the mechanism is now read once, and each diagram carries only what its own picture
 * means, which is the part that actually differs between them.
 *
 * WHY INLINE SVG RATHER THAN AN IMAGE. An inline diagram cannot go stale. The tool screenshots in
 * public/shots/ will be wrong the next time those interfaces change; a diagram explaining a file
 * format will not. It is also crawlable markup rather than a binary, costs no request, and reads
 * the same CSS tokens as the rest of the site - so it follows the theme instead of fighting it,
 * and needs no dark-mode variant.
 *
 * WHY THIS IS A CLIENT COMPONENT, AND WHY NOT SCROLL-DRIVEN CSS. The obvious way to assemble a
 * diagram as the reader reaches it is `animation-timeline: view()`, which the rest of the site's
 * motion uses. MEASURED, IT DOES NOT WORK HERE: SVG children accept `animation-name` and
 * `animation-timeline: view()` and then never animate - all thirty-four of them stayed at opacity
 * 1 with the figure centred in the viewport. HTML elements honour the timeline; their SVG
 * counterparts do not.
 *
 * So the trigger is an IntersectionObserver and the animation is time-based, which SVG does
 * honour. One observer, one class, and the delays stay with the caller - inline on each group,
 * because they mark a reading order rather than an index anybody has to count.
 *
 * WHAT THE CALLER KEEPS, AND WHY THIS COMPONENT TAKES THE REST. A caller supplies its viewBox,
 * its own accessible name and description, its caption, and its groups; it does not supply its
 * own ids. They are passed rather than generated with useId() so the prerendered HTML stays
 * diffable, and the extraction that produced this file was checked that way: both diagrams that
 * existed before it rebuilt byte-for-byte identical, apart from the build id and the
 * content-hashed asset filenames, which change on every build by design.
 *
 * WHY THE CALLING MODULES CARRY `"use client"` AS WELL, WHICH LOOKS REDUNDANT AND IS NOT. Only
 * this file needs the directive; it is the one that uses hooks. A caller that drops it still
 * renders correctly, because a server component may pass children into a client one - and that is
 * exactly what makes the mistake easy to make. MEASURED, dropping it moves the drawing out of the
 * client bundle and into the RSC payload, where it is serialised a second time alongside the
 * markup it has already produced: the two diagram pages went from 70543 and 68190 bytes to 77009
 * and 75232, in exchange for one kilobyte of JavaScript. Keeping the directive on the caller
 * holds the HTML at the size it already was, which is the right side of that trade on a Worker
 * whose CPU budget, rather than its bandwidth, is the thing that runs out.
 *
 * WHAT THE DRAWING DOES UNTIL THE OBSERVER FIRES, which is the property worth keeping. `armed`
 * means "JavaScript has taken over and the diagram may now hide itself"; it is deliberately
 * separate from `shown`, because those are two different moments. Armed happens on mount and
 * shown happens when the reader arrives. Without the split the elements would be visible, then
 * jump to opacity 0, then fade in - a flash. A browser without scripting, a script that fails, or
 * a reader who asked for reduced motion all get the finished diagram rather than an empty box,
 * because `is-armed` is only ever added by the effect below.
 */
type DiagramFigureProps = {
  /** The drawing's coordinate space, e.g. "0 0 720 430". */
  viewBox: string;
  /** id of the SVG <title>. Must be unique in the document. */
  titleId: string;
  /** id of the SVG <desc>. Must be unique in the document. */
  descId: string;
  /** The accessible name: what this drawing decides, in one sentence. */
  title: string;
  /** The accessible description: the drawing described as prose, for a reader who cannot see it. */
  desc: string;
  /** The line under the figure. The part a reader should leave with. */
  caption: ReactNode;
  /** The groups, each carrying its own inline animationDelay. */
  children: ReactNode;
};

export default function DiagramFigure({
  viewBox,
  titleId,
  descId,
  title,
  desc,
  caption,
  children,
}: DiagramFigureProps) {
  const figure = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
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
       * MOST OF THE FIGURE, NOT A SLIVER. This was 0.35 and it was reported as "it does not move
       * at all" - because 0.35 fires while the figure is still arriving, so the whole sequence
       * played out during the scroll and had finished by the time the reader stopped and looked
       * at it. The measurement showed it working perfectly; the problem was that nobody could be
       * looking at the right moment.
       *
       * 0.65 means the observer waits until the diagram has mostly settled into the viewport,
       * which is a reasonable proxy for the reader having stopped.
       */
      { threshold: 0.65 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <figure ref={figure} className="my-10">
      <svg
        viewBox={viewBox}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className={`diagram-build h-auto w-full${armed ? " is-armed" : ""}${shown ? " is-shown" : ""}`}
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{desc}</desc>
        {children}
      </svg>

      <figcaption className="mt-3 text-center text-[13px] leading-relaxed text-[var(--ink-3)]">
        {caption}
      </figcaption>
    </figure>
  );
}
