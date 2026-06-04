// ============================================================
// 運命図鑑 タイプ別 静的ページ生成スクリプト (Node.js)
// ------------------------------------------------------------
// 生成物:
//   - types/index.html              … 図鑑トップ(ハブ)
//   - types/{mbti}.html  ×16        … タイプ別ページ
//   - types/{mbti}-{干支}.html ×192 … タイプ×干支ページ(SEOロングテール)
//        各ページに固有の「全国偏差値(ranking.js計算)」＋干支解説＋相性＋内部リンク
//   データは js/data.js + js/ranking.js を単一の真実源として読み込む。
// 使い方:  node make_type_pages.js
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'types');
const SITE = 'https://gfd-creators.github.io/unmei';
const VER = '15.2.3';

// ---- data.js + ranking.js を読み込んで定数/関数を取り出す ----
const dataCode = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
const rankCode = fs.readFileSync(path.join(ROOT, 'js', 'ranking.js'), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  dataCode + '\n' + rankCode +
  '\nvar __OUT = { MBTI_DETAILS, CHAR_IMG, MIRROR_PAIRS, SOULMATE_PAIRS, WARNING_PAIRS, ZODIACS, calcAllRankings };',
  sandbox
);
const { MBTI_DETAILS, CHAR_IMG, MIRROR_PAIRS, SOULMATE_PAIRS, WARNING_PAIRS, calcAllRankings } = sandbox.__OUT;

const MBTI_ORDER = [
  'INTJ','INTP','INFJ','INFP','ENFP','ENFJ','ENTJ','ENTP',
  'ISTJ','ISFJ','ISTP','ISFP','ESTJ','ESFJ','ESTP','ESFP'
];
const RANK_ORDER = ['mote','commu','money','loyal','genius','mental','yandere'];

