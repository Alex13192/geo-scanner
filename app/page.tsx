"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Language = "en" | "zh" | "es" | "de" | "fr" | "ja";

const translations: Record<Language, {
  tag: string;
  title1: string;
  title2: string;
  subtitle: string;
  placeholder: string;
  button: string;
  crawlersTitle: string;
  crawlersDesc: string;
  llmsTitle: string;
  llmsDesc: string;
  badgeTitle: string;
  badgeDesc: string;
}> = {
  en: {
    tag: "Generative Engine Optimization",
    title1: "Is Your Site Optimized for",
    title2: "AI Search Engines?",
    subtitle: "Check if ChatGPT, Perplexity, and Claude can crawl your website. Audit your AI visibility and auto-generate /llms.txt files instantly.",
    placeholder: "Enter domain or URL (e.g., adidas.com)",
    button: "Scan Website 🚀",
    crawlersTitle: "AI Crawler Passability",
    crawlersDesc: "Scan robots.txt and WAF rules to ensure GPTBot, PerplexityBot, and ClaudeBot are not blocked.",
    llmsTitle: "/llms.txt Generation",
    llmsDesc: "Auto-generate standardized markdown context files so LLMs can digest your domain's content cleanly.",
    badgeTitle: "Dynamic Score Badge",
    badgeDesc: "Embed real-time GEO readiness badges directly in your GitHub README or site footer.",
  },
  zh: {
    tag: "生成式引擎优化 (GEO)",
    title1: "您的网站是否已针对",
    title2: "AI 搜索引擎进行优化？",
    subtitle: "检查 ChatGPT、Perplexity 和 Claude 是否能够抓取您的网站。审计您的 AI 能见度并即时生成 /llms.txt 文件。",
    placeholder: "输入域名或 URL (例如 adidas.com)",
    button: "矢量扫描 🚀",
    crawlersTitle: "AI 爬虫可达性",
    crawlersDesc: "扫描 robots.txt 与 WAF 防火墙规则，确保 GPTBot、PerplexityBot 等未被封禁。",
    llmsTitle: "/llms.txt 自动生成",
    llmsDesc: "自动生成标准 Markdown 上下文文件，让大语言模型更清晰地理解您的网站内容。",
    badgeTitle: "动态评分徽章",
    badgeDesc: "生成实时 GEO 准备度徽章，可直接嵌入 GitHub README 或网站页脚。",
  },
  es: {
    tag: "Optimización para Motores Generativos",
    title1: "¿Está su sitio optimizado para",
    title2: "Motores de Búsqueda de IA?",
    subtitle: "Compruebe si ChatGPT, Perplexity y Claude pueden rastrear su sitio web. Audite su visibilidad de IA y genere archivos /llms.txt al instante.",
    placeholder: "Ingrese dominio o URL (ej. adidas.com)",
    button: "Escanear Sitio 🚀",
    crawlersTitle: "Accesibilidad de Rastreadores IA",
    crawlersDesc: "Escanee robots.txt y reglas WAF para garantizar que GPTBot y PerplexityBot no estén bloqueados.",
    llmsTitle: "Generación de /llms.txt",
    llmsDesc: "Genere automáticamente archivos Markdown estandarizados para que los LLM digieran su contenido.",
    badgeTitle: "Insignia de Puntuación Dinámica",
    badgeDesc: "Incruste insignias de estado GEO en tiempo real directamente en su GitHub o pie de página.",
  },
  de: {
    tag: "Generative Engine Optimization",
    title1: "Ist Ihre Website optimiert für",
    title2: "KI-Suchmaschinen?",
    subtitle: "Überprüfen Sie, ob ChatGPT, Perplexity und Claude Ihre Website crawlen können. Auditieren Sie Ihre KI-Sichtbarkeit und erstellen Sie /llms.txt.",
    placeholder: "Domain oder URL eingeben (z. B. adidas.com)",
    button: "Website Scannen 🚀",
    crawlersTitle: "KI-Crawler-Erreichbarkeit",
    crawlersDesc: "Überprüfen Sie robots.txt und WAF-Regeln, um sicherzustellen, dass GPTBot nicht blockiert ist.",
    llmsTitle: "/llms.txt Erstellung",
    llmsDesc: "Erstellen Sie automatisch standardisierte Markdown-Dateien für eine saubere LLM-Erfassung.",
    badgeTitle: "Dynamisches Score-Badge",
    badgeDesc: "Binden Sie Echtzeit-GEO-Badges direkt in Ihre GitHub README oder Fußzeile ein.",
  },
  fr: {
    tag: "Optimisation pour Moteurs Génératifs",
    title1: "Votre site est-il optimisé pour",
    title2: "les Moteurs de Recherche IA ?",
    subtitle: "Vérifiez si ChatGPT, Perplexity et Claude peuvent explorer votre site. Auditez votre visibilité IA et générez des fichiers /llms.txt.",
    placeholder: "Entrez le domaine (ex. adidas.com)",
    button: "Analyser le Site 🚀",
    crawlersTitle: "Accessibilité des Robots IA",
    crawlersDesc: "Analysez robots.txt et les règles WAF pour vous assurer que GPTBot et PerplexityBot ne sont pas bloqués.",
    llmsTitle: "Génération de /llms.txt",
    llmsDesc: "Générez automatiquement des fichiers Markdown structurés pour permettre aux LLM de comprendre votre contenu.",
    badgeTitle: "Badge de Score Dynamique",
    badgeDesc: "Intégrez des badges d'état GEO en temps réel directement dans votre README GitHub ou votre pied de page.",
  },
  ja: {
    tag: "生成AIエンジン最適化 (GEO)",
    title1: "あなたのウェブサイトは",
    title2: "AI検索エンジンに最適化されていますか？",
    subtitle: "ChatGPT、Perplexity、Claudeがサイトをクロールできるか確認。AIの可視性を監査し、/llms.txtを即座に生成します。",
    placeholder: "ドメインまたはURLを入力 (例: adidas.com)",
    button: "サイトをスキャン 🚀",
    crawlersTitle: "AIクローラーのアクセシビリティ",
    crawlersDesc: "robots.txtとWAFルールをスキャンし、GPTBotやPerplexityBotがブロックされていないか確認します。",
    llmsTitle: "/llms.txtの自動生成",
    llmsDesc: "LLMがコンテンツを正確に理解できるよう、標準化されたMarkdownファイルを自動生成します。",
    badgeTitle: "動的スコアバッジ",
    badgeDesc: "リアルタイムのGEOスコアバッジをGitHubのREADMEやサイトフッターに直接埋め込めます。",
  },
};

