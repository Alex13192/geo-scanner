import type { Locale } from "./config";

/**
 * The translated copy for the five localized pages.
 *
 * WHY THIS IS ONE FILE AND NOT FIVE PAGE TREES: the localized surface is deliberately small
 * in this first phase - the homepage and the pricing page for each language - and every one
 * of them renders through the same two components. Keeping the strings in one typed object
 * means a missing translation is a TypeScript error rather than a page that silently falls
 * back to English, and it gives `scripts/check-i18n.mts` one place to verify.
 *
 * WHAT IS NOT HERE: the deep documentation, the 40 rule pages, the guides and the writing.
 * Those stay English in this phase and are linked as English; the localized footer says so
 * rather than letting a reader discover it halfway down a page.
 *
 * THE CLAIMS ARE THE SAME CLAIMS AS THE ENGLISH SITE: 40 published checks, 12 weighted
 * dimensions, a study over 30 homepages, readiness rather than mention tracking. A
 * translation that quietly strengthens a claim would be worse than no translation.
 */

export type ProductCopy = {
  name: string;
  tagline: string;
  features: [string, string, string, string];
};

export type Dictionary = {
  meta: {
    homeTitle: string;
    homeDescription: string;
    pricingTitle: string;
    pricingDescription: string;
  };
  nav: {
    home: string;
    pricing: string;
    docs: string;
    scan: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
  };
  checks: {
    title: string;
    lead: string;
    bullets: [string, string, string];
  };
  evidence: {
    title: string;
    lead: string;
    stats: [ { value: string; label: string }, { value: string; label: string }, { value: string; label: string } ];
  };
  scope: {
    title: string;
    lead: string;
  };
  pricing: {
    title: string;
    lead: string;
    freeTitle: string;
    freeLine: string;
    buyCta: string;
    fallback: string;
    delivery: string;
    currencyNote: string;
    products: Record<"signal" | "pro", ProductCopy>;
  };
  faq: {
    title: string;
    items: [ { q: string; a: string }, { q: string; a: string }, { q: string; a: string } ];
  };
  footer: {
    docsNote: string;
    author: string;
    legal: string;
  };
};

