import type { Metadata } from "next";
import LegalLinks from "@/app/components/LegalLinks";

/**
 * Privacy policy.
 *
 * This page exists because the site is free to use and is paid for by ads, and
 * because both AdSense review and the payment providers used for the manual
 * audit check for a reachable privacy policy before anything else. Google's own
 * AdSense requirements name a privacy policy that discloses third-party cookie
 * use as a condition of serving ads, so the advertising section below is not
 * boilerplate: it is the section the review is looking for.
 *
 * Honesty constraints kept deliberately:
 *  - No analytics, no account system and no advertising cookies are described
 *    as active unless they are. The advertising section is written in the
 *    conditional ("when an ad is served"), which is accurate both before and
 *    after AdSense is switched on.
 *  - Nothing here claims a consent mechanism that does not exist yet. The
 *    consent paragraph states the obligation that applies in the EEA, UK and
 *    Switzerland; the consent management platform must actually be deployed
 *    before personalised advertising is served there.
 *
 * Not legal advice. Have it reviewed before selling to consumers in the EU.
 */
const TITLE = "Privacy policy";
const DESCRIPTION =
  "What LLMention processes when you run a scan, what the server logs contain, how advertising cookies are handled, and how to exercise your data rights.";
const CONTACT_EMAIL = "hello@ccie13192.com";

