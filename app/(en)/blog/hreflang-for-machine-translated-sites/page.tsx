import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("hreflang-for-machine-translated-sites");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English-first series; translations add their own hreflang keys when they ship. */
    languages: {
      en: `/blog/${insight.slug}/`,
      "x-default": `/blog/${insight.slug}/`,
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: insightPath(insight.slug),
    type: "article",
  }),
};

export default function Page() {
  return (
    <PostShell
      insight={insight}
      faq={{
        title: "Questions about hreflang and machine translation",
        items: [
          {
            q: "Does hreflang improve ranking in each language?",
            a: "No. It tells an engine which URL to show to which language or region; it does not rank the page, and it does not judge the translation. A machine-translated page with perfect hreflang is still a machine-translated page.",
          },
          {
            q: "What if only some pages are translated?",
            a: "Declare only the versions that exist. A page translated into Chinese and Japanese should list those two plus itself and x-default; a page that exists only in English should list only English and x-default. Declaring a version that was never built is a broken promise the scanner cannot catch because it does not fetch the alternates.",
          },
          {
            q: "Should machine-translated pages be indexed?",
            a: "Only if they meet the quality bar you would apply to a human translation. hreflang does not make a weak translation better; it exposes it in more markets. If the text is not good enough to publish, noindex or do not publish the language, and do not declare it in the cluster.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("canonical-urls-split-citations"),
          label: "Canonical URLs: the mistakes that split citations",
          note: "The other head-level declaration that has to agree with hreflang.",
        },
        {
          href: insightPath("sitemap-lastmod-false-freshness"),
          label: "Sitemap lastmod: why false freshness is worse than none",
          note: "The same principle for another field: declare only what the site can honour.",
        },
        {
          href: "/checks/hreflang/",
          label: "The rule this article is about",
          note: "Two points for two distinct codes, and the rule page's admission that nothing is fetched.",
        },
      ]}
    >
      <p>
        Machine translation makes a multilingual site cheap to produce and easy to get wrong. The
        pages are generated in a loop, the hreflang tags are generated in the same loop, and the
        result looks complete: every URL points at every other URL, every language is declared, and
        nothing is checked. hreflang is a declaration of alternatives, not a quality signal, and a
        declaration that names pages which do not exist is a broken promise a single fetch cannot
        catch.
      </p>
      <p>
        This article is about the cluster as a system: what has to be true for it to be valid, what
        machine translation adds to the failure list, and what this site does when a page is
        translated into some languages but not others.
      </p>

      <h2>What hreflang declares</h2>
      <p>
        An hreflang annotation says: this URL is the version of the page for this language (and
        optionally region), and these other URLs are the other versions. The set is a cluster, and
        the rules are about the cluster rather than any single tag.
      </p>
      <ul>
        <li>
          <strong>Every version lists every version, including itself.</strong> The relationship is
          reciprocal; a one-way declaration is ignored or only half-applied.
        </li>
        <li>
          <strong><code>x-default</code> names the fallback</strong> — the version to show when no
          language matches. It is not a language code and does not count as one.
        </li>
        <li>
          <strong>Each version canonicalises to itself.</strong> The Chinese page&rsquo;s canonical
          is the Chinese URL, not the English one; the hreflang cluster is what connects them.
        </li>
        <li>
          <strong>Only pages that exist and are indexable belong in the cluster.</strong> A version
          that 404s, redirects, or is noindexed is not an alternate.
        </li>
        <li>
          <strong>Codes are language tags, not marketing names.</strong> <code>zh-Hans</code> and
          <code>pt-BR</code> are tags; <code>chinese</code> and <code>international</code> are not.
        </li>
      </ul>

      <h2>What machine translation adds to the failure list</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Failure</th>
              <th>Why it happens</th>
              <th>What to do instead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Every page translated, including the thin ones</td>
              <td>Translation is cheap, so the loop covers legal pages, tag archives and empty categories.</td>
              <td>Translate the pages that carry value; leave the rest in the source language or out of the index.</td>
            </tr>
            <tr>
              <td>One-way hreflang</td>
              <td>The template emits the full list on the source page but a partial one on the translated page.</td>
              <td>Generate the cluster from one list, not from per-page logic.</td>
            </tr>
            <tr>
              <td>Declared versions that were never built</td>
              <td>The cluster is generated from the locale list, not from the pages that exist.</td>
              <td>Read the translations from the same registry that drives routing.</td>
            </tr>
            <tr>
              <td>x-default missing or pointing at a redirect</td>
              <td>The fallback is copied from the source URL before a locale prefix is added.</td>
              <td>Point x-default at the language selector or the canonical default page, and check it resolves.</td>
            </tr>
            <tr>
              <td>Canonical pointing across languages</td>
              <td>A template canonicalises every version to the source language.</td>
              <td>Self-canonical per version; let hreflang do the connecting.</td>
            </tr>
            <tr>
              <td>Auto-redirect by IP or Accept-Language</td>
              <td>It feels helpful to show the "right" language.</td>
              <td>Keep every version crawlable at its own URL; offer a switch instead of a redirect.</td>
            </tr>
            <tr>
              <td>Weak translations indexed for every market</td>
              <td>hreflang is treated as a publishing decision.</td>
              <td>Apply a quality bar; noindex or unpublish a language that does not meet it.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Partial translation is normal; declaring it wrong is not</h2>
      <p>
        Most sites are not uniformly translated. A blog may have thirty English posts and five
        Chinese ones; a product may have six locales on the homepage and one on the legal pages. That
        is fine. What is not fine is emitting a six-language cluster on a page that exists in two.
      </p>
      <p>
        This site handles it with a registry field rather than a locale list: a piece declares the
        languages it actually exists in, and everything downstream reads that field. The English-only
        posts in this series declare <code>["en"]</code>; their alternate block is English plus
        <code>x-default</code>, the sitemap lists no Chinese or Japanese alternate, and the localized
        archives do not show them. The Chinese and Japanese pages of the older pieces declare their
        own three-language cluster. Nothing claims a version that is not there.
      </p>

      <h2>What the scanner checks — and what it does not</h2>
      <p>
        The rule is <Link href="/checks/hreflang/">hreflang</Link>, worth 2 points in the
        multilingual dimension. The condition is at least two distinct language codes; repeated
        attributes for the same language do not count, and <code>x-default</code> is not a language,
        so <code>en</code> plus <code>x-default</code> does not satisfy it. A page with no hreflang
        at all is marked not applicable rather than failed, because one fetched page cannot tell a
        single-language site from a multilingual one that forgot to declare.
      </p>
      <p>
        The rule page states the limit plainly: the codes are read from the attributes and the pages
        they point at are not fetched, so two tags naming versions that were never built satisfy the
        check. It is a declaration check. The cluster can be perfectly declared and still be wrong.
      </p>
      <p>
        There is a separate <code>lang-region</code> rule (1 point) for a tag with a region subtag,
        and an <code>html-lang</code> rule for the document language. They are different questions:
        what the page says about itself, and what it says about its siblings.
      </p>

      <h2>Auditing a cluster</h2>
      <pre>{`# 1. The alternates declared on one version
curl -sS https://your-domain.com/blog/post/ \\
  | grep -oE 'hreflang="[^"]+" href="[^"]+"'

# 2. The same for a translated version — the sets must match
curl -sS https://your-domain.com/zh/blog/post/ \\
  | grep -oE 'hreflang="[^"]+" href="[^"]+"'

# 3. Every declared URL should be 200 and self-canonical
curl -sS https://your-domain.com/blog/post/ \\
  | grep -oE 'hreflang="[^"]+" href="[^"]+"' | grep -oE 'https://[^"]+' \\
  | while read u; do curl -sS -o /dev/null -w "%{http_code} %{url_effective}\\n" "$u"; done

# 4. Does each version canonicalise to itself?
for u in /blog/post/ /zh/blog/post/ /ja/blog/post/; do
  curl -sS "https://your-domain.com$u" | grep -oE 'rel="canonical"[^>]*'
done`}</pre>
      <p>
        The comparison in step 2 is the one that catches most real failures: the two sets should be
        identical. A missing return link, a language declared on one side only, or a cluster that
        includes a version which does not exist all show up as a difference.
      </p>

      <h2>What hreflang does not do</h2>
      <p>
        It does not improve the translation, it does not guarantee the right version is shown, and it
        does not make a page citable in a language where the content is weak. It is a declaration
        that reduces a specific error — showing a Korean reader the English page — and it is only as
        good as the cluster behind it.
      </p>
      <p>
        The same standard as the rest of this series: declare only what the site can honour, make
        the declaration checkable, and do not let a tag imply a quality that the page does not have.
      </p>
    </PostShell>
  );
}
