import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("entity-graph-organization-website-softwareapplication");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English-first series; translations add their own keys when they ship. */
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
        title: "Questions about the entity graph",
        items: [
          {
            q: "Do I need all three nodes?",
            a: "Not always, but most product sites need at least Organization and WebSite, and a tool or app should describe itself with SoftwareApplication rather than being folded into WebSite. The point is not the count; it is that each node answers a different question and the relations say how they belong together.",
          },
          {
            q: "Does adding the markup guarantee the engine understands my brand?",
            a: "No. Structured data is a set of claims; entity resolution is an inference the engine makes from those claims, the page text, links and other sources. The markup removes avoidable ambiguity. It does not force a conclusion.",
          },
          {
            q: "Why does the scanner pass a page with only a Person node?",
            a: "Because its entity check accepts any Organization, WebSite, Person or LocalBusiness node, including one nested inside an Article's author property. That is a floor, not a proper entity graph: a page can pass the check and still have no declared organisation or product. The evidence line names what it saw so the pass is not mistaken for more.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("llms-full-txt-and-context-budgets"),
          label: "llms-full.txt and context budgets",
          note: "The other machine-facing file: what an agent reads when it wants the corpus rather than the map.",
        },
        {
          href: insightPath("entity-markup-gap"),
          label: "22 of 30 sites leave AI guessing who they are",
          note: "The study result behind this article: what the sample declared, and what it did not.",
        },
        {
          href: "/checks/jsonld-entity/",
          label: "The rule this article is about",
          note: "The exact pass condition, the four accepted node types, and what the check does not prove.",
        },
      ]}
    >
      <p>
        There is a specific kind of structured data that is easy to add and hard to get right:
        the entity graph. Almost every guide shows a single block with <code>Organization</code> and{" "}
        <code>WebSite</code>, the page validates, and the site is declared done. What the block
        usually lacks is the part that makes it a graph — identifiers and relations — and the part
        that distinguishes the company from the site from the product.
      </p>
      <p>
        This article is about the three nodes that most product sites need, what each one answers,
        how to connect them with <code>@id</code>, and the mistakes that leave a technically valid
        graph saying less than it appears to.
      </p>

      <h2>Three questions, three nodes</h2>
      <p>
        The nodes are not synonyms for "my site". They answer different questions, and collapsing
        them into one loses the distinctions an engine needs.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Node</th>
              <th>Question it answers</th>
              <th>Typical properties</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>Organization</code>
              </td>
              <td>Who is responsible for this site and this product?</td>
              <td>
                <code>name</code>, <code>url</code>, <code>logo</code>, <code>sameAs</code>,{" "}
                <code>founder</code>, <code>email</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>WebSite</code>
              </td>
              <td>What is the site, and who publishes it?</td>
              <td>
                <code>url</code>, <code>name</code>, <code>publisher</code>,{" "}
                <code>inLanguage</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>SoftwareApplication</code>
              </td>
              <td>What is the product, and what can it do?</td>
              <td>
                <code>name</code>, <code>applicationCategory</code>,{" "}
                <code>operatingSystem</code>, <code>offers</code>, <code>publisher</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        A useful rule of thumb: if the thing could plausibly exist without the website, it is not
        the <code>WebSite</code>. A company and a product can both exist without a particular
        domain, which is why they get their own nodes. The site is the surface through which both
        are read.
      </p>

      <h2>The part that makes it a graph: @id</h2>
      <p>
        <code>@id</code> gives a node a stable identifier — usually the site URL plus a fragment —
        and lets other nodes refer to it instead of repeating it. A relation such as{" "}
        <code>{'{"publisher": { "@id": "https://example.com/#organization" }}'}</code> says "this is
        the same organisation declared above", not "here is another organisation". Without those
        references, three blocks on one page are three disconnected claims; with them, they are
        one entity described in three roles.
      </p>
      <pre>{`{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Example Labs",
      "url": "https://example.com/",
      "logo": "https://example.com/logo.png",
      "sameAs": ["https://github.com/example-labs"],
      "founder": { "@id": "https://example.com/#founder" }
    },
    {
      "@type": "Person",
      "@id": "https://example.com/#founder",
      "name": "Jane Example",
      "jobTitle": "Founder"
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com/",
      "name": "Example Labs",
      "publisher": { "@id": "https://example.com/#organization" }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://example.com/#app",
      "name": "Example Audit",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "publisher": { "@id": "https://example.com/#organization" },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  ]
}`}</pre>
      <p>
        The exact properties are less important than the shape: one node per thing, an identifier
        per node, and references between them. The graph should read like a sentence — this
        organisation publishes this site and this product — not like three brochures stapled
        together.
      </p>

      <h2>Mistakes that pass validation and still say nothing</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Mistake</th>
              <th>What it costs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Three nodes, no <code>@id</code>, no relations</td>
              <td>Three unconnected claims; an engine cannot tell they describe one thing.</td>
            </tr>
            <tr>
              <td>Using <code>WebSite</code> for the product</td>
              <td>The site is described, the product is not; there is nothing to attach an app category or offer to.</td>
            </tr>
            <tr>
              <td>Brand name in <code>name</code> differs from the visible title</td>
              <td>The page and the markup make different claims, which is the ambiguity markup was meant to remove.</td>
            </tr>
            <tr>
              <td>
                <code>sameAs</code> pointing at the site itself or at a profile that does not list the brand
              </td>
              <td>A link with no corroboration; it adds noise instead of identity.</td>
            </tr>
            <tr>
              <td>Product node without a publisher</td>
              <td>The product floats: no one is accountable for it, and it is not attached to the organisation.</td>
            </tr>
            <tr>
              <td>Two <code>Organization</code> nodes with different identifiers</td>
              <td>The graph contradicts itself; resolution becomes a guess.</td>
            </tr>
            <tr>
              <td>JSON-LD injected after hydration</td>
              <td>The markup is absent from the server response a crawler parses.</td>
            </tr>
            <tr>
              <td>Invented addresses, awards or ratings</td>
              <td>False structured data is a trust and compliance problem, not a markup problem.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How this scanner scores it — and what the score means</h2>
      <p>
        The rule is <Link href="/checks/jsonld-entity/">jsonld-entity</Link>, worth 4 points in the
        machine readability dimension. The condition is deliberately simple: parsed JSON-LD must
        contain an <code>@type</code> of <code>Organization</code>, <code>WebSite</code>,{" "}
        <code>Person</code> or <code>LocalBusiness</code>. Nested nodes count, so a{" "}
        <code>Person</code> inside an <code>Article</code>&rsquo;s author property satisfies it.
      </p>
      <p>
        That is a floor, not a verdict. The rule page says so explicitly: a page can pass without
        declaring an <code>Organization</code> anywhere, and the evidence line names the types it
        matched rather than asserting that a brand entity exists. The check is cheap and honest
        about being cheap; the work of building a graph is still the work.
      </p>
      <p>
        There is a second, separate rule for page-type markup (<code>jsonld-content</code>), which
        looks for <code>FAQPage</code>, <code>Article</code>, <code>Product</code>,{" "}
        <code>SoftwareApplication</code> and similar. Passing one does not imply the other: a site
        can declare a perfect <code>Organization</code> and still not say what kind of page the
        reader is on.
      </p>

      <h2>How to check your own graph</h2>
      <p>
        The first requirement is that the data is in the response, not only in the browser. Fetch
        the page as a crawler would and parse what comes back.
      </p>
      <pre>{`# 1. Is there a JSON-LD block in the server response?
curl -sS https://your-domain.com/ | grep -c 'application/ld+json'

# 2. Extract it and check that it parses
curl -sS https://your-domain.com/ \\
  | python -c "import sys,json,re; html=sys.stdin.read(); \\
      blocks=re.findall(r'<script[^>]*application/ld\\\\+json[^>]*>(.*?)</script>', html, re.S); \\
      [json.loads(b) for b in blocks]; print(len(blocks), 'block(s) parsed')"

# 3. List the @type values and the @id references
curl -sS https://your-domain.com/ | grep -oE '"@type" *: *"[^"]+"' | sort -u`}</pre>
      <p>
        Then check consistency by hand: every <code>@id</code> reference should resolve to a node
        in the same graph; the brand name should match the visible heading; the product should have
        a publisher; <code>sameAs</code> should point at profiles a reader can open. A validator
        catches syntax; only reading the graph catches a contradiction.
      </p>

      <h2>What a graph changes, and what it does not</h2>
      <p>
        Good entity markup makes disambiguation cheaper: a model does not have to infer whether the
        brand name, the domain and the product are one thing or three. That is a real benefit for
        products with common names or with a name close to another product&rsquo;s, and it is the
        part of GEO that is closest to traditional SEO hygiene.
      </p>
      <p>
        It does not guarantee understanding, ranking or citation. Entity resolution is an inference
        from many sources, and one page&rsquo;s JSON-LD is one input. What the markup can do is
        remove avoidable ambiguity and make the claim auditable — which is exactly what a scanner
        can check, and what a reader can verify.
      </p>
    </PostShell>
  );
}
