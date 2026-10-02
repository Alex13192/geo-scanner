import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";

const TITLE = "Implementing Schema.org JSON-LD for AI Entity Disambiguation";
const DESCRIPTION =
  "How to use Schema.org JSON-LD to make sure ChatGPT and Claude connect your brand name, domain and products to one entity, including a minimal working example and validation steps.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/docs/schema-org-jsonld/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/docs/schema-org-jsonld/", type: "article" },
};

export default function Page() {
  return (
    <ArticleShell
      category="Schema"
      title={TITLE}
      description={DESCRIPTION}
      readTime="5 min read"
      updated="October 2026"
    >
      <p>
        <strong>JSON-LD is how you tell a machine that your brand name, your domain and your
        product are one thing rather than three coincidences.</strong> Without it, a model has
        to infer that the string in your <code>&lt;title&gt;</code> is the same entity as your
        domain. Structured data removes the guesswork.
      </p>

      <h2>What problem does JSON-LD solve for AI engines?</h2>
      <p>
        Entity disambiguation. If your product is called <em>Northwind</em> and there is also a
        film studio called Northwind, an AI system has no reliable way to attribute a mention
        to you. <code>Organization</code> markup with a stable <code>@id</code>, a canonical{" "}
        <code>url</code> and a <code>sameAs</code> list gives it the joins it needs.
      </p>

      <h2>Which schema types matter most for GEO?</h2>
      <ul>
        <li><strong>Organization</strong> — anchors your brand as an entity. The single highest-value node.</li>
        <li><strong>WebSite</strong> — ties the domain to that entity.</li>
        <li><strong>SoftwareApplication</strong> or <strong>Product</strong> — describes what you actually sell.</li>
        <li><strong>FAQPage</strong> — pairs questions with answers. Only use it where the same Q&amp;A is visible on the page.</li>
        <li><strong>Article</strong> — signals authorship and dates on editorial pages.</li>
      </ul>

      <h2>How do I connect multiple nodes into one entity?</h2>
      <p>
        Use a single <code>@graph</code> and give every node an <code>@id</code>. Other nodes
        then reference those identifiers instead of repeating the data. This is what turns
        separate snippets into one coherent entity description.
      </p>
      <pre>{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://your-domain.com/#organization",
      "name": "Your Brand Name",
      "url": "https://your-domain.com",
      "logo": "https://your-domain.com/logo.png",
      "sameAs": [
        "https://x.com/yourhandle",
        "https://github.com/you/repo"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://your-domain.com/#website",
      "url": "https://your-domain.com",
      "name": "Your Brand Name",
      "publisher": { "@id": "https://your-domain.com/#organization" }
    }
  ]
}
</script>`}</pre>
      <p>
        The detail that gets skipped: <strong>the <code>name</code> must be identical across
        your <code>&lt;title&gt;</code>, your <code>&lt;h1&gt;</code>, your{" "}
        <code>llms.txt</code> and this markup.</strong> Three different names on one page
        defeats the purpose entirely.
      </p>

      <h2>How do I validate the markup?</h2>
      <ol>
        <li>Run the URL through the <a href="https://validator.schema.org/" rel="nofollow noopener" target="_blank">Schema.org validator</a>. Zero errors is the bar.</li>
        <li>Confirm the node types you intended are actually detected — not just that nothing errored.</li>
        <li>Check the rendered HTML source, not the editor. Client-side rendering can drop the script from the initial response.</li>
      </ol>
      <p>
        Note that Google has narrowed FAQ <em>rich results</em> to a small set of sites, so low
        FAQPage eligibility does not mean the markup is useless — generative engines still
        parse it. See also{" "}
        <a href="/docs/qa-style-headings/">optimizing headings for direct AI citation</a>.
      </p>
    </ArticleShell>
  );
}
