"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

/**
 * `/zh/llms-txt-studio/` 的交互部分——输入、请求、预览、复制与下载。
 *
 * WHY THIS IS A COPY OF THE ENGLISH WIDGET RATHER THAN A `locale` PROP ON IT:
 * `app/(en)/llms-txt-studio/StudioWidget.tsx` 的每一句界面文案都直接写在 JSX 里，与状态机交错；
 * 加一个语言分支会让每句话都变成三元表达式，也会让英文页承担一份它不需要的翻译依赖。两份文件的
 * 差别只在显示字符串：`fetch` 的目标、查询参数、从响应里读出的 JSON 键、以及 loading / 可访问 /
 * 出错的状态判断都与英文版逐行一致——这正是两个页面会对同一个域名给出同一份文件的原因。
 * 任何涉及行为的需求都应先改英文版，再同步到这里。
 *
 * WHY `lang=en` IS KEPT VERBATIM: `/api/llms-txt` 的 `Lang` 只声明了 "en" 和 "de"，其余值都会
 * 回落到英文（见 `app/api/llms-txt/route.ts` 的 `langParam` 判断）。所以 `lang=zh` 与 `lang=en`
 * 发出的文件完全相同，而查询参数必须与英文版逐字一致：这个页面翻译的是工具界面和说明，不是
 * 生成的文件内容。目标站点收到的 `Accept-Language` 也因此与英文版相同。
 *
 * WHY THE API'S ENGLISH ERRORS ARE MAPPED HERE: 生成端点是一个所有语言共用的路由，错误句子是
 * 英文的。若原样显示，中文读者会在一个中文表单上收到英文报错；若换成一句笼统的「出错了」，又会
 * 丢掉服务端已经给出的原因。所以已知的几种说法在显示层翻译，认不出的原样返回，让缺失的翻译
 * 可见，而不是被盖住。
 */
function cleanDomain(domain: string): string {
  if (!domain) return "";
  return domain
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split("/")[0]
    .toLowerCase();
}

/**
 * 端点与网络层会返回的错误原文，对应 `app/api/llms-txt/route.ts` 和
 * `lib/net/fetch-safe.ts`。键必须保持英文原文，因为那是服务端实际发出的字符串。
 */
const API_ERROR_ZH: Record<string, string> = {
  "Too many requests from this address. Please wait a moment and try again.":
    "来自这个地址的请求过多，请稍等片刻再试。",
  "Invalid domain": "域名无效。",
  "That is not a valid URL.": "这不是一个有效的 URL。",
  "Only http and https addresses can be scanned.": "只能扫描 http 和 https 地址。",
  "Enter a domain name, for example example.com.": "请输入域名，例如 example.com。",
  "IP addresses are not scanned. Enter a domain name instead.":
    "不扫描 IP 地址，请改为输入域名。",
  "That hostname points at a private network and will not be fetched.":
    "这个主机名指向私有网络，不会被抓取。",
  "That hostname resolves to an address embedded in the name and will not be fetched.":
    "这个主机名会解析到名字里嵌入的地址，不会被抓取。",
  "The homepage could not be reached.": "无法访问首页。",
};

/** 把已知的英文错误译成中文；认不出的写法保留原文，绝不改写成另一种说法。 */
function zhApiError(message: string): string {
  const known = API_ERROR_ZH[message];
  if (known) return known;

  // 状态码是这段句子里唯一会变化的数字，所以只替换它，句子结构保持服务端的判断。
  const status = /^The homepage returned HTTP (\d{3})\.$/.exec(message)?.[1];
  if (status) return `首页返回了 HTTP ${status}。`;

  return message;
}

