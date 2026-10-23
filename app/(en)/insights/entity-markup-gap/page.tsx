import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("entity-markup-gap");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: insightPath(insight.slug) },
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
        title: "Questions about entity markup",
        items: [
          {
            q: "Is entity markup a ranking factor?",
            a: "Not directly. It is a resolution aid: it gives a model a name, a URL and a set of external profiles it can check the name against. Whether a page is cited depends on far more than that, and no markup guarantees a citation.",
          },
          {
            q: "Does more JSON-LD always help?",
            a: "No. A valid graph that describes the page truthfully helps; a large graph full of types the page does not support is the same liability as keyword stuffing, and a consumer that finds it in conflict with the visible page will trust neither.",
          },
          {
            q: "What is the smallest change that moves the number?",
            a: "One Organization node with name, url and sameAs, plus a WebSite node that references it. That is enough to pass both rules on this site, and it is the markup most of the sample is missing.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("thirty-homepages-none-graded-a"),
          label: "We scanned 30 homepages and none graded an A",
          note: "Entity markup is 12% of the score. The distribution shows what it costs when several dimensions fail together.",
        },
        {
          href: insightPath("reading-a-failed-check"),
          label: "How to read a failed check and fix the right thing",
          note: "A failed entity check can mean the markup is absent or that the parser never saw it. The two need different fixes.",
        },
      ]}
    >
      <p>
        Twenty-two of the 30 homepages in the study declare no Organization, WebSite, Person or
        LocalBusiness entity at all. That is <strong>73%</strong> of the sample, and it includes
        several companies whose names a model certainly knows, because knowing a name and being
        told which domain owns it are different problems.
      </p>
      <p>
        Nineteen of the 30 — <strong>63%</strong> — have neither an entity node nor a
        <code>sameAs</code> list. For those pages, every consumer has to infer the brand from
        the visible text, and inference is the part that goes wrong quietly: a model can know
        the company perfectly and still not attach its name to your domain.
      </p>

      <h2>What counts as declaring an entity?</h2>
      <p>
        One parsed JSON-LD block containing an <code>@type</code> of Organization, WebSite,
        Person or LocalBusiness. That is the whole rule, worth four points.
      </p>
      <p>
        It is deliberately shallow. The scanner reads the types that appear anywhere in a graph
        that parsed, including nested ones, so a Person node inside an article&rsquo;s author
        property satisfies it without an Organization node existing anywhere on the page. The
        evidence line names the types that matched, so a pass says what it saw rather than
        asserting that a brand entity exists.
      </p>

      <h2>How many of the 30 declare one?</h2>
      <p>
        Eight declare an entity type, nine carry a <code>sameAs</code>, six do both, and
        nineteen do neither. The overlap is the interesting part: the two properties are often
        added together, and the sites that have one without the other are the ones worth
        looking at.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Signal</th>
              <th>Sites</th>
              <th>Share of 30</th>
              <th>Where it is scored</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Declares an entity type</td>
              <td>8</td>
              <td>27%</td>
              <td>Machine readability, 12% of total</td>
            </tr>
            <tr>
              <td>Carries a sameAs list</td>
              <td>9</td>
              <td>30%</td>
              <td>Trust and authority, 10% of total</td>
            </tr>
            <tr>
              <td>Both</td>
              <td>6</td>
              <td>20%</td>
              <td>Both dimensions</td>
            </tr>
            <tr>
              <td>Neither</td>
              <td>19</td>
              <td>63%</td>
              <td>Both dimensions</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What do the passing and failing pages look like?</h2>
      <p>
        The pattern is not the one people expect. Some of the highest-scoring pages have an
        entity and no <code>sameAs</code>; some of the lower-scoring ones have <code>sameAs</code>
        without an entity.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Homepage</th>
              <th>Score</th>
              <th>Entity</th>
              <th>sameAs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>salesforce.com</td>
              <td>83</td>
              <td>Yes</td>
              <td>No</td>
            </tr>
            <tr>
              <td>vercel.com</td>
              <td>79</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>shopify.com</td>
              <td>72</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>bbc.com</td>
              <td>61</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>github.com</td>
              <td>60</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>microsoft.com</td>
              <td>48</td>
              <td>No</td>
              <td>No</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Two of those rows are instructive. Salesforce scores highest in the whole sample and has
        no <code>sameAs</code>: the entity node is doing the identification work, and the profile
        links were never added. Shopify passes <code>sameAs</code> while declaring no entity, so
        the profiles point at something the page never names — a join without an anchor.
      </p>

      <h2>What does a model actually do with this markup?</h2>
      <p>
        It uses it to resolve a string to one thing. <code>Organization</code> with
        <code>name</code>, <code>url</code> and <code>sameAs</code> is the shape that says
        &ldquo;this name, this domain, these profiles are the same entity&rdquo;.
      </p>
      <p>
        Without it, a consumer resolving your brand has to use the page text and whatever it
        already believes. That is not nothing — a large document with the company name written
        plainly is not invisible — but it is inference, and inference has failure modes a
        declaration does not: the wrong namesake, an abbreviated name, a rebrand, or a model
        that knows the company and not the domain.
      </p>
      <p>
        This is why the two rules are scored in different dimensions. The entity node is a
        machine-readability property: can the parser see a thing to point at. The
        <code>sameAs</code> list is a trust property: does the thing point at accounts that
        exist elsewhere. The first is about this page, the second is about your brand in the
        world.
      </p>

      <h2>Does the check prove the entity is correct?</h2>
      <p>
        No, and the rule pages say so. Presence is all that is tested: nothing fetches the
        <code>sameAs</code> profiles, and nothing compares the declared name to the page title.
      </p>
      <p>
        That limit is worth knowing before optimising for it. A page can pass by declaring a
        Person node whose name appears nowhere in the visible copy, and a model reading both
        will notice the disagreement. The rule is a floor for parsability, not a certificate of
        identity.
      </p>

      <h2>What is the smallest markup that passes both rules?</h2>
      <p>
        One Organization node, one WebSite node that references it, and a
        <code>sameAs</code> array. Replace the placeholders; do not leave them.
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
      "sameAs": [
        "https://github.com/your-account",
        "https://www.linkedin.com/company/your-brand"
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
        Two things about that snippet are deliberate. The <code>@id</code> values are fragments
        on the real origin, so every page can reference the same node rather than restating the
        brand. And the array is not padded: two profiles that exist are worth more than six
        that do not, because the property is a claim a consumer can check.
      </p>

      <h2>Which is worth doing first?</h2>
      <p>
        The entity node, because it is scored twice over — once directly and once as the anchor
        that makes <code>sameAs</code> mean something.
      </p>
      <ol>
        <li>
          Add the Organization node to every page, or to a layout that wraps every page. Both
          work; one file is easier to keep true.
        </li>
        <li>
          Add <code>sameAs</code> with the profiles you actually maintain. A dead profile is a
          broken claim, and a claim a model can disprove costs more than an absent one.
        </li>
        <li>
          Validate the block parses. A syntax error is indistinguishable from absent markup to a
          consumer, and worse than nothing to a reader who thinks they added it.
        </li>
        <li>
          Re-run the scan. The evidence line names the types that matched, so a pass is
          observable rather than assumed.
        </li>
      </ol>
      <p>
        The guide with the full walkthrough is{" "}
        <Link href="/docs/schema-org-jsonld/">the Schema.org JSON-LD guide</Link>, and the
        arithmetic behind the weights is on the{" "}
        <Link href="/methodology/">methodology page</Link>.
      </p>
    </PostShell>
  );
}
