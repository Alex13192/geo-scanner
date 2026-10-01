'use client';

// Cloudflare Pages 部署必需配置
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';

interface CheckItem {
  pass: boolean;
  score: number;
  details: string;
}

interface ReportData {
  domain: string;
  score: number;
  badgeUrl: string;
  checks: {
    crawlerPassability: CheckItem;
    llmsTxtCompliance: CheckItem;
    schemaMetadata: CheckItem;
    aiContentExtractability: CheckItem;
  };
  llmsTxtContent: string;
}

export default function ReportPage({ params }: { params: { domain: string } }) {
  const [domain, setDomain] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string>('');

  // 邮箱订阅 Form 状态
  const [email, setEmail] = useState('');
  const [leadStatus, setLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [leadMsg, setLeadMsg] = useState('');

  // Badge 复制复制控制
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [copiedLlms, setCopiedLlms] = useState(false);

  useEffect(() => {
    async function unwrapParams() {
      const resolvedParams = await params;
      const decodedDomain = decodeURIComponent(resolvedParams.domain);
      setDomain(decodedDomain);
      fetchReport(decodedDomain);
    }
    unwrapParams();
  }, [params]);

  const fetchReport = async (targetDomain: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/scan?domain=${encodeURIComponent(targetDomain)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch audit report.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLeadStatus('submitting');
    setLeadMsg('');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain }),
      });

      if (!res.ok) {
        throw new Error('Failed to subscribe.');
      }

      setLeadStatus('success');
      setLeadMsg('Subscribed successfully! We will monitor your GEO score.');
      setEmail('');
    } catch (err: any) {
      setLeadStatus('error');
      setLeadMsg(err.message || 'Subscription failed. Please try again.');
    }
  };

  const copyToClipboard = (text: string, type: 'badge' | 'llms') => {
    navigator.clipboard.writeText(text);
    if (type === 'badge') {
      setCopiedBadge(true);
      setTimeout(() => setCopiedBadge(false), 2000);
    } else {
      setCopiedLlms(true);
      setTimeout(() => setCopiedLlms(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm animate-pulse">Scanning {domain} for GEO Readiness...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md space-y-4">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-lg font-bold">Scan Error</h2>
          <p className="text-xs text-gray-400">{error || 'Could not analyze domain.'}</p>
          <a href="/" className="inline-block bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded-xl">
            Try Another Domain
          </a>
        </div>
      </div>
    );
  }

  const badgeMarkdown = `![GEO Score](${window.location.origin}${data.badgeUrl})`;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white p-6 md:p-12 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <a href="/" className="text-xs text-blue-400 hover:underline">← Back to Search</a>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2 text-white">
              GEO Report: <span className="text-blue-400">{data.domain}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl shrink-0">
            <span className="text-xs text-gray-400 uppercase font-semibold">GEO Score:</span>
            <span className={`text-2xl font-black ${data.score >= 80 ? 'text-green-400' : data.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {data.score} / 100
            </span>
          </div>
        </div>

        {/* Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check 1 */}
          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">1. AI Crawler Accessibility</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${data.checks.crawlerPassability.pass ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {data.checks.crawlerPassability.pass ? 'PASS' : 'BLOCKED'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{data.checks.crawlerPassability.details}</p>
          </div>

          {/* Check 2 */}
          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">2. /llms.txt Compliance</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${data.checks.llmsTxtCompliance.pass ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {data.checks.llmsTxtCompliance.pass ? 'FOUND' : 'MISSING'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{data.checks.llmsTxtCompliance.details}</p>
          </div>

          {/* Check 3 */}
          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">3. Schema.org Metadata</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${data.checks.schemaMetadata.pass ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {data.checks.schemaMetadata.pass ? 'VALID' : 'NO SCHEMA'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{data.checks.schemaMetadata.details}</p>
          </div>

          {/* Check 4 */}
          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">4. AI Extractability</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${data.checks.aiContentExtractability.pass ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {data.checks.aiContentExtractability.pass ? 'HIGH' : 'LOW'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{data.checks.aiContentExtractability.details}</p>
          </div>
        </div>

        {/* /llms.txt Generator Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📄 Auto-generated /llms.txt Code</span>
              </h2>
              <p className="text-xs text-gray-400">Save this content to your website root folder at <code className="text-blue-400 font-mono">/llms.txt</code></p>
            </div>
            <button
              onClick={() => copyToClipboard(data.llmsTxtContent, 'llms')}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs px-4 py-2 rounded-xl transition-all"
            >
              {copiedLlms ? 'Copied! ✓' : 'Copy /llms.txt'}
            </button>
          </div>
          <pre className="bg-[#070A0F] border border-gray-800/80 p-4 rounded-xl text-xs text-blue-200 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {data.llmsTxtContent}
          </pre>
        </div>

        {/* Dynamic Badge Embed Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🏷️ Embed GEO Score Badge</span>
              </h2>
              <p className="text-xs text-gray-400">Showcase your GEO readiness on GitHub or your footer.</p>
            </div>
            <button
              onClick={() => copyToClipboard(badgeMarkdown, 'badge')}
              className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-xs px-4 py-2 rounded-xl transition-all"
            >
              {copiedBadge ? 'Copied! ✓' : 'Copy Markdown'}
            </button>
          </div>
          <div className="bg-[#070A0F] border border-gray-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <code className="text-xs text-gray-400 font-mono overflow-x-auto select-all">{badgeMarkdown}</code>
            <img src={data.badgeUrl} alt="GEO Score Badge" className="h-6 shrink-0" />
          </div>
        </div>

        {/* Lead Capture Box */}
        <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-white">Free GEO Health Monitoring</h3>
            <p className="text-xs text-gray-300 max-w-md leading-relaxed">
              Subscribe to get notified if GPTBot or Perplexity rules change for <span className="text-blue-400 font-semibold">{data.domain}</span>.
            </p>
          </div>
          <form onSubmit={handleLeadSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              className="bg-gray-900/90 border border-gray-700 px-4 py-2.5 text-xs text-white placeholder-gray-500 rounded-xl outline-none focus:border-blue-500 transition-all w-full md:w-64"
            />
            <button
              type="submit"
              disabled={leadStatus === 'submitting'}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition-all shrink-0 disabled:opacity-50"
            >
              {leadStatus === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
        {leadMsg && (
          <p className={`text-xs text-center ${leadStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {leadMsg}
          </p>
        )}
      </div>
    </div>
  );
}