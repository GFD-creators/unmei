// ============================================================
// 運命図鑑 タイプ別 静的ページ生成スクリプト (Node.js)
// ------------------------------------------------------------
// 目的: AdSense主軸の収益化に向けた「リアル個別ページ方式」。
//   - 16タイプの実HTMLページを /types/ に生成
//   - 結果画面からの実ページ遷移 = 本物のPV(AdSense収益) + SEO着地点 + 審査通過
//   - データは js/data.js を単一の真実源として読み込む(再生成するだけ)
//
// 使い方:  node make_type_pages.js
// 出力:    types/index.html, types/{mbti}.html ×16
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const DATA_JS = path.join(ROOT, 'js', 'data.js');
const OUT_DIR = path.join(ROOT, 'types');

// ---- 1. data.js を読み込んで定数を取り出す（const はvmのcontextに乗らないので末尾でvarに集約）----
const dataCode = fs.readFileSync(DATA_JS, 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  dataCode +
  '\nvar __OUT = { MBTI_DETAILS, CHAR_IMG, MIRROR_PAIRS, SOULMATE_PAIRS, WARNING_PAIRS, ZODIACS };',
  sandbox
);
const { MBTI_DETAILS, CHAR_IMG, MIRROR_PAIRS, SOULMATE_PAIRS, WARNING_PAIRS } = sandbox.__OUT;

const MBTI_ORDER = [
  'INTJ','INTP','INFJ','INFP','ENFP','ENFJ','ENTJ','ENTP',
  'ISTJ','ISFJ','ISTP','ISFP','ESTJ','ESFJ','ESTP','ESFP'
];

const SITE = 'https://gfd-creators.github.io/unmei';
const VER = '15.2.0';

