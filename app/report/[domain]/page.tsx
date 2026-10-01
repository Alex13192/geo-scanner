'use client';

import { useEffect, useState, use } from 'react';
import { getDictionary, Language } from '@/lib/i18n';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Link from 'next/link';

interface ScanResult {
  domain: string;
  overallScore: number;
  breakdown: {
    crawlerPassability: { score: number; blockedBots: string[] };
    llmsCompliance: { score: number; hasLlmsTxt: boolean };
    schemaMetadata: { score: number; hasJsonLd: boolean };
    aiExtractability: { score: number; textToCodeRatio: string };
  };
}

export default function ReportPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const domain = decodeURIComponent(resolvedParams.domain);

  const [lang, setLang] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const dict = getDictionary(lang);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: domain }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult(data);
        }
      } catch {
        console.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [domain]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const generatedLlmsTxt = result
    ? `# ${result.domain}\n\n> Automated LLM context description for ${result.domain}.\n\n## Core System Overview\n- Primary Business: AI Search and Engine Optimization Node\n- Primary Documentation: https://${result.domain}/docs\n\n## Key Resources\n- API Specification: https://${result.domain}/api\n- Contact & Support: support@${result.domain}`
    : '';

  const badgeMarkdown = result
    ? `![GEO Score](https://geo-scanner.ccie13192.com/api/badge?score=${result.overallScore})`
    : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReportLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-6 md:p-12">
      {/* 顶部导航 */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4 border-b border-slate-800 mb-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-400">
          🌐 GEO Scanner
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-slate-400 text-sm hover:text-slate-200">
            {dict.nav.scanner}
          </Link>
          <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
        </nav>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center my-24 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Generating live GEO Audit Report for <span className="text-white font-mono">{domain}</span>...</p>
        </div>
      ) : result ? (
        <section className="w-full max-w-5xl bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-700/60 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 font-mono">Target: {result.domain}</span>
                <button
                  onClick={copyReportLink}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded-md transition"
                >
                  {linkCopied ? 'Link Copied!' : '🔗 Share Report'}
                </button>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">{dict.score.title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-extrabold px-5 py-2.5 rounded-2xl border ${getScoreBadgeColor(result.overallScore)}`}>
                {result.overallScore} <span className="text-lg font-normal text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          {/* 4 维评估 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 1. AI 爬虫通行度 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-200">1. Crawler Passability</h3>
                <span className="text-sm font-bold text-blue-400">{result.breakdown.crawlerPassability.score}/100</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Checks robots.txt rules for GPTBot, ClaudeBot, PerplexityBot, and CCBot.</p>
              {result.breakdown.crawlerPassability.blockedBots.length > 0 ? (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  ❌ Blocked AI crawlers detected: {result.breakdown.crawlerPassability.blockedBots.join(', ')}
                </div>
              ) : (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                  ✅ All major AI search crawlers are allowed.
                </div>
              )}
            </div>

            {/* 2. /llms.txt 规范度 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-200">2. /llms.txt Compliance</h3>
                <span className="text-sm font-bold text-blue-400">{result.breakdown.llmsCompliance.score}/100</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Verifies presence of standard /llms.txt content structure for AI context indexing.</p>
              {result.breakdown.llmsCompliance.hasLlmsTxt ? (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                  ✅ Standard /llms.txt specification file detected.
                </div>
              ) : (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                  ⚠️ No /llms.txt found. Consider generating one below for optimal LLM context parsing.
                </div>
              )}
            </div>

            {/* 3. Schema & 元数据 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-200">3. Schema & Metadata</h3>
                <span className="text-sm font-bold text-blue-400">{result.breakdown.schemaMetadata.score}/100</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Evaluates JSON-LD structured data tags for rich answer snippets.</p>
              {result.breakdown.schemaMetadata.hasJsonLd ? (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                  ✅ JSON-LD structured data tags detected on target URL.
                </div>
              ) : (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                  ⚠️ Missing JSON-LD structured data tags.
                </div>
              )}
            </div>

            {/* 4. AI 内容可提取度 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-200">4. AI Content Extractability</h3>
                <span className="text-sm font-bold text-blue-400">{result.breakdown.aiExtractability.score}/100</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Measures clean readable text-to-code ratio and DOM depth.</p>
              <div className="text-xs text-slate-300 bg-slate-800 p-2.5 rounded-lg flex justify-between">
                <span>Text-to-Code Density:</span>
                <span className="font-mono font-bold text-blue-400">{result.breakdown.aiExtractability.textToCodeRatio}</span>
              </div>
            </div>
          </div>

          {/* 工具箱 */}
          <div className="border-t border-slate-700/60 pt-8 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🛠️ Actionable Remediation & Growth Suite
            </h3>

            {/* /llms.txt */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-200">Recommended /llms.txt Specification</span>
                <button
                  onClick={() => copyToClipboard(generatedLlmsTxt)}
                  className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg transition"
                >
                  {copied ? 'Copied!' : 'Copy /llms.txt'}
                </button>
              </div>
              <pre className="text-xs font-mono bg-slate-950 p-4 rounded-lg border border-slate-800/80 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {generatedLlmsTxt}
              </pre>
            </div>

            {/* Dynamic Badge */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-200">Embed Dynamic GEO Badge in README / Footer</span>
                <button
                  onClick={() => copyToClipboard(badgeMarkdown)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition"
                >
                  Copy Markdown
                </button>
              </div>
              <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <img
                  src={`/api/badge?score=${result.overallScore}`}
                  alt="GEO Score Badge"
                  className="h-5"
                />
                <code className="text-xs font-mono text-slate-400 flex-1 truncate">
                  {badgeMarkdown}
                </code>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <p className="text-rose-400 my-12">Failed to load audit report for this domain.</p>
      )}
    </main>
  );
}