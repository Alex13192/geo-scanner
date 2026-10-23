/**
 * Japanese rule and fix copy, one entry per published check.
 *
 * `rule` and `onFail` are translations of the catalogue, not rewrites of it; `fixes` follows
 * CHECK_COPY entry for entry, with `when` preserved. Titles are not here: this module carries the
 * rule text only. Technical terms (robots.txt, sitemap.xml, JSON-LD, canonical, hreflang,
 * llms.txt, HTTP, HTTPS, URL, H1, meta description, noindex, user-agent, GPTBot, E-E-A-T) stay in
 * their published form, because that is what the reader sees in the scan output and in every
 * other tool; translating them would make the page harder to use.
 *
 * The ids are the catalogue's ids, so a renamed rule resolves to nothing and shows its English
 * copy rather than a stale translation.
 */

export type JaRuleCopy = {
  /** このルールが何を確認するか。catalog の rule を翻訳したもので、足し引きはしない。 */
  rule: string;
  /** 失敗が何を意味するか。catalog の onFail を翻訳したもの。onFail を持たないルールでは省略する。 */
  onFail?: string;
  /** どう直すか。CHECK_COPY の fixes と 1 対 1 で対応し、when はそのまま保つ。 */
  fixes: { when: "fail" | "partial"; text: string }[];
};