// ---- 2. ユーティリティ ----
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function clip(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// ---- 3. 共通パーツ ----
function head(title, desc, canonical) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">

<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-P0E2BDE2ET"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-P0E2BDE2ET', { send_page_view: true, anonymize_ip: true });
  window.ev = function(name, params){ if (typeof gtag === 'function') gtag('event', name, params || {}); };
</script>

<!-- ▼▼ AdSense: 審査通過後、下記を有効化する（Step2） ▼▼
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<script>window.UNMEI_ADSENSE = { enabled: true, client: 'ca-pub-XXXXXXXXXXXXXXXX' };</script>
   ▲▲ ここまで（client IDを差し替え、ad-slot の data-ad-slot を実IDに） ▲▲ -->

<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="運命図鑑 ウンメイ">
<meta property="og:image" content="${SITE}/assets/og/ogp.png">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og/ogp.png">

<link rel="manifest" href="../manifest.json">
<meta name="theme-color" content="#ff6fb3">
<link rel="icon" type="image/png" sizes="32x32" href="../assets/icons/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Kosugi+Maru&family=M+PLUS+Rounded+1c:wght@400;500;700;800;900&family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css?v=${VER}">
<style>
  /* タイプページ専用レイアウト（self-contained） */
  .tp-wrap { max-width: 480px; margin: 0 auto; padding: 16px 14px 60px; }
  .tp-nav { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:14px; font-size:13px; }
  .tp-nav a { color:#e8358c; text-decoration:none; font-weight:700; background:#fff; border:2px solid #ffd1e7; border-radius:999px; padding:6px 14px; }
  .tp-char { width:170px; height:170px; margin:6px auto 2px; }
  .tp-char img { width:100%; height:100%; object-fit:contain; }
  .tp-mbti-tag { display:inline-block; background:#fff; border:2px solid #ffd1e7; color:#e8358c; font-weight:800; letter-spacing:2px; border-radius:999px; padding:3px 16px; font-size:14px; margin-bottom:8px; }
  .tp-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:10px; }
  .tp-grid a { display:block; text-decoration:none; color:#4a2c5c; background:#fff; border:2px solid #ffe4f1; border-radius:14px; padding:8px 4px 6px; text-align:center; }
  .tp-grid a:hover { border-color:#ff6fb3; }
  .tp-grid .tg-img { width:100%; aspect-ratio:1; }
  .tp-grid .tg-img img { width:100%; height:100%; object-fit:contain; }
  .tp-grid .tg-name { font-size:9.5px; font-weight:700; line-height:1.25; margin-top:3px; }
  .tp-grid .tg-mbti { font-size:9px; color:#b07; letter-spacing:1px; }
  .tp-cta { display:block; text-align:center; text-decoration:none; }
  /* 広告枠: AdSense有効化前は空 → 非表示。有効化後に中身が入り表示される */
  .ad-slot { margin:18px 0; min-height:0; text-align:center; }
  .ad-slot:empty { display:none; }
  .ad-label { font-size:10px; color:#c9a; letter-spacing:1px; }
</style>
</head>
<body>
<div class="bg-pattern"></div>
<div class="bg-dots"></div>`;
}

function adSlot(id) {
  // 審査前は空。types.js が enabled 時のみ広告を注入する。
  return `<div class="ad-slot" data-ad-slot="${id}"></div>`;
}

function gridOf(currentMbti) {
  const cells = MBTI_ORDER.filter(m => m !== currentMbti).map(m => {
    const d = MBTI_DETAILS[m];
    return `      <a href="${m.toLowerCase()}.html">
        <div class="tg-img"><img src="../${CHAR_IMG[m]}" alt="${esc(d.name)}" loading="lazy"></div>
        <div class="tg-name">${esc(d.name)}</div>
        <div class="tg-mbti">${m}</div>
      </a>`;
  }).join('\n');
  return `    <div class="tp-grid">\n${cells}\n    </div>`;
}

// ---- 4. タイプページ ----
function typePage(mbti) {
  const d = MBTI_DETAILS[mbti];
  const mirror = MIRROR_PAIRS[mbti];
  const mirrorD = MBTI_DETAILS[mirror.mbti];
  const title = `${d.name}（${mbti}型）の性格・恋愛・相性 | 運命図鑑`;
  const desc = clip(`${d.catch}。${d.desc}`, 118);
  const canonical = `${SITE}/types/${mbti.toLowerCase()}.html`;

  return head(title, desc, canonical) + `
<div class="tp-wrap">
  <nav class="tp-nav">
    <a href="index.html">★ 図鑑トップ</a>
    <a href="../index.html" onclick="if(window.ev)ev('type_to_quiz',{from:'${mbti}',pos:'nav'});">うらなう ♡</a>
  </nav>

  <div class="result-card">
    <div class="result-label">★ 運 命 タ イ プ 図 鑑 ★</div>
    <div class="tp-char">${getImg(mbti)}</div>
    <div class="tp-mbti-tag">${mbti}</div>
    <h1 class="result-type">${esc(d.name)}</h1>
    <p class="result-catchphrase">${esc(d.catch)}</p>
    <div class="result-divider"></div>
    <div class="result-attr-grid">
      <div class="attr-box"><div class="attr-label">タイプ</div><div class="attr-value">${mbti}</div></div>
      <div class="attr-box"><div class="attr-label">運命の色</div><div class="attr-value color-dot"><span class="color-circle" style="background:${esc(d.color)}"></span><span style="font-size:13px">${esc(d.colorName)}</span></div></div>
    </div>
    <div class="result-description">${esc(d.desc)}</div>
  </div>

  ${adSlot('type-top')}

  <div class="section-title">あ な た の く せ</div>
  <div class="info-card warning"><div class="card-label">✕ ちょっとした弱点</div><div class="card-text">${esc(d.flaw)}</div></div>

  <div class="section-title">か く れ た 魅 力</div>
  <div class="info-card charm"><div class="card-label">◆ ほんとうのあなた</div><div class="card-text">${esc(d.charm)}</div></div>

  <div class="section-title">鏡 う つ し の 子</div>
  <div class="mirror-card">
    <div class="mirror-label">あなたと正反対の運命</div>
    <div class="mirror-char">${getImg(mirror.mbti)}</div>
    <div class="mirror-type"><a href="${mirror.mbti.toLowerCase()}.html" style="color:inherit;text-decoration:underline dotted;">${esc(mirrorD.name)}</a></div>
    <div class="mirror-desc">${esc(mirror.desc)}</div>
  </div>

  <div class="relation-grid">
    <div class="relation-card warning"><div class="relation-label">⚠ ニガテな子</div><div class="relation-value">${esc(WARNING_PAIRS[mbti])} の子</div></div>
    <div class="relation-card soulmate"><div class="relation-label">♡ うんめいの子</div><div class="relation-value">${esc(SOULMATE_PAIRS[mbti])} の子</div></div>
  </div>

  <div class="section-title">恋 に お ち る 瞬 間</div>
  <div class="info-card love"><div class="card-label">♡ あなたが好きになる時</div><div class="card-text">${esc(d.love)}</div></div>

  <div class="section-title">あ な た の 未 来</div>
  <div class="info-card gold"><div class="card-label">★ あなたが手にするもの</div><div class="card-text">${esc(d.prophecy)}</div></div>

  ${adSlot('type-mid')}

  <div class="share-buttons">
    <a class="btn btn-yellow tp-cta" href="../index.html" onclick="if(window.ev)ev('type_to_quiz',{from:'${mbti}',pos:'cta'});">
      ★ あなたの運命タイプを 診断する ★
      <span class="btn-sub">生年月日 × 20の質問で あなたのキャラを占う</span>
    </a>
  </div>

  <div class="section-title">ほ か の 運 命 タ イ プ</div>
${gridOf(mbti)}

  ${adSlot('type-bottom')}

  <div style="text-align:center;margin-top:24px;font-size:11px;color:#b9a;">
    <a href="../index.html" style="color:#e8358c;">運命図鑑 ウンメイ</a> ｜ MBTI × 干支 で占う 運命キャラ図鑑
  </div>
</div>
</body>
</html>`;
}

function getImg(mbti) {
  return `<img src="../${CHAR_IMG[mbti]}" alt="${esc(MBTI_DETAILS[mbti].name)}">`;
}

// ---- 5. 図鑑トップ (hub) ----
function hubPage() {
  const title = '運命タイプ図鑑｜MBTI×干支の16キャラ一覧 | 運命図鑑 ウンメイ';
  const desc = '運命図鑑の16の運命タイプ（MBTIキャラ）一覧。あなたの性格・恋愛・相性・運命の色をキャラクターで診断。気になるタイプをタップして詳細をチェック♡';
  const canonical = `${SITE}/types/`;
  const cards = MBTI_ORDER.map(m => {
    const d = MBTI_DETAILS[m];
    return `      <a href="${m.toLowerCase()}.html">
        <div class="tg-img"><img src="../${CHAR_IMG[m]}" alt="${esc(d.name)}" loading="lazy"></div>
        <div class="tg-name">${esc(d.name)}</div>
        <div class="tg-mbti">${m}</div>
      </a>`;
  }).join('\n');

  return head(title, desc, canonical) + `
<div class="tp-wrap">
  <nav class="tp-nav">
    <a href="../index.html">★ トップへ</a>
    <a href="../index.html" onclick="if(window.ev)ev('type_to_quiz',{from:'hub',pos:'nav'});">うらなう ♡</a>
  </nav>

  <div style="text-align:center;margin:6px 0 2px;">
    <div class="result-label">★ 運 命 タ イ プ 図 鑑 ★</div>
    <h1 class="result-type" style="font-size:22px;">16の運命キャラ ずかん</h1>
    <p class="result-catchphrase">MBTI × 干支 で わかる あなたの運命タイプ</p>
  </div>

  ${adSlot('hub-top')}

  <div class="tp-grid">
${cards}
  </div>

  ${adSlot('hub-mid')}

  <div class="share-buttons" style="margin-top:20px;">
    <a class="btn btn-yellow tp-cta" href="../index.html" onclick="if(window.ev)ev('type_to_quiz',{from:'hub',pos:'cta'});">
      ★ あなたの運命タイプを 診断する ★
      <span class="btn-sub">生年月日 × 20の質問で 占う</span>
    </a>
  </div>

  <div style="text-align:center;margin-top:24px;font-size:11px;color:#b9a;">
    <a href="../index.html" style="color:#e8358c;">運命図鑑 ウンメイ</a> ｜ MBTI × 干支 で占う 運命キャラ図鑑
  </div>
</div>
</body>
</html>`;
}

// ---- 6. 出力 ----
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const m of MBTI_ORDER) {
  fs.writeFileSync(path.join(OUT_DIR, m.toLowerCase() + '.html'), typePage(m), 'utf8');
  count++;
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), hubPage(), 'utf8');

console.log(`✅ 生成完了: types/index.html + ${count}タイプページ (計${count + 1}ファイル)`);
console.log(`   出力先: ${OUT_DIR}`);
