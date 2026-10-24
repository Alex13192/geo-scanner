import Link from "next/link";
import type { ReactNode } from "react";
import PageFooter from "@/app/components/PageFooter";
import SiteNav from "@/app/components/SiteNav";
import Evidence, {
  type EvidenceSource,
  GEO_PRIMARY_QUOTE,
  GEO_PRIMARY_SOURCES,
} from "@/app/components/Evidence";
import Faq, { type FaqItem } from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { formatDate, insightPath, type PostMeta } from "@/lib/insights";
import { OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * The shell every /blog/<slug>/ article renders through.
 *
 * WHY IT IS NOT ArticleShell WITH EXTRA PROPS: /docs/ is product documentation - the
 * reader arrives with a task and the page is a sequence of steps. /blog/ is
 * writing: it has a publication date, a byline, a source list and a place in an
 * archive, and the About page's claim that a person wrote it has to be visible rather
 * than inferred from structured data. Sharing one component would have meant a byline
 * slot on five guides that no one authors, and a "read the next guide" strip on articles
 * that are not in a series.
 *
 * The body typography is the same `.doc-article` class as the guides, because it is the
 * same job: 17px text at a 768px measure. See globals.css.
 *
 * THE BYLINE LINKS TO /author/ AND NOT TO THE GITHUB PROFILE. A reader who wants to know
 * whether to trust a number should land on the page that explains how the numbers are
 * made; the repository is one click further on, for the reader who wants to check the
 * code itself. Both are in the Person node's `sameAs`, so a crawler gets them either way.
 */
type RelatedLink = {
  href: string;
  label: string;
  note: string;
};

type PostShellProps = {
  insight: PostMeta;
  /**
   * Overrides the canonical path used in the structured data. /author/ renders through this
   * shell but is not an archive entry, so the default (built from the slug) would point its
   * `mainEntityOfPage` at a URL that does not exist.
   */
  path?: string;
  /**
   * BlogPosting for a dated piece, ProfilePage for the page that describes its author. The
   * distinction is what tells a consumer whether it is looking at writing or at a person.
   */
  schemaType?: "BlogPosting" | "ProfilePage";
  /** Replacement sources where the piece leans on something more specific. */
  sources?: EvidenceSource[];
  /** Per-article Q&A. Omitted rather than filled with boilerplate. */
  faq?: { title: string; items: FaqItem[] };
  /** Two or three internal links that continue the piece. */
  related?: RelatedLink[];
  /**
   * The small byline card after the sources. Off on /author/ itself, where the whole page is
   * the card and a link back to it would be a loop.
   */
  showAuthorCard?: boolean;
  children: ReactNode;
};

export default function PostShell({
  insight,
  path,
  schemaType = "BlogPosting",
  sources = GEO_PRIMARY_SOURCES,
  faq,
  related = [],
  showAuthorCard = true,
  children,
}: PostShellProps) {
  const url = `${SITE_URL}${path ?? insightPath(insight.slug)}`;

  /*
   * BlogPosting rather than Article: the distinction tells a consumer this is part of a
   * dated series rather than a one-off page. The author is a reference to the node the
   * root layout already publishes, so the byline, the Person node and the `sameAs` handle
   * are three renderings of one declaration in lib/author.ts - they cannot name different
   * people.
   */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": `${url}#article`,
    name: insight.title,
    headline: insight.title,
    description: insight.description,
    datePublished: insight.published,
    dateModified: insight.updated ?? insight.published,
    inLanguage: "en",
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: AUTHOR.name,
      url: `${SITE_URL}${AUTHOR.path}`,
    },
    about: { "@id": `${SITE_URL}/#author` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${SITE_URL}${OG_IMAGE.url}`,
    articleSection: insight.category,
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-1)] selection:bg-blue-500 selection:text-white font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <SiteNav />

      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/blog/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← All writing
          </Link>
        </div>
      </div>

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                {insight.category}
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {insight.title}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {insight.dek}
              </p>
              {/*
                The byline is the one place the author's name appears in visible text on
                every article. `dateTime` carries the ISO value so the machine-readable
                date and the printed date are the same fact, not two formats of a guess.
              */}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                <span>
                  By{" "}
                  <Link href={AUTHOR.path} className="text-[var(--accent)] hover:opacity-75">
                    {AUTHOR.name}
                  </Link>
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime={insight.published}>{formatDate(insight.published)}</time>
                {insight.updated ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Updated {formatDate(insight.updated)}</span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{insight.readTime}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              {children}
            </article>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              {faq ? <Faq title={faq.title} items={faq.items} level="h3" /> : null}
              <Evidence
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={sources}
                note="Every figure in this piece comes from the published study or from the rule set the scanner executes; both are linked, and both can be re-run."
              />
            </div>

            {/*
              The author card, rendered here rather than only on /author/, because an
              article that ends in a source list and then nothing looks like content
              without a writer. It is deliberately small: the full account, including how
              the writing is funded and corrected, is one link away. Off on /author/ itself,
              where the page is the card.
            */}
            {showAuthorCard ? (
              <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
                <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                  {AUTHOR.name} — {AUTHOR.role}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">{AUTHOR.bio}</p>
                <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                  <Link href={AUTHOR.path} className="text-[var(--accent)] hover:opacity-75">
                    How this site is written and funded →
                  </Link>
                </p>
              </div>
            ) : null}

            {related.length > 0 ? (
              <div className="mx-auto mt-14 max-w-3xl">
                <h2 className="text-xl font-bold text-[var(--ink-1)]">Read next</h2>
                <ul className="mt-4 space-y-3">
                  {related.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                      >
                        {link.label}
                      </Link>
                      <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">{link.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mx-auto mt-14 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link href="/" className="text-sm text-[var(--accent)] hover:opacity-75">
                Run a free GEO audit on your own site →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PageFooter width="3xl" brand="LLMention Writing" />
    </div>
  );
}
