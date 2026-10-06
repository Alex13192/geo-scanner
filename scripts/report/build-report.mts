/**
 * Build a client-facing GEO diagnostic report from a REAL scan of one domain.
 *
 * WHAT THIS IS: the batch half of the report product. It runs the site's own analyser
 * (lib/geo/scan.ts -> lib/geo/analyze.ts) against a domain and writes a format-neutral
 * model plus a Markdown rendering. The Office formats are produced from the same model by
 * scripts/report/render-report.py.
 *
 * WHY IT IS A SCRIPT AND NOT A ROUTE. The site's Worker runs on the Free plan, where the CPU
 * budget is 10 ms per invocation and cannot be raised (OPERATIONS.md measures the consequence:
 * intermittent 1102s). A scan is a handful of outbound requests plus parsing; the report is a
 * document build on top of that. Neither belongs in a page view. This is the same reasoning that
 * put the weekly report in cron/ rather than in the site's worker.
 *
 * WHY THE MODEL IS JSON AND THE COPY LIVES IN IT. Three formats are rendered from one model, and
 * the human-readable strings are part of that model rather than part of each renderer. If the
 * section titles lived in the Python file, the Markdown and the DOCX could disagree about what a
 * section is called - which is the same class of drift as two scoring implementations, and this
 * repository already refuses that one (lib/geo/scan.ts exists so the cron and the API cannot
 * score differently).
 *
 * WHAT IT DELIBERATELY DOES NOT CONTAIN: any AI-visibility metric. No mention rate, no
 * recommendation rate, no per-platform breakdown. Those require actually querying AI platforms,
 * and this scanner does not do that - app/(en)/report/page.tsx says so in as many words ("It does
 * not ask any AI engine about you"). A report that invented those numbers would contradict the
 * product's only real asset, which is that it does not claim what it has not measured. The
 * limitations section is generated, not decorative.
 *
 * SCORING IS NEVER RECOMPUTED HERE. Every number below comes from AnalyzeResult as the analyser
 * produced it. The one derived figure is `pointsAtStake`, which is the site's own published
 * formula (a check's share of its dimension times that dimension's weight) and is computed from
 * the analyser's own earned/possible/applicableWeight rather than from a second opinion.
 *
 * Usage (English by default, since the product is sold globally; the site itself is app/(en)/):
 *
 *   npm run report -- --domain=example.com [--out=reports/...] [--lang=zh] [--no-pdf]
 *
 * WHAT EACH OUTPUT NEEDS, and each one degrades on its own rather than taking the run down with it:
 *
 *   report-model.json, report.md   Node only. Always written.
 *   report.docx, report.xlsx       Python with python-docx, openpyxl and Pillow. Auto-detected;
 *                                  REPORT_PYTHON names an interpreter that has them.
 *   report.pdf                     A LibreOffice kit, named by REPORT_PDF_KIT_NODE and
 *                                  REPORT_PDF_KIT_CLI. Skipped when unset, and a failure is fatal
 *                                  when they are set - see exportPdf below for why those differ.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runScan } from "../../lib/geo/scan.ts";
import { inspectTarget } from "../../lib/net/fetch-safe.ts";
import { SITE_HOST, SITE_URL } from "../../lib/site.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");

/* ------------------------------------------------------------------ */
/* Copy. Report scaffolding only - never engine copy.                  */
/* ------------------------------------------------------------------ */

type Copy = Record<string, string>;

const DIMENSION_ZH: Record<string, string> = {
  "ai-crawler-access": "AI 爬虫可访问性",
  "machine-readability": "机器可读性",
  "content-depth": "内容深度",
  citability: "可引用性与证据",
  "answer-readiness": "答案就绪度",
  "trust-authority": "信任与权威",
  "semantic-structure": "语义结构",
  metadata: "元数据与可发现性",
  "llms-txt": "AI 上下文文件",
  freshness: "时效性",
  multilingual: "国际化就绪",
  delivery: "交付与移动端",
};

/**
 * The six legacy metrics ARE six of the twelve dimensions under different keys, and the site
 * already says so: app/(en)/report/ReportWidget.tsx renders them with the dimension labels in
 * legacyDimensions(). Reusing that mapping is the reason this file has no second label map for
 * them - an English report briefly showed "trustAuthority" on the radar, which is what inventing
 * one's own names for numbers the product has already named looks like.
 */
const METRIC_DIMENSION: Record<string, string> = {
  crawlability: "ai-crawler-access",
  understandability: "semantic-structure",
  answerReadiness: "answer-readiness",
  citability: "citability",
  trustAuthority: "trust-authority",
  contentDepth: "content-depth",
};