export const JA_CHECK_RULES: Record<string, JaRuleCopy> = {
  "robots-present": {
    rule: "/robots.txt へのリクエストが、空でないボディとともに HTTP 200 を返す。200 でもボディが空、または空白文字だけの場合は未提供として扱う。政策を何も公開していないためである。",
    onFail: "ドメインルートに読み取り可能な robots.txt がない。",
    fixes: [
      { when: "fail", text: "robots.txt を公開する。robots.txt がない場合、すべてのクローラーが既定で許可されるため、これはブロックではなく政策の欠落である。" },
    ],
  },
  "robots-ai-allowed": {
    rule: "robots.txt を user-agent グループに解析したとき、gptbot、claudebot、perplexitybot、oai-searchbot、google-extended のいずれも / へのアクセスを禁止されておらず、かつホームページがクローラー形式のリクエストに HTTP 200 を返していること。完全一致の agent グループは * グループより優先され、最も長く一致したパターンが適用され、同じ長さでは Allow が優先され、Disallow の値が空ならどのパスにも一致せず、* はワイルドカードとして扱う。ホームページがリクエストを拒否した場合、判定は同じ URL をブラウザ形式の User-Agent で再度プローブした結果に従う。それが 200 を返せば拒否は識別されたクローラーに向けられたものであり、このチェックは robots-ai-blocked として失敗する。同じように拒否された場合は、拒否がサイトではなくスキャン元のアドレスに対するものであり、このチェックは未検証として 6 点中 2 点を計上する。",
    onFail: "少なくとも 1 つの AI クローラーがサイトルートへのアクセスを禁止されているか、サーバーが識別されたクローラーを明示的に拒否している。",
    fixes: [
      { when: "partial", text: "CDN または WAF で、識別された AI クローラーが許可されているか、どのネットワークから許可されているかを確認する。このスキャンではそこまで確定できない。" },
    ],
  },
  "robots-sitemap": {
    rule: "robots.txt に Sitemap: 行が含まれている。",
    fixes: [
      { when: "fail", text: "sitemap.xml を指す Sitemap: 行を追加する。" },
      { when: "fail", text: "robots.txt を公開し、サイトマップを指す Sitemap: 行をその中に入れる。" },
    ],
  },
  "home-200": {
    rule: "ホームページが、自らを正直に示す非ブラウザのリクエストに HTTP 200 を返す。",
    onFail: "ホームページの応答が 200 以外である。アクセス可否の判定自体は robots-ai-allowed または robots-ai-blocked が報告し、拒否が何に向けられたかを区別する。",
    fixes: [
      { when: "fail", text: "ホームページが、クローラーの user-agent に対してチャレンジやエラーではなく 200 を返すようにする。" },
    ],
  },
  "home-noindex": {
    rule: "ホームページに、noindex を含む meta robots 指令がない。",
    fixes: [
      { when: "fail", text: "ホームページから noindex を外し、取得できるようにする。" },
    ],
  },
  "sitemap-valid": {
    rule: "/sitemap.xml のボディに <urlset> または <sitemapindex> が含まれている。",
    onFail: "sitemap がないか、有効な sitemap マークアップではない応答である。",
    fixes: [
      { when: "partial", text: "/sitemap.xml で標準的な sitemap を配信する。" },
      { when: "fail", text: "sitemap を公開し、クローラーが推測せずにページを発見できるようにする。" },
    ],
  },
  "content-signal": {
    rule: "robots.txt に、同じ行に値を持つ Content-Signal 指令が含まれている。例えば `Content-Signal: search=yes, ai-input=yes, ai-train=no`。この指令は各行の先頭で大文字小文字を区別せずに照合する。",
    onFail: "robots.txt に Content-Signal 指令がない。",
    fixes: [
      { when: "fail", text: "Content-Signal: search=yes, ai-input=yes, ai-train=no のような行を追加する。採用はまだ初期段階で配点も低いが、すべてのクローラーがすでに読む唯一のファイルで自社の立場を示せる。" },
    ],
  },
  "jsonld-valid": {
    rule: "少なくとも 1 つの <script type=\"application/ld+json\"> ブロックが JSON として解析でき、少なくとも 1 つの @ キーワード（@context、@type、@graph、@id）を宣言している。{} だけを含むブロックは解析できるが何も宣言しないため、該当しない。",
    fixes: [
      { when: "fail", text: "Organization と WebSite のノードを持つ JSON-LD の @graph を追加する。" },
    ],
  },
  "jsonld-entity": {
    rule: "解析された JSON-LD に、Organization、WebSite、Person、LocalBusiness のいずれかの @type が含まれている。",
    fixes: [
      { when: "fail", text: "安定した @id と sameAs リストを持つ Organization ノードを宣言する。" },
    ],
  },
  "jsonld-content": {
    rule: "解析された JSON-LD に、FAQPage、Article、BlogPosting、HowTo、Product、SoftwareApplication、BreadcrumbList のいずれかの @type が含まれている。",
    fixes: [
      { when: "fail", text: "ページ種別をマークアップし、エンジンがそのページの種類を把握できるようにする。" },
    ],
  },
  "word-count": {
    rule: "script、style、コメントの内容を取り除いた可視テキストが、少なくとも 800 語分の単語トークンを含む。300〜799 は部分通過。",
    fixes: [
      { when: "partial", text: "生成 AI エンジンは、1 つの話題を最後まで扱う情報源を好む。引用されたいページでは 800 語以上を目安にする。" },
      { when: "fail", text: "具体的で重複のない内容を、800 語以上に増やす。" },
    ],
  },
  "sections": {
    rule: "ページに少なくとも 4 つの H2 要素が含まれている。2〜3 個は部分通過。",
    fixes: [
      { when: "partial", text: "内容を問いの形をしたセクションに分割し、それぞれを独立して取得できるようにする。" },
      { when: "fail", text: "それぞれが 1 つの問いに答える H2 セクションを追加する。" },
    ],
  },
  "extractables": {
    rule: "ページに <ul>/<ol> と <table> の両方が含まれている。片方だけなら部分通過。script と style の内容は先に除外するため、文字列の中にしか現れないマークアップは該当しない。",
    fixes: [
      { when: "partial", text: "リストと表は、エンジンが最も確実に抽出できる形式である。合う箇所には両方を追加する。" },
      { when: "fail", text: "比較と手順をリストまたは表に変換する。" },
    ],
  },
  "statistics": {
    rule: "本文に少なくとも 5 つの数値的な主張が含まれている。パーセント、金額、3.2x の形式の倍率、桁区切り付きの数値、または 5 桁以上の素の数値である。桁区切りも単位もない 4 桁の数値は数えない。データであるより年のことがはるかに多いためである。",
    fixes: [
      { when: "partial", text: "具体的な数値を加える。公表された GEO 研究では、統計と引用による可視性の向上が最も大きいと報告されている。" },
      { when: "fail", text: "主張に具体的な数値を加える。裏付けのない断言が引用されることはほとんどない。" },
    ],
  },
  "quotations": {
    rule: "ページに少なくとも 1 つの <blockquote> 要素が含まれている。",
    fixes: [
      { when: "fail", text: "名前のわかる専門家の言葉を引用することは、公表された研究で最も効果の高い追加の 1 つである。" },
    ],
  },
  "authority-citations": {
    rule: "ページが、権威リスト上の少なくとも 2 つの外部ホストにリンクしている。arxiv.org、doi.org、nature.com、science.org、acm.org、ieee.org、springer.com、sciencedirect.com、任意の .gov または .edu ホスト、wikipedia.org、github.com、developer.mozilla.org、web.dev、nih.gov、who.int、europa.eu。自社ドメインへのリンクは数えない。",
    fixes: [
      { when: "partial", text: "独立した権威ある出典を複数引用することは、今度は自分が引用されることと強く関連している。" },
      { when: "fail", text: "主張の背後にある一次資料を引用し、そこへリンクする。" },
    ],
  },
  "canonical": {
    rule: "ページが rel=canonical リンクを宣言している。",
    fixes: [
      { when: "fail", text: "canonical URL を宣言し、重複ページがシグナルを分散させないようにする。" },
    ],
  },
  "qa-headings": {
    rule: "少なくとも 3 つの H2 または H3 見出しが、疑問符で終わるか、how、what、why、which、when、who、where、is、are、do、does、can、should、will のいずれかで始まっている。",
    fixes: [
      { when: "partial", text: "顧客が尋ねるであろう問いの形に見出しを書き換え、キーワードは文の中に残す。" },
      { when: "fail", text: "エンジンは問いに一致するスパンを取得する。ラベルのような見出しには一致するものが何もない。" },
    ],
  },
  "faq": {
    rule: "解析された JSON-LD に FAQPage ノードが含まれている。代わりに <details>/<summary> マークアップを使っていて schema がない場合は部分通過。",
    onFail: "FAQPage schema がない。このチェックが読むのは構造化データであり、HTML のどこかに「faq」や「question」という語が現れるかどうかではない点に注意。",
    fixes: [
      { when: "partial", text: "ページにすでに表示されている問いと一致する FAQPage schema を追加する。" },
      { when: "fail", text: "5〜10 組の質問と回答を追加し、FAQPage としてマークアップする。" },
    ],
  },
  "answer-first": {
    rule: "H2/H3 の後に任意でラッパー要素を挟み、その後に <p> が続く「見出しと段落」の組のうち、最初の 30 組で、少なくとも 60% の冒頭段落が 80 語以下である。",
    fixes: [
      { when: "partial", text: "答えを各見出し直下の最初の文に置く。長い書き出しがそのまま抽出されることはほとんどない。" },
      { when: "fail", text: "見出し、直後の一文の答え、その後の詳細、という順でセクションを構成する。" },
    ],
  },
  "https": {
    rule: "ホームページが、平文の http:// のみではなく https:// 経由で取得された。",
    fixes: [
      { when: "fail", text: "サイトを HTTPS で配信する。ブラウザは平文の HTTP を安全でないと表示し、クローラーも取得を拒否する傾向が強まっている。" },
    ],
  },
  "about-contact": {
    rule: "ページ上の href に、about 系のパス（about、company、team、who-we-are）と、contact 系のパス（contact、support）または mailto: リンクの両方が含まれている。",
    fixes: [
      { when: "partial", text: "モデルは、ある主張に誰が責任を持つかを重視する。両方にリンクする。" },
      { when: "fail", text: "about ページと contact の導線にリンクし、発行元を特定できるようにする。" },
    ],
  },
  "author": {
    rule: "著者情報が次のいずれかで示されている。解析された JSON-LD の Person ノード、解析された JSON-LD の値が空でない author プロパティ、rel=\"author\"、または「by Firstname Lastname」の形式に一致する可視の署名。",
    fixes: [
      { when: "fail", text: "内容を、名前のわかる人物または組織に帰属させる。" },
    ],
  },
  "sameas": {
    rule: "解析された JSON-LD に、値が空でない sameAs プロパティが含まれている。",
    fixes: [
      { when: "fail", text: "プロフィールの sameAs リストを追加し、ブランドが 1 つの実体として解決されるようにする。" },
    ],
  },
  "h1-single": {
    rule: "ページに、空でない <h1> がちょうど 1 つ含まれている。0 個または複数個の場合は部分通過または失敗となる。",
    fixes: [
      { when: "fail", text: "そのページが何についてのものかを示す H1 を 1 つ追加する。" },
      { when: "partial", text: "1 ページにつき H1 は 1 つにし、残りは H2 に下げる。" },
    ],
  },
  "landmarks": {
    rule: "main、article、section、header、nav、footer のうち少なくとも 3 つが要素として現れている。",
    fixes: [
      { when: "partial", text: "main、article、section、header、nav、footer を使い、パーサーがセクションの境界を見つけられるようにする。" },
    ],
  },
  "no-js-dependency": {
    rule: "JavaScript を実行しなくても、サーバーの生の応答に少なくとも 100 語の可視テキストが含まれている。",
    fixes: [
      { when: "fail", text: "クローラーは JavaScript を実行しない。引用されたい内容はサーバーサイドでレンダリングする。" },
    ],
  },
  "title": {
    rule: "<title> の長さが 15〜65 文字である。",
    fixes: [
      { when: "partial", text: "検索結果でタイトルが切り捨てられないよう、15〜65 文字を目安にする。" },
      { when: "fail", text: "内容を説明するタイトルを追加する。" },
    ],
  },
  "description": {
    rule: "meta description の長さが 50〜160 文字である。",
    fixes: [
      { when: "partial", text: "50〜160 文字を目安にする。" },
      { when: "fail", text: "そのページが何に答えるのかを示す説明を書く。" },
    ],
  },
  "opengraph": {
    rule: "og: で始まる meta property が少なくとも 1 つ存在する。",
    fixes: [
      { when: "fail", text: "Open Graph タグを追加し、共有されたリンクが正しく表示されるようにする。" },
    ],
  },
  "html-lang": {
    rule: "<html> 要素に lang 属性がある。",
    fixes: [
      { when: "fail", text: "言語を宣言し、ページが適切な市場で取得されるようにする。" },
    ],
  },
  "llms-txt": {
    rule: "/llms.txt が 20 バイトを超え、H1、> で始まる要約行、少なくとも 3 つの markdown リンクを含んでいる。いずれかが欠けている場合は部分通過。",
    fixes: [
      { when: "partial", text: "慣例に従う。H1 を 1 つ、> の要約行を 1 行、その後に説明付きリンクの H2 セクションを置く。" },
      { when: "fail", text: "任意であり、そのためここでの配点も低い。ただし追加の手間は小さい。llms.txt ガイドを参照。" },
    ],
  },
  "ai-context-robots": {
    rule: "robots.txt が読み取り可能であり、クローラー政策が公開されている。読み取り可能とは、空白以外の内容を持つボディがあることを指す。HTTP 200 でもボディが空または空白文字だけなら政策は公開されておらず、robots-present とまったく同じくこのチェックも失敗する。",
    fixes: [
      { when: "fail", text: "どのクローラーを歓迎するかを記した robots.txt を公開する。" },
    ],
  },
  "markdown-alternate": {
    rule: "ドキュメントの head に、rel=\"alternate\" と type=\"text/markdown\" の両方を持つ <link> が含まれている。属性の順序は問わない。",
    onFail: "ページに markdown の代替版が宣言されていない。",
    fixes: [
      { when: "fail", text: "ページの markdown 版を公開し、<link rel=\"alternate\" type=\"text/markdown\" href=\"...\"> で指す。エージェントが周囲の枠を除いた内容だけを取得できるようになる。" },
    ],
  },
  "date-machine": {
    rule: "dateModified、datePublished、article:modified_time のいずれかで機械可読な日付が見つかる。12 か月以内なら完全通過、それより古い場合は部分通過。HTTP の Last-Modified ヘッダーだけが日付を持つ場合は部分通過。",
    fixes: [
      { when: "partial", text: "日付に敏感なページを更新し、その際に日付も更新する。" },
      { when: "partial", text: "schema と meta タグでは ISO 8601 形式（YYYY-MM-DD）の日付を使う。" },
      { when: "partial", text: "構造化データでも dateModified を宣言する。ヘッダーは読者には表示されない。" },
      { when: "partial", text: "構造化データで dateModified を宣言し、最新の状態に保つ。" },
      { when: "fail", text: "機械可読な更新日を公開する。" },
    ],
  },
  "copyright-year": {
    rule: "現在の暦年が可視の本文に現れている。",
    fixes: [
      { when: "fail", text: "現在の年が表示されるようにサイトを更新する。古い日付のシグナルは生成回答での選択を妨げる。" },
    ],
  },
  "hreflang": {
    rule: "少なくとも 2 つの異なる hreflang 言語コードが宣言されている。同じ言語の属性が重複しても数えず、x-default は言語ではなく既定のマーカーであるため、`en` と `x-default` だけを宣言した単一言語サイトはこの条件を満たさない。hreflang をまったく宣言していないページはこのルールで採点しない。取得するページが 1 つのみでは、スキャナーは単一言語サイトと、各言語版をまだ宣言していない多言語サイトとを区別できないため、未宣言は失敗ではなく対象外とする。コードをちょうど 1 つだけ宣言した場合は依然として失敗する。",
    fixes: [
      { when: "fail", text: "実際に提供している言語版ごとに hreflang を宣言し、各版がそれぞれの市場で取得されるようにする。" },
    ],
  },
  "lang-region": {
    rule: "地域サブタグを持つ言語タグが、<html lang>、og:locale、hreflang 属性のいずれかに現れる。例えば en-GB、en_GB、de-AT。「en」のような地域を伴わない言語だけではこの条件を満たさない。それは html-lang が確認する内容である。",
    fixes: [
      { when: "fail", text: "必要な箇所で地域を宣言する。例えば lang=\"en-GB\"、og:locale=\"en_GB\"、hreflang=\"de-AT\"。" },
    ],
  },
  "viewport": {
    rule: "meta viewport タグが存在する。",
    fixes: [
      { when: "fail", text: "meta viewport タグを追加し、モバイルでページが正しく表示されるようにする。" },
    ],
  },
  "payload": {
    rule: "非圧縮の HTML 応答が 500 KB 未満である。",
    fixes: [
      { when: "partial", text: "マークアップを削る。クローラーもデバイスも解析の予算は有限である。" },
    ],
  },
};
