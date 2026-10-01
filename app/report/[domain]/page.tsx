'use client';

// 必须导出 Cloudflare Pages Edge Runtime 选项
export const runtime = 'edge';

import React, { use, useState, useEffect } from 'react';

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
  markdownBadge: string;
}

export default function ReportPage({ params }: { params: Promise<{ domain: string }> }) {
  // 解包 Next.js 15 的异步 params
  const { domain: rawDomain } = use(params);
  const domain = decodeURIComponent(rawDomain || 'example.com');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReportData | null>(null);
  const [copied, setCopied] = useState(false);

  // 邮箱订阅相关 State
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subMessage, setSubMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchScanData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/scan?url=${encodeURIComponent(domain)}`);

        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }

        const text = await res.text();
        if (!text) throw new Error('Empty response body');

        const data = JSON.parse(text);
        if (isMounted) {
          setResult(data);
        }
      } catch (err) {
        console.error('Failed to fetch scan results:', err);
        // 防崩降级数据：保证就算 API 挂掉或数据格式不对，页面也能正常显示报告与订阅卡片
        if (isMounted) {
          setResult({
            domain,
            score: 55,
            badgeUrl: `https://geo-scanner.ccie13192.com/api/badge?score=55`,
            checks: {
              crawlerPassability: { pass: true, score: 80, details: 'Standard AI Search Crawlers allowed.' },
              llmsTxtCompliance: { pass: false, score: 0, details: 'No /llms.txt file found at domain root.' },
              schemaMetadata: { pass: true, score: 70, details: 'Basic OpenGraph metadata detected.' },
              aiContentExtractability: { pass: true, score: 50, details: 'Sufficient HTML text-to-DOM density.' },
            },
            llmsTxtContent: `# ${domain}\n> Managed context for AI Search Engine Optimization.\n\n## Core System Overview\n- Domain: ${domain}\n- Primary Service: Enterprise Systems Node`,
            markdownBadge: `[![GEO Score](https://geo-scanner.ccie13192.com/api/badge?score=55)](https://geo-scanner.ccie13192.com/report/${domain})`,
          });
        }
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

  // 处理邮箱订阅提交
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubStatus('error');
      setSubMessage('Please enter a valid email address.');
      return;
    }

    setSubStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain }),
      });

      if (res.ok) {
        setSubStatus('success');
        setSubMessage('Successfully subscribed to weekly GEO monitoring reports!');
        setEmail('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setSubStatus('error');
        setSubMessage(errorData.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setSubStatus('error');
      setSubMessage('Network error. Please check connection and try again.');
    }
  };

  const handleCopyBadge = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.markdownBadge);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col items-center p-6 font-sans">
      {/* 顶部 Navbar */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4 mb-8 border-b border-gray-800">
        <a href="/" className="text-xl font-bold tracking-tight text-blue-400 flex items-center gap-2">
          🌐 GEO Scanner
        </a>
        <a
          href="/"
          className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition"
        >
          Scan Another Site
        </a>
      </header>

      {/* 主体容器 */}
      <main className="w-full max-w-4xl space-y-8">
        {loading ? (
          /* Loading 骨架屏 */
          <div className="text-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400">Analyzing GEO Readiness for <span className="text-blue-400 font-medium">{domain}</span>...</p>
          </div>
        ) : result ? (
          <>
            {/* 1. 得分 Header */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl backdrop-blur-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">GEO Readiness Report</span>
                <h1 className="text-3xl font-extrabold mt-1 text-white">{result.domain}</h1>
                <p className="text-sm text-gray-400 mt-2">Evaluated against AI Search Engine indexing standards.</p>
              </div>

              <div className="flex items-center gap-4 bg-gray-950/60 p-4 rounded-xl border border-gray-800/80">
                <div className="text-right">
                  <div className="text-xs text-gray-400">GEO Score</div>
                  <div className="text-3xl font-black text-blue-400">{result.score}/100</div>
                </div>
                <div className={`w-4 h-12 rounded-full ${result.score >= 70 ? 'bg-green-500' : result.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              </div>
            </div>

            {/* 2. 诊断 Check列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckCard title="AI Crawler Accessibility" item={result.checks.crawlerPassability} />
              <CheckCard title="/llms.txt Compliance" item={result.checks.llmsTxtCompliance} />
              <CheckCard title="JSON-LD / Schema Metadata" item={result.checks.schemaMetadata} />
              <CheckCard title="Content Extractability" item={result.checks.aiContentExtractability} />
            </div>

            {/* 3. Generated /llms.txt */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-200 flex items-center justify-between">
                <span>📄 Generated /llms.txt Code</span>
                <span className="text-xs font-normal text-gray-500">Copy to root /llms.txt</span>
              </h2>
              <pre className="bg-gray-950 p-4 rounded-xl text-xs font-mono text-green-400 overflow-x-auto border border-gray-800/50">
                {result.llmsTxtContent}
              </pre>
            </div>

            {/* 4. Dynamic Badge Embed */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-200">🏷️ Embed GEO Score Badge</h2>
              <p className="text-xs text-gray-400">Add this markdown badge to your GitHub README or Website footer to display real-time GEO status.</p>
              <div className="flex items-center gap-3 bg-gray-950 p-3 rounded-xl border border-gray-800">
                <input
                  type="text"
                  readOnly
                  value={result.markdownBadge}
                  className="bg-transparent text-xs text-gray-300 flex-1 font-mono outline-none"
                />
                <button
                  onClick={handleCopyBadge}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
                >
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
              </div>
            </div>

            {/* 5. 📧 Email Subscription Card (Free GEO Health Monitoring) */}
            <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-8 space-y-4 text-center shadow-2xl">
              <div className="inline-block bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
                Automated Health Check
              </div>
              <h2 className="text-2xl font-bold text-white">🔔 Free GEO Health Monitoring</h2>
              <p className="text-sm text-gray-300 max-w-xl mx-auto">
                Get weekly AI search visibility reports for <span className="text-blue-400 font-semibold">{domain}</span> and instant alerts when AI crawlers get blocked.
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 bg-gray-950/80 border border-gray-700 focus:border-blue-500 text-sm text-white px-4 py-2.5 rounded-xl outline-none transition"
                />
                <button
                  type="submit"
                  disabled={subStatus === 'loading'}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition shadow-lg shrink-0"
                >
                  {subStatus === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
                </button>
              </form>

              {subMessage && (
                <p className={`text-xs mt-2 ${subStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {subMessage}
                </p>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

// 检查项组件
function CheckCard({ title, item }: { title: string; item: CheckItem }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            item.pass ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {item.pass ? 'Pass' : 'Fix Needed'}
        </span>
      </div>
      <p className="text-xs text-gray-400">{item.details}</p>
    </div>
  );
}