const en: Dictionary = {
  meta: {
    homeTitle: "LLMention GEO Scanner — can AI crawl, read and cite your site?",
    homeDescription:
      "Audit whether ChatGPT, Claude and Perplexity can crawl, read and cite your pages. 40 published checks, free and no signup.",
    pricingTitle: "Pricing — LLMention GEO Scanner",
    pricingDescription:
      "The scanner is free. Paid is a one-time AI visibility measurement: questions put to the engines, answers recorded.",
  },
  nav: { home: "Home", pricing: "Pricing", docs: "Guides", scan: "Scan a site", language: "Language" },
  hero: {
    eyebrow: "Readiness audit, not mention tracking",
    title: "Is your site built to be cited by AI search?",
    lead: "LLMention reads your page the way a crawler does and scores it against 40 published checks in 12 weighted dimensions, then names what would stop an AI engine citing it.",
    primaryCta: "Scan your site free",
    secondaryCta: "See pricing",
  },
  checks: {
    title: "What the scan actually does",
    lead: "One page fetched the way a crawler receives it, scored against rules you can read.",
    bullets: [
      "40 published checks: every rule, its point value and its pass condition are documented.",
      "12 weighted dimensions, each scored separately with the evidence that produced it.",
      "Not a mention tracker: the scanner never asks an AI engine whether your brand appears.",
    ],
  },
  evidence: {
    title: "The method is measured, not asserted",
    lead: "A public study of 30 major homepages, collected through the same public API the scanner exposes.",
    stats: [
      { value: "30", label: "homepages measured" },
      { value: "0", label: "scored an A" },
      { value: "9 / 30", label: "blocked at least one AI crawler" },
    ],
  },
  scope: {
    title: "What this does not measure",
    lead: "It does not tell you how often AI mentions you. It tells you whether your pages are in a state where being cited is possible - the part you can actually fix.",
  },
  pricing: {
    title: "Free scanner. Paid measurement.",
    lead: "The scan is free and needs no account. What costs money is measurement work: questions your buyers ask, put to AI engines, with the answers recorded.",
    freeTitle: "Free, forever",
    freeLine: "Scanner, 40 rule pages, llms.txt studio, readiness badge, weekly report.",
    buyCta: "Buy the report",
    fallback: "Checkout is not live yet - order by email",
    delivery: "Intake form within one working day; report and workbook 5-10 working days after the question bank is frozen.",
    currencyNote: "Charged in USD. Taxes are handled by the merchant of record.",
    products: {
      signal: {
        name: "Signal report",
        tagline: "Confirm whether the problem exists before buying a bigger measurement.",
        features: [
          "25–30 questions built from your vocabulary",
          "3 runs per question, each in a fresh session",
          "1 AI engine of your choice",
          "Report and data workbook by email",
        ],
      },
      pro: {
        name: "Pro report",
        tagline: "A measurement you can compare over time and defend internally.",
        features: [
          "25–30 questions built from your vocabulary",
          "3 runs per question, each in a fresh session",
          "2 AI engines of your choice",
          "Report, workbook and action list, plus one retest within 90 days",
        ],
      },
    },
  },
  faq: {
    title: "Questions before buying",
    items: [
      {
        q: "How is this different from the free scan?",
        a: "The free scan reads your pages and scores whether an engine could crawl, parse and cite them. The paid report asks the engines your buyers' questions and records the answers: what was said, which names appeared, and which domains were cited.",
      },
      {
        q: "Can I get a refund?",
        a: "Yes, in full until you approve and freeze the question bank. After that the measurement runs have already been paid for and the fee is non-refundable; the page that asks for approval says so.",
      },
      {
        q: "Will I see my ranking in AI search?",
        a: "No. There is no ranking and no score out of 100 in the report. You get per-question counts (for example 2 of 3 runs mentioned you), the raw answers, and the domains that were cited instead.",
      },
    ],
  },
  footer: { docsNote: "Detailed documentation and the 40 rule pages are currently in English.", author: "Maintained by Alex, an independent developer.", legal: "Legal policies are published in English; the English version governs." },
};