// 干支情報（romaji=ファイル名用 / yomi=表示 / blurb=干支別の性格解説）
const ZODIAC_INFO = {
  '子': { romaji:'ne',      yomi:'ねずみ',   blurb:'機転が利き、人当たりがよく、チャンスを逃さない現実派。コツコツ蓄える堅実さも。' },
  '丑': { romaji:'ushi',    yomi:'うし',     blurb:'忍耐強く誠実。コツコツ努力を積み上げ、時間をかけて信頼を勝ち取るタイプ。' },
  '寅': { romaji:'tora',    yomi:'とら',     blurb:'情熱的で行動力抜群。正義感が強く、勝負所でこそ力を発揮する一匹狼。' },
  '卯': { romaji:'u',       yomi:'うさぎ',   blurb:'穏やかで人に好かれる平和主義。美的センスと細やかな気配りの持ち主。' },
  '辰': { romaji:'tatsu',   yomi:'たつ',     blurb:'カリスマと運の強さを併せ持つ。スケールの大きい夢を現実に変える星。' },
  '巳': { romaji:'mi',      yomi:'へび',     blurb:'知的で神秘的。直感と分析力に優れ、執念深く目標を達成する。' },
  '午': { romaji:'uma',     yomi:'うま',     blurb:'明るく社交的で行動派。人を惹きつけるスター性の持ち主。' },
  '未': { romaji:'hitsuji', yomi:'ひつじ',   blurb:'優しく協調的。芸術センスがあり、人を癒やす穏やかな魅力。' },
  '申': { romaji:'saru',    yomi:'さる',     blurb:'器用で頭の回転が速い。好奇心旺盛でエンタメ性も抜群。' },
  '酉': { romaji:'tori',    yomi:'とり',     blurb:'しっかり者で計画的。美意識が高く、努力家で世話好き。' },
  '戌': { romaji:'inu',     yomi:'いぬ',     blurb:'忠実で正直。仲間思いで、一度信じた人を最後まで守る。' },
  '亥': { romaji:'i',       yomi:'いのしし', blurb:'まっすぐで情に厚い。一途で全力、決めたら突き進む猪突猛進型。' }
};
const ZODIAC_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// ---- ユーティリティ ----
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function clip(s, n) {
  s = String(s || '').replace(/\s+/g,' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function imgTag(mbti, cls) {
  return `<img src="../${CHAR_IMG[mbti]}" alt="${esc(MBTI_DETAILS[mbti].name)}"${cls ? ' class="'+cls+'"' : ''}>`;
}

// ---- 共通 head ----
function head(title, desc, canonical) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googlesyndication.com https://stats.g.doubleclick.net; frame-src https://googleads.g.doubleclick.net https://*.doubleclick.net https://*.google.com; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<script>if (window.top !== window.self) { try { window.top.location.replace(window.location.href); } catch (e) {} }</script>
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

<!-- ▼▼ AdSense: 審査通過後に有効化（Step2） ▼▼
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ▲▲ client IDを差し替え ▲▲ -->

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
  .tp-wrap { max-width: 480px; margin: 0 auto; padding: 16px 14px 60px; }
  .tp-nav { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:14px; font-size:13px; }
  .tp-nav a { color:#e8358c; text-decoration:none; font-weight:700; background:#fff; border:2px solid #ffd1e7; border-radius:999px; padding:6px 14px; }
  .tp-char { width:170px; height:170px; margin:6px auto 2px; }
  .tp-char img { width:100%; height:100%; object-fit:contain; }
  .tp-mbti-tag { display:inline-block; background:#fff; border:2px solid #ffd1e7; color:#e8358c; font-weight:800; letter-spacing:2px; border-radius:999px; padding:3px 16px; font-size:14px; margin:4px 3px 8px; }
  .tp-zodiac-tag { display:inline-block; background:#fff7ad; border:2px solid #f5b342; color:#8a5a00; font-weight:800; border-radius:999px; padding:3px 16px; font-size:14px; margin:4px 3px 8px; }
  .tp-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:10px; }
  .tp-grid a { display:block; text-decoration:none; color:#4a2c5c; background:#fff; border:2px solid #ffe4f1; border-radius:14px; padding:8px 4px 6px; text-align:center; }
  .tp-grid a:hover { border-color:#ff6fb3; }
  .tp-grid .tg-img { width:100%; aspect-ratio:1; }
  .tp-grid .tg-img img { width:100%; height:100%; object-fit:contain; }
  .tp-grid .tg-name { font-size:9.5px; font-weight:700; line-height:1.25; margin-top:3px; }
  .tp-grid .tg-mbti { font-size:9px; color:#b07; letter-spacing:1px; }
  .tp-cta { display:block; text-align:center; text-decoration:none; }
  .z-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:10px; }
  .z-grid a { display:block; text-decoration:none; color:#8a5a00; background:#fffdf2; border:2px solid #ffe9b0; border-radius:12px; padding:9px 4px; text-align:center; font-weight:700; font-size:12px; }
  .z-grid a:hover { border-color:#f5b342; }
  .cb-rank-row { display:flex; align-items:center; gap:8px; padding:7px 10px; border-bottom:1px dashed #ffd1e7; }
  .cb-rank-row:last-child { border-bottom:none; }
  .cb-rank-ico { font-size:18px; width:24px; text-align:center; }
  .cb-rank-label { flex:1; font-weight:700; color:#4a2c5c; font-size:13px; }
  .cb-rank-score { font-weight:800; font-size:15px; }
  .cb-rank-top { font-size:10px; color:#b09; margin-left:4px; }
  .ad-slot { margin:18px 0; text-align:center; }
  .ad-slot:empty { display:none; }
</style>
</head>
<body>
<div class="bg-pattern"></div>
<div class="bg-dots"></div>`;
}

function adSlot(id) { return `<div class="ad-slot" data-ad-slot="${id}"></div>`; }

// タイプ16グリッド（currentを除く）
function typeGrid(currentMbti) {
  return '<div class="tp-grid">\n' + MBTI_ORDER.filter(m => m !== currentMbti).map(m => {
    const d = MBTI_DETAILS[m];
    return `  <a href="${m.toLowerCase()}.html"><div class="tg-img"><img src="../${CHAR_IMG[m]}" alt="${esc(d.name)}" loading="lazy"></div><div class="tg-name">${esc(d.name)}</div><div class="tg-mbti">${m}</div></a>`;
  }).join('\n') + '\n</div>';
}

// 干支12リンク（あるタイプの干支別ページへ）
function zodiacGridForType(mbti, currentZodiac) {
  return '<div class="z-grid">\n' + ZODIAC_ORDER.filter(z => z !== currentZodiac).map(z => {
    const zi = ZODIAC_INFO[z];
    return `  <a href="${mbti.toLowerCase()}-${zi.romaji}.html">${z}年<br><span style="font-size:9px;color:#b9a;">${zi.yomi}</span></a>`;
  }).join('\n') + '\n</div>';
}

// 同じ干支の他タイプ16リンク
function typeGridForZodiac(zodiac, currentMbti) {
  const zi = ZODIAC_INFO[zodiac];
  return '<div class="tp-grid">\n' + MBTI_ORDER.filter(m => m !== currentMbti).map(m => {
    const d = MBTI_DETAILS[m];
    return `  <a href="${m.toLowerCase()}-${zi.romaji}.html"><div class="tg-img"><img src="../${CHAR_IMG[m]}" alt="${esc(d.name)}" loading="lazy"></div><div class="tg-name">${esc(d.name)}</div><div class="tg-mbti">${m}</div></a>`;
  }).join('\n') + '\n</div>';
}

// 偏差値ランキングブロック（干支×タイプ固有・unique data）
function rankingBlock(mbti, zodiac) {
  const r = calcAllRankings(mbti, zodiac, null);
  const rows = RANK_ORDER.map(k => {
    const x = r[k];
    const top = x.topPercent >= 10 ? Math.round(x.topPercent) + '%' : x.topPercent.toFixed(1) + '%';
    return `    <div class="cb-rank-row"><span class="cb-rank-ico">${x.axis.icon}</span><span class="cb-rank-label">${x.axis.label}</span><span class="cb-rank-score" style="color:${x.axis.color}">偏差値 ${x.score}</span><span class="cb-rank-top">上位${top}</span></div>`;
  }).join('\n');
  return `  <div class="section-title">${zodiac}年 × ${mbti} の 全国偏差値</div>\n  <div class="ranking-card">\n${rows}\n  </div>`;
}

// ---- タイプページ（16）----
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
    <div class="tp-char">${imgTag(mbti)}</div>
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
    <div class="mirror-char">${imgTag(mirror.mbti)}</div>
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

  <div class="section-title">干 支 別 の ${esc(d.name)}</div>
  <p style="text-align:center;font-size:12px;color:#7a5290;margin:-4px 0 4px;">生まれ年の干支で さらに詳しく（性格・相性・偏差値）</p>
  ${zodiacGridForType(mbti, null)}

  <div class="section-title">ほ か の 運 命 タ イ プ</div>
  ${typeGrid(mbti)}

  ${adSlot('type-bottom')}
  <div style="text-align:center;margin-top:24px;font-size:11px;color:#b9a;">
    <a href="../index.html" style="color:#e8358c;">運命図鑑 ウンメイ</a> ｜ MBTI × 干支 で占う 運命キャラ図鑑<br><a href="../privacy.html" style="color:#b9a;">プライバシーポリシー</a>
  </div>
</div>
</body>
</html>`;
}

// ---- タイプ×干支ページ（192）----
function comboPage(mbti, zodiac) {
  const d = MBTI_DETAILS[mbti];
  const zi = ZODIAC_INFO[zodiac];
  const title = `${zodiac}年生まれの${d.name}（${mbti}）｜性格・恋愛・相性・偏差値 | 運命図鑑`;
  const desc = clip(`${zodiac}年(${zi.yomi})生まれで${mbti}「${d.name}」のあなたの性格・恋愛・相性・全国偏差値。${d.catch}。${zi.blurb}`, 120);
  const canonical = `${SITE}/types/${mbti.toLowerCase()}-${zi.romaji}.html`;

  return head(title, desc, canonical) + `
<div class="tp-wrap">
  <nav class="tp-nav">
    <a href="${mbti.toLowerCase()}.html">★ ${esc(d.name)}</a>
    <a href="../index.html" onclick="if(window.ev)ev('type_to_quiz',{from:'${mbti}-${zi.romaji}',pos:'nav'});">うらなう ♡</a>
  </nav>

  <div class="result-card">
    <div class="result-label">★ 干 支 × タ イ プ 詳 細 ★</div>
    <div class="tp-char">${imgTag(mbti)}</div>
    <div>
      <span class="tp-zodiac-tag">${zodiac}年（${zi.yomi}）</span>
      <span class="tp-mbti-tag">${mbti}</span>
    </div>
    <h1 class="result-type">${zodiac}年生まれの ${esc(d.name)}</h1>
    <p class="result-catchphrase">${esc(d.catch)}</p>
    <div class="result-divider"></div>
    <div class="result-description">${esc(d.desc)}</div>
  </div>

  ${adSlot('combo-top')}

  <div class="section-title">${zodiac}年生まれ の 特徴</div>
  <div class="info-card charm"><div class="card-label">◆ ${zodiac}（${zi.yomi}）の星</div><div class="card-text">${esc(zi.blurb)} ${mbti}「${esc(d.name)}」の資質と掛け合わさることで、独自の個性が生まれます。</div></div>

${rankingBlock(mbti, zodiac)}

  <div class="section-title">恋 愛 と 相 性</div>
  <div class="relation-grid">
    <div class="relation-card soulmate"><div class="relation-label">♡ うんめいの子</div><div class="relation-value">${esc(SOULMATE_PAIRS[mbti])} の子</div></div>
    <div class="relation-card warning"><div class="relation-label">⚠ ニガテな子</div><div class="relation-value">${esc(WARNING_PAIRS[mbti])} の子</div></div>
  </div>
  <div class="info-card love"><div class="card-label">♡ あなたが好きになる時</div><div class="card-text">${esc(d.love)}</div></div>

  ${adSlot('combo-mid')}

  <div class="share-buttons">
    <a class="btn btn-yellow tp-cta" href="../index.html" onclick="if(window.ev)ev('type_to_quiz',{from:'${mbti}-${zi.romaji}',pos:'cta'});">
      ★ あなたの運命タイプを 診断する ★
      <span class="btn-sub">生年月日 × 20の質問で 詳しく占う</span>
    </a>
  </div>

  <div class="section-title">${esc(d.name)} の 干支別</div>
  ${zodiacGridForType(mbti, zodiac)}

  <div class="section-title">${zodiac}年 の 他の タイプ</div>
  ${typeGridForZodiac(zodiac, mbti)}

  ${adSlot('combo-bottom')}
  <div style="text-align:center;margin-top:24px;font-size:11px;color:#b9a;">
    <a href="../index.html" style="color:#e8358c;">運命図鑑 ウンメイ</a> ｜ MBTI × 干支 で占う 運命キャラ図鑑<br><a href="../privacy.html" style="color:#b9a;">プライバシーポリシー</a>
  </div>
</div>
</body>
</html>`;
}

// ---- 図鑑トップ ----
function hubPage() {
  const title = '運命タイプ図鑑｜MBTI×干支の16キャラ一覧 | 運命図鑑 ウンメイ';
  const desc = '運命図鑑の16の運命タイプ（MBTIキャラ）一覧。あなたの性格・恋愛・相性・運命の色をキャラクターで診断。気になるタイプをタップして詳細をチェック♡';
  const canonical = `${SITE}/types/`;
  const cards = MBTI_ORDER.map(m => {
    const d = MBTI_DETAILS[m];
    return `    <a href="${m.toLowerCase()}.html"><div class="tg-img"><img src="../${CHAR_IMG[m]}" alt="${esc(d.name)}" loading="lazy"></div><div class="tg-name">${esc(d.name)}</div><div class="tg-mbti">${m}</div></a>`;
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
    <a href="../index.html" style="color:#e8358c;">運命図鑑 ウンメイ</a> ｜ MBTI × 干支 で占う 運命キャラ図鑑<br><a href="../privacy.html" style="color:#b9a;">プライバシーポリシー</a>
  </div>
</div>
</body>
</html>`;
}

// ---- 出力 ----
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
let typeCount = 0, comboCount = 0;
for (const m of MBTI_ORDER) {
  fs.writeFileSync(path.join(OUT_DIR, m.toLowerCase() + '.html'), typePage(m), 'utf8');
  typeCount++;
  for (const z of ZODIAC_ORDER) {
    fs.writeFileSync(path.join(OUT_DIR, m.toLowerCase() + '-' + ZODIAC_INFO[z].romaji + '.html'), comboPage(m, z), 'utf8');
    comboCount++;
  }
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), hubPage(), 'utf8');
console.log(`✅ 生成完了: ハブ1 + タイプ${typeCount} + 干支別${comboCount} = 計${1 + typeCount + comboCount}ファイル`);
console.log(`   出力先: ${OUT_DIR}`);
