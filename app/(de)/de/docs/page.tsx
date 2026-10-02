import Link from "next/link";

const guides = [
  {
    slug: "gptbot-robots-txt",
    category: "Technik",
    title: "GPTBot & Co.: in robots.txt erlauben oder blockieren?",
    description:
      "Welche User-Agents KI-Suchmaschinen senden, wie Sie einzelne davon gezielt aussperren oder zulassen, und warum eine 403-Antwort trotzdem nichts über echte KI-Crawler aussagt.",
    readTime: "5 Min.",
  },
  {
    slug: "llms-txt-erstellen",
    category: "Einrichtung",
    title: "llms.txt erstellen und einbinden",
    description:
      "Aufbau, Ablageort und Prüfung einer llms.txt – inklusive einer ehrlichen Einschätzung, was die Datei leistet und was nicht.",
    readTime: "4 Min.",
  },
];

export default function GermanDocsIndex() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href="/de/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              LLMention Leitfäden
            </span>
          </Link>
          <Link
            href="/de/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            ← Zurück zum Scanner
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 space-y-10">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Wissensbasis
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Leitfäden zu Generative Engine Optimization
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Schritt-für-Schritt-Anleitungen für Technik- und Marketingteams, die in ChatGPT,
            Perplexity und Claude zitiert werden wollen. Diese Leitfäden sind auf Deutsch
            geschrieben und nicht aus dem Englischen übersetzt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/de/docs/${guide.slug}/`}
              className="bg-gray-900/60 border border-gray-800/80 hover:border-blue-500/50 p-6 rounded-2xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    {guide.category}
                  </span>
                  <span className="text-gray-500 font-mono">{guide.readTime}</span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">{guide.title}</h2>
                <p className="text-xs text-gray-400 leading-relaxed">{guide.description}</p>
              </div>
              <span className="text-xs text-blue-400 font-medium">Leitfaden lesen →</span>
            </Link>
          ))}
        </div>

        <div className="bg-[#070A10]/60 border border-gray-800/60 rounded-2xl p-6 space-y-2">
          <h2 className="text-sm font-bold text-white">Weitere Leitfäden</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Die weiterführenden Leitfäden zu Schema.org JSON-LD, zu antwortförmigen Überschriften
            und zur Funktionsweise der Bewertung liegen derzeit auf Englisch vor. Eine deutsche
            Fassung folgt, sobald die ersten beiden Artikel geprüft sind.
          </p>
          <p className="text-xs text-gray-400">
            <a href="/docs/" hrefLang="en" className="text-blue-400 hover:text-blue-300 underline">
              Zu den englischen Leitfäden
            </a>
            {" · "}
            <a
              href="/methodology/"
              hrefLang="en"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Zur Bewertungsmethodik (EN)
            </a>
          </p>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        © 2026 LLMention. Brand Generative Engine Optimization Intelligence.
      </footer>
    </div>
  );
}