const zh: Dictionary = {
  meta: {
    homeTitle: "LLMention GEO Scanner — 检查 AI 能否抓取、读取并引用你的网站",
    homeDescription:
      "按 40 项公开检查审计 ChatGPT、Claude、Perplexity 能否抓取、读取并引用你的页面。免费，无需注册。",
    pricingTitle: "定价 — LLMention GEO Scanner",
    pricingDescription:
      "扫描免费。付费的是一次性的 AI 可见度测量：把你的买家问题交给 AI 引擎，记录它的回答。",
  },
  nav: { home: "首页", pricing: "定价", docs: "指南(英文)", scan: "扫描网站", language: "语言" },
  hero: {
    eyebrow: "这是就绪度审计，不是提及监测",
    title: "你的网站，准备好被 AI 引用了吗?",
    lead: "LLMention 像爬虫一样读取你的页面，按 40 项公开检查和 12 个加权维度打分，然后逐条指出是什么在阻止 AI 引擎引用你。",
    primaryCta: "免费扫描你的网站",
    secondaryCta: "查看定价",
  },
  checks: {
    title: "扫描到底做了什么",
    lead: "抓取一次页面，按你能读到的规则逐项评分。",
    bullets: [
      "40 项公开检查：每条规则、分值和通过条件都有文档。",
      "12 个加权维度，各自给分，并附上得出该结论的证据。",
      "不是提及监测：扫描器从不询问 AI 引擎是否提到了你。",
    ],
  },
  evidence: {
    title: "方法是被测量出来的，不是被声称的",
    lead: "一份 30 个知名首页的公开研究，数据来自扫描器对外提供的同一个 API。",
    stats: [
      { value: "30", label: "个首页被测量" },
      { value: "0", label: "个拿到 A" },
      { value: "9 / 30", label: "至少屏蔽了一个 AI 爬虫" },
    ],
  },
  scope: {
    title: "它不测量什么",
    lead: "它不会告诉你 AI 多久提到你一次。它告诉你的是：你的页面是否处于「可以被引用」的状态——这是你真正能修的部分。",
  },
  pricing: {
    title: "扫描免费，测量收费",
    lead: "扫描免费、无需账号。收费的是测量工作：把你的买家会问的问题交给 AI 引擎，并记录回答。",
    freeTitle: "永久免费",
    freeLine: "扫描器、40 条规则页、llms.txt studio、评分徽章、每周报告。",
    buyCta: "购买报告",
    fallback: "结账通道尚未开通——改用邮件下单",
    delivery: "付款后 1 个工作日内收到填报表；题库冻结后 5–10 个工作日交付报告与数据表。",
    currencyNote: "以美元计价，税费由 merchant of record 处理。",
    products: {
      signal: {
        name: "Signal 报告",
        tagline: "先确认问题是否存在，再决定要不要做更大的测量。",
        features: [
          "25–30 个问题，用你自己的行业词汇构建",
          "每个问题跑 3 次，每次独立会话",
          "1 个你选择的 AI 引擎",
          "报告与数据表，邮件交付",
        ],
      },
      pro: {
        name: "Pro 报告",
        tagline: "一份可以跨时间对比、也可以拿去向内部解释的测量。",
        features: [
          "25–30 个问题，用你自己的行业词汇构建",
          "每个问题跑 3 次，每次独立会话",
          "2 个你选择的 AI 引擎",
          "报告、数据表、行动清单，以及 90 天内 1 次复测",
        ],
      },
    },
  },
  faq: {
    title: "购买前的问题",
    items: [
      {
        q: "它和免费扫描有什么区别?",
        a: "免费扫描读取你的页面，判断引擎能否抓取、解析并引用；付费报告则把你的买家问题交给引擎，记录答案：说了什么、出现了哪些名字、引用了哪些域名。",
      },
      {
        q: "可以退款吗?",
        a: "在你确认并冻结题库之前可以全额退款。之后测量已经实际发生，费用不退；要求你确认的那封邮件会写明这一点。",
      },
      {
        q: "能看到我在 AI 搜索里的排名吗?",
        a: "不能。报告里没有排名，也没有 100 分制评分。你得到的是逐题计数(例如 3 次里有 2 次提到你)、原始回答，以及被引用来代替你的域名。",
      },
    ],
  },
  footer: {
    docsNote: "40 条规则页与指南已完成中文化;更长的分析文字仍为英文。",
    author: "由独立开发者 Alex 维护。",
    legal: "法律条款以英文版为准。",
  },
};

