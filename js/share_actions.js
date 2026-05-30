// ============================================
// シェアアクション (Day 5)
// Web Share API + Twitter/X + LINE + コピー + 画像DL
// ============================================

// 現在のシェアコンテキスト（共有テキスト + URL + 画像ファイル名）
let _currentShare = {
  text: '私の運命を 占ってみたよ♡ #運命図鑑',
  url:  window.location.origin + window.location.pathname,
  filename: 'unmei.png'
};

// シェアコンテキストをセット（image生成関数から呼ばれる）
function setShareContext({ text, url, filename }) {
  _currentShare = {
    text: text || _currentShare.text,
    url:  url  || _currentShare.url,
    filename: filename || 'unmei.png'
  };
  // 現在のシェア文プレビューを更新
  const previewEl = document.getElementById('share-text-preview');
  if (previewEl) {
    previewEl.textContent = _currentShare.text + ' ' + _currentShare.url;
  }
  // モーダル開いた直後のスクロール位置をトップにリセット（iOS Safariで効く）
  setTimeout(() => {
    const modal = document.getElementById('share-modal');
    if (modal && modal.classList.contains('active')) {
      modal.scrollTop = 0;
    }
  }, 50);
}

// =====================
// 1. Web Share API（モバイル優先）
// =====================
async function tryWebShare() {
  if (!navigator.share) {
    // 未対応の場合は画像DLにフォールバック
    downloadShareImage();
    return;
  }
  try {
    // 画像をBlobに変換
    const canvas = document.getElementById('share-canvas');
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], _currentShare.filename, { type: 'image/png' });

    // 画像付きシェアが使えるか
    const shareData = {
      title: '運命図鑑 ウンメイ',
      text: _currentShare.text,
      url:  _currentShare.url
    };
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      shareData.files = [file];
    }
    await navigator.share(shareData);
  } catch (e) {
    // ユーザーキャンセル等は無視
    if (e.name !== 'AbortError') {
      console.warn('Share failed, falling back to download', e);
      downloadShareImage();
    }
  }
}

// =====================
// 2. 画像ダウンロード
// =====================
function downloadShareImage() {
  const canvas = document.getElementById('share-canvas');
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = _currentShare.filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showShareToast('画像を保存しました ♡');
}

// =====================
// 3. テキスト＋URL コピー
// =====================
async function copyShareText() {
  const fullText = _currentShare.text + '\n' + _currentShare.url;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(fullText);
      showShareToast('テキストをコピーしました ♡');
      return;
    } catch (e) {
      /* fall through */
    }
  }
  // フォールバック
  const ta = document.createElement('textarea');
  ta.value = fullText;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showShareToast('テキストをコピーしました ♡');
  } catch (e) {
    alert('コピーに失敗しました。手動で長押しコピーしてください');
  }
  document.body.removeChild(ta);
}

// =====================
// 4. Twitter / X シェア
// =====================
function shareToTwitter() {
  const text = encodeURIComponent(_currentShare.text);
  const url = encodeURIComponent(_currentShare.url);
  const intent = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  window.open(intent, '_blank', 'noopener,noreferrer');
  showShareToast('Xのシェア画面を開きました');
}

// =====================
// 5. LINE シェア
// =====================
function shareToLineImage() {
  const text = encodeURIComponent(_currentShare.text + ' ');
  const url = encodeURIComponent(_currentShare.url);
  const intent = `https://line.me/R/msg/text/?${text}${url}`;
  window.open(intent, '_blank', 'noopener,noreferrer');
  showShareToast('LINEのシェア画面を開きました');
}

// =====================
// トースト表示
// =====================
function showShareToast(msg) {
  let toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

// =====================
// シェアテキスト ジェネレーター
// =====================
function buildShareTextResult(st) {
  // 運命カード（個人の結果）
  const name = st.rareType ? st.rareType.name : st.details.name;
  const rare = st.rareType ? `【${st.rareType.badge.replace(/[★ ]/g, '')}】` : '';
  return `${rare}私の運命タイプは『${name}』だった♡ あなたも占って♡ #運命図鑑`;
}

function buildShareTextRanking(rankings) {
  // 偏差値カード — 上位3軸を抜粋
  const top3 = rankings.slice(0, 3).map(r => `${r.axis.label}${r.score}`).join(' / ');
  return `私のランキング ▼\n${top3}\nあなたも占って♡ #運命図鑑 #偏差値`;
}

function buildShareTextPair(result, partnerName) {
  // ふたりの相性
  return `ふたりの相性は『${result.rankInfo.rank}ランク』${result.total}点だった♡ あなたも占って♡ #運命図鑑`;
}

function getBaseShareUrl() {
  return window.location.origin + window.location.pathname;
}
