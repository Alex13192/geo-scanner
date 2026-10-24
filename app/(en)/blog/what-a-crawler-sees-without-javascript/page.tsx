import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("what-a-crawler-sees-without-javascript");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English first; translations add their own keys when they ship. */
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
        title: "Questions about JavaScript and AI crawlers",
        items: [
          {
            q: "Do AI crawlers execute JavaScript?",
            a: "Some render pages, some do not, and none promise it. The safe engineering assumption is an HTML fetch: if the words you want cited are not in the server response, you are relying on a behaviour the crawler does not have to provide. Test the response, not the assumption.",
          },
          {
            q: "Is a noscript block enough?",
            a: "Only if it contains the content, which it usually does not. A noscript tag that says \"enable JavaScript\" is a status message, not a page. The check the site scores reads the raw response; a crawler reads the same thing.",
          },
          {
            q: "What about Google rendering my page?",
            a: "Rendering in a search engine is a second pass that not every fetch receives, and it is not the same promise as an AI answer engine retrieving and quoting a passage. A server-rendered baseline is what makes the page work in both cases; relying on rendering makes it work only sometimes.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("cloudflare-waf-ai-crawlers-403-meaning"),
          label: "Cloudflare WAF and AI crawlers: what a 403 actually means",
          note: "The other way a crawler gets nothing: a refusal before any HTML is returned.",
        },
        {
          href: insightPath("reading-a-failed-check"),
          label: "How to read a failed check",
          note: "The evidence line tells you what the scanner saw; the rendered page and the response are not the same thing.",
        },
        {
          href: "/checks/no-js-dependency/",
          label: "The rule this article explains",
          note: "The exact pass condition, the 100-word threshold, and what the threshold does not prove.",
        },
      ]}
    >
      <p>
        Two people can look at your page and see different documents. The browser shows a rendered
        page with every section, comment and lazy-loaded table. A crawler that does not run
        JavaScript sees the bytes the server sent: the shell, the navigation, the empty mount
        point, and whatever text happened to be in the HTML. When a citation does not happen, this
        gap is one of the first things to rule out, and it is cheap to check.
      </p>
      <p>
        This article is about the fetch a crawler makes, why a page that looks complete in a
        browser can be almost empty in that fetch, and how to verify the difference in three
        commands. It is not an argument that JavaScript is bad. It is an argument that the content
        you want quoted should survive without it.
      </p>

      <h2>What a crawler actually receives</h2>
      <p>
        A crawler is an HTTP client. It sends a request with its own User-Agent, receives a
        response, and — for the agents the scanner tests — works with the body it received.
        Whether a particular engine runs a rendering pass is a property of that engine, not of
        your page, and it can change. The engineering question is therefore not "which crawler
        renders" but "what does the response contain".
      </p>
      <p>
        The answer is visible in the response body, not in the browser inspector. That distinction
        matters because the two tools show different trees: DevTools shows the DOM after
        JavaScript has run, and the page source shows what the server sent. When they disagree,
        the crawler sees the second one.
      </p>

      <h2>Three checks that take a minute</h2>
      <p>
        Run these against a real URL, with a crawler-shaped User-Agent, and compare the result
        with what you see in the browser. The exact host does not matter; the shape of the
        comparison does.
      </p>
      <pre>{`# 1. How large is the response a crawler gets?
curl -sS -A "GPTBot" https://your-domain.com/page/ | wc -c

# 2. Rough visible-word count after stripping tags.
curl -sS -A "GPTBot" https://your-domain.com/page/ \\
  | sed 's/<[^>]*>/ /g' | tr -s ' ' | wc -w

# 3. Does the response contain the words you expect to be cited?
curl -sS -A "GPTBot" https://your-domain.com/page/ \\
  | grep -i -c "the phrase you want quoted"`}</pre>
      <p>
        Then do the browser control: open DevTools, disable JavaScript for the site (DevTools
        settings → Debugger → Disable JavaScript), reload, and read the page. What remains is
        approximately what a non-rendering crawler can work with. If the article disappears and
        only the navigation remains, the page depends on JavaScript for its content, even though
        the browser user never notices.
      </p>
      <p>
        A large response is not proof of content. Application shells ship their JavaScript,
        styles and route data in the HTML, so a single-page app can return hundreds of kilobytes
        and almost no prose. Compare the word count at step 2 with the word count of the rendered
        article, not with the byte size.
      </p>

      <h2>What usually breaks, and how it fails quietly</h2>
      <ul>
        <li>
          <strong>Client-side fetching for the main copy.</strong> The first render is a loading
          state; the text arrives after a request. A response-level reader gets the loading state.
        </li>
        <li>
          <strong>Content below the fold, loaded on scroll.</strong> Scroll-triggered fetching is a
          real user experience decision, but a crawler does not scroll. Everything behind an
          intersection observer is absent from the fetch.
        </li>
        <li>
          <strong>Consent or region gates rendered by JavaScript.</strong> A modal that must be
          dismissed, or a redirect decided in the browser, can leave the server response with no
          article at all.
        </li>
        <li>
          <strong>JSON-LD injected client-side.</strong> Structured data that exists only after
          hydration is missing from the body a crawler parses, which is the same failure as
          missing prose but harder to notice visually.
        </li>
        <li>
          <strong>Client-side routing with no server fallback.</strong> A deep link that returns a
          shell unless the router runs means the URL a citation would use has no content behind
          it on a direct fetch.
        </li>
      </ul>
      <p>
        What these have in common is that they pass every manual browser test. The page looks
        correct, the console is clean, and the only signal is a fetch you did not make.
      </p>

      <h2>What the scanner scores, and what it does not</h2>
      <p>
        The rule is{" "}
        <Link href="/checks/no-js-dependency/">no-js-dependency</Link>, worth 2 points in the
        semantic structure dimension. Its condition is deliberately modest: the raw server
        response must contain at least 100 words of visible text without executing JavaScript.
      </p>
      <p>
        The note on the rule page is the part worth reading: the hundred words are counted across
        the whole response, so navigation, footer and cookie text are included. A page whose
        article is assembled by JavaScript can clear the threshold on its chrome alone. The check
        therefore proves the response is not empty; it does not prove the article is in it. That
        is an honest limit of a cheap check, and it is why the manual comparison above is still
        worth doing on a page that matters.
      </p>

      <h2>Fixing it without rewriting the product</h2>
      <p>
        The fix is usually not "remove the framework". It is to move the content that should be
        citable into the server-rendered path, while leaving interactivity where it belongs.
      </p>
      <ol>
        <li>
          <strong>Server-render the article, not the shell.</strong> In a React framework that
          means server components or static generation for the prose; interactive widgets can
          stay client-side around it.
        </li>
        <li>
          <strong>Fetch on the server for the first paint.</strong> If the page needs data, load it
          before rendering the HTML, or prerender it. A loading skeleton is a user-interface
          choice; it should not be the only thing a crawler receives.
        </li>
        <li>
          <strong>Keep structured data in the response.</strong> JSON-LD belongs in the HTML the
          server returns, not in an effect that runs after hydration.
        </li>
        <li>
          <strong>Test the deployed response, not localhost.</strong> CDNs, consent tools and bot
          rules can change the body. Run the curl check against production after a deploy.
        </li>
      </ol>
      <p>
        A useful CI gate is the same idea: fetch the built page, strip tags, count words, and fail
        if the count is implausibly low for the page type. That is a blunt instrument, but it
        catches the regression that matters — the day a refactor moves the article into a client
        component and nobody notices because the browser still looks right.
      </p>

      <h2>What this does not solve</h2>
      <p>
        Server-rendering does not guarantee a citation. It guarantees that the content is present
        in the fetch, which is a precondition rather than the outcome. A page can be fully
        server-rendered and still not be quoted because the answer is buried, the structure is
        unextractable, or the engine chooses another source. This article is about removing one
        specific, verifiable cause of failure; it is not a claim about what happens next.
      </p>
      <p>
        The practical rule: if you would be surprised to see your article missing from a printout
        of the response body, the crawler would be too.
      </p>
    </PostShell>
  );
}
