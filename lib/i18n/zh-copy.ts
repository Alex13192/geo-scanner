/**
 * Chinese copy for the deep pages.
 *
 * WHY A MODULE AND NOT STRINGS INSIDE EACH PAGE: the dimension labels are rendered by both the
 * Chinese methodology page and the Chinese checks overview, and the rule pages will follow. A
 * second hand-written copy of the same twelve labels is how a translation starts disagreeing
 * with itself - the same failure the site documents for every other single source of truth.
 *
 * The ids are the catalogue's ids; a rule renamed in lib/geo/catalog.ts will not resolve here,
 * which is the point: an untranslated rule shows its English title rather than a wrong one.
 */

export const ZH_DIMENSION_LABELS: Record<string, string> = {
  "ai-crawler-access": "AI 爬虫访问",
  "machine-readability": "机器可读性",
  "content-depth": "内容深度",
  citability: "可引用性与证据",
  "answer-readiness": "答案就绪度",
  "trust-authority": "信任与权威",
  "semantic-structure": "语义结构",
  metadata: "元数据与可发现性",
  "llms-txt": "AI 上下文文件",
  freshness: "时效性",
  multilingual: "国际就绪度",
  delivery: "交付与移动端",
};

/** One sentence per dimension: why it carries the weight it carries. */
export const ZH_DIMENSION_SUMMARIES: Record<string, string> = {
  "ai-crawler-access": "爬虫读不到页面，后面的规则都无从谈起。",
  "machine-readability": "JSON-LD 把品牌名、域名和产品绑定成一个实体。",
  "content-depth": "生成式引擎偏好能完整回答一个问题的页面，而不是薄页。",
  citability: "统计数字、直接引语和外部来源是收益最大的可引用性投入。",
  "answer-readiness": "答案以片段被抽取，问题式标题加直接回答最容易被取走。",
  "trust-authority": "E-E-A-T 信号决定模型是否敢把你的说法当作事实重复。",
  "semantic-structure": "标题层级和地标元素决定解析器能否定位章节边界。",
  metadata: "标题、描述和 canonical 决定搜索或答案界面展示什么。",
  "llms-txt": "一个便宜的、可选的信号：让站点用一个 URL 说明自己的上下文。",
  freshness: "有日期的内容在生成回答里更受重视；没有日期的页面无法被判断新旧。",
  multilingual: "语言和地区标记决定页面能被哪个语言市场检索到。",
  delivery: "过慢或不适配移动端的页面，在内容分析开始前就被丢弃。",
};

/**
 * The 40 published rule titles. Technical terms (robots.txt, JSON-LD, canonical, hreflang,
 * schema names) stay in their original form because that is what the reader will see in the
 * scan output and in every other tool; translating them would make the page harder to use.
 */
export const ZH_CHECK_TITLES: Record<string, string> = {
  "robots-present": "robots.txt 可访问",
  "robots-ai-allowed": "没有屏蔽 AI 爬虫",
  "robots-sitemap": "robots.txt 声明了 sitemap",
  "home-200": "首页返回 HTTP 200",
  "home-noindex": "首页被标记为 noindex",
  "sitemap-valid": "sitemap.xml 存在且格式正确",
  "content-signal": "robots.txt 声明了内容政策",
  "jsonld-valid": "存在合法的 JSON-LD",
  "jsonld-entity": "声明了实体节点",
  "jsonld-content": "存在内容类型 schema",
  "word-count": "正文内容充足",
  sections: "内容按章节组织",
  extractables: "存在列表和表格",
  statistics: "存在量化数据",
  quotations: "存在直接引语",
  "authority-citations": "引用了外部权威来源",
  canonical: "声明了 canonical URL",
  "qa-headings": "标题是真实问句",
  faq: "存在 FAQPage schema",
  "answer-first": "标题后有直接答案",
  https: "通过 HTTPS 提供服务",
  "about-contact": "链接了关于与联系页面",
  author: "注明了作者身份",
  sameas: "实体有站外交叉引用",
  "h1-single": "只有一个 H1",
  landmarks: "使用了语义化地标",
  "no-js-dependency": "主要内容在 HTML 中",
  title: "标题长度在范围内",
  description: "meta description 长度在范围内",
  opengraph: "存在 Open Graph 标签",
  "html-lang": "声明了文档语言",
  "llms-txt": "/llms.txt 存在且结构正确",
  "ai-context-robots": "公布了爬虫政策",
  "markdown-alternate": "声明了 markdown 替代版本",
  "date-machine": "存在机器可读且较新的日期",
  "copyright-year": "内容中出现当前年份",
  hreflang: "声明了其他语言版本",
  "lang-region": "声明了地区化语言设置",
  viewport: "存在 viewport meta 标签",
  payload: "HTML 体积合理",
};