export default function HomePage() {
  const [lang, setLang] = useState<Language>("en");
  const [url, setUrl] = useState("");
  const router = useRouter();

  const t = translations[lang];

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let cleanDomain = url.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)/, "").replace(/\/.*$/, "");

    router.push(`/report?domain=${encodeURIComponent(cleanDomain)}&lang=${lang}`);
  };

  /**
   * Visible FAQ content.
   *
   * The SAME array also renders the FAQPage structured data at the bottom of
   * this page. That is deliberate: Google only accepts FAQ markup for questions
   * and answers that are actually visible to users, so the two must not drift.
   *
   * Written answer-first and factually. One of these answers deliberately tells
   * the reader that llms.txt is NOT a ranking factor - overselling it would be
   * both dishonest and bad GEO, since AI engines favour accurate sources.
   */
  const faqItems = [
    {
      q: "What is Generative Engine Optimization (GEO)?",
      a: "GEO is the practice of making a website discoverable, parseable and citable by AI search engines such as ChatGPT, Perplexity, Claude and Google AI Overviews. Instead of ranking a blue link, the goal is to be quoted inside a generated answer.",
    },
    {
      q: "How do I check whether AI crawlers can read my website?",
      a: "Check your robots.txt for rules that block AI crawler user-agents such as GPTBot, ClaudeBot, PerplexityBot and Bytespider, then confirm your firewall does not return 403 to those agents. LLMention scans both automatically and reports exactly what is blocked.",
    },
    {
      q: "Do I need an llms.txt file?",
      a: "Not necessarily. llms.txt is an emerging convention rather than a standard: Google does not use it in Search, and AI crawlers request it inconsistently. It is cheap to add and does help documentation sites and coding agents, but treat it as one small signal, not a ranking factor.",
    },
    {
      q: "Which AI crawlers should I allow in robots.txt?",
      a: "Allow the crawlers behind the engines you want citations from: GPTBot and OAI-SearchBot for OpenAI, ClaudeBot and Claude-SearchBot for Anthropic, PerplexityBot for Perplexity, Google-Extended for Google, and Bingbot, whose index also feeds ChatGPT search. Blocking a crawler removes you from that engine's answers entirely.",
    },
    {
      q: "Is GEO replacing SEO?",
      a: "No. GEO and SEO share most of their foundations: crawlable pages, clear structure, accurate facts and genuine authority. GEO adds an emphasis on answer-shaped content, entity markup such as Schema.org JSON-LD, and machine-readable context files. A site that already does SEO well starts GEO from a strong position.",
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
          <div className="relative inline-block">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-gray-900 border border-gray-800 text-xs text-gray-200 font-medium px-3.5 py-1.5 rounded-full outline-none focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="en">🇬🇧 English</option>
              <option value="zh">🇨🇳 简体中文</option>
              <option value="es">🇪🇸 Español</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="ja">🇯🇵 日本語</option>
            </select>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          {t.tag}
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          {t.title1} <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            {t.title2}
          </span>
        </h1>

        <p className="text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          {t.subtitle}
        </p>

        {/* 搜索框 */}
        <form onSubmit={handleScan} className="w-full max-w-2xl pt-2">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-2xl focus-within:border-blue-500/60 transition-all">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholder}
              required
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm px-6 py-3 rounded-xl transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.button}</span>
            </button>
          </div>
        </form>

        {/* 三卡片核心功能 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full pt-6 text-left">
          <div className="bg-gray-900/50 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">🤖</div>
            <h3 className="text-sm font-bold text-gray-200">{t.crawlersTitle}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{t.crawlersDesc}</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">📄</div>
            <h3 className="text-sm font-bold text-gray-200">{t.llmsTitle}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{t.llmsDesc}</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">🏷️</div>
            <h3 className="text-sm font-bold text-gray-200">{t.badgeTitle}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{t.badgeDesc}</p>
          </div>
        </div>

        {/* 新增模块 1：Supported AI Crawlers */}
        <section className="w-full pt-10 text-left space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
            Supported AI Search & Crawler Agents
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

        {/* 新增模块 2：SEO vs GEO 对比 */}
        <section className="w-full pt-8 text-left space-y-4">
          <div className="bg-gradient-to-r from-blue-950/20 via-gray-900/60 to-purple-950/20 border border-gray-800 p-8 rounded-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Why GEO Matters in 2026</h2>
              <p className="text-xs text-gray-400">Generative Engine Optimization shifts focus from keywords to AI entity citation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#070A10]/60 p-5 rounded-xl border border-gray-800/60 space-y-2">
                <span className="text-xs font-mono font-bold text-red-400 uppercase">Traditional SEO</span>
                <h3 className="text-sm font-bold text-gray-200">Keyword Ranking & Backlinks</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Optimizes for SERP blue links, click-through rates, and Google PageRank algorithms.</p>
              </div>
              <div className="bg-[#070A10]/60 p-5 rounded-xl border border-blue-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase">Generative GEO</span>
                <h3 className="text-sm font-bold text-gray-200">AI Citation & Share of Voice</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Optimizes for direct LLM synthesis, structured JSON-LD context, and /llms.txt file accessibility.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — content here and the FAQPage markup below come from one source */}
        <section id="faq" className="w-full pt-8 text-left space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-gray-400">Short, direct answers about GEO and AI crawler access.</p>
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              })),
            }),
          }}
        />

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800/60 py-6 text-center text-xs text-gray-500 space-y-2">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a href="/methodology/" className="hover:text-gray-300 transition-colors">
            Methodology
          </a>
          <a href="/docs/" className="hover:text-gray-300 transition-colors">
            Guides
          </a>
          <a href="/pricing/" className="hover:text-gray-300 transition-colors">
            Pricing
          </a>
          <a href="/llms.txt" className="hover:text-gray-300 transition-colors">
            llms.txt
          </a>
        </nav>
        <div>© LLMention. Brand Generative Engine Optimization Intelligence.</div>
      </footer>
    </div>
  );
}