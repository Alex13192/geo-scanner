import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { AUTHOR } from "@/lib/author";
import type { PostMeta } from "@/lib/insights";
import { social } from "@/lib/og";
import { CONTACT_EMAIL } from "@/lib/site";

const TITLE = "Who writes this site";
const DESCRIPTION =
  "Who maintains LLMention, how the writing is produced and corrected, what it will not do, and how the site is funded.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: AUTHOR.path,
    /* Translated into Chinese on 2026-10-23; the pair is claimed on both pages. */
    languages: {
      en: "/author/",
      "zh-Hans": "/zh/author/",
      "x-default": "/author/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: AUTHOR.path,
  }),
};

/**
 * The author page.
 *
 * WHY IT IS A /insights/ ARTICLE RATHER THAN PART OF /about/: /about/ answers "what is this
 * product"; this page answers "who is accountable for the claims", which is a different
 * question a reader asks after reading one. It renders through PostShell because it is the
 * same kind of page as the pieces it stands behind - dated, bylined, with sources - and
 * because a person page that has no publication date is the shape of a page written to
 * satisfy a reviewer rather than a reader.
 *
 * The funding section is not a legal formality. A site that recommends nothing and sells a
 * measurement has one obvious conflict: a paying customer may prefer a better number. Saying
 * plainly that the score is computed by code, and that buying a report cannot change one, is
 * the only useful answer to that, and it only means something if it is written where a
 * reader can find it.
 */
const post: PostMeta = {
  slug: "author",
  title: TITLE,
  description: DESCRIPTION,
  dek: "The person accountable for the measurements, the standard the writing is held to, and the two ways this site makes money.",
  category: "Explainer",
  published: "2026-10-18",
  readTime: "5 min read",
};

