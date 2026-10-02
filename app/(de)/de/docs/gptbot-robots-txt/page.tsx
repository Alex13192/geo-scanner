import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";

const TITLE = "GPTBot & Co.: in robots.txt erlauben oder blockieren?";
const DESCRIPTION =
  "Welche User-Agents KI-Suchmaschinen senden, wie Sie einzelne Crawler in robots.txt gezielt aussperren oder zulassen, und warum eine 403-Antwort nichts über echte KI-Crawler aussagt.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/de/docs/gptbot-robots-txt/",
    languages: {
      en: "/docs/allow-ai-crawlers/",
      de: "/de/docs/gptbot-robots-txt/",
    },
  },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/de/docs/gptbot-robots-txt/", type: "article" },
};

export default function Page() {
  return (
    <ArticleShell
      category="Technik"
      title={TITLE}
      description={DESCRIPTION}
      readTime="5 Min."
      updated="Oktober 2026"
    >
      <p>
        <strong>Wer einen KI-Crawler aussperrt, verschwindet aus den Antworten der zugehörigen
        Engine.</strong> Wer ihn zulässt, kann zitiert werden. Die Entscheidung fällt pro Crawler
        und nicht pauschal, und sie fällt in zwei getrennten Dateien beziehungsweise Systemen:
        in <code>robots.txt</code> und in Ihrer Firewall.
      </p>

      <h2>Welche User-Agents senden KI-Suchmaschinen?</h2>
      <ul>
        <li><strong>OpenAI:</strong> <code>GPTBot</code> (Training), <code>OAI-SearchBot</code> (Suchindex), <code>ChatGPT-User</code> (Abruf durch eine Nutzerfrage)</li>
        <li><strong>Anthropic:</strong> <code>ClaudeBot</code>, <code>Claude-User</code>, <code>Claude-SearchBot</code>, <code>anthropic-ai</code></li>
        <li><strong>Perplexity:</strong> <code>PerplexityBot</code>, <code>Perplexity-User</code></li>
        <li><strong>Google:</strong> <code>Google-Extended</code> (KI-Grounding; <code>Googlebot</code> ist davon getrennt)</li>
        <li><strong>Weitere:</strong> <code>Bytespider</code> (ByteDance), <code>CCBot</code> (Common Crawl), <code>meta-externalagent</code> (Meta), <code>Applebot-Extended</code> (Apple)</li>
      </ul>
      <p>
        Die <code>*-User</code>-Agents sind etwas anderes als die übrigen: Sie rufen eine URL ab,
        weil eine Person gerade danach gefragt hat. Wer sie blockiert, ändert nicht die Zukunft
        des Index, sondern die Antwort, die ein Mensch im selben Moment erhält.
      </p>

      <h2>Wie blockiere ich GPTBot in robots.txt?</h2>
      <pre>{`# GPTBot vollstaendig aussperren
User-agent: GPTBot
Disallow: /

# Nur Teile aussperren (Index bleibt erlaubt)
User-agent: GPTBot
Disallow: /intern/
Disallow: /suche?`}</pre>
      <p>
        Wichtig: <code>GPTBot</code> deckt Training <em>und</em> Grounding ab. Wer nur das
        Training ablehnen, aber weiterhin in ChatGPT-Antworten erscheinen will, muss zwischen
        den Agents unterscheiden und nicht den ganzen Anbieter aussperren.
      </p>

      <h2>Wie erlaube ich KI-Crawler gezielt?</h2>
      <p>
        Ohne <code>robots.txt</code> ist alles erlaubt – der Standardfall ist also bereits
        zulässig. Sinnvoll ist eine ausdrückliche Regel trotzdem, weil sie die Absicht
        dokumentiert und verhindert, dass eine später hinzugefügte Wildcard-Regel die
        KI-Crawler unbeabsichtigt mit aussperrt.
      </p>
      <pre>{`User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: *
Allow: /
Disallow: /intern/

Sitemap: https://ihre-domain.de/sitemap.xml`}</pre>

      <h2>Sollte ich KI-Trainingscrawler blockieren?</h2>
      <p>
        Das ist eine legitime Entscheidung, aber eine andere als die Frage der Sichtbarkeit.
        <code>CCBot</code> und <code>GPTBot</code> betreffen Training und Grounding.
        <code>OAI-SearchBot</code> und <code>PerplexityBot</code> entscheiden darüber, ob Sie
        überhaupt zitiert werden können. Wer Sichtbarkeit will, sperrt die zweiten nicht aus –
        und sperrt <code>Googlebot</code> oder <code>Bingbot</code> nie versehentlich mit.
      </p>

      <h2>Warum sehe ich trotzdem eine 403-Antwort?</h2>
      <p>
        <strong>Weil große Websites Crawler nicht am User-Agent, sondern an der IP-Adresse
        prüfen.</strong> Ein Scan-Werkzeug, das sich als GPTBot ausgibt, wird dann als Fälschung
        erkannt und abgewiesen – obwohl echter GPTBot-Verkehr problemlos bedient wird. Eine
        403-Antwort gegenüber einem fremden Rechner beweist also nichts über echte KI-Crawler.
        Verlässlich ist allein die <code>robots.txt</code>: Sie ist die erklärte Absicht der
        Website.
      </p>

      <h2>Wie prüfe ich, was tatsächlich blockiert ist?</h2>
      <ol>
        <li>Rufen Sie <code>https://ihre-domain.de/robots.txt</code> auf und suchen Sie die Gruppen der genannten Agents.</li>
        <li>Beachten Sie, dass eine exakte Agent-Gruppe Vorrang vor <code>*</code> hat und die letzte passende Regel gewinnt.</li>
        <li>Prüfen Sie, ob Ihre Firewall den Agents ein <code>403</code> zurückgibt und ob der Header <code>cf-mitigated</code> auftaucht.</li>
        <li>Suchen Sie im Sicherheitsprotokoll Ihres CDN nach abgewiesenen Anfragen aus den Adressbereichen von OpenAI, Anthropic und Perplexity.</li>
      </ol>
      <p>
        Die ersten drei Schritte führt der <a href="/de/">LLMention-Scanner</a> automatisch aus
        und benennt, welcher Agent blockiert wird und warum. Die vollständige Bewertungslogik
        steht in der <a href="/methodology/" hrefLang="en">Methodik (EN)</a>.
      </p>
    </ArticleShell>
  );
}
