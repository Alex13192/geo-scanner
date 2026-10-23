/**
 * Chinese rule and fix copy, one entry per published check.
 *
 * `rule` and `onFail` are translations of the catalogue, not rewrites of it; `fixes` follows
 * CHECK_COPY entry for entry, with `when` preserved. Titles are not here: they live in zh-copy.ts.
 * The ids are the catalogue's ids, so a renamed rule resolves to nothing and shows its English
 * copy rather than a stale translation.
 */

export type ZhRuleCopy = {
  /** 这条规则检查什么。翻译 catalog 的 rule，不增不减。 */
  rule: string;
  /** 失败意味着什么。翻译 catalog 的 onFail；没有 onFail 的规则省略该字段。 */
  onFail?: string;
  /** 怎么修。与 CHECK_COPY 的 fixes 一一对应，when 原样保留。 */
  fixes: { when: "fail" | "partial"; text: string }[];
};

export const ZH_CHECK_RULES: Record<string, ZhRuleCopy> = {
  "robots-present": {
    rule: "请求 /robots.txt 返回 HTTP 200 且响应体非空。返回 200 但响应体为空或只有空白字符的，视为未提供，因为它没有公布任何政策。",
    onFail: "域名根目录下没有可读取的 robots.txt。",
    fixes: [
      { when: "fail", text: "发布 robots.txt。没有 robots.txt 时，所有爬虫默认都被允许，因此这是政策缺口，而不是屏蔽。" },
    ],
  },
  "robots-ai-allowed": {
    rule: "把 robots.txt 解析为 user-agent 分组后，gptbot、claudebot、perplexitybot、oai-searchbot 和 google-extended 中的任何一个都没有被禁止访问 /，并且首页对爬虫形态的请求返回了 HTTP 200。精确的 agent 分组优先于 * 分组，最长匹配的规则生效，长度相同时 Allow 优先，Disallow 值为空时不匹配任何路径，* 视为通配符。当首页拒绝了该请求时，判定取决于用浏览器形态的 User-Agent 对同一 URL 进行的第二次探测：如果这次返回 200，说明拒绝针对的是已识别的爬虫，该检查以 robots-ai-blocked 判定为失败；如果同样被拒绝，说明拒绝针对的是扫描所用的地址而不是站点，该检查按未验证计 6 分中的 2 分。",
    onFail: "至少有一个 AI 爬虫被禁止访问站点根目录，或者服务器直接拒绝了已识别的爬虫。",
    fixes: [
      { when: "partial", text: "在 CDN 或 WAF 中确认已识别的 AI 爬虫是否被放行，以及来自哪些网络。本次扫描无法从这里确认这一点。" },
    ],
  },
  "robots-sitemap": {
    rule: "robots.txt 中包含一行 Sitemap:。",
    fixes: [
      { when: "fail", text: "添加一行 Sitemap:，指向你的 sitemap.xml。" },
      { when: "fail", text: "发布 robots.txt，并在其中用一行 Sitemap: 指向你的 sitemap。" },
    ],
  },
  "home-200": {
    rule: "首页对如实标识自身身份的非浏览器请求返回 HTTP 200。",
    onFail: "首页响应不是 200。访问判定本身由 robots-ai-allowed 或 robots-ai-blocked 报告，它们会区分拒绝针对的对象。",
    fixes: [
      { when: "fail", text: "确保首页对爬虫 user-agent 返回 200，而不是验证挑战或错误。" },
    ],
  },
  "home-noindex": {
    rule: "首页没有包含 noindex 的 meta robots 指令。",
    fixes: [
      { when: "fail", text: "移除首页的 noindex，使其可被检索。" },
    ],
  },
  "sitemap-valid": {
    rule: "/sitemap.xml 的响应体中包含 <urlset> 或 <sitemapindex>。",
    onFail: "没有 sitemap，或返回的不是合法的 sitemap 标记。",
    fixes: [
      { when: "partial", text: "在 /sitemap.xml 提供一个标准 sitemap。" },
      { when: "fail", text: "发布 sitemap，让爬虫无需猜测即可发现页面。" },
    ],
  },
  "content-signal": {
    rule: "robots.txt 中包含一条带值的 Content-Signal 指令，值写在同一行，例如 `Content-Signal: search=yes, ai-input=yes, ai-train=no`。该指令在任意行首做不区分大小写的匹配。",
    onFail: "robots.txt 中没有 Content-Signal 指令。",
    fixes: [
      { when: "fail", text: "添加一行，例如：Content-Signal: search=yes, ai-input=yes, ai-train=no。采用尚早，权重也低，但它能在每个爬虫本来就会读取的文件里表明你的立场。" },
    ],
  },
  "jsonld-valid": {
    rule: "至少有一个 <script type=\"application/ld+json\"> 块能被解析为 JSON，并声明了至少一个 @ 关键字（@context、@type、@graph 或 @id）。只包含 {} 的块可以被解析但什么也没声明，因此不算数。",
    fixes: [
      { when: "fail", text: "添加带 Organization 和 WebSite 节点的 JSON-LD @graph。" },
    ],
  },
  "jsonld-entity": {
    rule: "解析出的 JSON-LD 中包含 Organization、WebSite、Person 或 LocalBusiness 的 @type。",
    fixes: [
      { when: "fail", text: "声明一个带稳定 @id 和 sameAs 列表的 Organization 节点。" },
    ],
  },
  "jsonld-content": {
    rule: "解析出的 JSON-LD 中包含 FAQPage、Article、BlogPosting、HowTo、Product、SoftwareApplication 或 BreadcrumbList 的 @type。",
    fixes: [
      { when: "fail", text: "标注页面类型，让引擎知道这是什么页面。" },
    ],
  },
  "word-count": {
    rule: "移除 script、style 和注释内容后的可见文本，至少包含 800 个词。300-799 为部分通过。",
    fixes: [
      { when: "partial", text: "生成式引擎偏好能完整覆盖一个主题的来源。希望被引用的页面请写到 800 词以上。" },
      { when: "fail", text: "扩充到至少 800 词的具体、不重复的内容。" },
    ],
  },
  "sections": {
    rule: "页面至少包含 4 个 H2 元素。2-3 个为部分通过。",
    fixes: [
      { when: "partial", text: "把内容拆成问题式章节，让每一节都能被独立检索。" },
      { when: "fail", text: "添加各自回答一个问题的 H2 章节。" },
    ],
  },
  "extractables": {
    rule: "页面同时包含 <ul>/<ol> 和 <table>。只有其中一种是部分通过。先排除 script 和 style 的内容，因此只出现在字符串里的标记不算数。",
    fixes: [
      { when: "partial", text: "列表和表格是引擎抽取最可靠的格式。在合适的地方两者都加上。" },
      { when: "fail", text: "把对比和步骤改写成列表或表格。" },
    ],
  },
  "statistics": {
    rule: "正文至少包含 5 个数字论断：百分比、金额、3.2x 形式的倍数、带千位分隔符的数字，或五位及以上的纯数字。单独出现的四位数不计入，因为它更常是年份而不是数据。",
    fixes: [
      { when: "partial", text: "加入具体数字。已发表的 GEO 研究报告称，统计数字和引用带来的可见度提升最大。" },
      { when: "fail", text: "为论断补上具体数字；没有支撑的断言很少被引用。" },
    ],
  },
  "quotations": {
    rule: "页面至少包含一个 <blockquote> 元素。",
    fixes: [
      { when: "fail", text: "引用具名专家是已发表研究中收益最高的改动之一。" },
    ],
  },
  "authority-citations": {
    rule: "页面链接到权威列表上的至少 2 个外部主机：arxiv.org、doi.org、nature.com、science.org、acm.org、ieee.org、springer.com、sciencedirect.com、任意 .gov 或 .edu 主机、wikipedia.org、github.com、developer.mozilla.org、web.dev、nih.gov、who.int 或 europa.eu。本站域名的链接不计入。",
    fixes: [
      { when: "partial", text: "引用多个独立权威来源，与被引用有很强的关联。" },
      { when: "fail", text: "引用论断背后的原始来源，并链接到它们。" },
    ],
  },
  "canonical": {
    rule: "页面声明了 rel=canonical 链接。",
    fixes: [
      { when: "fail", text: "声明 canonical URL，避免重复页面分散信号。" },
    ],
  },
  "qa-headings": {
    rule: "至少有 3 个 H2 或 H3 标题以问号结尾，或以 how、what、why、which、when、who、where、is、are、do、does、can、should 或 will 开头。",
    fixes: [
      { when: "partial", text: "把标题改写为客户会问的问题，并把关键词留在句子中。" },
      { when: "fail", text: "引擎检索的是与问题匹配的片段。标签式标题没有可供匹配的内容。" },
    ],
  },
  "faq": {
    rule: "解析出的 JSON-LD 中包含一个 FAQPage 节点。如果页面改用 <details>/<summary> 标记而没有该 schema，则为部分通过。",
    onFail: "没有 FAQPage schema。注意，该检查读取的是结构化数据，而不是 HTML 中是否出现 “faq” 或 “question” 字样。",
    fixes: [
      { when: "partial", text: "添加与页面已可见问题一致的 FAQPage schema。" },
      { when: "fail", text: "添加 5-10 组问答，并标注为 FAQPage。" },
    ],
  },
  "answer-first": {
    rule: "在前 30 组“标题后接段落”的组合中（H2/H3 之后可选地经过包装元素，再接一个 <p>），至少 60% 的开篇段落不超过 80 词。",
    fixes: [
      { when: "partial", text: "把答案放在每个标题下的第一句；过长的开篇很少被完整抽取。" },
      { when: "fail", text: "按“标题、紧接着一句话答案、再展开细节”的结构组织章节。" },
    ],
  },
  "https": {
    rule: "首页是通过 https:// 获取的，而不是只能通过明文 http:// 获取。",
    fixes: [
      { when: "fail", text: "通过 HTTPS 提供站点。浏览器会把明文 HTTP 标记为不安全，爬虫也越来越多地拒绝抓取它。" },
    ],
  },
  "about-contact": {
    rule: "页面上的链接同时包含关于类路径（about、company、team、who-we-are）和联系类路径（contact、support）或 mailto: 链接。",
    fixes: [
      { when: "partial", text: "模型会衡量谁对一个说法负责。两类页面都要链接。" },
      { when: "fail", text: "链接关于页面和联系入口，让发布方可以被识别。" },
    ],
  },
  "author": {
    rule: "作者身份由以下任一信号表明：解析出的 JSON-LD 中有 Person 节点、解析出的 JSON-LD 中有值非空的 author 属性、rel=\"author\"，或可见署名符合“by Firstname Lastname”的形式。",
    fixes: [
      { when: "fail", text: "把内容归属到具名的人或组织。" },
    ],
  },
  "sameas": {
    rule: "解析出的 JSON-LD 中包含值非空的 sameAs 属性。",
    fixes: [
      { when: "fail", text: "添加一组 sameAs 资料链接，让品牌归并为同一个实体。" },
    ],
  },
  "h1-single": {
    rule: "页面恰好包含一个非空的 <h1>。零个或多个都属于部分通过或失败的结果。",
    fixes: [
      { when: "fail", text: "添加一个 H1，说明页面讲的是什么。" },
      { when: "partial", text: "每个页面只保留一个 H1，其余的降为 H2。" },
    ],
  },
  "landmarks": {
    rule: "main、article、section、header、nav 和 footer 中至少有 3 个作为元素出现。",
    fixes: [
      { when: "partial", text: "使用 main、article、section、header、nav 和 footer，让解析器能找到章节边界。" },
    ],
  },
  "no-js-dependency": {
    rule: "不执行 JavaScript 时，原始服务器响应中包含至少 100 词的可见文本。",
    fixes: [
      { when: "fail", text: "爬虫不执行 JavaScript。把希望被引用的内容做服务端渲染。" },
    ],
  },
  "title": {
    rule: "<title> 长度在 15 到 65 个字符之间。",
    fixes: [
      { when: "partial", text: "控制在 15-65 个字符，避免标题在结果中被截断。" },
      { when: "fail", text: "添加一个描述性的标题。" },
    ],
  },
  "description": {
    rule: "meta description 长度在 50 到 160 个字符之间。",
    fixes: [
      { when: "partial", text: "控制在 50-160 个字符。" },
      { when: "fail", text: "写一段说明页面回答了什么的描述。" },
    ],
  },
  "opengraph": {
    rule: "至少存在一个以 og: 开头的 meta property。",
    fixes: [
      { when: "fail", text: "添加 Open Graph 标签，让分享出去的链接正常显示。" },
    ],
  },
  "html-lang": {
    rule: "<html> 元素带有 lang 属性。",
    fixes: [
      { when: "fail", text: "声明语言，让页面能在正确的市场被检索到。" },
    ],
  },
  "llms-txt": {
    rule: "/llms.txt 返回超过 20 字节，并包含一个 H1、一行 > 摘要和至少 3 个 markdown 链接。缺少其中任何一项即为部分通过。",
    fixes: [
      { when: "partial", text: "遵循约定：一个 H1、一行 > 摘要，然后是带说明链接的 H2 章节。" },
      { when: "fail", text: "这是可选项，权重也因此很低，但添加成本不高。参见 llms.txt 指南。" },
    ],
  },
  "ai-context-robots": {
    rule: "robots.txt 可读取，即已公布爬虫政策。可读取指响应体含有非空白内容：返回 HTTP 200 但响应体为空或只有空白字符的，没有公布任何政策，该检查不通过，与 robots-present 的判定相同。",
    fixes: [
      { when: "fail", text: "发布 robots.txt，说明欢迎哪些爬虫。" },
    ],
  },
  "markdown-alternate": {
    rule: "文档 head 中包含同时带有 rel=\"alternate\" 和 type=\"text/markdown\" 的 <link>，两个属性的顺序不限。",
    onFail: "页面没有声明 markdown 替代版本。",
    fixes: [
      { when: "fail", text: "发布该页面的 markdown 版本，并用 <link rel=\"alternate\" type=\"text/markdown\" href=\"...\"> 指向它，让 agent 能绕过页面框架直接获取内容。" },
    ],
  },
  "date-machine": {
    rule: "在 dateModified、datePublished 或 article:modified_time 中找到机器可读的日期。12 个月内为完全通过；更早为部分通过。如果只有 HTTP Last-Modified 头带有日期，则为部分通过。",
    fixes: [
      { when: "partial", text: "更新对日期敏感的页面，并在更新时同步修改日期。" },
      { when: "partial", text: "在 schema 和 meta 标签中使用 ISO 8601 日期（YYYY-MM-DD）。" },
      { when: "partial", text: "同时在结构化数据中声明 dateModified；响应头不会展示给读者。" },
      { when: "partial", text: "在结构化数据中声明 dateModified，并保持其更新。" },
      { when: "fail", text: "发布机器可读的修改日期。" },
    ],
  },
  "copyright-year": {
    rule: "当前日历年出现在可见正文中。",
    fixes: [
      { when: "fail", text: "更新站点，让当前年份可见；过期的日期信号会降低被生成式回答选中的机会。" },
    ],
  },
  "hreflang": {
    rule: "至少声明 2 个不同的 hreflang 语言代码。同一语言的重复属性不计入，x-default 是默认标记而不是语言，因此只声明 `en` 加 `x-default` 的单语言站点不算满足该规则。完全没有声明 hreflang 的页面不按该规则评分：只抓取一个页面时，扫描器无法区分单语言站点和尚未声明各语言版本的多语言站点，因此这种情况标记为不适用，而不是失败。只声明一个代码仍然失败。",
    fixes: [
      { when: "fail", text: "为你实际提供的每个语言版本声明 hreflang，让每个版本都能在其对应市场被检索到。" },
    ],
  },
  "lang-region": {
    rule: "在 <html lang>、og:locale 或 hreflang 属性中出现带地区子标签的语言标记，例如 en-GB、en_GB 或 de-AT。只写语言、不带地区的标记（如 “en”）不满足该规则；那是 html-lang 检查的内容。",
    fixes: [
      { when: "fail", text: "在需要的地方声明地区，例如 lang=\"en-GB\"、og:locale=\"en_GB\" 或 hreflang=\"de-AT\"。" },
    ],
  },
  "viewport": {
    rule: "存在 meta viewport 标签。",
    fixes: [
      { when: "fail", text: "添加 viewport meta 标签，让页面能在移动端正常渲染。" },
    ],
  },
  "payload": {
    rule: "未压缩的 HTML 响应小于 500 KB。",
    fixes: [
      { when: "partial", text: "精简标记；爬虫和设备的解析预算都是有限的。" },
    ],
  },
};
