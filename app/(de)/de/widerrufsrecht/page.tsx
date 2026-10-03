import type { Metadata } from "next";
import LegalLinks from "@/app/components/LegalLinks";
import {
  CONTACT_EMAIL,
  LEGAL_ADDRESS_LINES,
  LEGAL_NAME_LATIN,
  LEGAL_NAME_NATIVE,
} from "@/lib/legal-entity";

/**
 * Widerrufsbelehrung - the withdrawal notice for consumers in the EU.
 *
 * WHY IT EXISTS: the manual audit is sold to consumers, and a distance contract
 * with a consumer in the EU carries a statutory 14-day right of withdrawal. The
 * notice has to be given BEFORE the consumer is bound, and the model withdrawal
 * form has to be provided with it (Art. 246a section 2 EGBGB).
 *
 * THE PART THAT IS EASY TO GET WRONG: for a service, the right does not simply
 * run for 14 days and then lapse on its own. It lapses early only if the trader
 * started work after the consumer gave express consent AND confirmed they know
 * they lose the right by doing so (section 356(4) BGB; section 356(5) for
 * digital content). That consent is an operational step in the order flow, not
 * something a web page can do - see the section "Wie wir das im Bestellprozess
 * umsetzen" below, which states the process rather than assuming it.
 *
 * The refund page is deliberately more generous than the statutory minimum, and
 * that promise is voluntary and additional. It is presented that way here so it
 * cannot be read as narrowing the statutory right.
 *
 * NOT LEGAL ADVICE. The wording follows the official model notice. Have it
 * reviewed before relying on it.
 */
const TITLE = "Widerrufsbelehrung";
const DESCRIPTION =
  "Widerrufsrecht für Verbraucher: Frist, Folgen, vorzeitiges Erlöschen und das Muster-Widerrufsformular.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/de/widerrufsrecht/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/de/widerrufsrecht/",
    type: "article",
  },
};

export default function WiderrufsrechtPage() {
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
            Für Verbraucher in der Europäischen Union. Verbraucher ist jede natürliche Person, die
            ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch
            ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>Widerrufsrecht</h2>
          <p>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
            widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
          </p>
          <p>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
          </p>
          <p>
            {LEGAL_NAME_LATIN} ({LEGAL_NAME_NATIVE})
            <br />
            {LEGAL_ADDRESS_LINES.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
            E-Mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            mittels einer eindeutigen Erklärung (zum Beispiel per E-Mail) über Ihren Entschluss
            informieren, diesen Vertrag zu widerrufen. Sie können dafür das beigefügte
            Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der
            Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
            Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
          </p>

          <h2>Folgen des Widerrufs</h2>
          <p>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
            erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
            zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns
            eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie
            bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde
            ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser
            Rückzahlung Entgelte berechnet.
          </p>
          <p>
            Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so
            haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem
            Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses
            Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang
            der im Vertrag vorgesehenen Dienstleistungen entspricht.
          </p>

          <h2>Erlöschen des Widerrufsrechts</h2>
          <p>
            Bei einem Vertrag über die Erbringung von Dienstleistungen erlischt das Widerrufsrecht,
            wenn wir die Dienstleistung vollständig erbracht haben und mit der Ausführung erst
            begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben und gleichzeitig
            Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht mit Beginn der
            Ausführung des Vertrags verlieren (§ 356 Abs. 4 BGB).
          </p>
          <p>
            Bei einem Vertrag über die Lieferung von digitalen Inhalten, die nicht auf einem
            körperlichen Datenträger geliefert werden, gilt Entsprechendes nach § 356 Abs. 5 BGB.
          </p>
          <p>
            <strong>
              Solange Sie diese Zustimmung nicht erteilt haben, bleibt Ihr Widerrufsrecht auch nach
              Beginn der Arbeiten bestehen.
            </strong>{" "}
            Wir werden Sie vor Beginn der Arbeiten ausdrücklich danach fragen und Ihre Antwort
            festhalten.
          </p>

          <h2>Wie wir das im Bestellprozess umsetzen</h2>
          <p>
            Der Ablauf ist bewusst so gebaut, dass Sie Ihre Rechte nicht verlieren, ohne es zu
            merken:
          </p>
          <ul>
            <li>
              Sie senden uns die Seiten, die geprüft werden sollen. Vor jeder Zahlung erhalten Sie
              eine kurze Leistungsbeschreibung mit Umfang, Preis und Lieferzeit.
            </li>
            <li>
              Diese Nachricht enthält diese Widerrufsbelehrung und das Muster-Widerrufsformular,
              damit sie Ihnen vor Vertragsabschluss in Textform vorliegen.
            </li>
            <li>
              Erst danach erhalten Sie den Zahlungslink. Bezahlt wird erst, wenn Sie den Umfang
              bestätigt haben.
            </li>
            <li>
              Wünschen Sie eine Lieferung innerhalb der vierzehn Tage, fragen wir Sie vorher
              ausdrücklich, ob wir vor Ablauf der Widerrufsfrist beginnen dürfen, und Sie bestätigen
              uns, dass Sie dadurch Ihr Widerrufsrecht verlieren. Ohne diese Bestätigung warten wir
              entweder ab oder Sie können weiterhin widerrufen.
            </li>
          </ul>

          <h2>Zusätzliches, freiwilliges Rückerstattungsversprechen</h2>
          <p>
            Unabhängig vom gesetzlichen Widerrufsrecht gilt: Wenn die Prüfung auf den von Ihnen
            eingereichten Seiten nichts ergibt, das sich sinnvoll beheben lässt, erstatten wir den
            vollen Preis. Das ist eine freiwillige Zusage, die über das gesetzlich Geforderte
            hinausgeht. Einzelheiten stehen in der{" "}
            <a href="/refund/">Rückerstattungsregelung</a>. Diese Zusage schränkt Ihr gesetzliches
            Widerrufsrecht nicht ein.
          </p>

          <h2>Muster-Widerrufsformular</h2>
          <p className="text-gray-400">
            (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und
            senden Sie es zurück.)
          </p>
          <p>
            An:
            <br />
            {LEGAL_NAME_LATIN}
            <br />
            {LEGAL_ADDRESS_LINES.map((line) => (
              <span key={`form-${line}`}>
                {line}
                <br />
              </span>
            ))}
            E-Mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die
            Erbringung der folgenden Dienstleistung (*):
            <br />
            _______________________________________________
          </p>
          <p>
            Bestellt am (*) / erhalten am (*): _______________________________________________
          </p>
          <p>
            Name des/der Verbraucher(s): _______________________________________________
          </p>
          <p>
            Anschrift des/der Verbraucher(s): _______________________________________________
          </p>
          <p>
            Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
            <br />
            _______________________________________________
          </p>
          <p>Datum: _______________________________________________</p>
          <p className="text-gray-400">(*) Unzutreffendes streichen.</p>

          <h2>Weitere rechtliche Seiten</h2>
          <p>
            Das <a href="/de/impressum/">Impressum</a> nennt den Anbieter und die Anschrift. Die{" "}
            <a href="/privacy/">Datenschutzerklärung</a> und die{" "}
            <a href="/terms/">Nutzungsbedingungen</a> sind derzeit auf Englisch verfügbar.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/de/impressum/" className="text-xs text-blue-400 hover:text-blue-300">
            Impressum →
          </a>
          <a href="/refund/" className="text-xs text-blue-400 hover:text-blue-300" hrefLang="en">
            Rückerstattungsregelung (EN) →
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