const ja: Dictionary = {
  meta: {
    homeTitle: "LLMention GEO Scanner — AI がクロール・引用できるサイトですか",
    homeDescription:
      "ChatGPT・Claude・Perplexity がページをクロールし、読み取り、引用できるかを 40 の公開チェックで診断。無料・登録不要。",
    pricingTitle: "料金 — LLMention GEO Scanner",
    pricingDescription:
      "スキャンは無料です。有料なのは一度きりの AI 可視性測定:購入者の質問を AI エンジンに投げ、回答を記録します。",
  },
  nav: { home: "ホーム", pricing: "料金", docs: "ガイド(英語)", scan: "サイトを診断", language: "言語" },
  hero: {
    eyebrow: "メンション追跡ではなく、引用準備度の診断",
    title: "あなたのサイトは、AI 検索に引用される状態ですか?",
    lead: "LLMention はクローラーと同じ方法でページを読み、40 の公開チェックと 12 の重み付き指標で採点し、AI が引用できない原因を具体的に示します。",
    primaryCta: "無料でサイトを診断",
    secondaryCta: "料金を見る",
  },
  checks: {
    title: "スキャンが実際に行うこと",
    lead: "クローラーが受け取る形で 1 ページを取得し、公開されたルールで採点します。",
    bullets: [
      "40 の公開チェック:ルール、配点、合格条件をすべて文書化。",
      "12 の重み付き指標を個別に採点し、その根拠となる証拠を提示。",
      "メンション追跡ではありません。AI エンジンにブランドの言及を問い合わせることはありません。",
    ],
  },
  evidence: {
    title: "手法は主張ではなく、測定されています",
    lead: "著名な 30 ホームページを対象とした公開調査。データはスキャナーが公開している API から取得しました。",
    stats: [
      { value: "30", label: "測定したホームページ" },
      { value: "0", label: "A 評価" },
      { value: "9 / 30", label: "AI クローラーを 1 つ以上ブロック" },
    ],
  },
  scope: {
    title: "測れないもの",
    lead: "AI があなたを何回言及したかは分かりません。分かるのは、引用される可能性がある状態かどうか — 実際に直せる部分です。",
  },
  pricing: {
    title: "スキャンは無料。測定は有料。",
    lead: "スキャンは無料でアカウントも不要です。有料なのは測定作業:購入者が尋ねる質問を AI エンジンに投げ、回答を記録します。",
    freeTitle: "永久無料",
    freeLine: "スキャナー、40 のルールページ、llms.txt studio、レディネスバッジ、週次レポート。",
    buyCta: "レポートを購入",
    fallback: "決済は未開通です — メールで注文",
    delivery: "お支払い後 1 営業日以内にヒアリングシートをお送りし、質問バンク確定後 5〜10 営業日でレポートとデータ表をお届けします。",
    currencyNote: "米ドルでの請求です。税金は merchant of record が処理します。",
    products: {
      signal: {
        name: "Signal レポート",
        tagline: "大きな測定の前に、問題が実在するかを確認する。",
        features: [
          "自社の語彙から作る 25〜30 の質問",
          "各質問を 3 回、毎回新しいセッションで実行",
          "選択した AI エンジン 1 つ",
          "レポートとデータ表をメールで納品",
        ],
      },
      pro: {
        name: "Pro レポート",
        tagline: "時系列で比較でき、社内説明にも使える測定。",
        features: [
          "自社の語彙から作る 25〜30 の質問",
          "各質問を 3 回、毎回新しいセッションで実行",
          "選択した AI エンジン 2 つ",
          "レポート、データ表、アクションリスト、90 日以内の再測定 1 回",
        ],
      },
    },
  },
  faq: {
    title: "購入前の質問",
    items: [
      {
        q: "無料スキャンとの違いは何ですか?",
        a: "無料スキャンはページを読み、エンジンがクロール・解析・引用できるかを採点します。有料レポートは購入者の質問をエンジンに投げ、回答を記録します:何が言われ、どの名前が出て、どのドメインが引用されたか。",
      },
      {
        q: "返金はできますか?",
        a: "質問バンクを承認・確定するまでは全額返金できます。確定後は測定が実行済みのため返金できません。承認を求めるメールにその旨を明記しています。",
      },
      {
        q: "AI 検索での順位は分かりますか?",
        a: "いいえ。レポートに順位や 100 点満点のスコアはありません。分かるのは質問ごとの回数(例:3 回中 2 回で言及)、生の回答、代わりに引用されたドメインです。",
      },
    ],
  },
  footer: {
    docsNote: "40 のルールページとガイドは日本語化済みです。長い分析文は英語のままです。",
    author: "独立開発者 Alex が運営しています。",
    legal: "法的文書は英語で公開され、英語版が優先します。",
  },
};

