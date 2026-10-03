import type { Metadata } from "next";
import LegalLinks from "@/app/components/LegalLinks";
import {
  CONTACT_EMAIL,
  LEGAL_ADDRESS_LINES,
  LEGAL_ADDRESS_NATIVE,
  LEGAL_NAME_LATIN,
  LEGAL_NAME_NATIVE,
} from "@/lib/legal-entity";

/**
 * Impressum - the German provider identification required by section 5 DDG.
 *
 * WHY IT EXISTS: the German pages are a commercial offering, and section 5 of
 * the Digitale-Dienste-Gesetz (in force since 14 May 2024, replacing the
 * equivalent provision of the TMG) requires a provider identification that
 * names the person responsible and gives an address where legal documents can
 * actually be served. A contact form or an email address alone does not satisfy
 * it, which is why the full postal address is published here.
 *
 * WHAT IS DELIBERATELY ABSENT:
 *  - No VAT identification number and no phone number, because the operator
 *    confirmed there is neither. Inventing a placeholder would be worse than
 *    omitting the line: a false Impressum is itself the offence.
 *  - No link to the EU online dispute resolution platform. That platform was
 *    shut down in July 2025, so the link that most German sites still carry now
 *    points at a dead service, and a stale notice is a warning-letter risk in
 *    its own right. The section 36 VSBG statement below is what remains.
 *
 * NOT LEGAL ADVICE. The wording is the ordinary formulation for a natural
 * person trading from outside the EU. Have it reviewed before relying on it.
 */
const TITLE = "Impressum";
const DESCRIPTION =
  "Anbieterkennzeichnung nach § 5 DDG: Name, Anschrift und Kontakt des Betreibers von LLMention.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/de/impressum/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/de/impressum/", type: "article" },
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <a href="/de/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
          </a>
          <a
            href="/de/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            ← Zur Startseite
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Rechtliches
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {TITLE}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz).
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>Diensteanbieter</h2>
          <p>
            {LEGAL_NAME_LATIN} ({LEGAL_NAME_NATIVE})
            <br />
            {LEGAL_ADDRESS_LINES.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
            <span className="text-gray-400">{LEGAL_ADDRESS_NATIVE}</span>
          </p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            Eine Telefonnummer wird nicht bereitgestellt. § 5 DDG verlangt Angaben, die eine
            schnelle elektronische Kontaktaufnahme und unmittelbare Kommunikation ermöglichen;
            die E-Mail-Adresse erfüllt das, und sie ist der Weg, auf dem Anfragen tatsächlich
            beantwortet werden.
          </p>

          <h2>Umsatzsteuer-Identifikationsnummer</h2>
          <p>
            Eine Umsatzsteuer-Identifikationsnummer nach § 27a Umsatzsteuergesetz ist nicht
            vorhanden.
          </p>

          <h2>Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). Der Betreiber hat seinen Sitz
            außerhalb der Europäischen Union, sodass die Voraussetzungen für eine
            Teilnahmeverpflichtung nicht vorliegen.
          </p>

          <h2>Verantwortlich für den Inhalt</h2>
          <p>
            {LEGAL_NAME_LATIN}, Anschrift wie oben.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen
            Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder
            gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die
            auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder
            Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben davon
            unberührt. Eine diesbezügliche Haftung ist erst ab dem Zeitpunkt der Kenntnis einer
            konkreten Rechtsverletzung möglich.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
            übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
            Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft; rechtswidrige Inhalte waren zum
            Zeitpunkt der Verlinkung nicht erkennbar. Bei Bekanntwerden von Rechtsverletzungen
            werden wir derartige Links umgehend entfernen.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
            außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
            Betreibers. Zitate mit Quellenangabe und Link sind ausdrücklich willkommen. Downloads
            und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch
            gestattet.
          </p>

          <h2>Weitere rechtliche Seiten</h2>
          <p>
            Die <a href="/de/widerrufsrecht/">Widerrufsbelehrung</a> gilt für Verbraucher in der
            Europäischen Union. Die <a href="/privacy/">Datenschutzerklärung</a>, die{" "}
            <a href="/terms/">Nutzungsbedingungen</a> und die{" "}
            <a href="/refund/">Rückerstattungsregelung</a> sind derzeit auf Englisch verfügbar.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/de/widerrufsrecht/" className="text-xs text-blue-400 hover:text-blue-300">
            Widerrufsbelehrung →
          </a>
          <a href="/contact/" className="text-xs text-blue-400 hover:text-blue-300" hrefLang="en">
            Kontakt (EN) →
          </a>
          <a href="/de/" className="text-xs text-gray-500 hover:text-gray-300">
            Zur Startseite
          </a>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        <LegalLinks locale="de" className="mb-3" />
        <div>© 2026 LLMention. Brand Generative Engine Optimization Intelligence.</div>
      </footer>
    </div>
  );
}
