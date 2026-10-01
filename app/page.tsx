'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDictionary, Language } from '@/lib/i18n';
import LanguageSwitcher from './components/LanguageSwitcher';

export default function Home() {
  const [urlInput, setUrlInput] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const router = useRouter();

  const dict = getDictionary(lang);
  const heroData = dict.hero as Record<string, string>;

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // 清理输入的网址格式，提取出干净的域名
    let cleanDomain = urlInput.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');

    // 自动跳转到专属诊断报告页面：/report/[domain]
    if (cleanDomain) {
      router.push(`/report/${encodeURIComponent(cleanDomain)}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-between p-6 md:p-12">
      {/* 顶部导航 */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-400">
          🌐 GEO Scanner
        </div>
        <nav className="flex items-center gap-6">
          <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
        </nav>
      </header>

      {/* 核心搜索区 */}
      <section className="w-full max-w-3xl text-center my-16">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          {heroData.title}
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
          {heroData.subtitle}
        </p>

        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={heroData.inputPlaceholder || 'https://yourwebsite.com'}
            className="flex-1 bg-slate-800/80 border border-slate-700 focus:border-blue-500 text-white rounded-xl px-4 py-3.5 outline-none transition text-sm"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 py-3.5 transition flex items-center justify-center gap-2 text-sm"
          >
            {heroData.button || heroData.scanButton || 'Scan Website'} 🚀
          </button>
        </form>
      </section>

      {/* 页脚 */}
      <footer className="w-full max-w-5xl border-t border-slate-800 py-6 text-center text-slate-500 text-xs">
        © {new Date().getFullYear()} GEO Scanner. Powered by Next.js Edge Runtime.
      </footer>
    </main>
  );
}