export default function AuthorPage() {
  return (
    <PostShell
      insight={post}
      path={AUTHOR.path}
      schemaType="ProfilePage"
      showAuthorCard={false}
      faq={{
        title: "Questions about the author",
        items: [
          {
            q: "Is LLMention run by a company?",
            a: "No. It is an independent project maintained by one person, and it is not affiliated with OpenAI, Anthropic, Google or Perplexity. The source is public, so the claim is checkable rather than sincere.",
          },
          {
            q: "Can a paying customer get a better score?",
            a: "No. The score is computed by the scanner from the response it fetches, and nothing in the paid report feeds back into it. A report explains a result; it cannot change one.",
          },
          {
            q: "How are corrections handled?",
            a: "Send the URL, the check and what the scan reported. A disagreement that names a rule is the most useful message this project gets, and a correction is published where the error was rather than in a changelog nobody reads.",
          },
        ],
      }}
      related={[
        {
          href: "/insights/",
          label: "All writing",
          note: "Six pieces on the study, the rules and their limits.",
        },
        {
          href: "/about/",
          label: "About LLMention",
          note: "What the scanner is, what it deliberately does not do, and how the method is published.",
        },
      ]}
    >
      <h2>Who is behind LLMention?</h2>
      <p>
        <strong>{AUTHOR.name}</strong> builds and maintains the project: the scanner, the rule
        catalogue, the study and this writing. The byline is a handle rather than a legal name,
        and the way to verify it is the public repository at{" "}
        <a href={AUTHOR.githubRepo} target="_blank" rel="noopener noreferrer">
          github.com/Alex13192/geo-scanner
        </a>
        , where the rule set and the site itself are readable.
      </p>
      <p>
        That is a deliberate trade. A pseudonym with a public repository and a working contact
        address can be checked; a full name with no work attached to it cannot. If a legal name
        is required by a payment processor or a regulator, it is provided through the operator
        details on the <Link href="/refund/">refund policy</Link> rather than invented for a
        byline.
      </p>

      <h2>What qualifies him to run this measurement?</h2>
      <p>
        Nothing in the way the question usually means. There is no data-science credential and
        no SEO agency history to cite, so the page does not claim one.
      </p>
      <p>
        The qualification offered instead is structural: the method is published in full, every
        rule and its weight are on the{" "}
        <Link href="/methodology/">methodology page</Link>, and the scanner runs the same
        catalogue the page publishes. A reader who thinks a rule is wrong can name it and check
        it, which is a better guarantee than a biography — and the only one this project can
        honestly make.
      </p>

      <h2>What is his professional background?</h2>
      <p>
        Alex Xu has spent 23 years building and operating networks, most of them large enough
        that a crawler or a misconfigured edge is not an abstraction. He is a Cisco CCIE
        (#13192, Routing &amp; Switching and Security, with the Service Provider written and lab
        exams), CCNP and CCNA, Microsoft MCSE and Juniper JNCIS certified, and studied at
        Shanghai Normal University.
      </p>
      <p>
        Recent roles: Global Technical Lead Engineer at Infosys (2024–), responsible for a
        network spanning 10+ data centres, 3,000+ retail stores and 60+ corporate offices;
        Senior Network Architect at LVMH (2023–2024), leading a hybrid-cloud and SD-WAN
        transformation across 8 data centres and 2,000+ boutiques in Greater China and APAC;
        Senior Network Engineer at Pearson (2013–2022), running 16 enterprise data centres and
        the network behind 5,500+ Pearson VUE test centres; and earlier roles at Novartis and at
        Cisco partners in Kenya and China, including carrier backbone work.
      </p>
      <p>
        The specialities that shape this site&rsquo;s checks are the same ones: data-centre
        fabrics (VXLAN/EVPN, spine-leaf), BGP/MPLS/SRv6, multicast and low-latency switching for
        AI clusters, network security (Zscaler, Palo Alto, FortiGate, Cisco ASA/Firepower), and
        automation with Python, Ansible and Nornir. Crawler access, edge delivery and
        machine-readable structure are the parts of GEO that are network problems, and they are
        written by someone who has spent two decades on network problems.
      </p>
      <p className="text-sm text-[var(--ink-3)]">
        A full résumé is available on request at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Phone number, postal address and
        date of birth are deliberately not published here.
      </p>

      <h2>How is the writing produced?</h2>
      <p>
        Every piece starts from a measurement, then goes through the same four stages. The
        drafting stage uses a language model; the three checks around it are what make the result
        publishable.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Stage</th>
              <th>What happens</th>
              <th>What would stop publication</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1. Data</td>
              <td>The study rows or the rule catalogue are read, not remembered</td>
              <td>A figure that does not appear in either</td>
            </tr>
            <tr>
              <td>2. Draft</td>
              <td>A language model prepares the first version against that data</td>
              <td>Drafting happens before the data, which is how invented numbers get in</td>
            </tr>
            <tr>
              <td>3. Check</td>
              <td>Every number, name and status code is traced back to its source</td>
              <td>One untraceable figure</td>
            </tr>
            <tr>
              <td>4. Publish</td>
              <td>The limits of the claim are written into the piece, not left out</td>
              <td>A headline the data does not support</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Saying the drafting stage uses a model is uncomfortable and true. The alternative —
        claiming every sentence came from a person — would be a false statement on a site whose
        entire argument is that claims should be checkable. The standard is not who typed it;
        it is whether each number can be re-run and each limit is stated.
      </p>

      <h2>What are the editorial rules?</h2>
      <p>
        Five rules, all of them checkable against what is published, and all of them broken
        somewhere by sites in this category.
      </p>
      <ul>
        <li>
          <strong>No sponsored content and no paid placement.</strong> A report is a report; a
          mention is not for sale, at any price.
        </li>
        <li>
          <strong>No number without a source.</strong> Percentages, status codes and weights are
          traced to the study or the catalogue before publication.
        </li>
        <li>
          <strong>Limits are published with the claim.</strong> The scan does not ask a model
          about your brand, and every page that implies otherwise is being corrected.
        </li>
        <li>
          <strong>Corrections go where the error was.</strong> A wrong figure is fixed on the page
          that carried it, with the date changed.
        </li>
        <li>
          <strong>No volume targets.</strong> A piece is published when there is a measurement
          behind it. There are six; there is no quota of thirty.
        </li>
      </ul>
      <p>
        The last rule is the one that makes the archive look thin on purpose. Of the 30 homepages
        in the study, <strong>53%</strong> graded F, <strong>30%</strong> never answered the
        crawler at all, and none reached an A — the findings are worth writing up, but a blog that
        padded them to a weekly schedule would be imitating the content this project measures
        against.
      </p>
      <p>
        The weights that decide those grades are published, and they are the reason the writing
        goes where it does: AI crawler access carries <strong>16%</strong>, machine readability{" "}
        <strong>12%</strong> and content depth <strong>11%</strong>, while the context file this
        site still publishes is capped at 3.3 of the 100. A claim about the small lever is not
        worth an article.
      </p>

      <h2>How is the site funded?</h2>
      <p>
        Two ways, both printed on the site rather than discovered later: advertising served by
        Google, and the paid measurement reports described on the{" "}
        <Link href="/pricing/">pricing page</Link>, from <strong>$39</strong>. The prices are
        imported from <code>lib/pricing.ts</code> and are the same numbers the checkout uses; when
        they change, they change in one place.
      </p>
      <p>
        The obvious conflict is that a paying customer might prefer a better number. Three things
        constrain it: the scan is free and identical for everyone, the score is computed by code
        from the response it fetches, and the paid report explains a result rather than changing
        it. A reader can verify the first of those by running a scan, and the other two by
        reading the source.
      </p>
      <p>
        There are no affiliate links, no paid directory placements that carry a rating, and no
        vendor logos that imply an endorsement. Where an outbound link earns anything, it does not
        appear on this site.
      </p>

      <h2>How do I report a mistake?</h2>
      <p>
        Write to <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a> with the URL, the check and
        what the scan reported. The most useful message this project receives is a disagreement
        with a specific rule, because the rule set is public and a specific objection can be
        answered or acted on.
      </p>
      <p>
        Corrections to the writing follow the same route. A figure that turns out to be wrong is
        the one thing this archive cannot quietly fix, because it is the thing the rest of it
        rests on.
      </p>

      <h2>What does the site deliberately not do?</h2>
      <p>
        It does not ask an AI engine whether your brand is mentioned, and it does not pretend a
        readiness score is a citation. Those limits are stated on the{" "}
        <Link href="/about/">About page</Link> and in every article that touches the question.
      </p>
      <p>
        It also does not publish a method it cannot execute: the tests assert that the published
        rule set and the scanner&rsquo;s behaviour cannot drift apart, which is a stronger
        promise than a methodology page written by hand and never checked again.
      </p>
    </PostShell>
  );
}
