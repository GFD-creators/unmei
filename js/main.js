// ============================================
// 起動時の処理
// ============================================
function setupPreviewChars() {
  const container = document.getElementById('preview-chars');
  if (!container) return;
  const order = ['INTJ','ENFP','INFP','ENTJ','INFJ','ESFP','ISFJ','ENTP','ISFP','ENFJ','ISTP','ESTJ'];
  order.forEach(mbti => {
    const div = document.createElement('div');
    div.className = 'preview-char';
    div.innerHTML = getCharHTML(mbti);
    container.appendChild(div);
  });
}

function createFloatingStars() {
  const container = document.getElementById('floating-stars');
  if (!container) return;
  const symbols = ['★', '♡', '✦', '◆'];
  const colors = ['#ff8fc4', '#ffd93d', '#c4b5fd', '#ff6fb3'];
  for (let i = 0; i < 12; i++) {
    const star = document.createElement('div');
    star.className = 'float-star';
    star.textContent = symbols[i % symbols.length];
    star.style.color = colors[i % colors.length];
    star.style.left = Math.random() * 100 + '%';
    star.style.animationDelay = (i * 0.7) + 's';
    star.style.animationDuration = (6 + Math.random() * 4) + 's';
    container.appendChild(star);
  }
}

function initialize() {
  setupPreviewChars();
  createFloatingStars();

  // 名前入力欄にリアルタイム更新リスナー
  const nameInput = document.getElementById('inviter-name-input');
  if (nameInput) {
    nameInput.addEventListener('input', updateInviteUrl);
  }

  // ?invite= パラメータをチェック
  const params = new URLSearchParams(window.location.search);
  const inviteParam = params.get('invite');
  if (inviteParam) {
    const partnerData = parseInviteParam(inviteParam);
    if (partnerData && partnerData.mbti && partnerData.zodiac) {
      // 招待リンクから来訪＝ループの「拡散」。K-factor計測用
      if (window.ev) ev('invite_opened', { partner_mbti: partnerData.mbti, partner_zodiac: partnerData.zodiac });
      showInviteWelcome(partnerData);
      return;
    }
  }
}

document.addEventListener('DOMContentLoaded', initialize);

// ============================================
// PWA Phase 1: Service Worker 登録
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
        // 更新通知（新しいSWが activated 時に1回だけ）
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available');
              // 必要なら自動リロードや更新トースト表示（今回は静かに更新）
            }
          });
        });
      })
      .catch((err) => console.warn('[PWA] SW register failed:', err));
  });
}