const COPY: Record<"zh" | "en", Copy> = {
  zh: {
    reportName: "GEO 诊断报告",
    overview: "一页纸总览",
    scoreCaption: "综合技术评分",
    scoreOf: "满分 100",
    subtitle: "对 {domain} 首页的单 URL 扫描",
    calloutFixes:
      "共 {count} 项检查未通过。按分值排序，最值得先修的是「{topFix}」，修正后综合分约 +{topPoints} 分；得分最低的维度是「{weakLabel}」（{weakScore}/100，占权重 {weakWeight}%）。",
    calloutAllPass: "全部适用检查均通过，没有需要修复的项。",
    tableItem: "项目",
    tableValue: "结果",
    kScore: "综合评分",
    kGrade: "等级",
    kPassed: "通过的检查",
    kNotApplicable: "不适用的检查",
    kPageType: "页面类型",
    kScheme: "访问协议",
    kHomeStatus: "首页 HTTP 状态",
    kBrowserProbe: "浏览器探针状态",
    kFinalUrl: "最终 URL",
    kTruncated: "响应是否被截断",
    kScannedAt: "扫描时间",
    yes: "是",
    no: "否",
    notMeasured: "未测量",
    probeNotNeeded: "未发起（首页正常返回）",
    sectionDimensions: "维度分解",
    sectionCompetitors: "同业对照（客户指定站点）",
    competitorsNote:
      "对照使用同一套引擎、同一天、对客户指定的 {n} 个站点各做一次单 URL 扫描。它不代表该品牌的真实市场，不是排名，也不是行业抽样：对手由客户点名，未点名的对手不在这里。未被测量的对象在表中标为“未测量”，其单元格不得被读作 0 分。",
    competitorsUnmeasured: "未测量",
    competitorsSomeUnmeasured:
      "下列站点本次未取得响应，因此没有任何分数，本报告也不据此对其作出任何判断：{list}。",
    competitorsNoteErrorStatus:
      "⚠ 下列站点没有返回 200：{list}。这些分数描述的是那次错误响应，不是对方的页面——被拒绝的请求可能来自对方的防爬规则，与对方的 GEO 水平无关。",
    competitorsOverallRow: "综合评分",
    competitorsHeaderDimension: "维度（满分 100）",
    competitorsHeaderSite: "本站",
    tableDimension: "维度",
    tableWeight: "权重",
    tableScore: "得分",
    tablePoints: "得分 / 满分",
    tableRationale: "该维度的口径",
    tablePriority: "优先级",
    tableCheck: "检查项",
    tableSeverity: "严重度",
    tableAtStake: "修正后约得",
    tableEvidence: "观察到的证据",
    tableFix: "建议动作",
    tableStatus: "状态",
    sectionFixes: "修复清单（按分值排序）",
    sectionChecks: "全部检查结果",
    sectionLimits: "这份报告不能告诉你什么",
    sectionMethod: "方法与口径",
    severityHigh: "高",
    severityMedium: "中",
    severityLow: "低",
    statusPass: "通过",
    statusWarn: "建议",
    statusFail: "未通过",
    statusNa: "不适用",
    pointsUnit: " 分",
    figBar: "图 1｜各维度得分（0–100，权重见下表）",
    figRadar: "图 2｜六项能力视图（0–100）。六项由十二个维度组合而成，与站点 /report/ 页同一口径。",
    limitOnlyHomepage:
      "只扫描了首页。内页、模板页和整站结构完全不在单 URL 扫描的范围内。",
    limitNoAi:
      "没有询问任何 AI 引擎。本报告不测量 ChatGPT、豆包、Kimi 或文心一言当前是否提及或推荐该品牌，也不测量推荐率、引用来源或竞品压制——那些数字必须通过真实调用平台获得。",
    limitNoCitation: "高分不等于会被引用。它只说明页面处于“可能被引用”的状态。",
    limitWaf:
      "被拒绝不等于被封禁。大型站点按 IP 校验爬虫，扫描器可能被拒而真实爬虫正常访问；访问判定以 robots.txt 的声明为准。",
    limitCwv: "性能检查是粗粒度的。真实 Core Web Vitals 需要浏览器，本扫描器刻意不运行浏览器。",
    limitIpHint:
      "若首页状态非 200，“浏览器探针状态”一栏说明这是针对机器人 UA 的规则还是针对扫描来源地址的限制。",
    methodEngine:
      "评分引擎与站点 /report/ 页、每周监测邮件完全同一套代码（lib/geo/scan.ts）。本报告不重新计算任何分数。",
    methodWeights:
      "维度权重、每一项检查的通过条件与证据来源全部公开在 {url}/methodology/，可以逐条核对。",
    methodPointsAtStake:
      "“修正后约得”= 该检查在其维度内的权重 ÷ 该维度适用检查权重之和 × 该维度实际权重，即站点发布的口径。",
    methodApplicable:
      "不适用的检查同时离开分子与分母，因此既不加分也不扣分；剩余权重重新归一化，所以分数读作“在可评估范围内的百分比”。",
    methodGenerated: "本报告由 {url} 的扫描器于 {date} 生成。",
    footer: "GEO 诊断报告",
    sheetOverview: "总览",
    sheetDimensions: "维度分解",
    sheetFixes: "修复清单",
    sheetChecks: "全部检查",
    sheetMeta: "元数据",
    sheetAbout: "说明与边界",
    aboutPurpose: "用途",
    aboutPurposeText:
      "单 URL 的 GEO 技术诊断。用于定位“页面处于什么状态、哪些项在扣分、先修什么”。",
    aboutNotAi:
      "本报告不含任何 AI 可见度指标（提及率、推荐率、竞品压制、信源引用），因为本扫描器不调用任何 AI 平台。",
  },
  en: {
    reportName: "GEO Diagnostic Report",
    overview: "One-page overview",
    scoreCaption: "Technical score",
    scoreOf: "out of 100",
    subtitle: "Single-URL scan of the {domain} homepage",
    calloutFixes:
      "{count} check(s) did not pass. Ordered by what they are worth, the first to fix is \"{topFix}\" (+{topPoints} points); the lowest-scoring dimension is {weakLabel} at {weakScore}/100, carrying {weakWeight}% of the weight.",
    calloutAllPass: "Every applicable check passed. There is nothing to fix.",
    tableItem: "Item",
    tableValue: "Result",
    kScore: "Overall score",
    kGrade: "Grade",
    kPassed: "Checks passed",
    kNotApplicable: "Checks not applicable",
    kPageType: "Page type",
    kScheme: "Scheme",
    kHomeStatus: "Homepage HTTP status",
    kBrowserProbe: "Browser probe status",
    kFinalUrl: "Final URL",
    kTruncated: "Response truncated",
    kScannedAt: "Scanned at",
    yes: "yes",
    no: "no",
    notMeasured: "not measured",
    probeNotNeeded: "not made (the homepage answered normally)",
    sectionDimensions: "Dimensions",
    sectionCompetitors: "Competitor comparison (sites the client named)",
    competitorsNote:
      "The comparison runs the same engine on the same day, once over each of the {n} sites the client named. It is not the brand's real market, not a ranking, and not a sample of the industry: the sites are the client's choice, and competitors they did not name are not here. An unmeasured site is marked \"not measured\"; its cell must not be read as a zero.",
    competitorsUnmeasured: "not measured",
    competitorsSomeUnmeasured:
      "No response was obtained for the following site(s) on this run, so there is no score for them and this report draws no conclusion about them: {list}.",
    competitorsNoteErrorStatus:
      "Warning: the following site(s) did not answer 200: {list}. Those scores describe the error response, not the rival's page - a refusal can be an anti-bot rule and says nothing about their GEO.",
    competitorsOverallRow: "Overall",
    competitorsHeaderDimension: "Dimension (out of 100)",
    competitorsHeaderSite: "This site",
    tableDimension: "Dimension",
    tableWeight: "Weight",
    tableScore: "Score",
    tablePoints: "Earned / possible",
    tableRationale: "What it measures",
    tablePriority: "Priority",
    tableCheck: "Check",
    tableSeverity: "Severity",
    tableAtStake: "Worth",
    tableEvidence: "Observed evidence",
    tableFix: "Recommended action",
    tableStatus: "Status",
    sectionFixes: "Fix list, ordered by points at stake",
    sectionChecks: "Every check",
    sectionLimits: "What this report cannot tell you",
    sectionMethod: "Method and definitions",
    severityHigh: "high",
    severityMedium: "medium",
    severityLow: "low",
    statusPass: "pass",
    statusWarn: "warn",
    statusFail: "fail",
    statusNa: "n/a",
    pointsUnit: " pts",
    figBar: "Figure 1 - Score by dimension (0-100; weights in the table)",
    figRadar: "Figure 2 - Six capability metrics (0-100), composed from the twelve dimensions.",
    limitOnlyHomepage:
      "Only the homepage was read. Interior pages, templates and site structure are outside a single-URL scan entirely.",
    limitNoAi:
      "No AI engine was asked anything. This report does not measure whether ChatGPT, Doubao, Kimi or ERNIE mention or recommend the brand, nor recommendation rate, cited sources or competitor pressure - those require actually querying the platforms.",
    limitNoCitation:
      "A high score is not a promise of a citation. It says the page is in a state that makes being cited possible.",
    limitWaf:
      "A refused request is not proof of a block. Large sites verify crawlers by IP, so a scanner can be turned away while real crawler traffic is served normally; the verdict follows robots.txt, which is stated intent.",
    limitCwv:
      "Performance checks are coarse. Real Core Web Vitals need a browser, and this scanner deliberately does not run one.",
    limitIpHint:
      "When the homepage did not return 200, the browser-probe row separates a rule aimed at bot user-agents from a restriction on the address the scan came from.",
    methodEngine:
      "The scoring engine is the same code the /report/ page and the weekly monitoring email use (lib/geo/scan.ts). No score is recomputed for this document.",
    methodWeights:
      "Every dimension weight, pass condition and evidence source is published at {url}/methodology/ and can be checked line by line.",
    methodPointsAtStake:
      "\"Worth\" = the check's share of its dimension's applicable weight, times that dimension's applicable weight - the formula the site publishes.",
    methodApplicable:
      "An inapplicable check leaves both the numerator and the denominator, so it can neither add nor cost points; the remaining weights are renormalised, which is why the score reads as a percentage of what could be assessed.",
    methodGenerated: "Generated by the scanner at {url} on {date}.",
    footer: "GEO Diagnostic Report",
    sheetOverview: "Overview",
    sheetDimensions: "Dimensions",
    sheetFixes: "Fix list",
    sheetChecks: "All checks",
    sheetMeta: "Metadata",
    sheetAbout: "About and limits",
    aboutPurpose: "Purpose",
    aboutPurposeText:
      "A single-URL GEO technical diagnosis: what state the page is in, which checks cost points, and what to fix first.",
    aboutNotAi:
      "This report contains no AI-visibility metric (mention rate, recommendation rate, competitor pressure, cited sources), because this scanner does not call any AI platform.",
  },
};