export default function StudioWidgetZh() {
  const searchParams = useSearchParams();
  const rootDomain = cleanDomain(searchParams.get("domain") || "");

  const [domain, setDomain] = useState(rootDomain);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkCount, setLinkCount] = useState<number | null>(null);
  /*
   * 这些链接里，生成器实际读了多少个。
   *
   * 与链接数量放在一起，是因为两个数字回答的问题不同，而这一页的论点依赖这个差别可见而不是
   * 被暗示：「24 条链接」和「24 条链接，其中 12 条被读取、2 条没有描述」不是同一个说法，
   * 只有后者可以被核对。
   */
  const [pagesRead, setPagesRead] = useState<number | null>(null);
  const [sectionCount, setSectionCount] = useState<number | null>(null);
  const [withoutDescription, setWithoutDescription] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async (target: string) => {
    if (!target) {
      setError("请先输入域名。");
      setContent("");
      return;
    }
    setLoading(true);
    setError("");
    setContent("");
    setLinkCount(null);
    setPagesRead(null);
    setSectionCount(null);
    setWithoutDescription(null);

    try {
      const res = await fetch(
        `/api/llms-txt?domain=${encodeURIComponent(target)}&lang=en`
      );
      const data = await res.json();
      if (!data.reachable) {
        const apiError = typeof data.error === "string" ? data.error : "";
        setError(apiError ? zhApiError(apiError) : "无法读取这个站点。");
      } else {
        setContent(data.content || "");
        setLinkCount(typeof data.linkCount === "number" ? data.linkCount : null);
        setPagesRead(typeof data.pagesRead === "number" ? data.pagesRead : null);
        setSectionCount(typeof data.sectionCount === "number" ? data.sectionCount : null);
        setWithoutDescription(
          typeof data.pagesWithoutDescription === "number" ? data.pagesWithoutDescription : null
        );
      }
    } catch {
      setError("无法连接生成器，请重试。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDomain(rootDomain);
    if (rootDomain) void generate(rootDomain);
  }, [rootDomain, generate]);

  /*
   * 重新生成与第一次生成是同一个请求，它做成按钮而不是脚注，是因为文件会旧：一条描述只对页面
   * 被读取的那一天成立。输出里的日期是读者会检查的东西，而这个按钮就是让新日期变得便宜的那件事。
   */
  const handleRegenerate = () => {
    void generate(cleanDomain(domain));
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "llms.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="studio-heading">
      <h2 id="studio-heading" className="sr-only">
        生成一个 llms.txt 文件
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-8">
        <label htmlFor="studio-domain" className="sr-only">
          要读取的域名
        </label>
        <input
          id="studio-domain"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate(cleanDomain(domain))}
          placeholder="your-domain.com"
          className="flex-1 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink-1)] placeholder-[var(--ink-3)] outline-none focus:border-blue-500 transition-all"
        />
        <button
          onClick={() => generate(cleanDomain(domain))}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
        >
          {loading ? "正在读取站点……" : "生成 llms.txt"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-sm rounded-2xl p-6 mb-8">
          {error}
        </div>
      )}

      <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-xs font-mono text-[var(--ink-2)]">预览：/llms.txt</span>
            {linkCount !== null && (
              <span className="text-[11px] text-[var(--ink-3)] font-mono">
                {linkCount} 条链接，共 {sectionCount ?? 0} 个小节
                {pagesRead !== null ? `，已读取 ${pagesRead} 个页面` : ""}
                {withoutDescription
                  ? `，其中 ${withoutDescription} 条没有描述`
                  : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-1)] disabled:opacity-50 border border-[var(--line)] text-[var(--ink-1)] px-3 py-1.5 rounded-lg font-medium transition-all"
            >
              {loading ? "读取中……" : "重新生成"}
            </button>
            <button
              onClick={handleCopy}
              disabled={!content}
              className="text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-1)] disabled:opacity-50 border border-[var(--line)] text-[var(--ink-1)] px-3 py-1.5 rounded-lg font-medium transition-all"
            >
              {copied ? "✓ 已复制" : "复制原文"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!content}
              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
            >
              下载 .txt
            </button>
          </div>
        </div>

        <label htmlFor="studio-output" className="sr-only">
          生成的 llms.txt 内容，可编辑
        </label>
        <textarea
          id="studio-output"
          value={loading ? "正在读取你的站点……" : content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="w-full h-96 bg-[var(--surface-0)] border border-[var(--line)] rounded-xl p-4 text-xs font-mono text-[var(--ink-2)] focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
        />

        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed pt-4">
          发布前先编辑。小节来自每个路径的第一段，每条描述都摘自它旁边那个页面——页面的 meta description，
          没有的话就是它的 H1。工具写下但没有描述的链接，是它没有读取的页面；文件会写明有多少条，
          并且绝不会用一句自己写的话去填这个空。描述只对顶部生成日期那天的页面成立，所以请重新生成，
          而不是发布一个你编辑过、后来忘了的文件。按位置重定向访客的站点可能会返回某个地区版本，
          所以在发布前先检查这些链接。
        </p>
      </div>
    </section>
  );
}