const es: Dictionary = {
  meta: {
    homeTitle: "LLMention GEO Scanner — ¿puede la IA rastrear, leer y citar tu web?",
    homeDescription:
      "Audita si ChatGPT, Claude y Perplexity pueden rastrear, leer y citar tus páginas. 40 comprobaciones publicadas, gratis y sin registro.",
    pricingTitle: "Precios — LLMention GEO Scanner",
    pricingDescription:
      "El escáner es gratis. Lo de pago es una medición única de visibilidad en IA: preguntas a los motores y respuestas registradas.",
  },
  nav: { home: "Inicio", pricing: "Precios", docs: "Guías (inglés)", scan: "Escanear web", language: "Idioma" },
  hero: {
    eyebrow: "Auditoría de preparación, no seguimiento de menciones",
    title: "¿Está tu web preparada para que la IA la cite?",
    lead: "LLMention lee tu página como lo haría un rastreador y la puntúa con 40 comprobaciones publicadas en 12 dimensiones ponderadas; después señala qué impide que un motor de IA te cite.",
    primaryCta: "Escanea tu web gratis",
    secondaryCta: "Ver precios",
  },
  checks: {
    title: "Qué hace realmente el escaneo",
    lead: "Una página obtenida tal como la recibe un rastreador y puntuada con reglas que puedes leer.",
    bullets: [
      "40 comprobaciones publicadas: cada regla, sus puntos y su condición de aprobado están documentados.",
      "12 dimensiones ponderadas, puntuadas por separado con la evidencia que las respalda.",
      "No es un monitor de menciones: el escáner nunca pregunta a un motor si apareces.",
    ],
  },
  evidence: {
    title: "El método se mide, no se afirma",
    lead: "Un estudio público de 30 páginas de inicio, recogido con la misma API pública que ofrece el escáner.",
    stats: [
      { value: "30", label: "páginas medidas" },
      { value: "0", label: "obtuvieron una A" },
      { value: "9 / 30", label: "bloquean al menos un rastreador de IA" },
    ],
  },
  scope: {
    title: "Qué no mide",
    lead: "No te dice con qué frecuencia te menciona la IA. Te dice si tus páginas están en un estado en el que ser citado es posible: la parte que sí puedes arreglar.",
  },
  pricing: {
    title: "Escáner gratis. Medición de pago.",
    lead: "El escaneo es gratis y no requiere cuenta. Lo que se paga es el trabajo de medición: las preguntas de tus compradores planteadas a los motores, con las respuestas registradas.",
    freeTitle: "Gratis para siempre",
    freeLine: "Escáner, 40 páginas de reglas, estudio llms.txt, insignia de preparación y informe semanal.",
    buyCta: "Comprar el informe",
    fallback: "El pago aún no está activo: pide por correo",
    delivery: "Formulario de datos en un día laborable; informe y libro de datos 5-10 días laborables después de congelar el banco de preguntas.",
    currencyNote: "Se cobra en USD. Los impuestos los gestiona el merchant of record.",
    products: {
      signal: {
        name: "Informe Signal",
        tagline: "Confirma si el problema existe antes de comprar una medición mayor.",
        features: [
          "25–30 preguntas creadas con tu vocabulario",
          "3 ejecuciones por pregunta, cada una en sesión nueva",
          "1 motor de IA a tu elección",
          "Informe y libro de datos por correo",
        ],
      },
      pro: {
        name: "Informe Pro",
        tagline: "Una medición comparable en el tiempo y defendible internamente.",
        features: [
          "25–30 preguntas creadas con tu vocabulario",
          "3 ejecuciones por pregunta, cada una en sesión nueva",
          "2 motores de IA a tu elección",
          "Informe, libro de datos y plan de acción, más una repetición en 90 días",
        ],
      },
    },
  },
  faq: {
    title: "Preguntas antes de comprar",
    items: [
      {
        q: "¿En qué se diferencia del escaneo gratuito?",
        a: "El escaneo gratuito lee tus páginas y puntúa si un motor podría rastrearlas, analizarlas y citarlas. El informe de pago plantea a los motores las preguntas de tus compradores y registra las respuestas: qué se dijo, qué nombres aparecieron y qué dominios se citaron.",
      },
      {
        q: "¿Puedo obtener un reembolso?",
        a: "Sí, íntegro hasta que apruebes y congeles el banco de preguntas. Después las ejecuciones ya se han pagado y la tarifa no es reembolsable; el correo que pide la aprobación lo indica.",
      },
      {
        q: "¿Veré mi posicionamiento en la búsqueda con IA?",
        a: "No. No hay ranking ni puntuación sobre 100. Obtienes recuentos por pregunta (por ejemplo, 2 de 3 ejecuciones te mencionaron), las respuestas originales y los dominios citados en tu lugar.",
      },
    ],
  },
  footer: {
    docsNote: "La documentación detallada y las 40 páginas de reglas están actualmente en inglés.",
    author: "Mantenido por Alex, desarrollador independiente.",
    legal: "Las políticas legales se publican en inglés; prevalece la versión inglesa.",
  },
};

