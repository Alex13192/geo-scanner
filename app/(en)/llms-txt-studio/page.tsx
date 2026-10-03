import { Suspense } from "react";
import Link from "next/link";
import LegalLinks from "@/app/components/LegalLinks";
import StudioWidget from "./StudioWidget";

/**
 * /llms-txt-studio/ - the server-rendered half.
 *
 * WHY THIS FILE IS A SERVER COMPONENT AND NOT "use client":
 * It previously was not, and the route prerendered to the single string
 * "Loading Studio...". The cause was specific rather than mysterious: the page
 * called useSearchParams(), and that opts its subtree out of prerendering, so
 * `next build` wrote the Suspense fallback into the HTML. Nothing else wrong
 * with it - no headings, no body copy, no <a href> anywhere, because the entire
 * navigation was onClick handlers on <button> elements.
 *
 * That mattered more here than it would on most sites. This is a page that tells
 * other people their markup is the reason they are not being cited. The page
 * itself was the worst-scoring kind of page on the site: 38 checks, twelve
 * dimensions, and this one could not have passed "raw server response contains
 * visible text without executing JavaScript".
 *
 * So the copy below is deliberately in the server component. The interactive
 * widget is the only client-rendered part, and it lives in StudioWidget.tsx.
 * If you add wording to this page, add it here.
 */
