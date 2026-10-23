/**
 * ローカライズされたページで使う日本語の用語。
 *
 * なぜモジュールなのか：ディメンションのラベルは方法論ページとチェック一覧の両方で
 * 描画され、今後はルールページも同じラベルを使う。同じ 12 個のラベルを手で二度書けば、
 * 翻訳が翻訳自身と食い違う。このサイトが他のあらゆる単一の情報源について記録している
 * 失敗が、まさにそれである。
 *
 * id はカタログの id である。lib/geo/catalog.ts で名前を変えたルールはここで解決されない。
 * それは意図したことであり、未翻訳のルールは誤った題名ではなく英語の題名を表示する。
 */

export const JA_DIMENSION_LABELS: Record<string, string> = {
  "ai-crawler-access": "AI クローラーのアクセス",
  "machine-readability": "機械可読性",
  "content-depth": "コンテンツの深さ",
  citability: "引用可能性と根拠",
  "answer-readiness": "回答準備性",
  "trust-authority": "信頼性と権威性",
  "semantic-structure": "セマンティック構造",
  metadata: "メタデータと発見可能性",
  "llms-txt": "AI コンテキストファイル",
  freshness: "鮮度",
  multilingual: "国際対応",
  delivery: "配信とモバイル",
};

/** ディメンションごとに一文: その重みをなぜ負うのか。 */
export const JA_DIMENSION_SUMMARIES: Record<string, string> = {
  "ai-crawler-access":
    "クローラーがページを読み取れなければ、このリストのほかの項目はどれも意味を持ちません。",
  "machine-readability":
    "JSON-LD は、ブランド名、ドメイン、製品を一つのエンティティとして結び付けます。",
  "content-depth":
    "生成エンジンは、一つの問いに十分に答えるページを選び、内容の薄いページはマークアップがどれだけ整っていても参照されにくくなります。",
  citability:
    "統計、引用、出典の明示は、公開されている GEO 研究で最も効果が大きいと測定された施策です。",
  "answer-readiness":
    "回答はページではなくスパンとして抽出されるため、問いの形をした見出しの直後に答えを置くことが、検索システムにとって最もそのまま抜き出しやすい形です。",
  "trust-authority":
    "E-E-A-T のシグナルは、モデルがその主張を事実として繰り返してよいか、それとも留保を付けるべきかを判断する材料になります。",
  "semantic-structure":
    "見出しの階層とランドマーク要素は、パーサーがそもそも節の境界を特定するための手段です。",
  metadata:
    "タイトル、meta description、canonical は、検索結果や回答画面でページについて何を表示できるかを決めます。",
  "llms-txt":
    "安価で任意のシグナルであり、一つの URL でサイトが機械向けに自分のコンテキストを示せます。",
  freshness:
    "日付が古いコンテンツは生成回答で優先度が下げられ、日付のないページはエンジンが新旧を判断する材料を持ちません。",
  multilingual:
    "言語と地域のマークアップは、そのページがそもそもどの言語市場で取得できるかを決めます。",
  delivery:
    "遅いページやモバイルで読めないページは、コンテンツの解析が始まる前に除外されます。",
};

/**
 * 公開されている 40 個のルールの題名。robots.txt、JSON-LD、canonical、hreflang、
 * schema 名などの技術用語は原形のまま残す。読者がスキャン結果やほかのツールで目にする
 * 表記であり、翻訳するとページが使いにくくなるためである。
 */
export const JA_CHECK_TITLES: Record<string, string> = {
  "robots-present": "robots.txt が配信されている",
  "robots-ai-allowed": "AI クローラーがブロックされていない",
  "robots-sitemap": "robots.txt に sitemap が宣言されている",
  "home-200": "トップページが HTTP 200 を返す",
  "home-noindex": "トップページが noindex になっている",
  "sitemap-valid": "sitemap.xml が存在し、形式が正しい",
  "content-signal": "robots.txt にコンテンツポリシーが宣言されている",
  "jsonld-valid": "有効な JSON-LD が存在する",
  "jsonld-entity": "エンティティノードが宣言されている",
  "jsonld-content": "コンテンツタイプの schema が存在する",
  "word-count": "本文の分量が十分である",
  sections: "コンテンツがセクションに分かれている",
  extractables: "リストと表が存在する",
  statistics: "定量データが存在する",
  quotations: "直接引用が存在する",
  "authority-citations": "外部の権威ある情報源が引用されている",
  canonical: "canonical URL が宣言されている",
  "qa-headings": "見出しが実際の問いの形になっている",
  faq: "FAQPage schema が存在する",
  "answer-first": "見出しの直後に直接の答えがある",
  https: "HTTPS で配信されている",
  "about-contact": "about ページと contact ページがリンクされている",
  author: "著者が明示されている",
  sameas: "エンティティが外部と相互参照されている",
  "h1-single": "H1 が一つだけである",
  landmarks: "セマンティックなランドマークが使用されている",
  "no-js-dependency": "主要なコンテンツが HTML 内にある",
  title: "タイトルの長さが範囲内である",
  description: "meta description の長さが範囲内である",
  opengraph: "Open Graph タグが存在する",
  "html-lang": "文書の言語が宣言されている",
  "llms-txt": "/llms.txt が存在し、構造が正しい",
  "ai-context-robots": "クローラーポリシーが公開されている",
  "markdown-alternate": "markdown の代替版が宣言されている",
  "date-machine": "機械可読で新しい日付が存在する",
  "copyright-year": "コンテンツに現在の年が含まれている",
  hreflang: "他の言語バージョンが宣言されている",
  "lang-region": "地域を含む言語設定が宣言されている",
  viewport: "viewport meta タグが存在する",
  payload: "HTML のサイズが適切である",
};
