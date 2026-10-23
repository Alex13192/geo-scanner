import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Faq from "@/app/components/Faq";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/zh/api-docs/` - the scan API reference, in Chinese.
 *
 * WHY THIS REBUILDS ProsePage'S SHELL INSTEAD OF USING IT: ProsePage renders SiteNav and
 * PageFooter, whose navigation and footer strings are English, and its back-link points at the
 * English hub. A localized page has to use LocaleHeader/LocaleFooter and return to `/zh/`, or
 * the one link meant to orient a Chinese reader would hand them an English page. The band, the
 * `wrap` geometry, the `doc-article` measure, the two tables and the FAQ order are copied from
 * the English page so the two versions read as the same reference in two languages.
 *
 * WHAT STAYS BYTE-IDENTICAL: the endpoint, every parameter name, every JSON key, the status
 * codes, the numbers (300 bytes / 8 KB, 20 requests, 5, 10, 39/39, 39/40), the captured sample
 * response and the three curl commands. Those are the subject matter: a translated `scope=site`
 * would be a different parameter, and a re-typed sample would stop being the captured one. The
 * English page says the sample is real, so it has to stay exactly as captured.
 *
 * WHY NO CLAIM IS ADDED OR SOFTENED: every limit below is the one the code enforces -
 * lib/net/rate-limit.ts for the token bucket, lib/geo/scan.ts for the site-scope budget,
 * app/api/scan/route.ts for the response shape and the 400/429 branches. The English page also
 * names what is NOT promised (uptime, versioning, a global limit); those sentences are here too,
 * because a translation that drops a caveat has strengthened the promise.
 *
 * WHY THE LINKS ARE MIXED: /zh/methodology/, /zh/study/, /zh/pricing/ and
 * /zh/compare/readiness-vs-mention-tracking/ exist, so they are linked in Chinese. /report/ and
 * /contact/ have no Chinese page: they keep the English URL, hrefLang="en" and the （英文）
 * marker. The two GitHub source links and the "try it" endpoint stay exactly as the English
 * page writes them - they are code and JSON, not prose, and the endpoint serves the same JSON
 * whatever language the reader is in.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "扫描 API：用程序获取 GEO 分数";
const DESCRIPTION =
  "一个公开端点，无需密钥：与本站运行的是同一个分析器，参数、响应字段、速率限制，以及它并不修复的那些限制都有文档。";
const UPDATED = "2026-10-23";

/** A real `?brief=1` response for example.com, captured 2026-10-23. Not a mock-up. */
const SAMPLE_BRIEF = `{
  "domain": "example.com",
  "status": 200,
  "browserStatus": null,
  "scoreBasis": "homepage",
  "truncated": false,
  "score": 16,
  "grade": "F",
  "checksRun": 40,
  "checksPassed": 5,
  "aiCrawlersBlocked": false,
  "hasJsonLdEntity": false,
  "hasSameAs": false,
  "hasRobotsTxt": false,
  "topIssue": "robots-present",
  "pageType": "homepage",
  "checksNotApplicable": 1
}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/api-docs/",
    languages: {
      en: "/api-docs/",
      "zh-Hans": "/zh/api-docs/",
      "x-default": "/api-docs/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/api-docs/",
  }),
};

