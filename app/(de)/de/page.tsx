"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * German homepage.
 *
 * A real translation rather than a machine-dumped stub: German-speaking
 * markets are the ones the English-first GEO tools have left alone, so the
 * point of the pilot is to see whether a properly localised page can rank where
 * a translated-by-default page would not.
 *
 * Detailed guides and the scoring method are still English-only; links to them
 * are labelled so a German reader is not surprised by the language switch.
 */
export default function GermanHomePage() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const startScan = () => {
    const cleanDomain = url
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];
    if (!cleanDomain) return;
    router.push(`/report/?domain=${encodeURIComponent(cleanDomain)}`);
  };

  const faqItems = [
    {
      q: "Was ist Generative Engine Optimization (GEO)?",
      a: "GEO bezeichnet die Praxis, eine Website f\u00fcr KI-Suchmaschinen wie ChatGPT, Perplexity, Claude und Google AI Overviews auffindbar, lesbar und zitierbar zu machen. Statt einer Platzierung in der Trefferliste geht es darum, in einer generierten Antwort zitiert zu werden.",
    },
    {
      q: "Wie pr\u00fcfe ich, ob KI-Crawler meine Website lesen k\u00f6nnen?",
      a: "Pr\u00fcfen Sie Ihre robots.txt auf Regeln, die KI-Crawler wie GPTBot, ClaudeBot, PerplexityBot oder Bytespider aussperren, und stellen Sie sicher, dass Ihre Firewall diesen Agenten kein 403 zur\u00fcckgibt. LLMention pr\u00fcft beides automatisch und benennt genau, was blockiert wird.",
    },
    {
      q: "Brauche ich eine llms.txt-Datei?",
      a: "Nicht zwingend. llms.txt ist eine aufkommende Konvention und kein Standard: Google nutzt sie nicht in der Suche, und KI-Crawler fragen sie uneinheitlich ab. Sie ist in wenigen Minuten angelegt und hilft Dokumentationsseiten und Coding-Agenten, aber behandeln Sie sie als kleines Signal und nicht als Rankingfaktor.",
    },
    {
      q: "Welche KI-Crawler sollte ich in robots.txt erlauben?",
      a: "Erlauben Sie die Crawler der Engines, aus denen Sie zitiert werden m\u00f6chten: GPTBot und OAI-SearchBot f\u00fcr OpenAI, ClaudeBot und Claude-SearchBot f\u00fcr Anthropic, PerplexityBot f\u00fcr Perplexity, Google-Extended f\u00fcr Google sowie Bingbot, dessen Index auch die ChatGPT-Suche speist. Wer einen Crawler aussperrt, verschwindet aus den Antworten dieser Engine.",
    },
    {
      q: "Ersetzt GEO das klassische SEO?",
      a: "Nein. GEO und SEO teilen die meisten Grundlagen: crawlbar, klar strukturiert, sachlich korrekt und mit echter Autorit\u00e4t. GEO erg\u00e4nzt den Schwerpunkt auf antwortf\u00f6rmige Inhalte, Entit\u00e4ts-Markup wie Schema.org JSON-LD und maschinenlesbare Kontextdateien. Wer SEO bereits gut beherrscht, startet beim GEO mit Vorsprung.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A10] text-white flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center px-6 py-6 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/20 border border-white/10">
            L
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-none">
              LLMention
            </span>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-1">
              Brand GEO Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-full border border-gray-800 text-xs">
            <a
              href="/"
              hrefLang="en"
              className="px-3 py-1 rounded-full text-gray-400 hover:text-white transition-all"
            >
              🇬🇧 English
            </a>
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-medium">
              🇩🇪 Deutsch
            </span>
          </nav>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 flex-1 pt-16 md:pt-24 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Generative Engine Optimization
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
            Ist Ihre Website f&uuml;r{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              KI-Suchmaschinen
            </span>{" "}
            optimiert?
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Pr&uuml;fen Sie, ob ChatGPT, Perplexity und Claude Ihre Website crawlen k&ouml;nnen.
            Analysieren Sie Ihre KI-Sichtbarkeit und erzeugen Sie /llms.txt-Dateien automatisch.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto pt-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startScan()}
              placeholder="Domain oder URL eingeben (z. B. adidas.com)"
              className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-all"
            />
            <button
              onClick={startScan}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
            >
              Website scannen 🚀
            </button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">🤖</div>
            <h2 className="text-sm font-bold text-gray-200">KI-Crawler-Zugang</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Pr&uuml;ft robots.txt und WAF-Regeln, damit GPTBot, PerplexityBot und ClaudeBot
              nicht blockiert werden.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">📄</div>
            <h2 className="text-sm font-bold text-gray-200">/llms.txt-Erzeugung</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Erzeugt standardisierte Markdown-Kontextdateien, damit LLMs Ihre Inhalte sauber
              erfassen k&ouml;nnen.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">🏷️</div>
            <h2 className="text-sm font-bold text-gray-200">Sichtbarkeits-Badge</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bettet GEO-Bereitschafts-Badges direkt in Ihr GitHub-README oder Ihren
              Website-Footer ein.
            </p>
          </div>
        </section>

        {/* Verifiable self-audit */}
        <section className="text-left">
          <div className="bg-[#070A10]/60 border border-blue-500/30 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-white">
                Diese Website wird mit denselben 38 Pr&uuml;fungen gemessen
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                LLMention pr&uuml;ft die eigene Startseite mit genau den Regeln, die auch f&uuml;r
                Ihre Website gelten, und verlinkt das Ergebnis, statt eine Zahl zu behaupten. Zuletzt
                gepr&uuml;ft am 2. Oktober 2026: 100 von 100 Punkten, Note A, alle 38 Pr&uuml;fungen
                bestanden. Pr&uuml;fen Sie es selbst &ndash; der Bericht listet jede Pr&uuml;fung auf,
                nicht nur die Fehler.
              </p>
            </div>
            <a
              href="/report/?domain=geo-scanner.ccie13192.com"
              className="text-xs font-semibold bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white px-5 py-3 rounded-xl transition-all shrink-0 text-center"
            >
              Diese Website scannen →
            </a>
          </div>
        </section>

        {/* Supported crawlers */}
        <section className="text-left space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
            Unterst&uuml;tzte KI-Such- und Crawler-Agenten
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-900/30 border border-gray-800/60 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">GPTBot</p>
                <p className="text-[10px] text-gray-500">OpenAI / ChatGPT</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            </div>
            <div className="bg-gray-900/30 border border-gray-800/60 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">PerplexityBot</p>
                <p className="text-[10px] text-gray-500">Perplexity AI</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            </div>
            <div className="bg-gray-900/30 border border-gray-800/60 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">ClaudeBot</p>
                <p className="text-[10px] text-gray-500">Anthropic Claude</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            </div>
            <div className="bg-gray-900/30 border border-gray-800/60 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Bytespider</p>
                <p className="text-[10px] text-gray-500">ByteDance / Doubao</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="text-left space-y-4">
          <div className="bg-gradient-to-r from-blue-950/20 via-gray-900/60 to-purple-950/20 border border-gray-800 p-8 rounded-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Warum GEO 2026 z&auml;hlt</h2>
              <p className="text-xs text-gray-400">
                Generative Engine Optimization verschiebt das Ziel von einem gelisteten Link zu
                einem zitierten Absatz.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
                <thead className="bg-[#070A10]/80 text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Dimension</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Klassisches SEO</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Generatives GEO</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 text-gray-500">Was Sie gewinnen</td>
                    <td className="px-4 py-2.5">Eine Position auf der Ergebnisseite</td>
                    <td className="px-4 py-2.5">Einen Satz, der in einer Antwort zitiert wird</td>
                  </tr>
                  <tr className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 text-gray-500">Wettbewerbseinheit</td>
                    <td className="px-4 py-2.5">Die Seite, gegen andere Seiten gerankt</td>
                    <td className="px-4 py-2.5">Der Absatz, gegen andere Abs&auml;tze abgerufen</td>
                  </tr>
                  <tr className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 text-gray-500">Wichtigster Hebel</td>
                    <td className="px-4 py-2.5">Keywords, Backlinks, Seitenautorit&auml;t</td>
                    <td className="px-4 py-2.5">
                      Entit&auml;tsklarheit, Belege, extrahierbare Struktur
                    </td>
                  </tr>
                  <tr className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 text-gray-500">Wie Sie es messen</td>
                    <td className="px-4 py-2.5">Rank-Tracking und Klickrate</td>
                    <td className="px-4 py-2.5">
                      Ob ein Modell Ihre Aussage wiederholt und Sie zitiert
                    </td>
                  </tr>
                  <tr className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 text-gray-500">Typisches Scheitern</td>
                    <td className="px-4 py-2.5">Position 11, keine Klicks</td>
                    <td className="px-4 py-2.5">Die Antwort wird gegeben &ndash; ohne Sie</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="text-left space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">H&auml;ufige Fragen</h2>
            <p className="text-xs text-gray-400">
              Kurze, direkte Antworten zu GEO und zum Zugriff von KI-Crawlern.
            </p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group bg-[#070A10]/60 border border-gray-800/60 rounded-xl p-5 open:border-blue-500/40 transition-colors"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-gray-100 leading-snug">{item.q}</h3>
                  <span className="text-gray-500 group-open:rotate-45 transition-transform text-lg leading-none shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-xs text-gray-400 leading-relaxed pt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Research */}
        <section className="text-left space-y-4">
          <div className="bg-gradient-to-r from-blue-950/20 via-gray-900/60 to-purple-950/20 border border-gray-800 p-8 rounded-2xl space-y-5">
            <h2 className="text-lg font-bold text-white">
              Was die ver&ouml;ffentlichte Forschung zeigt
            </h2>

            <blockquote className="border-l-2 border-blue-500 pl-4 space-y-2">
              <p className="text-sm text-gray-300 leading-relaxed">
                Das Hinzuf&uuml;gen von Quellenangaben erzielte den gr&ouml;&szlig;ten gemessenen
                Sichtbarkeitsgewinn f&uuml;r schwach rankende Websites (+115&nbsp;%), vor der
                Erg&auml;nzung von Expertenzitaten (+41&nbsp;%) und Statistiken (+30&ndash;40&nbsp;%).
              </p>
              <footer className="text-xs text-gray-500">
                &ndash; Zusammenfassung der Ergebnisse,{" "}
                <a
                  href="https://arxiv.org/abs/2311.09735"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Generative Engine Optimization
                </a>
                , KDD 2024 (Princeton und Georgia Tech)
              </footer>
            </blockquote>

            <p className="text-xs text-gray-400 leading-relaxed">
              LLMention gewichtet seine Bewertung entsprechend: Zitierf&auml;higkeit und Belege
              tragen 11&nbsp;% der Gesamtnote, Antwortbereitschaft weitere 10&nbsp;%. Die
              vollst&auml;ndige Gewichtung, jede Regel und eine ausdr&uuml;ckliche Darstellung
              dessen, was die Bewertung nicht leisten kann, sind in der Methodik dokumentiert
              (derzeit auf Englisch).
            </p>

            <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-5">
              <li>
                <a
                  href="https://arxiv.org/abs/2311.09735"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Generative Engine Optimization
                </a>{" "}
                &ndash; KDD 2024. Quelle der oben genannten Zahlen.
              </li>
              <li>
                <a
                  href="https://arxiv.org/abs/2510.11438"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  What Generative Search Engines Like
                </a>{" "}
                &ndash; welche Seitenmerkmale tats&auml;chlich zitiert werden.
              </li>
              <li>
                <a
                  href="https://llmstxt.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Die llms.txt-Konvention
                </a>{" "}
                &ndash; die Originalquelle statt einer Anbieterzusammenfassung.
              </li>
            </ul>
          </div>
        </section>

        {/* About */}
        <section className="text-left space-y-4">
          <div className="bg-[#070A10]/60 border border-gray-800/60 p-8 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">&Uuml;ber LLMention</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              LLMention ist ein unabh&auml;ngiges Werkzeug, das pr&uuml;ft, ob KI-Suchmaschinen
              eine Website erreichen, erfassen und zitieren k&ouml;nnen. Es steht in keiner
              Verbindung zu OpenAI, Anthropic, Google oder Perplexity und unterh&auml;lt mit
              diesen keine Datenbeziehung. Der Scanner und der llms.txt-Generator sind
              kostenlos und erfordern kein Konto.
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Das Projekt ver&ouml;ffentlicht seine Bewertungsmethode vollst&auml;ndig: die
              ausgef&uuml;hrten Pr&uuml;fungen, ihre Gewichtung und die Teile des Bildes, die es
              nicht sehen kann. Es gibt keine Mindestpunktzahl &ndash; eine Seite, die keine
              Pr&uuml;fung besteht, landet nahe null. Signale mit schwacher Beweislage werden
              niedrig gewichtet statt als Rankingfaktor beworben.
            </p>
            <p className="text-xs text-gray-500">
              Gepflegt vom LLMention-Team. Weiterf&uuml;hrende Leitf&auml;den und die
              Methodik sind derzeit auf Englisch verf&uuml;gbar.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto border-t border-gray-800/60 mt-16 py-6 text-center text-xs text-gray-500 space-y-2">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a href="/about/" hrefLang="en" className="hover:text-gray-300 transition-colors">
            About (EN)
          </a>
          <a href="/methodology/" hrefLang="en" className="hover:text-gray-300 transition-colors">
            Methodik (EN)
          </a>
          <a href="/docs/" hrefLang="en" className="hover:text-gray-300 transition-colors">
            Leitf&auml;den (EN)
          </a>
          <a href="/pricing/" hrefLang="en" className="hover:text-gray-300 transition-colors">
            Preise (EN)
          </a>
          <a href="/llms.txt" className="hover:text-gray-300 transition-colors">
            llms.txt
          </a>
        </nav>
        <div>
          &copy; 2026 LLMention. Brand Generative Engine Optimization Intelligence.
        </div>
      </footer>
    </div>
  );
}
