import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";
import DiagramEntityGraph from "../_components/DiagramEntityGraph";

import { og } from "@/lib/og";

const TITLE = "Implementing Schema.org JSON-LD for AI Entity Disambiguation";
const DESCRIPTION =
  "How to use Schema.org JSON-LD so ChatGPT and Claude connect your brand, domain and products to one entity, with a minimal example and validation steps.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/docs/schema-org-jsonld/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/docs/schema-org-jsonld/",
    type: "article",
  }),
};

export default function Page() {
  return (
    <ArticleShell
      category="Schema"
      title={TITLE}
      description={DESCRIPTION}
      readTime="5 min read"
      updated="October 2026"
      faq={{
        title: "Questions about entity markup",
        items: [
          { q: "Which schema types matter most?", a: "Organization and WebSite. They are what let a model bind your brand name, your domain and your product to a single entity instead of guessing whether three separate strings mean the same thing." },
          { q: "What does sameAs actually do?", a: "It names the profiles that are the same entity elsewhere, which is what turns a string into a resolved entity. A link to an empty or abandoned profile is worse than no link at all." },
          { q: "How do I validate the markup?", a: "Paste it into a structured data validator and check two things: every node has a stable @id, and the properties its type requires are present rather than merely intended." },
        ],
      }}
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

      {/*
        Placed here rather than beside the @graph example further down, because it answers the
        sentence immediately above it - a stable @id, a canonical url and a sameAs list are the
        joins - and that sentence is the one a reader is most likely to read as decoration. The
        code block below then shows the syntax of a shape the reader has already seen, instead of
        asking them to infer the shape from the syntax.
      */}
      <DiagramEntityGraph />

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
