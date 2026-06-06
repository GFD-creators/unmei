// ============================================================
// 収益の出口（マネタイズ）設定 + 描画  ★ここ1ファイルで管理★
// ------------------------------------------------------------
// 使い方（初心者向け）:
//   ① note課金導線を出すとき:
//        note.enabled を true にして、note.url に記事URLを貼る
//   ② アフィリ広告を出すとき:
//        affiliate.enabled を true にして、affiliate.html に
//        ASP(A8.net/もしも等)からコピーした広告タグをそのまま貼る
//   空 or enabled:false の枠は自動で「非表示」になります（安全）。
//   広告/PRには自動で「PR」表記が付きます（ステマ規制対応・必須）。
// ============================================================

window.UNMEI_MONETIZE = {

  // ① note等の「詳細鑑定（有料）」への導線 -------------------
  note: {
    enabled: false,                 // ← 記事を用意できたら true に
    url: '',                        // ← noteの記事URL（例: https://note.com/xxxx/n/xxxxxxxx）
    title: 'もっと深い あなたの運命を読む',
    sub:   '完全版・詳細鑑定（恋愛 / 仕事 / 2026年の運勢）',
    byType: {}                      // ← タイプ別にURLを分けたい時だけ { INTJ:'...', ENFP:'...' }
  },

  // ② アフィリエイト広告枠（A8.net / もしも 等）--------------
  affiliate: {
    enabled: true,                  // ← 広告コードを貼ったら true に
    // items に複数入れるとランダムで1つ表示（A8管理画面で a8mat別に成果比較できる）
    items: [
      // ① ココナラ メール占い（¥2,000 / 確定率99%）
      `<a href="https://px.a8.net/svt/ejp?a8mat=4B5N49+RDYLU+2PEO+1BWBM9" rel="nofollow">
<img border="0" width="300" height="250" alt="ココナラ メール占い" src="https://www29.a8.net/svt/bgt?aid=260603721046&wid=001&eno=01&mid=s00000012624008045000&mc=1"></a>
<img border="0" width="1" height="1" src="https://www15.a8.net/0.gif?a8mat=4B5N49+RDYLU+2PEO+1BWBM9" alt="">`,
      // ② ココナラ 電話占い（¥16,000 / EPC50）
      `<a href="https://px.a8.net/svt/ejp?a8mat=4B5N49+H9LBM+2PEO+C4LLD" rel="nofollow">
<img border="0" width="300" height="250" alt="ココナラ 電話占い" src="https://www24.a8.net/svt/bgt?aid=260603721029&wid=001&eno=01&mid=s00000012624002037000&mc=1"></a>
<img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4B5N49+H9LBM+2PEO+C4LLD" alt="">`
    ],
    html: ''                        // ← 単発で貼りたい時はこちらでも可（items優先）
  }
};

// ---- 必要CSSを自動注入（このファイル単体で完結させる）----
(function injectMonetizeCSS() {
  if (document.getElementById('monetize-style')) return;
  const css = `
    #monetize-note-slot:empty, #monetize-affiliate-slot:empty { display: none; }
    #monetize-note-slot { margin: 18px 0 6px; }
    .btn-premium {
      background: linear-gradient(135deg, #ffe08a, #ffb648) !important;
      color: #6b4a00 !important;
      border: 2px solid #f5b342 !important;
      box-shadow: 0 4px 14px rgba(245,179,66,0.35) !important;
    }
    .pr-slot { margin: 18px 0; text-align: center; }
    .pr-label {
      display: inline-block; font-size: 10px; letter-spacing: 2px;
      color: #b3a3c0; border: 1px solid #e6d8ef; border-radius: 4px;
      padding: 1px 7px; margin-bottom: 6px;
    }
  `;
  const style = document.createElement('style');
  style.id = 'monetize-style';
  style.textContent = css;
  document.head.appendChild(style);
})();

// ---- 結果画面のマネタイズ枠を描画（flow.js の showResult から呼ぶ）----
function renderMonetize(mbti) {
  const cfg = window.UNMEI_MONETIZE || {};

  // --- ① note 課金導線 ---
  const noteSlot = document.getElementById('monetize-note-slot');
  if (noteSlot) {
    noteSlot.innerHTML = '';
    const n = cfg.note || {};
    const url = (n.byType && n.byType[mbti]) ? n.byType[mbti] : n.url;
    if (n.enabled && url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'btn btn-premium';
      a.innerHTML = '★ ' + (n.title || 'もっと詳しく読む') + ' ★' +
                    '<span class="btn-sub">' + (n.sub || '') + '</span>';
      a.addEventListener('click', function () {
        if (window.ev) ev('monetize_click', { kind: 'note', mbti: mbti });
      });
      noteSlot.appendChild(a);
    }
  }

  // --- ② アフィリ PR枠（itemsからランダム1つ表示）---
  const afSlot = document.getElementById('monetize-affiliate-slot');
  if (afSlot) {
    afSlot.innerHTML = '';
    const af = cfg.affiliate || {};
    const items = (af.items && af.items.length) ? af.items : (af.html ? [af.html] : []);
    if (af.enabled && items.length) {
      const idx = Math.floor(Math.random() * items.length);
      afSlot.innerHTML = '<div class="pr-label">PR</div>' + items[idx];
      afSlot.querySelectorAll('a').forEach(function (el) {
        el.addEventListener('click', function () {
          if (window.ev) ev('monetize_click', { kind: 'affiliate', mbti: mbti, ad: idx });
        });
      });
    }
  }
}
