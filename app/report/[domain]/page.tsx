'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export const runtime = 'edge';

interface ScanResult {
  domain: string;
  score: number;
  badgeUrl: string;
  checks: {
    llmsTxt: { pass: boolean; score: number; details: string };
    jsonLd: { pass: boolean; score: number; details: string };
    robotsTxt: { pass: boolean; score: number; details: string };
    textRatio: { pass: boolean; score: number; details: string };
  };
  llmsTxtContent: string;
  markdownBadge: string;
}

export default function ReportPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const resolvedParams = use(params);
  const rawDomain = resolvedParams.domain;
  const domain = decodeURIComponent(rawDomain);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyBadge, setCopyBadge] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchScanData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/scan?url=${encodeURIComponent(domain)}`);
        const data = await res.json();
        if (isMounted) {
          setResult(data);
        }
      } catch (err) {
        console.error('Failed to fetch scan results:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchScanData();

    return () => {
      isMounted = false;
    };
  }, [domain]);

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Analyzing GEO compatibility for <span className="text-blue-400 font-semibold">{domain}</span>...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 border-b border-slate-800 mb-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-400 hover:opacity-80 transition">
          🌐 GEO Scanner
        </Link>
        <button
          onClick={() => copyToClipboard(window.location.href, setCopied)}
          className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 px-3 py-2 rounded-lg transition flex items-center gap-1.5"
        >
          {copied ? '✓ Link Copied' : '🔗 Share Report'}
        </button>
      </header>

      {result && (
        <div className="w-full max-w-4xl space-y-8">
          {/* Header Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-blue-400 font-semibold mb-1">GEO Audit Report</div>
              <h1 className="text-3xl font-extrabold text-white">{result.domain}</h1>
              <p className="text-slate-400 text-sm mt-1">Generative Engine Optimization readiness assessment.</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-900/80 px-6 py-4 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-xs text-slate-400">GEO Score</div>
                <div className="text-3xl font-black text-blue-400">{result.score}<span className="text-sm font-normal text-slate-500">/100</span></div>
              </div>
            </div>
          </div>

          {/* Audit Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(result.checks).map(([key, check]) => (
              <div key={key} className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                <div className={`mt-0.5 text-lg ${check.pass ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {check.pass ? '✓' : '⚠️'}
                </div>
                <div>
                  <div className="font-semibold text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-xs text-slate-400 mt-1">{check.details}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Badge Embed Code */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-white text-sm">Embed Dynamic GEO Badge</h3>
              <button
                onClick={() => copyToClipboard(result.markdownBadge, setCopyBadge)}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                {copyBadge ? 'Copied!' : 'Copy Markdown'}
              </button>
            </div>
            <pre className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
              {result.markdownBadge}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}