const UPDATED = "2 October 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/privacy/", type: "article" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
          </a>
          <a
            href="/contact/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            Contact
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Legal
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {TITLE}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">{DESCRIPTION}</p>
          <p className="text-xs text-gray-500 font-mono">Last updated {UPDATED}</p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>What this policy covers</h2>
          <p>
            This covers the free scanner, the /llms.txt generator and every guide on this site, and
            the paid manual GEO audit. It says what is processed, why, how long it is kept, and what
            you can ask us to do about it. It does not cover third-party sites you reach by
            following a link from here.
          </p>

          <h2>Who is responsible</h2>
          <p>
            LLMention is an independent project, and it is the controller for the processing
            described below. Questions, requests and complaints all go to the same address:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. There is no tracking of
            individual visitors behind this site, so that address is also the fastest route to an
            answer.
          </p>

          <h2>What a scan processes</h2>
          <p>When you submit a domain or URL, the following is processed:</p>
          <ul>
            <li>
              <strong>The domain or URL you submitted</strong>, which is used to run the scan in
              that request.
            </li>
            <li>
              <strong>The requests the scanner makes to that domain</strong> — typically{" "}
              <code>robots.txt</code>, <code>llms.txt</code>, <code>sitemap.xml</code> and the page
              HTML. These are ordinary GET requests for publicly available files, made from our
              servers, not from your browser. The site being scanned therefore sees our address, not
              yours.
            </li>
            <li>
              <strong>Your IP address and user agent</strong>, as part of normal server operation,
              abuse prevention and rate limiting. These are recorded by our hosting provider,
              Cloudflare, and in our own logs.
            </li>
          </ul>
          <p>
            No account, name or email address is required to run a scan, and we do not ask for one.
          </p>

          <h2>What is deliberately not done</h2>
          <ul>
            <li>No account system, so there is no user profile to hold.</li>
            <li>
              No analytics, tracking pixels or session recording of our own. This site does not
              measure you.
            </li>
            <li>
              No history of the domains you scan. The score is computed per request and is not
              stored as a database of who scanned what. The one exception is the aggregate,
              anonymised research published on the{" "}
              <a href="/study/">study page</a>, which covers a fixed list of public homepages and no
              visitor data.
            </li>
            <li>No selling, renting or sharing of personal data for anyone else&apos;s marketing.</li>
          </ul>

          <h2>Cookies</h2>
          <p>
            Running a scan requires no cookie and we set none of our own for it. Cloudflare may set
            strictly necessary security cookies as part of serving the site and protecting it from
            abuse; these are not used to build a profile of you. Advertising cookies are a separate
            matter and are described in the next section.
          </p>

          <h2>Advertising and third-party cookies</h2>
          <p>
            This site is free to use, and advertising is what pays for it. When an ad is served on a
            page you are reading:
          </p>
          <ul>
            <li>
              <strong>Google, as a third-party vendor, uses cookies to serve ads on this site.</strong>
            </li>
            <li>
              Third-party vendors, including Google, use cookies to serve ads based on your prior
              visits to this website or other websites. Google&apos;s use of advertising cookies
              enables it and its partners to serve ads to you based on your visit to this site
              and/or other sites on the internet.
            </li>
            <li>
              You can opt out of personalised advertising by visiting{" "}
              <a
                href="https://myadcenter.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>
              , and opt out of third-party vendors&apos; use of cookies for personalised advertising
              at{" "}
              <a href="https://www.aboutads.info/" target="_blank" rel="noopener noreferrer">
                aboutads.info
              </a>{" "}
              or, in Europe,{" "}
              <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">
                youronlinechoices.eu
              </a>
              .
            </li>
            <li>
              Google&apos;s own handling of this data is described in the{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Privacy &amp; Terms
              </a>
              .
            </li>
          </ul>
          <p>
            <strong>If you are in the EEA, the UK or Switzerland</strong>, no non-essential cookie is
            set and no personalised advertising is served before you consent. Consent is requested
            through a Google-certified consent management platform, and the choice you make there is
            honoured for the purposes it covers. You can withdraw consent at any time by writing to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>; withdrawing it does not affect
            the lawfulness of anything done before then.
          </p>

          <h2>Other third parties</h2>
          <ul>
            <li>
              <strong>Cloudflare</strong> hosts and delivers this site and provides its security
              layer, and therefore processes request data including IP addresses on our behalf.
            </li>
            <li>
              <strong>Google</strong> serves the advertising described above.
            </li>
            <li>
              <strong>GitHub</strong> hosts the public source repository. If you open an issue
              there, GitHub&apos;s own terms and privacy policy apply to that.
            </li>
          </ul>
          <p>
            If you pay for a manual audit, the payment provider used for that transaction processes
            your payment details under its own privacy policy. We do not receive or store your card
            details.
          </p>

          <h2>Why this processing is allowed</h2>
          <ul>
            <li>
              <strong>Legitimate interests</strong> (Article 6(1)(f) GDPR) for serving the pages,
              running the scan you asked for, keeping the service available, and preventing abuse
              and denial-of-service.
            </li>
            <li>
              <strong>Consent</strong> (Article 6(1)(a) GDPR) for advertising cookies and
              personalised advertising where consent is required.
            </li>
            <li>
              <strong>Performance of a contract</strong> (Article 6(1)(b) GDPR) for correspondence
              and delivery when you order a manual audit, and for the record-keeping that goes with
              it.
            </li>
          </ul>

          <h2>How long it is kept</h2>
          <p>
            Server and security logs are kept for a short period, determined by our hosting
            provider&apos;s log retention, and are used for security and capacity rather than
            analysis of individuals. Scan results are not stored beyond the request that produced
            them. Correspondence about a paid audit is kept for as long as needed to deliver it and
            to meet accounting obligations. Advertising cookie lifetimes are set by Google, not by
            us.
          </p>

          <h2>Your rights</h2>
          <p>
            Where the GDPR or a comparable law applies to you, you have the right to ask for access
            to your personal data, to have it corrected, deleted or restricted, to object to
            processing based on legitimate interests, to receive it in a portable form, and to
            withdraw consent at any time. Write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and say which right you are
            exercising; no form is needed. You also have the right to complain to your national data
            protection authority. If a request concerns data held by Google for advertising, its own
            privacy controls are the faster route, and the opt-outs linked above work immediately.
          </p>

          <h2>Transfers outside your country</h2>
          <p>
            Cloudflare and Google operate globally, so data may be processed outside the country you
            are in, including in the United States. Those transfers rely on the safeguards those
            providers have in place, such as the European Commission&apos;s standard contractual
            clauses and the EU-US Data Privacy Framework.
          </p>

          <h2>Children</h2>
          <p>
            This site is a tool for people who run websites. It is not directed at children, and we
            do not knowingly process data about them.
          </p>

          <h2>If this policy changes</h2>
          <p>
            The date at the top of this page changes whenever the policy does. If a change concerns
            how advertising or cookies work, it will be reflected here before it takes effect, and
            consent will be asked again where the law requires it.
          </p>

          <h2>Contact</h2>
          <p>
            Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or use the{" "}
            <a href="/contact/">contact page</a> for anything that is not a data request. The{" "}
            <a href="/terms/">terms of service</a> and the{" "}
            <a href="/refund/">refund policy</a> are the pages that go with this one.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/terms/" className="text-xs text-blue-400 hover:text-blue-300">
            Terms of service →
          </a>
          <a href="/contact/" className="text-xs text-blue-400 hover:text-blue-300">
            Contact →
          </a>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
            Run a free scan
          </a>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        <LegalLinks className="mb-3" />
        <div>© 2026 LLMention. Brand Generative Engine Optimization Intelligence.</div>
      </footer>
    </div>
  );
}