/* ------------------------------------------------------------------ */
/* Arguments                                                          */
/* ------------------------------------------------------------------ */

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

const fromModelArg = arg("from-model");
const domain = (arg("domain") || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

if (!domain && !fromModelArg) {
  console.error(
    [
      "Usage:",
      "  npm run report -- --domain=example.com [--competitors=a.com,b.com] [--out=DIR] [--lang=zh] [--no-pdf]",
      "  npm run report -- --from-model=reports/<dir>/report-model.json [--out=DIR] [--no-pdf]",
      "",
      "--from-model re-renders a report that was already scanned, without touching the domain",
      "again. That is what makes adding a format - or fixing a heading - cheap, and it matters:",
      "a client's site should not be crawled five times while somebody adjusts typography.",
      "",
      "Competitors are scanned in the order they are typed, one at a time and paced (see",
      "COMPETITOR_GAP_MS). They are NOT scanned on a --from-model re-render: the comparison",
      "travels in the model, so re-rendering cannot silently show yesterday's rival scores",
      "under today's date, and it cannot spend three crawls to fix a heading.",
    ].join("\n")
  );
  process.exit(2);
}

/**
 * English is the DEFAULT, and that is a product decision rather than a technical one: every route
 * on this site lives under app/(en)/, the scanner's published method is written in English, and the
 * market is global. A Chinese report is the exception a client asks for, not the case to fall into
 * by accident - which is what a `zh` default would make it.
 */
const lang: "zh" | "en" = arg("lang") === "zh" ? "zh" : "en";
const C = COPY[lang];
const stamp = new Date().toISOString().slice(0, 10);

/**
 * Where the outputs go. A re-render lands beside the model it read, which is the only sensible
 * default: the first version of this fell through to the scan's naming rule with an empty domain
 * and wrote to `reports/-2026-10-05/`, silently producing a second copy of the report in a
 * directory whose name means nothing.
 */
const fromModelPath = fromModelArg ? resolve(REPO, fromModelArg) : null;
const outDir = resolve(
  REPO,
  arg("out") ||
    (fromModelPath
      ? dirname(fromModelPath)
      : join("reports", `${domain.replace(/[^a-z0-9.-]/gi, "_")}-${stamp}`))
);
mkdirSync(outDir, { recursive: true });

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

/**
 * A timestamp a client can read, built by hand rather than with toLocaleString.
 *
 * WHY NOT THE LOCALE: toLocaleString depends on the machine and the runtime's ICU build, so the
 * same scan would print differently on two machines and a report could change without the data
 * changing. The raw ISO string stays in the model and in the workbook's metadata sheet, which is
 * where a machine should read it from.
 */
function displayDate(iso: string, forLang: "zh" | "en"): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  if (forLang === "zh") {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${time}`;
  }
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${time}`;
}

/* ------------------------------------------------------------------ */
/* Competitors                                                        */
/* ------------------------------------------------------------------ */

/**
 * One competitor's scan, as it enters the model, and the reason a failed one has no numbers in it.
 *
 * WHY "measured" IS A FIELD AND NOT AN INFERENCE FROM A MISSING SCORE. A JSON null and a zero are
 * the same thing to a renderer that is not told the difference, and the failure this repository
 * cannot afford is a competitor's 403 or a DNS timeout printed as "0/100" - which reads as "this
 * rival is terrible at GEO" and is a fabricated finding about a third party the client will act
 * on. The flag is what lets all three renderers put "not measured" in the cell instead.
 *
 * `dimensions` is keyed by the engine's own dimension id rather than by position, because that is
 * the key the rest of this pipeline already joins on (ReportWidget.tsx, cron/report.ts) and a
 * positional array would silently mis-align if the engine ever reorders its dimensions.
 */
type Competitor = {
  domain: string;
  measured: boolean;
  score: number | null;
  grade: string | null;
  gradeLabel: string | null;
  /** Of the model's 12 dimension ids; empty when not measured. */
  dimensions: Record<string, number>;
  /**
   * The homepage status the score was computed from, and the browser-probe answer when there was
   * one. Null when the competitor was not measured at all.
   *
   * WHY THESE TRAVEL WITH THE SCORE. A scan of otterly.ai answered HTTP 403, and the engine scored
   * that refusal at 14/100 - correctly, because the site's published rule for a non-200 homepage is
   * to score the error response and say so. A column of mostly zeros under a WAF refusal is not,
   * however, a statement that the rival is bad at GEO, and a report that prints "14" with no status
   * beside it has made one. The status is what lets the note under the table say which columns
   * describe a page and which describe a refusal, and `browserStatus` is the same diagnostic the
   * site's own report uses: served to a browser but refused to a crawler is a rule aimed at bots,
   * while refused to both is a restriction on this scanner's address and says nothing about them.
   */
  homeStatus: number | null;
  browserStatus: number | null;
  /** Why there are no numbers. Present exactly when `measured` is false. */
  reason: string | null;
};

/**
 * The floor on the gap between two competitor scans, and the number that is actually load-bearing.
 *
 * WHY THIS EXISTS AT ALL. The site's own /api/scan token bucket allows 20 requests per 60 seconds
 * per isolate (lib/net/rate-limit.ts), and this run leaves from one address, so a client who names
 * a dozen rivals is asking for a dozen crawls from one place in under a minute. Pacing is therefore
 * part of the method rather than politeness: without it the site starts refusing this script, and a
 * refusal must not be recorded as a finding about the competitor - which is the one way this
 * feature can produce a number that is worse than no number.
 *
 * WHY IT ALSO COVERS THE CLIENT'S OWN SCAN, which is longer than four seconds. The gap is measured
 * from the START of the previous scan, not the end, so the three or four support-file requests that
 * follow the homepage are inside the window rather than added to it. A sleep-after-each-scan
 * version left more than twice this gap between scans - it worked, and it was a slower promise than
 * the comment claimed, which is how a stated pace and an actual one drift apart.
 */
const COMPETITOR_GAP_MS = 4000;

/**
 * How many competitors one run will attempt, and why there is a number at all.
 *
 * Not a technical limit: twelve dimension rows against an unbounded number of columns is a table
 * that stops being readable long before it stops fitting a page, and each column costs a crawl of
 * somebody else's site. The cap says so out loud instead of letting a typo in a comma-separated
 * list turn into a crawler run over a domain nobody chose.
 */
const COMPETITOR_MAX = 8;

/**
 * Normalise a competitor to the same hostname shape the API route's own cleanDomain produces, so a
 * pasted https://rival.com/pricing and a typed rival.com are the same request and the same column.
 */
function cleanDomain(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase();
}

/**
 * The domains named with --competitors, in the order they were typed.
 *
 * ORDER IS THE USER'S, and it is preserved rather than sorted: the columns come out in the order
 * the client listed their rivals, which is the order they will read them in. De-duplication is by
 * the cleaned hostname, so `www.rival-a.com` and `rival-a.com` cannot become two columns carrying
 * the same numbers, and the site's own domain is dropped because a competitor column that is this
 * site's column is a comparison the client would read as a coincidence.
 */
const competitorDomains = [
  ...new Set(
    (arg("competitors") || "")
      .split(",")
      .map(cleanDomain)
      .filter(Boolean)
  ),
].filter((d) => d !== cleanDomain(domain));

if (competitorDomains.length > COMPETITOR_MAX) {
  console.warn(
    [
      `--competitors names ${competitorDomains.length} domains; only the first ${COMPETITOR_MAX} will be scanned.`,
      `Each column is a crawl of somebody else's site, paced at ${COMPETITOR_GAP_MS / 1000}s, and a 12-row`,
      "table stops being readable well before it stops fitting the page. Split the list over two runs",
      "rather than raising this: the model of the second run is a complete report too.",
    ].join("\n")
  );
  competitorDomains.length = COMPETITOR_MAX;
}

/**
 * Scan the competitors named on the command line, one at a time and paced.
 *
 * WHY THIS DOES NOT GO THROUGH `${SITE_URL}/api/scan?brief=1`, which is how scripts/run-study.mts
 * gathers the published study - and this is the file's biggest deliberate departure, so here is
 * what was rejected and why:
 *
 *   - The brief form is what that endpoint offers for a sweep, and it returns ONE score with no
 *     dimension objects. The table this feature adds is twelve dimension rows, so the brief form
 *     cannot fill it, and the full form is the same bytes the client's own scan already pulls.
 *   - The route's token bucket is the thing lib/geo/scan.ts was written for. Its header says so:
 *     the weekly report "cannot call that endpoint instead ... a run over a hundred subscribers
 *     would be refused by its own site a fifth of the way in", and the fix was to import this
 *     module. A client-named competitor list is the same shape of problem at a smaller size, and
 *     reaching for runScan here is the repository's existing answer rather than a new one.
 *   - The site's own scan in this same script already calls runScan directly. Going over HTTP for
 *     the rivals would have the comparison scored by a different entry point from the column it
 *     is compared against, which is the one thing the comparison must not be.
 *
 * So the pacing below is not what protects a shared limit here - there is no shared limit on this
 * path. It is kept because the crawls are still this machine's, they still land on somebody
 * else's origin, and the number the comment in run-study.mts defends (roughly 4s) is the pace this
 * product has already decided it is willing to be measured at.
 *
 * A competitor that produces nothing gets `measured: false` and a human-readable reason. There is
 * no path through this function that returns a score that was not read off a scan.
 */
async function scanCompetitors(
  domains: string[],
  forLang: "zh" | "en",
  context: { domain: string; scanned: boolean }
): Promise<Competitor[]> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const out: Competitor[] = [];

  if (domains.length === 0) return out;

  /*
   * The generic "we got nothing" reason, per language, because the model's other prose is per
   * language and a fixed English string here would surface in the middle of a Chinese report.
   * The per-target inspectTarget reason is the engine's own sentence and is quoted as the engine
   * wrote it rather than translated: it names the rule that refused the target, and paraphrasing
   * a rule is how a report stops matching its own method page.
   */
  const genericReason =
    forLang === "zh"
      ? "未取得响应：请求超时或域名无法解析"
      : "no response: the request timed out or the domain did not resolve";

  let previousStart = context.scanned ? null : Date.now();

  for (const rival of domains) {
    if (previousStart !== null) {
      const wait = COMPETITOR_GAP_MS - (Date.now() - previousStart);
      if (wait > 0) await sleep(wait);
    }
    previousStart = Date.now();

    console.log(`Scanning competitor ${rival} …`);

    /*
     * Refuse a target that points at a network rather than a website before loading the engine.
     * The API route does this too (app/api/scan/route.ts) and for the same reason: the alternative
     * is a fetch timeout, which is indistinguishable in the output from "their site was down" -
     * a statement about the competitor that this run has not established.
     */
    const target = inspectTarget(`https://${rival}`);
    if (!target.ok) {
      console.log(`  ${rival}: not scanned - ${target.reason}`);
      out.push({
        domain: rival,
        measured: false,
        score: null,
        grade: null,
        gradeLabel: null,
        dimensions: {},
        homeStatus: null,
        browserStatus: null,
        reason: target.reason,
      });
      continue;
    }

    const scan = await runScan(rival);
    if (!scan.reachable) {
      console.log(`  ${rival}: no response - recorded as not measured`);
      out.push({
        domain: rival,
        measured: false,
        score: null,
        grade: null,
        gradeLabel: null,
        dimensions: {},
        homeStatus: null,
        browserStatus: null,
        reason: genericReason,
      });
      continue;
    }

    const r = scan.result;
    out.push({
      domain: rival,
      measured: true,
      score: r.score,
      grade: r.grade,
      gradeLabel: forLang === "zh" ? "" : r.gradeLabel,
      dimensions: Object.fromEntries(r.dimensions.map((d) => [d.id, d.score])),
      homeStatus: scan.homeStatus,
      browserStatus: scan.browserStatus,
      reason: null,
    });
    /*
     * The status is printed for every competitor rather than only for the ones that failed, so
     * that "200" here and "no 200" in the report's own table are visibly the same measurement. A
     * refused rival is marked with the same warning the site's own scan would get, because the run
     * has produced a number and the reader has to be told what that number is about.
     */
    console.log(
      `  ${rival}: ${r.score}/100 ${r.grade} (homepage HTTP ${scan.homeStatus}` +
        `${scan.homeStatus === 200 ? "" : ", so this score describes an error response, not the page"})`
    );
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Scan                                                               */
/* ------------------------------------------------------------------ */

/**
 * The comparison's prose, composed from the competitor array and the copy block, in one place.
 *
 * WHY THIS IS A FUNCTION AND NOT THREE TOP-LEVEL CONSTANTS, which is how it was written first and
 * why the first end-to-end run died on "Cannot access 'comparisonNote' before initialization": the
 * model is built INSIDE scanAndBuildModel(), which runs before any later top-level const exists, so
 * a constant that the model needs cannot be one. Making it a hoisted function removes the ordering
 * question for both callers - the scan, which needs these strings to put into the model, and the
 * re-render, which reads them back out - and both call it with the same C, so the DOCX and the
 * Markdown still cannot disagree.
 *
 * WHAT IT COMPOSES, and these are two different statements rather than one list of complaints:
 *   - the method paragraph, which is true of every comparison and says what this is NOT;
 *   - the error-status warning, for rivals that answered but not with 200. Their column holds real
 *     scores that describe a refusal, and a reader has to be told that before quoting them;
 *   - the not-measured warning, for rivals that answered with nothing. Their column holds no score
 *     at all, and the report draws no conclusion from it.
 * The reason strings inside those lists are already in the report's language, because
 * scanCompetitors writes them in the client's language rather than in this function.
 */
function composeComparisonProse(
  rivals: Competitor[],
  copy: Copy
): { note: string; warnings: string[] } {
  const fill = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

  const errored = rivals.filter((c) => c.measured && c.homeStatus !== null && c.homeStatus !== 200);
  const missing = rivals.filter((c) => !c.measured);

  return {
    note: fill(copy.competitorsNote ?? "", { n: rivals.length }),
    warnings: [
      errored.length === 0
        ? ""
        : fill(copy.competitorsNoteErrorStatus ?? "", {
            list: errored
              .map(
                (c) =>
                  `${c.domain} (HTTP ${c.homeStatus}${
                    c.browserStatus === null ? "" : `, browser probe ${c.browserStatus}`
                  })`
              )
              .join("; "),
          }),
      missing.length === 0
        ? ""
        : fill(copy.competitorsSomeUnmeasured ?? "", {
            list: missing.map((c) => `${c.domain} (${c.reason})`).join("; "),
          }),
    ].filter(Boolean),
  };
}

/**
 * The scan and the model it produces, as a unit, so that --from-model can skip both.
 *
 * WHY THIS IS A FUNCTION RATHER THAN AN `if` AROUND THE WHOLE SECTION: the section ends by writing
 * the model, and the two outcomes - a fresh scan and a re-render - have to converge on exactly the
 * same value. Wrapping it keeps one construction path, which is the property that makes
 * `--from-model` trustworthy: a re-rendered report cannot differ from a freshly scanned one except
 * in the copy, because the same code built both.
 */
async function scanAndBuildModel(): Promise<{ model: ReportModel; modelPath: string }> {
  console.log(`Scanning ${domain} …`);
  const scan = await runScan(domain);

  if (!scan.reachable) {
    console.error(`\n${domain} could not be reached over https or http. Nothing was written.`);
    console.error("A report is only produced from a real response; there is no partial or assumed version.");
    process.exit(1);
  }

    const r = scan.result;

  /*
   * The one derived number, and it is the site's own formula rather than a second opinion:
   * a check's share of its dimension's applicable weight, times that dimension's applicable
   * weight, against the renormalised total. See the /methodology/ page.
   */
  const dimById = new Map(r.dimensions.map((d) => [d.id, d]));
  const totalApplicable = r.dimensions.reduce((s, d) => s + d.applicableWeight, 0) || 100;
  const checkById = new Map(r.checks.map((c) => [c.id, c]));

  const pointsAtStake = (checkId: string): number => {
    const check = checkById.get(checkId);
    if (!check) return 0;
    const dim = dimById.get(check.dimension);
    if (!dim || dim.possible <= 0) return 0;
    return (check.weight / dim.possible) * dim.applicableWeight * (100 / totalApplicable);
  };

  const label = (id: string) => (lang === "zh" ? DIMENSION_ZH[id] ?? id : dimById.get(id)?.label ?? id);

  /**
   * The rivals, scanned AFTER this site and never before it, for one reason that is about honesty
   * rather than speed: if a competitor crawl throws or the process is interrupted, the client's own
   * report is already fully in memory, and this run's failure mode is a missing comparison rather
   * than a missing report.
   */
  const competitors = await scanCompetitors(competitorDomains, lang, { domain, scanned: true });
  const comparisonProse = composeComparisonProse(competitors, C);

  const fixes = r.issues
    .map((issue) => ({
      id: issue.id,
      title: issue.title,
      dimensionId: checkById.get(issue.id)?.dimension ?? "",
      dimension: label(checkById.get(issue.id)?.dimension ?? ""),
      severity: issue.severity,
      pointsAtStake: Number(pointsAtStake(issue.id).toFixed(2)),
      evidence: issue.evidence,
      recommendation: issue.recommendation,
    }))
    .sort((a, b) => b.pointsAtStake - a.pointsAtStake)
    .map((fix, i) => ({ ...fix, priority: i + 1 }));

  /*
   * The callout is derived from the data, never written by hand. It leads with the check that is
   * worth the most rather than with the worst-scoring dimension, because those are not the same
   * thing: on the first real run the lowest-scoring dimension carried 3% of the weight, so naming
   * it first would have pointed the reader at the cheapest possible fix.
   */
  const applicable = r.dimensions.filter((d) => d.applicableWeight > 0);
  const weakest = [...applicable].sort((a, b) => a.score - b.score)[0];
  const callout =
    fixes.length === 0
      ? C.calloutAllPass
      : fill(C.calloutFixes, {
          count: fixes.length,
          topFix: fixes[0].title,
          topPoints: fixes[0].pointsAtStake.toFixed(2),
          weakLabel: label(weakest.id),
          weakScore: weakest.score,
          weakWeight: weakest.applicableWeight,
        });

  const model = {
    generatedBy: "geo-scanner scripts/report/build-report.mts",
    site: SITE_URL,
    siteHost: SITE_HOST,
    lang,
    copy: C,
    dimensionLabels: DIMENSION_ZH,
    meta: {
      domain,
      scannedAt: scan.reachable ? new Date().toISOString() : new Date().toISOString(),
      scannedAtDisplay: displayDate(new Date().toISOString(), lang),
      scanDate: stamp,
      scheme: scan.scheme,
      homeStatus: scan.homeStatus,
      browserStatus: scan.browserStatus,
      finalUrl: scan.finalUrl,
      truncated: scan.truncated,
      pageType: r.pageType,
    },
    score: {
      total: r.score,
      grade: r.grade,
      gradeLabel: r.gradeLabel,
      checksRun: r.checksRun,
      checksPassed: r.checksPassed,
      checksNotApplicable: r.checksNotApplicable,
      totalApplicableWeight: totalApplicable,
    },
    callout,
    /*
     * The comparison lives in the model rather than being recomputed per format, for the same
     * reason the copy does: the Markdown and the DOCX cannot disagree about what a rival scored
     * if there is one array and both read it. It is also what lets --from-model re-render the
     * comparison without contacting the rivals again - the numbers were paid for once, at scan
     * time, and a re-render must not be able to produce different ones.
     */
    competitors,
    /**
     * The comparison's prose, composed once at scan time and carried in the model. The DOCX and
     * XLSX renderers print these verbatim and add nothing of their own - see
     * composeComparisonProse above for why that is a correctness property and not tidiness.
     */
    competitorsNote: comparisonProse.note,
    competitorsWarnings: comparisonProse.warnings,
    dimensions: r.dimensions.map((d) => ({
      id: d.id,
      label: label(d.id),
      labelEn: d.label,
      nominalWeight: d.weight,
      applicableWeight: d.applicableWeight,
      score: d.score,
      earned: d.earned,
      possible: d.possible,
      rationale: d.rationale,
    })),
    metrics: Object.entries(r.metrics).map(([id, score]) => {
      const dimensionId = METRIC_DIMENSION[id];
      return { id, dimensionId, label: dimensionId ? label(dimensionId) : id, score };
    }),
    fixes,
    checks: r.checks.map((c) => ({
      id: c.id,
      title: c.title,
      dimensionId: c.dimension,
      dimension: label(c.dimension),
      status: c.status,
      weight: c.weight,
    })),
  };

  const modelPath = join(outDir, "report-model.json");
  writeFileSync(modelPath, JSON.stringify(model, null, 2), "utf8");
  return { model, modelPath };
}

/**
 * The model as it exists on disk. Typed loosely on purpose: this file is the only thing that
 * writes it, and a full type would be a second description of the same shape to keep in step.
 */
type ReportModel = {
  site: string;
  lang: "zh" | "en";
  copy: Record<string, string>;
  meta: Record<string, string | number | boolean | null>;
  score: Record<string, number | string>;
  callout: string;
  /**
   * Optional, because models written before this feature existed are still on disk in reports/
   * and --from-model is documented as re-rendering an already-scanned report. Requiring the field
   * would turn re-rendering an older model into a crash, which is the one thing --from-model is
   * for; every reader below treats a missing array as "no comparison was run", which is true of
   * those models.
   */
  competitors?: Competitor[];
  /** Composed by this script; see comparisonNote and comparisonWarnings. Optional for older models. */
  competitorsNote?: string;
  competitorsWarnings?: string[];
  dimensions: { id: string; label: string; applicableWeight: number; score: number; earned: number; possible: number; rationale: string }[];
  metrics: { id: string; dimensionId?: string; label: string; score: number }[];
  fixes: { priority: number; id: string; title: string; dimension: string; severity: string; pointsAtStake: number; evidence: string; recommendation: string }[];
  checks: { id: string; title: string; dimensionId: string; dimension: string; status: string; weight: number }[];
};

const loaded = fromModelArg
  ? (() => {
      const p = resolve(REPO, fromModelArg);
      if (!existsSync(p)) {
        console.error(`--from-model points at ${p}, which does not exist.`);
        process.exit(1);
      }
      const parsed = JSON.parse(readFileSync(p, "utf8")) as ReportModel;
      console.log(
        `Re-rendering ${parsed.meta.domain} from ${p} - no scan, so that site is not contacted again.`
      );
      /*
       * A language given on a re-render is IGNORED, and said so rather than obeyed halfway.
       *
       * The model carries the whole copy block it was built with - that is the property that makes
       * a re-render byte-identical to the original apart from the change being made. Half of a
       * report's strings are not in that block at all: every dimension label, every rationale, the
       * callout and the check titles were written in the model at scan time. Switching the copy
       * block to another language here would therefore produce a document that is Chinese in its
       * headings and English in its body, and it would change the report's language without a new
       * scan - which is the opposite of what --from-model promises. Re-rendering in Chinese means
       * scanning with --lang=zh, which the usage line above already says.
       */
      if (arg("lang") && arg("lang") !== parsed.lang) {
        console.warn(
          [
            `--lang=${arg("lang")} was given, but this model was written in "${parsed.lang}" and its copy`,
            "block is part of the model. Re-rendering keeps that language; run the scan again with",
            `--lang=${arg("lang")} for a report in it.`,
          ].join("\n")
        );
      }
      return { model: parsed, modelPath: p };
    })()
  : await scanAndBuildModel();

const model = loaded.model;
const modelPath = loaded.modelPath;

/* ------------------------------------------------------------------ */
/* Markdown - rendered here so the text formats need no Python.        */
/* ------------------------------------------------------------------ */

const statusText = (s: string) =>
  s === "pass" ? C.statusPass : s === "warn" ? C.statusWarn : s === "fail" ? C.statusFail : C.statusNa;
const sevText = (s: string) =>
  s === "high" ? C.severityHigh : s === "medium" ? C.severityMedium : C.severityLow;
const esc = (s: string) => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

/* ------------------------------------------------------------------ */
/* Competitor comparison - one construction, three formats              */
/* ------------------------------------------------------------------ */

const competitors = model.competitors ?? [];

/**
 * Every string the comparison needs, in one place, with a fallback for a key a copy block written
 * before this feature does not have.
 *
 * WHY THE FALLBACKS EXIST rather than the keys being required: `copy` arrives from the model, and a
 * model can be older than this script - that is exactly what --from-model is. `C.x` on a missing
 * key is `undefined`, which python-docx renders as "None" and Markdown as "undefined"; a report
 * with "undefined" printed in a client's table is worse than one with a plain English word in it.
 */
const CX = {
  section: C.sectionCompetitors ?? "Competitor comparison",
  note: C.competitorsNote ?? "",
  unmeasured: C.competitorsUnmeasured ?? "not measured",
  someUnmeasured: C.competitorsSomeUnmeasured ?? "",
  noteErrorStatus: C.competitorsNoteErrorStatus ?? "",
  overall: C.competitorsOverallRow ?? "Overall",
  headerDimension: C.competitorsHeaderDimension ?? "Dimension",
  /**
   * The first data column holds this site's own score, and it is labelled rather than left to the
   * header's domain. A bare domain heading beside three rival domains reads as a fourth
   * competitor - and it is the column the reader most needs to identify, because it is the only
   * one they can act on.
   */
  headerSite: C.competitorsHeaderSite ?? "This site",
};

/**
 * The comparison as matrix rows, built once and consumed by all three renderers.
 *
 * WHY THIS IS EXPORTED AS DATA AND NOT AS THREE RENDERINGS. The rows are the part that must agree:
 * row 0 is the header, row 1 the overall score, rows 2.. the twelve dimensions. If the DOCX built
 * its own rows and the workbook built its own, the day one of them forgot the overall row would be
 * the day a client compared two documents from the same run and found different tables. Column
 * order is the caller's - this site first, then the competitors in the order they were named - and
 * a not-measured cell says so in words rather than being blank or zero.
 */
function comparisonRows(): string[][] {
  const siteDomain = String(model.meta.domain);

  /**
   * "(HTTP 403)" for a rival that answered with an error status, and "" otherwise.
   *
   * WHY IT GOES ON THE CELL. The engine scores a non-200 homepage on purpose - that is a published
   * rule and app/api/scan/route.ts says so in as many words - so a rival that refuses this scanner
   * has a real score that describes the refusal. "14 / 100 F (HTTP 403)" cannot be read as "this
   * rival scores 14 at GEO"; a bare 14 in a column otherwise full of zeros can. Python's
   * status_marker() does the same job for the DOCX and the workbook, and both were written because
   * the first end-to-end run scored otterly.ai at 14/100 off an HTTP 403 and printed it as though a
   * page had been read.
   */
  const statusMarker = (c: Competitor) =>
    c.measured && c.homeStatus !== null && c.homeStatus !== 200 ? ` (HTTP ${c.homeStatus})` : "";

  /**
   * The domain and the value share one cell on purpose: with four or more columns there is not
   * enough of a 16.6cm page for a separate score column per competitor, and a header that is only
   * a domain name would leave the numbers under it unattributed if the table ever broke across a
   * page.
   */
  const cell = (c: Competitor) =>
    c.measured
      ? `${c.domain}\n${c.score} / 100 ${c.grade}${statusMarker(c)}`
      : `${c.domain}\n${CX.unmeasured}`;

  return [
    [
      CX.headerDimension,
      // "This site: example.com", not a bare domain: see CX.headerSite for why the own column is
      // named rather than left to be inferred from the four domains beside it.
      `${CX.headerSite}: ${siteDomain}`,
      ...competitors.map(cell),
    ],
    [
      CX.overall,
      `${model.score.total} / 100 ${model.score.grade}`,
      ...competitors.map((c) =>
        c.measured ? `${c.score} / 100 ${c.grade}${statusMarker(c)}` : CX.unmeasured
      ),
    ],
    ...model.dimensions.map((d) => [
      d.label,
      String(d.score),
      ...competitors.map((c) => {
        const value = c.dimensions?.[d.id];
        // A measured competitor with no value for this dimension is a key mismatch, not a zero.
        // Saying "not measured" in that one cell is the conservative reading; printing 0 would be
        // a finding about a rival that no scan produced.
        return c.measured && typeof value === "number"
          ? `${value}${statusMarker(c)}`
          : CX.unmeasured;
      }),
    ]),
  ];
}

/**
 * The comparison's prose as this run should print it: the model's own copy when there is one, and
 * a recomposition from the competitors when there is not.
 *
 * WHY THE FALLBACK IS HERE AT ALL: --from-model reads a model that a previous version of this
 * script wrote, and the models in reports/ from before this feature have no prose keys. Printing
 * the table with no paragraph under it would drop the "this is not your market, not a ranking, not
 * a sample" sentence - which is the sentence that makes the table honest - so a re-render composes
 * it from the same function the scan used. The model's own strings win when present, so a
 * re-render never rewrites what was published.
 */
const comparisonProse = {
  note: model.competitorsNote ?? composeComparisonProse(competitors, C as Copy).note,
  warnings: model.competitorsWarnings ?? composeComparisonProse(competitors, C as Copy).warnings,
};

const md: string[] = [];
md.push(`# ${model.meta.domain} ${C.reportName}`);
md.push("");
md.push(`**${model.score.total} / 100** — ${C.scoreCaption} · ${model.score.grade} (${model.score.gradeLabel})`);
md.push("");
md.push(`> ${model.callout}`);
md.push("");
md.push(`## ${C.overview}`);
md.push("");
md.push(`| ${C.tableItem} | ${C.tableValue} |`);
md.push("| --- | --- |");
md.push(`| ${C.kScore} | ${model.score.total} / 100 (${model.score.grade}) |`);
md.push(`| ${C.kPassed} | ${model.score.checksPassed} / ${model.score.checksRun} |`);
md.push(`| ${C.kNotApplicable} | ${model.score.checksNotApplicable} |`);
md.push(`| ${C.kPageType} | ${model.meta.pageType} |`);
md.push(`| ${C.kScheme} | ${model.meta.scheme} |`);
md.push(`| ${C.kHomeStatus} | ${model.meta.homeStatus} |`);
md.push(
  `| ${C.kBrowserProbe} | ${model.meta.browserStatus === null ? C.probeNotNeeded : model.meta.browserStatus} |`
);
md.push(`| ${C.kFinalUrl} | ${model.meta.finalUrl} |`);
md.push(`| ${C.kTruncated} | ${model.meta.truncated ? C.yes : C.no} |`);
md.push(`| ${C.kScannedAt} | ${model.meta.scannedAtDisplay} |`);
md.push("");
md.push(`![${C.figBar}](charts/dimensions.png)`);
md.push("");
md.push(`*${C.figBar}*`);
md.push("");
md.push(`![${C.figRadar}](charts/radar.png)`);
md.push("");
md.push(`*${C.figRadar}*`);
md.push("");
md.push(`## ${C.sectionDimensions}`);
md.push("");
md.push(
  `| ${C.tableDimension} | ${C.tableWeight} | ${C.tableScore} | ${C.tablePoints} | ${C.tableRationale} |`
);
md.push("| --- | --- | --- | --- | --- |");
for (const d of model.dimensions) {
  md.push(
    `| ${esc(d.label)} | ${d.applicableWeight}% | ${d.score} | ${d.earned} / ${d.possible} | ${esc(d.rationale)} |`
  );
}
md.push("");
/*
 * The comparison sits between the dimension table and the fix list, which is where it is worth
 * something: "machine readability 62" becomes a diagnosis one paragraph later instead of a number
 * the reader has no reference point for. It is skipped entirely when no competitors were named -
 * an empty table under a heading about competitors reads as a failure rather than as a choice.
 */
if (competitors.length > 0) {
  md.push(`## ${CX.section}`);
  md.push("");
  md.push(comparisonProse.note);
  md.push("");
  /*
   * The same matrix the DOCX uses, flattened: Markdown cannot put two lines in one cell, so the
   * domain and its value are separated by a middle dot. Building the rows from comparisonRows()
   * rather than writing a second loop here is what keeps the two formats from disagreeing about
   * which dimensions are in the table.
   */
  const rows = comparisonRows();
  md.push(`| ${rows[0].map((h) => esc(h.replace(/\n/g, " · "))).join(" | ")} |`);
  md.push(`| ${rows[0].map(() => "---").join(" | ")} |`);
  for (const row of rows.slice(1)) {
    md.push(`| ${row.map((cell) => esc(cell.replace(/\n/g, " · "))).join(" | ")} |`);
  }
  md.push("");
  /*
   * The caveats come from the model's own builder rather than being reassembled here, so the
   * Markdown cannot say something the DOCX does not. A competitor that answered 403 is a caveat
   * about a NUMBER in the table and a competitor that answered nothing is a caveat about a MISSING
   * one; they are different sentences because a reader has to act on them differently.
   */
  for (const warning of comparisonProse.warnings) {
    md.push(`> ${esc(warning)}`);
    md.push("");
  }
}
md.push(`## ${C.sectionFixes}`);
md.push("");
if (model.fixes.length === 0) {
  md.push(C.calloutAllPass);
} else {
  md.push(
    `| # | ${C.tableCheck} | ${C.tableDimension} | ${C.tableSeverity} | ${C.tableAtStake} | ${C.tableEvidence} | ${C.tableFix} |`
  );
  md.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const f of model.fixes) {
    md.push(
      `| ${f.priority} | ${esc(f.title)} | ${esc(f.dimension)} | ${sevText(f.severity)} | ${f.pointsAtStake}${C.pointsUnit} | ${esc(f.evidence)} | ${esc(f.recommendation)} |`
    );
  }
}
md.push("");
md.push(`## ${C.sectionChecks}`);
md.push("");
md.push(`| ${C.tableCheck} | ${C.tableDimension} | ${C.tableStatus} |`);
md.push("| --- | --- | --- |");
for (const c of model.checks) {
  md.push(`| ${esc(c.title)} | ${esc(c.dimension)} | ${statusText(c.status)} |`);
}
md.push("");
md.push(`## ${C.sectionLimits}`);
md.push("");
for (const key of [
  "limitOnlyHomepage",
  "limitNoAi",
  "limitNoCitation",
  "limitWaf",
  "limitCwv",
  ...(model.meta.browserStatus === null ? [] : ["limitIpHint"]),
]) {
  md.push(`- ${C[key]}`);
}
md.push("");
md.push(`## ${C.sectionMethod}`);
md.push("");
for (const [key, vars] of [
  ["methodEngine", {}],
  ["methodWeights", { url: model.site }],
  ["methodPointsAtStake", {}],
  ["methodApplicable", {}],
  ["methodGenerated", { url: model.site, date: model.meta.scanDate }],
] as [string, Record<string, string>][]) {
  md.push(`- ${fill(C[key], vars)}`);
}
md.push("");

const mdPath = join(outDir, "report.md");
writeFileSync(mdPath, md.join("\n"), "utf8");
/*
 * Reported differently depending on how this run got its model: claiming to have "written" a file
 * that was read from disk is a small lie, and a small lie in a log is what sends somebody looking
 * for a file that was never produced.
 */
console.log(fromModelArg ? `model     ${modelPath}  (read)` : `wrote ${modelPath}`);
console.log(`wrote ${mdPath}  (${model.score.total}/100 ${model.score.grade}, ${model.fixes.length} fix item(s))`);

/* ------------------------------------------------------------------ */
/* Office formats, via the Python renderer                            */
/* ------------------------------------------------------------------ */

/**
 * Look for an interpreter that actually has python-docx, openpyxl and Pillow, by import-testing
 * rather than by assuming a name.
 *
 * NOT run through a shell, and that is a measured decision rather than a style one: with
 * `shell: true` on Windows, `${python} -c "import docx, openpyxl, PIL"` reaches cmd.exe with the
 * nested quotes rewritten, the import string is split, and the probe reports "no usable Python"
 * even when REPORT_PYTHON points straight at one. Spawning directly passes the argument through
 * intact.
 *
 * stdio is "ignore" because only the exit status is needed, and capturing a child's piped output
 * is the thing that does not work under a confined sandbox.
 */
const candidates = [
  ...(process.env.REPORT_PYTHON ? [process.env.REPORT_PYTHON] : []),
  "python3",
  "python",
];

const usable = candidates.find(
  (cmd) => spawnSync(cmd, ["-c", "import docx, openpyxl, PIL"], { stdio: "ignore" }).status === 0
);

if (!usable) {
  console.warn(
    [
      "",
      "SKIPPED .docx/.xlsx: no Python found with python-docx, openpyxl and Pillow.",
      "The model and the Markdown were still written. To finish, either install those three",
      "packages, or point REPORT_PYTHON at an interpreter that already has them:",
      "",
      "  REPORT_PYTHON=/path/to/python node scripts/report/build-report.mts --domain=" + domain,
      "",
    ].join("\n")
  );
  process.exit(0);
}

const renderer = join(HERE, "render-report.py");
const rendered = spawnSync(usable, [renderer, `--model=${modelPath}`, `--out=${outDir}`], {
  stdio: "inherit",
});

if (rendered.status !== 0) {
  console.error(`\nThe Python renderer exited with ${rendered.status}. The model and Markdown are still usable.`);
  process.exit(rendered.status ?? 1);
}

console.log(`\nReport written to ${outDir}`);

/* ------------------------------------------------------------------ */
/* PDF, when a LibreOffice kit has been pointed at                     */
/* ------------------------------------------------------------------ */

/**
 * A PDF, because that is what an overseas client forwards.
 *
 * WHY THIS IS CONFIGURATION AND NOT A SEARCH. The kit ships with the harness this project is
 * developed in, not with this repository, so its location is not a fact about the code - hardcoding
 * it would be wrong on any other machine and would publish one developer's directory layout in a
 * public repository. The alternative, looking for a system LibreOffice, is worse: the conversion
 * would then use whatever version happened to be installed, which is the same class of mistake as
 * two scoring implementations. So the two paths are named explicitly, and without them the step is
 * skipped with the variables printed.
 *
 * WHY A FAILURE HERE IS LOUD. "No kit configured" and "the kit is configured and did not work" are
 * different situations, and only the first is fine to walk past. Collapsing them is how a report
 * gets sent to a client with the PDF missing and nobody notices, so the second one exits non-zero
 * and says explicitly that the other three files are still complete on disk.
 */
function exportPdf(dir: string): void {
  const docx = join(dir, "report.docx");
  const pdf = join(dir, "report.pdf");
  const kitNode = process.env.REPORT_PDF_KIT_NODE;
  const kitCli = process.env.REPORT_PDF_KIT_CLI;

  if (process.argv.includes("--no-pdf")) {
    console.log("PDF: skipped (--no-pdf was given)");
    return;
  }

  if (!kitNode || !kitCli) {
    console.log(
      [
        "",
        "PDF: skipped - no LibreOffice kit is configured.",
        "The DOCX, XLSX and Markdown above are complete. To also get a PDF, set both variables",
        "and run again:",
        "",
        "  REPORT_PDF_KIT_NODE=<node executable>",
        "  REPORT_PDF_KIT_CLI=<.../libreoffice-kit/lib/cli.js>",
        "",
      ].join("\n")
    );
    return;
  }

  for (const [name, value] of [
    ["REPORT_PDF_KIT_NODE", kitNode],
    ["REPORT_PDF_KIT_CLI", kitCli],
  ] as const) {
    if (!existsSync(value)) {
      console.error(`\nPDF: ${name} points at ${value}, which does not exist. Nothing was converted.`);
      process.exit(1);
    }
  }

  if (!existsSync(docx)) {
    console.error(`\nPDF: ${docx} is missing, so there is nothing to convert.`);
    process.exit(1);
  }

  // Removed first rather than trusted to be overwritten: an older report.pdf left in place would
  // otherwise be indistinguishable from a successful conversion, and a client would be sent last
  // week's report under this week's name.
  rmSync(pdf, { force: true });

  const converted = spawnSync(
    kitNode,
    [kitCli, "convert", "--input", docx, "--output", pdf],
    // stdout carries the kit's JSON manifest, which this step does not read; stderr is kept so a
    // real conversion error is visible rather than swallowed.
    { stdio: ["ignore", "ignore", "inherit"] }
  );

  /**
   * The result is checked rather than assumed. A process that exits zero having written nothing, or
   * having written an error page, is exactly the failure this check exists for - and %PDF- is the
   * one thing every valid PDF starts with.
   */
  const head = existsSync(pdf) ? readFileSync(pdf).subarray(0, 5).toString("latin1") : "";
  const size = existsSync(pdf) ? statSync(pdf).size : 0;

  if (converted.status !== 0 || head !== "%PDF-" || size < 1024) {
    console.error(
      [
        "",
        "PDF EXPORT FAILED.",
        `  converter exit : ${converted.status}`,
        `  file written   : ${size} bytes, header ${JSON.stringify(head)}`,
        "  the DOCX, XLSX and Markdown are still complete on disk.",
        "",
      ].join("\n")
    );
    process.exit(1);
  }

  console.log(`wrote ${pdf}  (${Math.round(size / 1024)} KB)`);
}

exportPdf(outDir);