const de: Dictionary = {
  meta: {
    homeTitle: "LLMention GEO Scanner — kann KI Ihre Website crawlen und zitieren?",
    homeDescription:
      "Prüfen Sie, ob ChatGPT, Claude und Perplexity Ihre Seiten crawlen, lesen und zitieren können. 40 veröffentlichte Checks, kostenlos und ohne Anmeldung.",
    pricingTitle: "Preise — LLMention GEO Scanner",
    pricingDescription:
      "Der Scanner ist kostenlos. Bezahlt wird eine einmalige KI-Sichtbarkeitsmessung: Fragen an die Engines, Antworten dokumentiert.",
  },
  nav: { home: "Start", pricing: "Preise", docs: "Leitfäden (Englisch)", scan: "Website prüfen", language: "Sprache" },
  hero: {
    eyebrow: "Bereitschaftsprüfung, kein Mention-Tracking",
    title: "Ist Ihre Website bereit, von KI zitiert zu werden?",
    lead: "LLMention liest Ihre Seite wie ein Crawler und bewertet sie mit 40 veröffentlichten Checks in 12 gewichteten Dimensionen. Danach zeigt sie, was eine Zitierung durch eine KI verhindert.",
    primaryCta: "Website kostenlos prüfen",
    secondaryCta: "Preise ansehen",
  },
  checks: {
    title: "Was der Scan tatsächlich tut",
    lead: "Eine Seite wird so abgerufen, wie ein Crawler sie erhält, und nach Regeln bewertet, die Sie lesen können.",
    bullets: [
      "40 veröffentlichte Checks: jede Regel, ihre Punktzahl und ihre Bestehensbedingung sind dokumentiert.",
      "12 gewichtete Dimensionen, einzeln bewertet und mit den Belegen, die zu der Bewertung geführt haben.",
      "Kein Mention-Tracker: Der Scanner fragt keine KI, ob Ihre Marke vorkommt.",
    ],
  },
  evidence: {
    title: "Die Methode wird gemessen, nicht behauptet",
    lead: "Eine öffentliche Studie über 30 große Startseiten, erhoben über dieselbe öffentliche API, die der Scanner anbietet.",
    stats: [
      { value: "30", label: "Startseiten gemessen" },
      { value: "0", label: "erreichten ein A" },
      { value: "9 / 30", label: "blockieren mindestens einen KI-Crawler" },
    ],
  },
  scope: {
    title: "Was hier nicht gemessen wird",
    lead: "Es sagt Ihnen nicht, wie oft KI Sie erwähnt. Es sagt Ihnen, ob Ihre Seiten in einem Zustand sind, in dem eine Zitierung möglich ist - der Teil, den Sie tatsächlich beheben können.",
  },
  pricing: {
    title: "Scanner kostenlos. Messung bezahlt.",
    lead: "Der Scan ist kostenlos und braucht kein Konto. Bezahlt wird die Messarbeit: die Fragen Ihrer Käufer an die KI-Engines, mit dokumentierten Antworten.",
    freeTitle: "Dauerhaft kostenlos",
    freeLine: "Scanner, 40 Regelseiten, llms.txt-Studio, Bereitschafts-Badge, Wochenbericht.",
    buyCta: "Bericht kaufen",
    fallback: "Checkout noch nicht aktiv - per E-Mail bestellen",
    delivery: "Fragebogen innerhalb eines Werktags; Bericht und Datenmappe 5-10 Werktage nach Einfrieren des Fragenkatalogs.",
    currencyNote: "Abrechnung in USD. Steuern übernimmt der Merchant of Record.",
    products: {
      signal: {
        name: "Signal-Bericht",
        tagline: "Erst prüfen, ob das Problem existiert, bevor eine größere Messung gekauft wird.",
        features: [
          "25–30 Fragen aus Ihrer eigenen Sprache",
          "3 Durchläufe pro Frage, jeweils in neuer Sitzung",
          "1 KI-Engine Ihrer Wahl",
          "Bericht und Datenmappe per E-Mail",
        ],
      },
      pro: {
        name: "Pro-Bericht",
        tagline: "Eine Messung, die über die Zeit vergleichbar und intern vertretbar ist.",
        features: [
          "25–30 Fragen aus Ihrer eigenen Sprache",
          "3 Durchläufe pro Frage, jeweils in neuer Sitzung",
          "2 KI-Engines Ihrer Wahl",
          "Bericht, Datenmappe und Maßnahmenliste, plus eine Wiederholung innerhalb von 90 Tagen",
        ],
      },
    },
  },
  faq: {
    title: "Fragen vor dem Kauf",
    items: [
      {
        q: "Wie unterscheidet sich das vom kostenlosen Scan?",
        a: "Der kostenlose Scan liest Ihre Seiten und bewertet, ob eine Engine sie crawlen, parsen und zitieren könnte. Der bezahlte Bericht stellt den Engines die Fragen Ihrer Käufer und dokumentiert die Antworten: was gesagt wurde, welche Namen vorkamen und welche Domains zitiert wurden.",
      },
      {
        q: "Bekomme ich eine Rückerstattung?",
        a: "Ja, vollständig bis Sie den Fragenkatalog freigeben und einfrieren. Danach sind die Durchläufe bereits bezahlt und die Gebühr wird nicht erstattet; die E-Mail zur Freigabe sagt das ausdrücklich.",
      },
      {
        q: "Sehe ich mein Ranking in der KI-Suche?",
        a: "Nein. Es gibt kein Ranking und keine Punktzahl von 100. Sie erhalten Zählungen pro Frage (zum Beispiel 2 von 3 Durchläufen erwähnten Sie), die Rohantworten und die stattdessen zitierten Domains.",
      },
    ],
  },
  footer: {
    docsNote: "Die ausführliche Dokumentation und die 40 Regelseiten sind derzeit auf Englisch.",
    author: "Betrieben von Alex, einem unabhängigen Entwickler.",
    legal: "Rechtliche Richtlinien werden auf Englisch veröffentlicht; die englische Fassung ist maßgeblich.",
  },
};

