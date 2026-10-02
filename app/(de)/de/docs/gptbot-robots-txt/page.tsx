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
        und nicht pauschal, und sie fällt an zwei Stellen: in Ihrer{" "}
        <code>robots.txt</code> und in Ihrer Firewall.
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
      <pre>{`# GPTBot vollständig aussperren
User-agent: GPTBot
Disallow: /

# Nur Teile aussperren (Index bleibt erlaubt)
User-agent: GPTBot
Disallow: /intern/
Disallow: /suche?`}</pre>
      <p>
        Wichtig: <code>GPTBot</code> ist der Trainingscrawler. F&uuml;r ChatGPT-Antworten z&auml;hlen{" "}
        <code>OAI-SearchBot</code> und <code>ChatGPT-User</code>. Wer nur das Training ablehnen,
        aber weiterhin in ChatGPT-Antworten erscheinen will, muss zwischen den Agenten
        unterscheiden und nicht den ganzen Anbieter aussperren.
      </p>

      <h2>Wie erlaube ich KI-Crawler gezielt?</h2>
      <p>
        Ohne <code>robots.txt</code> ist alles erlaubt – die Standardeinstellung lässt also
        bereits alles zu. Sinnvoll ist eine ausdrückliche Regel trotzdem, weil sie die Absicht
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
        Das ist eine legitime Entscheidung, die aber nichts mit Ihrer Sichtbarkeit in
        KI-Antworten zu tun hat. Wer <code>CCBot</code> oder <code>GPTBot</code> blockiert,
        trifft das Modelltraining; wer <code>OAI-SearchBot</code> oder{" "}
        <code>PerplexityBot</code> blockiert, entscheidet darüber, ob er überhaupt zitiert werden
        kann. Wer Sichtbarkeit will, sperrt die zweiten nicht aus – und sperrt{" "}
        <code>Googlebot</code> oder <code>Bingbot</code> nie versehentlich mit.
      </p>

      <h2>Warum sehe ich trotzdem eine 403-Antwort?</h2>
      <p>
        <strong>Weil Bot-Management nicht am User-Agent entscheidet, sondern an der Herkunft der
        Anfrage.</strong> Cloudflare Bot Fight Mode, AWS WAF, Akamai und Fastly prüfen IP-Adresse,
        TLS-Fingerabdruck und Verhalten. Ein Werkzeug, das sich als GPTBot ausgibt und aus einem
        Rechenzentrum anfragt, wird als Fälschung abgewiesen – obwohl echter GPTBot-Verkehr
        problemlos bedient wird. Prüfen Sie deshalb in Ihrem CDN gezielt den Bot-Fight-Modus, die
        Sicherheitsstufe, eigene WAF-Regeln auf den User-Agent und Rate-Limits.
      </p>
      <p>
        Zur Auswertung von <code>robots.txt</code>: Eine exakte Agent-Gruppe hat Vorrang vor{" "}
        <code>*</code>. Innerhalb einer Gruppe gewinnt das längste passende Muster, bei gleicher
        Länge gewinnt <code>Allow</code>, und ein leerer <code>Disallow</code>-Wert erlaubt alles.
      </p>

      <h2>Wie prüfe ich, was tatsächlich blockiert ist?</h2>
      <ol>
        <li>Rufen Sie <code>https://ihre-domain.de/robots.txt</code> auf und suchen Sie die Gruppen der genannten Agenten.</li>
        <li>Prüfen Sie in Ihrer WAF oder Ihrem CDN, ob Regelwerk oder Bot-Schutz diese Agenten abweist und ob die Antwort den Header <code>cf-mitigated</code> trägt.</li>
        <li>Suchen Sie im Sicherheitsprotokoll Ihres CDN nach abgewiesenen Anfragen aus den Adressbereichen von OpenAI, Anthropic und Perplexity.</li>
      </ol>
      <p>
        Schritt 1 führt der <a href="/de/">LLMention-Scanner</a> automatisch aus und benennt, welche
        der Agenten gptbot, claudebot, perplexitybot, oai-searchbot und google-extended am
        Wurzelverzeichnis ausgesperrt sind. <strong>Die Schritte 2 und 3 führt er nicht aus:</strong>{" "}
        Er ruft Ihre Website als er selbst von seiner eigenen Adresse ab. Eine Anfrage von dort kann
        daher nie zeigen, wie Ihre Firewall auf einen echten KI-Crawler reagiert. Die vollständige
        Bewertungslogik steht in der{" "}
        <a href="/methodology/" hrefLang="en">Methodik (EN)</a>.
      </p>
    </ArticleShell>
  );
}
