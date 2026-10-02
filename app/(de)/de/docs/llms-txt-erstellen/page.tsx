import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";

const TITLE = "llms.txt erstellen und einbinden";
const DESCRIPTION =
  "Aufbau, Ablageort und Prüfung einer llms.txt – mit einer ehrlichen Einschätzung, was die Datei für die Sichtbarkeit in KI-Suchmaschinen leistet und was nicht.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/de/docs/llms-txt-erstellen/",
    languages: {
      en: "/docs/llms-txt-deployment/",
      de: "/de/docs/llms-txt-erstellen/",
    },
  },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/de/docs/llms-txt-erstellen/", type: "article" },
};

export default function Page() {
  return (
    <ArticleShell
      category="Einrichtung"
      title={TITLE}
      description={DESCRIPTION}
      readTime="4 Min."
      updated="Oktober 2026"
    >
      <p>
        <strong>Die llms.txt ist eine schlichte Markdown-Datei im Wurzelverzeichnis Ihrer Domain,
        die einem Sprachmodell sagt, welche Teile Ihrer Website relevant sind.</strong> Sie ist
        eine Konvention und kein Standard, in wenigen Minuten angelegt – und sie leistet weniger,
        als viele Anbieter behaupten.
      </p>

      <h2>Was ist llms.txt?</h2>
      <p>
        <code>/llms.txt</code> ist ein Vorschlag, KI-Systemen eine kuratierte, maschinenlesbare
        Zusammenfassung einer Website zu übergeben. Statt aus HTML eine Struktur abzuleiten,
        erhält das Modell ein kurzes Markdown-Dokument mit einer Projektbeschreibung und einer
        Liste der wichtigsten Links. Die begleitende Datei <code>/llms-full.txt</code> enthält
        zusätzlich die Inhalte selbst.
      </p>

      <h2>Wie ist eine llms.txt aufgebaut?</h2>
      <p>
        Die Konvention ist bewusst einfach: eine H1 mit dem Namen, ein Blockquote als
        Zusammenfassung, danach H2-Abschnitte mit kommentierten Links.
      </p>
      <pre>{`# Ihr Unternehmen

> Ein bis zwei Sätze dazu, was Sie tun und für wen.

## Zentrale Seiten
- [Produkt](https://ihre-domain.de/produkt): was es leistet.
- [Preise](https://ihre-domain.de/preise): Tarife und Grenzen.

## Dokumentation
- [Erste Schritte](https://ihre-domain.de/doku/start): Einrichtung in fünf Minuten.

## Optional
- [Blog](https://ihre-domain.de/blog): Release-Notes und Recherchen.`}</pre>
      <p>
        Zwei Regeln sind wichtiger als das Format: <strong>Der Satz in der Zusammenfassung wird
        am ehesten zitiert</strong> und sollte deshalb eine faktenreiche Aussage sein statt eines
        Werbespruchs. Und <strong>jeder Link muss erreichbar sein</strong> – eine Datei voller
        404er ist schlechter als gar keine Datei.
      </p>

      <h2>Wo muss die Datei liegen?</h2>
      <p>
        Sie muss exakt unter <code>https://ihre-domain.de/llms.txt</code> erreichbar sein, also
        im Wurzelverzeichnis und nicht in einem Unterordner. Bei Next.js legen Sie sie unter
        <code>public/llms.txt</code> ab; bei den meisten statischen Hostern im
        Veröffentlichungsverzeichnis. Vermeiden Sie Weiterleitungen und liefern Sie die Datei
        mit dem Content-Type <code>text/plain</code> aus.
      </p>

      <h2>Bringt llms.txt wirklich mehr Sichtbarkeit?</h2>
      <p>
        <strong>Teilweise – und deutlich weniger, als in dieser Branche behauptet wird.</strong>
        Google hat erklärt, llms.txt nicht in der Suche zu verwenden. Die Unterstützung durch
        Crawler ist uneinheitlich, und kein großer Anbieter hat sie als Rankingfaktor
        zugesagt.
      </p>
      <p>
        Real hilft sie heute an zwei Stellen: Dokumentationsseiten und Coding-Agenten, die
        Kontext gezielt abrufen, sowie Abrufsysteme, die einen kuratierten Einstiegspunkt
        akzeptieren. Die ehrliche Einordnung lautet daher: <strong>ein kleines, günstiges
        Signal</strong> – sinnvoll, aber kein Rankingfaktor. Aus diesem Grund trägt die
        Dimension in der <a href="/de/">LLMention-Bewertung</a> nur 5 von 100 Punkten.
      </p>

      <h2>Wie prüfe ich die Datei?</h2>
      <ol>
        <li>Rufen Sie <code>https://ihre-domain.de/llms.txt</code> im Browser auf. Sie sollte als Klartext erscheinen, nicht heruntergeladen werden und nicht 404 liefern.</li>
        <li>Prüfen Sie Statuscode <code>200</code> und Content-Type <code>text/plain</code>.</li>
        <li>Stellen Sie sicher, dass <code>robots.txt</code> den Pfad nicht aussperrt und Ihre Firewall keine Crawler-Agents blockiert.</li>
        <li>Klicken Sie jeden Link in der Datei einmal an. Tote Links sind der häufigste Fehler.</li>
      </ol>
      <p>
        Die Konvention selbst ist unter <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">llmstxt.org</a>{" "}
        dokumentiert. Der <a href="/de/">Scanner</a> prüft Erreichbarkeit, Aufbau und Verlinkung
        automatisch.
      </p>
    </ArticleShell>
  );
}
