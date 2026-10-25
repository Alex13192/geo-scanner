"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * The archive index.
 *
 * WHY THIS EXISTS: the card grid is good at showing the last several pieces and bad at
 * answering "where is the piece from three weeks ago". Once the blog publishes on a schedule,
 * the grid stops being an archive and becomes a feed. This is the directory underneath it:
 * every post in one compact list, grouped by year, filterable by category and searchable by
 * title. It renders on the server as a list, so it is crawlable before hydration; the filters
 * are a client enhancement rather than the source of the list.
 *
 * WHY IT TAKES PROPS INSTEAD OF READING THE REGISTRY: the English archive lists every piece,
 * the Chinese and Japanese archives list only translated pieces with translated titles. Passing
 * the items keeps the translation rule in the page that already owns it instead of adding a
 * fourth place that can disagree about what is published.
 */

export type ArchiveIndexItem = {
  slug: string;
  title: string;
  published: string;
  category: string;
};

export type ArchiveIndexLabels = {
  heading: string;
  description: string;
  search: string;
  allCategories: string;
  allYears: string;
  count: string;
  empty: string;
  category: string;
  date: string;
};

export default function BlogArchiveIndex({
  items,
  basePath,
  labels,
}: {
  items: ArchiveIndexItem[];
  basePath: string;
  labels: ArchiveIndexLabels;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [year, setYear] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items]
  );
  const years = useMemo(
    () => Array.from(new Set(items.map((item) => item.published.slice(0, 4)))).sort().reverse(),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((item) => (category === "all" ? true : item.category === category))
      .filter((item) => (year === "all" ? true : item.published.startsWith(year)))
      .filter((item) => (needle ? item.title.toLowerCase().includes(needle) : true))
      .sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0));
  }, [items, query, category, year]);

  const grouped = useMemo(() => {
    const map = new Map<string, ArchiveIndexItem[]>();
    for (const item of filtered) {
      const key = item.published.slice(0, 4);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  return (
    <section
      id="all-posts"
      aria-labelledby="all-posts-heading"
      className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="all-posts-heading"
          className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]"
        >
          {labels.heading}
        </h2>
        <span className="font-mono text-xs text-[var(--ink-3)]">
          {labels.count.replace("{n}", String(filtered.length)).replace("{total}", String(items.length))}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{labels.description}</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-xs text-[var(--ink-3)]">
          <span className="sr-only">{labels.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--ink-1)]"
          />
        </label>
        <div className="flex gap-3">
          <label className="text-xs text-[var(--ink-3)]">
            <span className="sr-only">{labels.category}</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--ink-1)]"
            >
              <option value="all">{labels.allCategories}</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--ink-3)]">
            <span className="sr-only">{labels.date}</span>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--ink-1)]"
            >
              <option value="all">{labels.allYears}</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--ink-3)]">{labels.empty}</p>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map(([groupYear, groupItems]) => (
            <div key={groupYear}>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
                {groupYear}
              </h3>
              <ol className="mt-3 divide-y divide-[var(--line)] border-t border-[var(--line)]">
                {groupItems.map((item) => (
                  <li key={item.slug} className="flex items-baseline gap-3 py-2.5 text-sm">
                    <time
                      dateTime={item.published}
                      className="w-24 shrink-0 font-mono text-xs text-[var(--ink-3)]"
                    >
                      {item.published.slice(5)}
                    </time>
                    <Link
                      href={`${basePath}${item.slug}/`}
                      className="min-w-0 flex-1 text-[var(--ink-2)] hover:text-[var(--accent)]"
                    >
                      {item.title}
                    </Link>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                      {item.category}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