export default async function ChineseApiDocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        {/* Full-bleed title band, matching ProsePage: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              {/* ProsePage puts the page's own back-link here, above the eyebrow. */}
              <Link
                href="/zh/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                ← 返回首页
              </Link>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                扫描 API
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                一个公开端点，返回与报告页渲染的同一份分析。没有密钥，没有账号，也不需要注册。本页记录参数、响应、速率限制，以及 API 自身并不修复的那些限制。
              </p>
              <p className="font-mono text-xs text-[var(--ink-3)]">
                文档更新于 {UPDATED}。该端点没有版本号；限制见下文「这个端点不做什么」。
              </p>
              {/*
                The one action ProsePage would carry. It stays an <a>, as in the English shell,
                because /api/scan answers with JSON rather than a localized page - there is no
                language to switch to at the other end of the link.
              */}
              <a
                href="/api/scan?brief=1&domain=example.com"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                在 example.com 上试用
              </a>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/* 17px body copy, the same measure as the English page. `.doc-article` carries the
                typography (h2, lists, pre, tables, links) because Tailwind Typography is not
                installed in this project. */}
            <article className="doc-article reveal-stagger mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <h2>这个端点做什么？</h2>
              <p>
                它像爬虫一样抓取一个域名，读取 <code>robots.txt</code>、<code>llms.txt</code> 和 <code>sitemap.xml</code>（如果存在），
                然后按站点在{" "}
                <Link href="/zh/methodology/">/zh/methodology/</Link>{" "}
                上说明的同一套公开规则给页面打分。调用者拿到的是分数、12 个维度的结果和问题列表，而不是它们的截图。
              </p>
              <pre>{`GET ${SITE_URL}/api/scan?domain=example.com`}</pre>
              <p>
                扫描在请求过程中完成，所以对一个冷域名的第一次调用，耗时等于抓取该域名本身的耗时。同一个分析器也支撑着
                <Link href="/report/" hrefLang="en">
                  报告页（英文）
                </Link>
                和
                <Link href="/zh/study/">已发布的研究</Link>
                ，这就是为什么从这里拿到的分数与从界面拿到的分数是同一个数。
              </p>

              <h2>它接受哪些参数？</h2>
              <table>
                <thead>
                  <tr>
                    <th>参数</th>
                    <th>必填</th>
                    <th>作用</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>domain</code>
                    </td>
                    <td>是</td>
                    <td>
                      只接受主机名。粘贴进来的 <code>https://</code> 前缀、路径或查询串会被去掉；<code>www.</code> 前缀也会被移除。
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>brief=1</code>
                    </td>
                    <td>否</td>
                    <td>
                      只返回头部数字——约 300 字节，而不是约 8 KB——不含维度或问题列表。调用者要收集大量域名时，靠它避免为每个域名拉一份完整报告。
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>scope=site</code>
                    </td>
                    <td>否</td>
                    <td>
                      增加一个 <code>site</code> 块：首页加上 sitemap 中列出的页面，每一页都由同一个分析器打分，并给出站点平均分和跨页面重复出现的问题。
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>pages=N</code>
                    </td>
                    <td>否</td>
                    <td>
                      站点扫描的预算：首页之外的页面数，默认 5，最大 10。提供它会隐含 <code>scope=site</code>。
                    </td>
                  </tr>
                </tbody>
              </table>
              <p>
                <code>brief=1</code> 与 <code>scope=site</code> 同时发送时，<code>brief=1</code> 优先。这是有意的：精简形式的存在是为了让批量收集便宜，而 site 块是相反的取舍。
              </p>

              <h2>响应里包含什么？</h2>
              <p>
                完整扫描返回 <code>reachable</code>、<code>status</code>、<code>scheme</code>、<code>browserStatus</code>、
                <code>scoreBasis</code>、<code>truncated</code>、<code>score</code>、<code>grade</code>、<code>gradeLabel</code>、
                <code>dimensions</code>、<code>checksRun</code>、<code>checksPassed</code>、<code>pageType</code>、
                <code>checksNotApplicable</code>、<code>issues</code> 和 <code>metrics</code>。
              </p>
              <ul>
                <li>
                  <strong>
                    <code>scoreBasis</code>
                  </strong>{" "}
                  说明这个分数描述的是什么。页面返回 200 时它是 <code>&quot;homepage&quot;</code>，
                  页面没有返回 200 时它是 <code>&quot;403 error response&quot;</code> 之类——错误响应不是页面，
                  这个字段的存在就是为了让调用者不会把两者搞混。
                </li>
                <li>
                  <strong>
                    <code>dimensions</code>
                  </strong>{" "}
                  承载全部 12 个加权结果，每个都带有已得点数、可得分点数，以及公开的评分理由。
                </li>
                <li>
                  <strong>
                    <code>issues</code>
                  </strong>{" "}
                  列出未通过和部分通过的检查，连同产生该结论的证据，以及规则页公布的修复方法。
                </li>
                <li>
                  <strong>
                    <code>truncated</code>
                  </strong>{" "}
                  在抓取因大小上限而中止时为 true，此时分数描述的是读到的那部分，而不是整份文档。
                </li>
                <li>
                  <strong>
                    <code>checksNotApplicable</code>
                  </strong>{" "}
                  是因页面类型或前提而被排除的规则数量。一个有 1 项被排除的 39/39，不等于 39/40；见
                  <Link href="/zh/methodology/">方法论</Link>。
                </li>
              </ul>

              <h2>精简响应长什么样？</h2>
              <p>
                这是 <code>example.com</code> 的一个真实响应，采集于 2026-10-23。它不是示意图：运行同一个请求，你应该得到同样的结构。
              </p>
              <pre>{SAMPLE_BRIEF}</pre>

              <h2>速率限制是多少？</h2>
              <p>
                一个尽力而为的 isolate 内令牌桶：每个客户端地址每分钟 20 个请求。用尽时端点返回 <code>429</code>，
                并带上 <code>Retry-After</code> 响应头。它不是全局限流——Cloudflare 会运行许多 isolate，每个都有自己的计数器——
                所以打算做批量工作的调用者应该自己控制节奏，而不是依赖这个数字。之所以写明这一点，是因为一句准确的警告比一个架构兑现不了的承诺更有用。
              </p>

              <h2>它会返回哪些状态码？</h2>
              <table>
                <thead>
                  <tr>
                    <th>状态码</th>
                    <th>含义</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>200</code>
                    </td>
                    <td>
                      一个结果。拒绝爬虫的站点仍然返回 200，带 <code>reachable: true</code> 和 <code>status: 403</code>——
                      拒绝本身就是结论。
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>400</code>
                    </td>
                    <td>
                      域名不是有效主机名，或拒绝解析到公网地址。响应体带一个 <code>error</code> 字符串。
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>429</code>
                    </td>
                    <td>被限流。按 <code>Retry-After</code> 的值重试。</td>
                  </tr>
                </tbody>
              </table>
              <p>
                如果两个 scheme 都完全不应答，响应是 <code>200</code>，带 <code>reachable: false</code>、<code>score: 0</code> 和空的问题列表。
                无法访问的域名是关于可达性的结果，而不是调用者造成的服务器错误。
              </p>

              <h2>这个端点不做什么？</h2>
              <ul>
                <li>
                  <strong>它看不见防火墙。</strong>
                  这个扫描器发出的请求来自它自己的地址，所以一条针对 bot 的 CDN 规则可以拒绝它，同时照常服务浏览器。
                  这会被报告为访问类检查的部分结果，而不是通过。
                </li>
                <li>
                  <strong>它不执行 JavaScript。</strong>
                  客户端渲染的页面，按爬虫收到的那样打分。
                </li>
                <li>
                  <strong>它不向任何 AI 引擎询问任何东西。</strong>
                  分数描述的是页面是否可以被引用，而不是它当前是否已经被引用；
                  <Link href="/zh/compare/readiness-vs-mention-tracking/">对比页</Link>
                  解释了其中的区别。
                </li>
                <li>
                  <strong>它不存储扫描内容。</strong>
                  没有历史，也没有会丢的密钥。
                </li>
                <li>
                  <strong>它不是一份有版本的契约。</strong>
                  字段可能增加，路由也可能随站点变化；稳定的是公开的方法，而不是 JSON 信封。
                  如果你要基于它构建，请固定在你读取的字段上，并在每次发布后重新核对。
                </li>
              </ul>

              <h2>如何在脚本里调用它？</h2>
              <pre>{`# Headline result for one domain
curl -s "${SITE_URL}/api/scan?brief=1&domain=example.com"

# Full report, including every dimension and issue
curl -s "${SITE_URL}/api/scan?domain=example.com" | jq '{score, grade, issues: [.issues[].id]}'

# Homepage plus up to five sitemap pages
curl -s "${SITE_URL}/api/scan?domain=example.com&scope=site" | jq '.site.siteScore'`}</pre>
              <p>
                参数和响应的实现在{" "}
                <a
                  href="https://github.com/Alex13192/geo-scanner/blob/main/app/api/scan/route.ts"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  app/api/scan/route.ts
                </a>
                ，站点扫描的预算在{" "}
                <a
                  href="https://github.com/Alex13192/geo-scanner/blob/main/lib/geo/scan.ts"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  lib/geo/scan.ts
                </a>
                。两者都可读，因为一份无法核对的 API 文档只是一个声明。
              </p>

              <h2>可以商用吗？</h2>
              <p>
                这个端点免费且无需认证，源码以 MIT 许可发布。没有服务等级协议：这是一个小型独立项目，不是平台；
                在循环里调用它，正是速率限制和「没有密钥」所要劝阻的事。批量或代理机构的工作，
                <Link href="/zh/pricing/">付费测量报告</Link>
                是受支持的路径——如果你的工作形态不在其中，请发
                <Link href="/contact/" hrefLang="en">
                  邮件（英文）
                </Link>
                。
              </p>

              <h2>为什么这个端点不在首页上？</h2>
              <p>
                因为这个站点面向的是想弄清自己的页面能否被引用的人，而他们中的大多数并不想要一个 JSON 信封。
                API 是给那些确实想要的读者——开发者、代理机构，以及任何需要以界面无法服务的规模收集数据的人——提供的同一种测量。
                它从工具索引、导航和 <code>/llms.txt</code> 都有链接，所以它不是秘密。
              </p>

              <Faq
                title="关于扫描 API 的问题"
                level="h3"
                items={[
                  {
                    q: "我需要 API 密钥吗？",
                    a: "不需要。端点公开且无需认证，扫描器也不保存扫描历史。速率限制是唯一的门槛，而且它是尽力而为的。",
                  },
                  {
                    q: "为什么速率限制不精确？",
                    a: "因为它在 Worker isolate 内部执行，而 Cloudflare 会运行许多 isolate。计数器只能阻止单个调用者猛打单个 isolate；它不是全局配额。诚实的限制是公布出来的那个，而不是架构交付不了的数字。",
                  },
                  {
                    q: "我可以拿到一个站点的每一页吗？",
                    a: "不是每一页。scope=site 读取首页，加上最多十个由 sitemap 列出的页面，逐节挑选；默认是五个。这是一份预算，而不是抽样，响应里会说明考虑了多少页、在哪里截断。",
                  },
                  {
                    q: "分数和报告页显示的一样吗？",
                    a: "一样。两者都调用同一个分析器、读取同一批支持的资源文件，这也是已发布的研究通过这个端点采集的原因。不同的只是呈现方式，而不是测量。",
                  },
                ]}
              />
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