const fr: Dictionary = {
  meta: {
    homeTitle: "LLMention GEO Scanner — l'IA peut-elle explorer et citer votre site ?",
    homeDescription:
      "Vérifiez si ChatGPT, Claude et Perplexity peuvent explorer, lire et citer vos pages. 40 contrôles publiés, gratuit et sans inscription.",
    pricingTitle: "Tarifs — LLMention GEO Scanner",
    pricingDescription:
      "Le scanner est gratuit. Le payant est une mesure unique de visibilité IA : questions posées aux moteurs, réponses consignées.",
  },
  nav: { home: "Accueil", pricing: "Tarifs", docs: "Guides (anglais)", scan: "Analyser un site", language: "Langue" },
  hero: {
    eyebrow: "Audit de préparation, pas de suivi des mentions",
    title: "Votre site est-il prêt à être cité par l'IA ?",
    lead: "LLMention lit votre page comme le ferait un robot d'exploration et la note selon 40 contrôles publiés en 12 dimensions pondérées, puis indique ce qui empêche un moteur d'IA de vous citer.",
    primaryCta: "Analyser votre site gratuitement",
    secondaryCta: "Voir les tarifs",
  },
  checks: {
    title: "Ce que fait réellement l'analyse",
    lead: "Une page récupérée telle qu'un robot la reçoit, notée selon des règles que vous pouvez lire.",
    bullets: [
      "40 contrôles publiés : chaque règle, ses points et sa condition de réussite sont documentés.",
      "12 dimensions pondérées, notées séparément avec les preuves qui les justifient.",
      "Ce n'est pas un outil de suivi des mentions : le scanner ne demande jamais à une IA si votre marque apparaît.",
    ],
  },
  evidence: {
    title: "La méthode est mesurée, pas affirmée",
    lead: "Une étude publique de 30 pages d'accueil majeures, collectée via la même API publique que celle du scanner.",
    stats: [
      { value: "30", label: "pages d'accueil mesurées" },
      { value: "0", label: "ont obtenu un A" },
      { value: "9 / 30", label: "bloquent au moins un robot d'IA" },
    ],
  },
  scope: {
    title: "Ce que cela ne mesure pas",
    lead: "Cela ne vous dit pas à quelle fréquence l'IA vous mentionne. Cela vous dit si vos pages sont dans un état où une citation est possible — la partie que vous pouvez réellement corriger.",
  },
  pricing: {
    title: "Scanner gratuit. Mesure payante.",
    lead: "L'analyse est gratuite et sans compte. Ce qui se paie, c'est le travail de mesure : les questions de vos acheteurs posées aux moteurs, avec les réponses consignées.",
    freeTitle: "Gratuit pour toujours",
    freeLine: "Scanner, 40 pages de règles, studio llms.txt, badge de préparation, rapport hebdomadaire.",
    buyCta: "Acheter le rapport",
    fallback: "Le paiement n'est pas encore actif — commandez par e-mail",
    delivery: "Formulaire sous un jour ouvré ; rapport et classeur de données 5 à 10 jours ouvrés après gel de la banque de questions.",
    currencyNote: "Facturé en USD. Les taxes sont gérées par le merchant of record.",
    products: {
      signal: {
        name: "Rapport Signal",
        tagline: "Confirmer que le problème existe avant d'acheter une mesure plus large.",
        features: [
          "25–30 questions construites avec votre vocabulaire",
          "3 exécutions par question, chacune en session neuve",
          "1 moteur d'IA de votre choix",
          "Rapport et classeur de données par e-mail",
        ],
      },
      pro: {
        name: "Rapport Pro",
        tagline: "Une mesure comparable dans le temps et défendable en interne.",
        features: [
          "25–30 questions construites avec votre vocabulaire",
          "3 exécutions par question, chacune en session neuve",
          "2 moteurs d'IA de votre choix",
          "Rapport, classeur et plan d'action, plus une nouvelle mesure sous 90 jours",
        ],
      },
    },
  },
  faq: {
    title: "Questions avant achat",
    items: [
      {
        q: "Quelle différence avec l'analyse gratuite ?",
        a: "L'analyse gratuite lit vos pages et note si un moteur pourrait les explorer, les analyser et les citer. Le rapport payant pose aux moteurs les questions de vos acheteurs et consigne les réponses : ce qui a été dit, quels noms sont apparus et quels domaines ont été cités.",
      },
      {
        q: "Puis-je être remboursé ?",
        a: "Oui, intégralement jusqu'à ce que vous approuviez et geliez la banque de questions. Ensuite, les exécutions sont déjà payées et les frais ne sont pas remboursables ; l'e-mail de validation le précise.",
      },
      {
        q: "Verrai-je mon classement dans la recherche IA ?",
        a: "Non. Il n'y a ni classement ni note sur 100. Vous obtenez des comptages par question (par exemple 2 exécutions sur 3 vous ont mentionné), les réponses brutes et les domaines cités à votre place.",
      },
    ],
  },
  footer: {
    docsNote: "La documentation détaillée et les 40 pages de règles sont actuellement en anglais.",
    author: "Maintenu par Alex, développeur indépendant.",
    legal: "Les politiques légales sont publiées en anglais ; la version anglaise fait foi.",
  },
};

export const DICTIONARIES: Record<"zh" | "ja" | "es" | "de" | "fr", Dictionary> = {
  zh,
  ja,
  es,
  de,
  fr,
};

export type LocalizedLocale = keyof typeof DICTIONARIES;

export function getDictionary(locale: LocalizedLocale): Dictionary {
  return DICTIONARIES[locale];
}

export { en as ENGLISH_DICTIONARY };
