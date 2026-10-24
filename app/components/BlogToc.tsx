"use client";

import { useEffect, useState } from "react";

/**
 * A reading index for the blog, built from the headings that are actually on the page.
 *
 * WHY THIS IS CLIENT-SIDE RATHER THAN SERVER-RENDERED: the articles are hand-written JSX in
 * three languages, and a server-side table of contents would need a heading list maintained
 * next to every article - a second copy of the document outline that drifts the first time a
 * heading is edited. Reading the rendered headings means the index cannot disagree with the
 * article. The cost is that it is absent from the first HTML response; for a reader it appears
 * with the hydration, and the headings themselves remain plain server-rendered markup.
 *
 * WHY THE IDS ARE SET HERE: the existing articles never needed anchors. Assigning them from the
 * rendered text keeps every link self-contained, and a heading that already has an id (future
 * articles) is left alone.
 */
export default function BlogToc({ label }: { label: string }) {
  const [items, setItems] = useState<{ id: string; text: string; level: number }[]>([]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".doc-article") ?? document.querySelector<HTMLElement>("article");
    if (!root) return;
    const headings = Array.from(root.querySelectorAll<HTMLElement>("h2, h3"));
    const next = headings
      .map((heading, index) => {
        if (!heading.id) heading.id = `section-${index + 1}`;
        return {
          id: heading.id,
          text: heading.textContent?.trim() ?? "",
          level: heading.tagName === "H2" ? 2 : 3,
        };
      })
      .filter((item) => item.text.length > 0);
    setItems(next);
  }, []);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label={label}
      className="fixed right-4 top-28 z-30 hidden max-h-[70vh] w-56 overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-1)]/95 p-4 text-xs leading-relaxed shadow-xl backdrop-blur xl:block"
    >
      <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
        {label}
      </p>
      <ol className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${item.id}`}
              className="block text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