export default function StudioPage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                L
              </span>
              <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
            </Link>
            <nav
              aria-label="Sections"
              className="hidden md:flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs"
            >
              <Link
                href="/report/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Audit Overview
              </Link>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                /llms.txt Studio
              </span>
              <Link
                href="/readiness-badge/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Readiness Badge
              </Link>
              <Link
                href="/methodology/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Methodology
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Markdown Studio
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            Free /llms.txt Generator
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
            Enter a domain and this tool reads its homepage, then drafts an llms.txt file from the
            real title, description and internal links it finds. No account, no limit.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-6 text-gray-500 text-sm">
              Loading the generator…
            </div>
          }
        >
          <StudioWidget />
        </Suspense>

        <section className="mt-16 max-w-3xl space-y-10 text-sm leading-relaxed text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">What is llms.txt?</h2>
            <p>
              llms.txt is a markdown file placed at a site&apos;s root that gives a language model a
              short, structured summary of what the site is and which pages matter. It is a
              convention, not a standard, and it is read by convention rather than by contract.
            </p>
            <p className="mt-3">
              The format is a single H1 naming the site, a blockquote summary, then sections of
              markdown links. It is meant to be read by a machine in one pass, which is why it is
              plain markdown and not HTML.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              What does the generated file contain?
            </h2>
            <p>Everything below is taken from your homepage. Nothing is invented.</p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>The site title, used as the H1, exactly as your own title tag writes it.</li>
              <li>Your meta description, used as the blockquote summary.</li>
              <li>
                Internal links found in the homepage markup, with the anchor text as the
                description of each page.
              </li>
              <li>A note on how the file was produced, so a reader can tell what it is.</li>
            </ul>
            <p className="mt-3 text-gray-400">
              It does not crawl your whole site. It reads one page, because that is what can be
              done honestly in a few seconds without a job queue.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">How do I deploy it?</h2>
            <p>Save the output as llms.txt and upload it, then confirm it is reachable.</p>
            <ol className="list-decimal pl-5 mt-3 space-y-1.5">
              <li>Copy or download the generated file.</li>
              <li>
                Upload it to your web root so that{" "}
                <code className="text-gray-400">https://your-domain.com/llms.txt</code> returns it.
              </li>
              <li>
                Check the response is HTTP 200 with a body, not a redirect to a login page or an
                HTML error page.
              </li>
              <li>
                Add a <code className="text-gray-400">Sitemap:</code> line to robots.txt if it is
                not already there.
              </li>
            </ol>
            <p className="mt-3">
              The deployment details, including what a refusal looks like, are in{" "}
              <Link
                href="/docs/llms-txt-deployment/"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                the llms.txt deployment guide
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Is llms.txt a ranking factor?</h2>
            <p>
              No. Google has said it does not use llms.txt in Search, and crawler support across the
              other engines is inconsistent. It is worth about 5% of the total score on this site.
            </p>
            <p className="mt-3">
              The reason it is still worth generating is that it costs almost nothing and the
              evidence for what does move visibility points somewhere else entirely. The largest
              measured gains in the published research came from citing sources and adding expert
              quotations, not from adding files:
            </p>
            <blockquote className="border-l-2 border-blue-500 pl-4 mt-4 text-gray-400">
              Adding source citations produced the largest measured visibility gain for
              low-ranking sites, at +115%, ahead of the addition of expert quotations at +41% and
              statistics at +30-40%, across the strategies tested on generative engines. —{" "}
              <a
                href="https://arxiv.org/abs/2311.09735"
                className="text-blue-400 hover:text-blue-300 underline"
                rel="noopener"
              >
                Generative Engine Optimization, KDD 2024
              </a>
            </blockquote>
            <p className="mt-4">
              That is why the weighting on this site puts citability and evidence at 11% and
              answer readiness at a further 10%, while the AI context file dimension carries 5%.
              You can read the whole weighting, and the limits of what it can tell you, on the{" "}
              <Link
                href="/methodology/"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                methodology page
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">The shape of the file</h2>
            <p>
              Every file this tool produces has the same three parts, so you can see what you will
              get before you run it.
            </p>
            <pre className="mt-3 bg-[#070A10] border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">{`# Your Site Name

> One sentence from your meta description, describing what the site is.

## Core pages
- [Page title](https://your-domain.com/page): the link text as written

## Notes
- Generated from the homepage on the date shown, by LLMention.`}</pre>
            <p className="mt-3 text-gray-400">
              Three to five sections is normal. If your homepage links to twenty pages, the draft
              will list twenty, and trimming it is the part that needs your judgement rather than
              the tool&apos;s.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              How does the scanner score llms.txt?
            </h2>
            <p>
              One dimension out of twelve looks at context files, and it is worth 5 of the 100
              points. Four of those five come from the file itself, and one comes from robots.txt
              being readable at all.
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-2 pr-4 font-semibold text-white">Check</th>
                    <th className="py-2 pr-4 font-semibold text-white">Points</th>
                    <th className="py-2 font-semibold text-white">What has to be true</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800/60">
                    <td className="py-2 pr-4 font-mono">llms-txt</td>
                    <td className="py-2 pr-4">4</td>
                    <td className="py-2">
                      The file is more than 20 bytes and contains an H1, a blockquote summary line
                      and at least 3 markdown links. Missing any of those is a partial pass.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono">robots-present</td>
                    <td className="py-2 pr-4">1</td>
                    <td className="py-2">
                      robots.txt is readable, so some crawler policy is published.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-gray-400">
              Note that the check reads the file&apos;s contents, not its status code. A 200
              response with an empty body scores nothing, and that distinction is deliberate:
              measuring whether a file is served is not the same as measuring whether it says
              anything.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Questions about the output</h2>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "Does llms.txt replace robots.txt?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "No. robots.txt states who is allowed to crawl and what they may fetch, and it is enforced. llms.txt is a suggestion about which pages are worth reading, and nothing enforces it. A crawler that is disallowed in robots.txt will not read the file that would have told it what to read.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Where exactly does the file go?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "At the site root, so that https://your-domain.com/llms.txt returns it directly with an HTTP 200 and a body. A redirect to a login page, a 200 with no content, or an HTML error page all count as not served.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Will this make ChatGPT recommend my site?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "No, and any tool that promises that is overclaiming. Serving the file changes what a model is able to read. It does not change what a model decides to say, and this tool has no way to measure that.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What if my homepage is rendered entirely in JavaScript?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "The generator reads the server response and does not execute JavaScript, so a client-rendered homepage gives it little to work with and the draft will be thin. That is worth knowing on its own, because it is the same response an AI crawler receives.",
                      },
                    },
                  ],
                }),
              }}
            />
            <h3 className="font-semibold text-white mt-4 mb-1">
              Does llms.txt replace robots.txt?
            </h3>
            <p>
              No. robots.txt states who is allowed to crawl and what they may fetch, and it is
              enforced. llms.txt is a suggestion about which pages are worth reading, and nothing
              enforces it.
            </p>

            <h3 className="font-semibold text-white mt-5 mb-1">
              Where exactly does the file go?
            </h3>
            <p>
              At the site root, so that{" "}
              <code className="text-gray-400">https://your-domain.com/llms.txt</code> returns it
              directly with an HTTP 200 and a body.
            </p>

            <h3 className="font-semibold text-white mt-5 mb-1">
              Will this make ChatGPT recommend my site?
            </h3>
            <p>
              No, and any tool that promises that is overclaiming. Serving the file changes what a
              model is able to read. It does not change what a model decides to say.
            </p>

            <h3 className="font-semibold text-white mt-5 mb-1">
              What if my homepage is rendered entirely in JavaScript?
            </h3>
            <p>
              The generator reads the server response and does not execute JavaScript, so a
              client-rendered homepage gives it little to work with. That is worth knowing on its
              own, because it is the same response an AI crawler receives.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              What the generated file cannot do
            </h2>
            <p>
              Stating the limits is the point of this tool, so here they are for its own output.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>
                It cannot know what your site is for. It reads your homepage, so if that page
                describes a product differently from the way you would describe it, the draft
                inherits that.
              </li>
              <li>
                It cannot see pages your homepage does not link to, which is usually most of them.
              </li>
              <li>
                It cannot guarantee a citation. Serving a file changes what a model can read, not
                what it chooses to say.
              </li>
            </ul>
            <p className="mt-4">
              The scanner this page belongs to is open source, so a disagreement with any of the
              above can be specific:{" "}
              <a
                href="https://github.com/Alex13192/geo-scanner"
                className="text-blue-400 hover:text-blue-300 underline"
                rel="noopener"
              >
                github.com/Alex13192/geo-scanner
              </a>
              . It runs 38 checks across 12 dimensions and publishes every rule it applies,
              including the ones it deliberately weights low.
            </p>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800/80 text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
          <Link href="/about/" className="hover:text-gray-300 transition-colors">
            About
          </Link>
          <Link href="/study/" className="hover:text-gray-300 transition-colors">
            Study
          </Link>
          <Link href="/methodology/" className="hover:text-gray-300 transition-colors">
            Methodology
          </Link>
          <Link href="/pricing/" className="hover:text-gray-300 transition-colors">
            Pricing
          </Link>
        </div>
        <LegalLinks className="justify-start" />
        {/*
          A build-time year is correct here, unlike dateModified in the root
          layout. There, a new date on every deploy teaches a consumer that the
          date means nothing. Here the year genuinely is the year the page was
          published, and the scanner's copyright-year check looks for the current
          calendar year in the visible text - which this page did not contain at
          all before, so it was failing a rule it publishes.
        */}
        <p className="mt-6">
          © {new Date().getFullYear()} LLMention. Brand Generative Engine Optimization
          Intelligence.
        </p>
      </footer>
    </div>
  );
}
