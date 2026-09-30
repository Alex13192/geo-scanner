'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2, XCircle, ArrowRight, Copy, Check, Sparkles } from 'lucide-react';

interface ScanResult {
  url: string;
  score: number;
  details: {
    robotsTxtBlocked: boolean;
    hasLlmsTxt: boolean;
    hasDescription: boolean;
    headingsCount: number;
  };
  siteInfo: { title: string; description: string };
  generatedLlmsTxt: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.generatedLlmsTxt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      {/* Header Zone */}
      <div className="max-w-3xl w-full text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 mb-2">
          <Sparkles className="w-4 h-4" /> Next-Gen GEO Readiness Tool
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Is Your Site Ready for AI Search?
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          Instantly audit ChatGPT & Perplexity access, detect blocks, and generate your <code className="text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded">llms.txt</code> in seconds.
        </p>
      </div>

      {/* Hero Input Box (TinyPNG Style) */}
      <div className="max-w-2xl w-full mb-12">
        <form onSubmit={handleScan} className="relative flex items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="enter website URL (e.g., mycompany.com)"
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-6 pr-36 text-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xl"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="absolute right-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-semibold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Scan GEO <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
      </div>

      {/* Results Dashboard */}
      {result && (
        <div className="max-w-3xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Score Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-sm font-medium text-slate-400">Target URL</span>
              <h3 className="text-xl font-bold text-slate-100 truncate max-w-md">{result.url}</h3>
              <p className="text-slate-400 text-sm line-clamp-1">{result.siteInfo.title}</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">GEO Score</div>
                <div className="text-xs text-slate-500">{result.score >= 80 ? 'Excellent' : 'Needs Optimization'}</div>
              </div>
              <div
                className={`text-4xl font-extrabold ${
                  result.score >= 80 ? 'text-emerald-400' : result.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {result.score}
                <span className="text-lg text-slate-500 font-normal">/100</span>
              </div>
            </div>
          </div>

          {/* Audit Checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
              {result.details.robotsTxtBlocked ? (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-slate-200">AI Crawler Access</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {result.details.robotsTxtBlocked
                    ? 'Blocked by robots.txt (ChatGPT/Perplexity cannot read)'
                    : 'SearchBots (ChatGPT, Perplexity, Claude) allowed.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
              {result.details.hasLlmsTxt ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-slate-200">llms.txt Standard</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {result.details.hasLlmsTxt ? 'Native /llms.txt file detected.' : 'Missing /llms.txt. Generate one below!'}
                </p>
              </div>
            </div>
          </div>

          {/* llms.txt Generator Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold text-slate-100">Generated llms.txt</h4>
              </div>
              <button
                onClick={copyToClipboard}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy File'}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-sm overflow-x-auto border border-slate-800/80 leading-relaxed">
              {result.generatedLlmsTxt}
            </pre>
            <p className="text-xs text-slate-500 text-center">
              Place this content into your website’s <code className="text-slate-400">/llms.txt</code> file to help AI search engines cite your site accurately.
            </p>
          </div>
          </div>
    )}

    {/* --- SEO & FAQ Section --- */}
    <section className="mt-20 border-t border-slate-800 pt-12 space-y-10">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-slate-100">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Everything you need to know about Generative Engine Optimization (GEO) and AI search readiness.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-2">
          <h3 className="font-semibold text-slate-200">What is Generative Engine Optimization (GEO)?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            GEO is the practice of optimizing website content so that AI search engines (like ChatGPT, Perplexity, and Claude) can easily crawl, understand, and cite your brand in generated answers.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-2">
          <h3 className="font-semibold text-slate-200">Why do I need an `llms.txt` file?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Similar to `robots.txt`, `llms.txt` is an emerging standard that explicitly tells LLM crawlers which content is most relevant, helping models cite your official pages accurately.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-2">
          <h3 className="font-semibold text-slate-200">How is the GEO Score calculated?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our scanner evaluates AI crawler permissions in `robots.txt`, structured data compatibility, page title relevance, and the presence of markdown-friendly metadata.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-2">
          <h3 className="font-semibold text-slate-200">How do I implement the generated `llms.txt`?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Simply copy the generated markdown code above, create a file named `llms.txt`, and upload it to the root directory of your website (e.g., `yourdomain.com/llms.txt`).
          </p>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 pt-8 border-t border-slate-800/50">
        <p>© {new Date().getFullYear()} GEO Readiness Scanner. Powered by Cloudflare Edge & Next.js.</p>
      </footer>
    </section>
  </main>
);
}