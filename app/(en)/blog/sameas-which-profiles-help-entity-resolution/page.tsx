import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("sameas-which-profiles-help-entity-resolution");
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
        title: "Questions about sameAs",
        items: [
          {
            q: "How many sameAs profiles should I have?",
            a: "A handful of profiles that actually identify the entity, not every account the company owns. Three to five verified profiles — a code host, a professional profile, a registry or directory — are usually more useful than fifteen links, because each link is a claim that has to be corroborated rather than noise.",
          },
          {
            q: "Does sameAs have to be on the Organization node?",
            a: "No. The scanner accepts a sameAs property anywhere in the parsed graph, because a Person or WebSite node can identify the same entity. Putting the strongest list on the node that represents the entity a reader is trying to resolve is the cleaner structure, but it is not a hard rule.",
          },
          {
            q: "Do these profiles have to link back to my site?",
            a: "It helps, and it is the cheapest form of corroboration: a profile that is controlled by a third party and points at the canonical site is harder to fake than a profile that merely exists. A link back is not required for schema validity; it is what makes the claim verifiable to a person.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("entity-graph-organization-website-softwareapplication"),
          label: "The entity graph: Organization vs WebSite vs SoftwareApplication",
          note: "Where sameAs sits in a graph, and the relations that make the nodes one entity.",
        },
        {
          href: insightPath("entity-markup-gap"),
          label: "22 of 30 sites leave AI guessing who they are",
          note: "What the 30-site sample declared, and why an entity node is not the same as an identity.",
        },
        {
          href: "/checks/sameas/",
          label: "The rule this article is about",
          note: "The exact pass condition — two points, non-empty sameAs — and what the check does not fetch.",
        },
      ]}
    >
      <p>
        <code>sameAs</code> is the most misunderstood property in structured data. It is not a
        place to put every social account the company owns, and it is not a ranking signal. It is a
        claim of identity: this URL is another page that refers to the same thing the current node
        describes. The useful version of that claim is short, verifiable and boring. The useless
        version is long, self-referential and never checked.
      </p>
      <p>
        This article is about which profiles actually help an entity resolve, which ones are
        decoration, and how to audit the list you have. It is not a list of platforms to sign up
        for; it is a filter for the ones worth linking.
      </p>

      <h2>What sameAs actually claims</h2>
      <p>
        Schema.org defines <code>sameAs</code> as a URL of a reference page that unambiguously
        indicates the identity of the entity. The word that does the work is <em>unambiguously</em>:
        the destination has to identify the same thing, not merely mention it or be run by the same
        person. A link to a company&rsquo;s own homepage is a self-reference, not corroboration. A
        link to an unrelated profile with the same name is worse than nothing.
      </p>
      <p>
        The property is a <em>list of claims</em>, and a claim is only useful when someone can
        check it. That is why the quality of the destination matters more than the number of links:
        an engine resolving an entity is looking for independent pages that agree, not for a
        package of links the entity published about itself.
      </p>

      <h2>A hierarchy that is actually useful</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Examples</th>
              <th>Why it helps</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Authoritative / registry</td>
              <td>Wikidata, a company registry, Crunchbase</td>
              <td>Records the entity independently of its own site; the strongest corroboration when it exists.</td>
            </tr>
            <tr>
              <td>Code and product</td>
              <td>GitHub organisation or repository, package registries</td>
              <td>For a software product, the repository is verifiable evidence that the thing exists and who publishes it.</td>
            </tr>
            <tr>
              <td>Professional profile</td>
              <td>LinkedIn company page, a founder profile</td>
              <td>Names the entity on a platform the entity does not control, usually with a back-link and a consistent name.</td>
            </tr>
            <tr>
              <td>Directories and reviews</td>
              <td>G2, AI-tool directories, Product Hunt</td>
              <td>Useful corroboration for a product, weaker than a registry, and sometimes promotional in tone.</td>
            </tr>
            <tr>
              <td>Social accounts</td>
              <td>X, Bluesky, a YouTube channel</td>
              <td>Fine as a contact surface; the profile has to actually name the entity to count as identity.</td>
            </tr>
            <tr>
              <td>Noise</td>
              <td>Link farms, unrelated profiles, self-referential site pages</td>
              <td>Adds links without adding corroboration; can make the claim less credible.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The ordering is about independence, not prestige. A small directory that clearly names the
        product and links to the site can be more useful than a large social account that never
        mentions it. The test is the same for every row: if a stranger opened the URL, would they
        know which entity it describes?
      </p>

      <h2>What this site does</h2>
      <p>
        LLMention&rsquo;s Organization node lists three profiles: the author&rsquo;s GitHub profile,
        the public repository for the scanner, and an AI-agents directory listing. They are in the
        list because each one exists, names the project, and can be opened and checked. The site
        deliberately does not list every account or a placeholder profile that has not been
        created — a link to a page that does not exist is not an identity claim.
      </p>
      <p>
        The Person node carries its own profile link, and the WebSite and WebPage nodes point back
        to the Organization with <code>@id</code> references rather than repeating the list. One
        entity, one list, referenced from the places that need it.
      </p>

      <h2>The mistakes that make the list worthless</h2>
      <ul>
        <li>
          <strong>Self-reference.</strong> <code>sameAs</code> pointing at your own homepage or
          another page on your own site is circular; it corroborates nothing.
        </li>
        <li>
          <strong>Profiles that do not mention the brand.</strong> A personal account with no
          reference to the company is not evidence that the company exists. If the profile is
          personal, attach it to the <code>Person</code> node, not the <code>Organization</code>.
        </li>
        <li>
          <strong>Fabricated or dead profiles.</strong> A 404 or a redirect to an unrelated page is
          a broken claim. The scanner does not fetch the list, so this passes the check and fails
          the reader.
        </li>
        <li>
          <strong>Name drift.</strong> The profile says one name, the site says another, and the
          JSON-LD says a third. Consistency across the three is the whole point.
        </li>
        <li>
          <strong>Padding.</strong> Fifteen links where four would do makes the credible ones
          harder to find, for a person and for a model.
        </li>
        <li>
          <strong>The wrong node.</strong> A company profile attached to a <code>Person</code>
          node (or the reverse) sends the reader to the wrong entity to resolve.
        </li>
      </ul>

      <h2>How to audit your own list</h2>
      <p>
        Fetch the JSON-LD from the response, extract every <code>sameAs</code> value, and check
        each one by hand. The commands are deliberately boring; the judgement is the work.
      </p>
      <pre>{`# 1. List the sameAs URLs in the server response
curl -sS https://your-domain.com/ \\
  | python -c "import sys,json,re; html=sys.stdin.read(); \\
      blocks=re.findall(r'<script[^>]*application/ld\\\\+json[^>]*>(.*?)</script>', html, re.S); \\
      [print(u) for b in blocks for u in re.findall(r'\\\"sameAs\\\"\\s*:\\s*\\[?\\\"([^\\\"]+)\\\"', b)]"

# 2. Check every one returns 200 and is not a redirect to somewhere else
#    (run once per URL)
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\\n" https://profile.example.com/brand`}</pre>
      <p>
        For each URL that survives, answer three questions: does the page name the entity clearly,
        is it on a platform the entity does not fully control, and does it link back to the
        canonical site. Three yeses is a good profile. Two is acceptable. One or zero is a link,
        not corroboration.
      </p>

      <h2>What the scanner scores — and why the score is low</h2>
      <p>
        The rule is <Link href="/checks/sameas/">sameas</Link>, worth 2 points in the trust and
        authority dimension. The condition is only that parsed JSON-LD contains a non-empty{" "}
        <code>sameAs</code>. The rule page is explicit about the limit: the profiles are not
        fetched, so a list of accounts that no longer exist passes.
      </p>
      <p>
        That is the right level for a cheap check. Presence is a one-line assertion; verification
        is work. Treat a pass as a reminder to do the work, not as evidence that the entity has
        been resolved. The same is true of every markup check on this site: the score describes the
        page, and the page is only as good as the claims in it.
      </p>

      <h2>What it changes, and what it does not</h2>
      <p>
        A short, verifiable <code>sameAs</code> list makes entity resolution cheaper: it gives a
        model or a person a few independent places to confirm that the brand on this site is the
        same brand on GitHub, in the directory, or in the registry. That reduces a specific kind of
        error — merging two same-named things, or treating a product and its company as unrelated.
      </p>
      <p>
        It does not guarantee a citation, a ranking or even correct resolution. Identity is
        inferred from many signals, and one list is one input. The honest goal is narrower and
        achievable: make the claim checkable, then keep it true.
      </p>
    </PostShell>
  );
}
