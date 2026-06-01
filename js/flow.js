// ============================================
// アプリ状態 + 画面遷移 + MBTI フロー
// ============================================
let state = {
  year: null, month: null, day: null,
  zodiac: null,
  mbti: { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 },
  questionIndex: 0,
  answerHistory: [],
  finalMBTI: null,
  details: null,
  rareType: null,
  luck: null,
  inviterName: null
};

// 招待モード state
let invitePartner = null;
let isInviteMode = false;

function goToScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

function openYearPicker() {
  const grid = document.getElementById('year-grid');
  grid.innerHTML = '';
  const currentYear = new Date().getFullYear();
  // 80年遡及 = 10代 ~ 80代 まで対応
  for (let y = currentYear; y >= currentYear - 80; y--) {
    const item = document.createElement('div');
    item.className = 'year-item';
    item.textContent = y;
    item.onclick = () => {
      document.getElementById('year').value = y;
      document.getElementById('year-picker').classList.remove('active');
    };
    grid.appendChild(item);
  }
  document.getElementById('year-picker').classList.add('active');
}

function validateAndProceed() {
  const year = parseInt(document.getElementById('year').value);
  const month = parseInt(document.getElementById('month').value);
  const day = parseInt(document.getElementById('day').value);

  if (!year || !month || !day) {
    alert('うらないには、すべての日付が必要だよ！');
    if (window.ev) ev('birthdate_validation_error');
    return;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    alert('その日はないみたい…');
    if (window.ev) ev('birthdate_validation_error');
    return;
  }

  state.year = year;
  state.month = month;
  state.day = day;
  state.zodiac = ZODIACS[year % 12];

  state.questionIndex = 0;
  state.answerHistory = [];
  state.mbti = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };

  // GA: 占い開始
  if (window.ev) ev('quiz_start', { zodiac: state.zodiac, year: year });

  goToScreen('question');
  renderQuestion();
}

// 質問数別の励まし文言 (key = 質問番号、1-based)
const CHEER_MESSAGES = {
  1:  { text: '♡ Q U E S T I O N ♡',         milestone: false },
  3:  { text: '★ 順調！ この調子 ♡',           milestone: false },
  5:  { text: '✦ 1/4 達成 ★ いい感じ ♡',       milestone: true  },
  7:  { text: '♡ ノってきた！ ★',              milestone: false },
  10: { text: '★ 半分まで きた！ ♡♡',         milestone: true  },
  13: { text: '✦ ラスト 3 / 8 問 ♡',          milestone: false },
  15: { text: '♡ ラストスパート ★ もう少し！',  milestone: true  },
  18: { text: '★ 残り 3問！ がんばれ ♡',       milestone: false },
  20: { text: '♡ ラスト 1問 ♡♡♡',             milestone: true  },
};

function updateCheer(qIndex) {
  // qIndex は 0-based 状態のインデックス、表示は 1-based
  const qNum = qIndex + 1;
  // 直近の閾値メッセージを採用
  const keys = Object.keys(CHEER_MESSAGES).map(Number).sort((a,b)=>a-b);
  let chosen = keys[0];
  for (const k of keys) {
    if (qNum >= k) chosen = k;
  }
  const cheer = CHEER_MESSAGES[chosen];
  const el = document.getElementById('progress-cheer');
  if (!el) return;
  el.textContent = cheer.text;
  // アニメーション再発火のため class を一度外す
  el.classList.remove('milestone');
  void el.offsetWidth;
  if (cheer.milestone) el.classList.add('milestone');
  // pop アニメ再発火
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function renderQuestion() {
  const q = QUESTIONS[state.questionIndex];
  const totalQ = QUESTIONS.length;
  const qNum = state.questionIndex + 1;
  const pct = Math.round((qNum / totalQ) * 100);

  document.getElementById('q-num').textContent = 'QUESTION ' + qNum;
  document.getElementById('q-text').textContent = q.text;
  document.getElementById('progress-fill').style.width = pct + '%';
  const pctEl = document.getElementById('progress-percent');
  if (pctEl) pctEl.textContent = pct + '%';
  document.getElementById('progress-count').textContent = `★ ${qNum} / ${totalQ} ★`;

  // 励まし文言更新
  updateCheer(state.questionIndex);

  const btnBack = document.getElementById('btn-back');
  btnBack.style.display = state.questionIndex > 0 ? 'block' : 'none';

  const optionsEl = document.getElementById('q-options');
  optionsEl.innerHTML = '';
  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt.text;
    btn.onclick = () => answerQuestion(opt.axis);
    optionsEl.appendChild(btn);
  });
}

function answerQuestion(axis) {
  state.mbti[axis]++;
  state.answerHistory.push(axis);
  state.questionIndex++;
  // GA: 5問ごとに進捗イベント
  if (window.ev && state.questionIndex % 5 === 0) {
    ev('quiz_progress', { question: state.questionIndex });
  }
  if (state.questionIndex < QUESTIONS.length) {
    setTimeout(renderQuestion, 250);
  } else {
    if (window.ev) ev('quiz_complete');
    goToScreen('ritual');
    runRitualAnimation();
  }
}

// 色名を文字数に応じてフォントサイズ調整しつつセット
function setColorName(name) {
  const el = document.getElementById('result-color-name');
  el.textContent = name;
  // 7文字以下=13px(デフォルト)、8-9=11px、10以上=10px
  const len = (name || '').length;
  if (len >= 10)      el.style.fontSize = '10px';
  else if (len >= 8)  el.style.fontSize = '11px';
  else                el.style.fontSize = '13px';
}

function goBackQuestion() {
  if (state.questionIndex > 0) {
    state.questionIndex--;
    const lastAxis = state.answerHistory.pop();
    if (lastAxis) state.mbti[lastAxis]--;
    renderQuestion();
  }
}

function runRitualAnimation() {
  const mbtiKeys = ['INTJ','INTP','INFJ','INFP','ENFP','ENFJ','ENTJ','ENTP','ISTJ','ISFJ','ISTP','ISFP','ESTP','ESFP','ESTJ','ESFJ'];
  const randomMbti = mbtiKeys[Math.floor(Math.random() * mbtiKeys.length)];
  document.getElementById('ritual-char').innerHTML = getCharHTML(randomMbti);

  const texts = [
    { main: 'あなたの星をよんでいるよ', sub: 'ちょっとまってね' },
    { main: '運命のしるしを かいどく中', sub: 'もうすこしだよ' },
    { main: 'キャラクターを えらんでいるよ', sub: 'もうすぐだよ' },
    { main: '運命図鑑を ひらくよ', sub: 'できたよ！' }
  ];
  let idx = 0;
  const interval = setInterval(() => {
    if (idx < texts.length) {
      document.getElementById('ritual-text').textContent = texts[idx].main;
      document.getElementById('ritual-sub').innerHTML = texts[idx].sub + '<span class="loading-dots">・・・</span>';
      const r = mbtiKeys[Math.floor(Math.random() * mbtiKeys.length)];
      document.getElementById('ritual-char').innerHTML = getCharHTML(r);
      idx++;
    } else {
      clearInterval(interval);
      showResult();
    }
  }, 700);
}

function showResult() {
  const m = state.mbti;
  const mbti = (m.E >= m.I ? 'E' : 'I') + (m.S >= m.N ? 'S' : 'N') + (m.T >= m.F ? 'T' : 'F') + (m.J >= m.P ? 'J' : 'P');
  state.finalMBTI = mbti;

  // v15.1: 新レア判定ロジック
  state.luck = calcLuck(state);
  state.rareType = determineRare(state);

  const details = MBTI_DETAILS[mbti];
  state.details = details;

  const badgeWrapper = document.getElementById('rare-badge-wrapper');
  const resultCard = document.getElementById('result-card-main');
  const charDisplay = document.getElementById('char-display');

  if (state.rareType) {
    badgeWrapper.innerHTML = `<div class="rare-badge">${state.rareType.badge}</div>`;
    resultCard.classList.add('rare');
    charDisplay.classList.add('rare');
    document.getElementById('result-type').textContent = state.rareType.name;
    document.getElementById('result-catch').textContent = state.rareType.catch;
    document.getElementById('result-desc').textContent = state.rareType.desc;
    document.getElementById('result-color-dot').style.background = state.rareType.color;
    setColorName(state.rareType.colorName);
    charDisplay.innerHTML = getCharHTML(state.rareType.charKey || state.rareType.char);
  } else {
    badgeWrapper.innerHTML = '';
    resultCard.classList.remove('rare');
    charDisplay.classList.remove('rare');
    document.getElementById('result-type').textContent = details.name;
    document.getElementById('result-catch').textContent = details.catch;
    document.getElementById('result-desc').textContent = details.desc;
    document.getElementById('result-color-dot').style.background = details.color;
    setColorName(details.colorName);
    charDisplay.innerHTML = getCharHTML(mbti);
  }

  document.getElementById('result-zodiac').textContent = state.zodiac;
  document.getElementById('result-mbti').textContent = mbti;
  document.getElementById('result-luck').textContent = state.luck;

  document.getElementById('result-flaw').textContent = details.flaw;
  document.getElementById('result-charm').textContent = details.charm;
  document.getElementById('result-love').textContent = details.love;
  document.getElementById('result-prophecy').textContent = details.prophecy;

  const mirror = MIRROR_PAIRS[mbti];
  const mirrorDetails = MBTI_DETAILS[mirror.mbti];
  document.getElementById('mirror-char').innerHTML = getCharHTML(mirror.mbti);
  document.getElementById('result-mirror').textContent = mirrorDetails.name;
  document.getElementById('result-mirror-desc').textContent = mirror.desc;

  document.getElementById('result-warning').textContent = WARNING_PAIRS[mbti] + ' の子';
  document.getElementById('result-soulmate').textContent = SOULMATE_PAIRS[mbti] + ' の子';

  // v15.1: 7軸全国ランキング描画
  renderRankingSection(state);

  // GA: 結果表示 (MBTI/zodiac/rare をディメンション化)
  if (window.ev) {
    ev('result_view', {
      mbti: state.finalMBTI,
      zodiac: state.zodiac,
      rare_type: state.rareType ? state.rareType.id : 'normal',
      is_rare: !!state.rareType
    });
    if (state.rareType) {
      ev('rare_summon', { rare_type: state.rareType.id });
    }
  }

  if (state.rareType) {
    showRareSummon(state.rareType);
  } else {
    if (isInviteMode && invitePartner) {
      setTimeout(() => showCompatibilityResult(), 300);
    } else {
      goToScreen('result');
    }
  }
}

// ============================================
// レア召喚演出
// ============================================
function showRareSummon(rareType) {
  const charHTML = getCharHTML(rareType.charKey || rareType.char);
  document.getElementById('rare-char-reveal').innerHTML = charHTML;

  document.getElementById('rare-msg-1').textContent = rareType.badge;
  document.getElementById('rare-msg-2').textContent = rareType.name;

  const sparklesContainer = document.getElementById('rare-sparkles');
  sparklesContainer.innerHTML = '';
  const symbols = ['♡', '★', '✦', '♥', '✧', '◆', '♪', '☆'];
  const colors = ['#ff6fb3', '#ffd93d', '#c4b5fd', '#ff8fc4', '#fff', '#ffaad4', '#fff099'];
  for (let i = 0; i < 50; i++) {
    const sp = document.createElement('div');
    sp.className = 'sparkle';
    sp.textContent = symbols[i % symbols.length];
    sp.style.color = colors[i % colors.length];
    sp.style.left = (Math.random() * 100) + '%';
    sp.style.top = (Math.random() * 100) + '%';
    sp.style.fontSize = (18 + Math.random() * 26) + 'px';
    sp.style.animationDelay = (Math.random() * 3) + 's';
    sp.style.animationDuration = (1.8 + Math.random() * 1.5) + 's';
    sparklesContainer.appendChild(sp);
  }

  goToScreen('rare-summon');

  setTimeout(() => {
    if (isInviteMode && invitePartner) {
      showCompatibilityResult();
    } else {
      goToScreen('result');
    }
  }, 4000);
}

function restart() {
  isInviteMode = false;
  invitePartner = null;
  if (window.location.search) {
    const cleanUrl = window.location.origin + window.location.pathname;
    history.replaceState(null, '', cleanUrl);
  }
  goToScreen('opening');
}

// ============================================
// 招待フロー
// ============================================
function showInviteWelcome(partnerData) {
  invitePartner = partnerData;
  isInviteMode = true;

  const partnerRare = getRareTypeById(partnerData.rareType);
  const partnerCharKey = partnerRare ? (partnerRare.charKey || partnerRare.char) : partnerData.mbti;
  document.getElementById('invite-partner-char').innerHTML = getCharHTML(partnerCharKey);

  const partnerName = partnerData.name || 'あの子';
  document.getElementById('invite-partner-name').textContent = partnerName;

  let partnerTypeName;
  if (partnerRare) {
    partnerTypeName = partnerRare.name;
  } else {
    const partnerDetails = MBTI_DETAILS[partnerData.mbti];
    partnerTypeName = partnerDetails ? partnerDetails.name : partnerData.mbti;
  }
  document.getElementById('invite-partner-type').textContent = partnerTypeName;

  document.getElementById('invite-subtitle-text').textContent =
    partnerData.name
      ? partnerData.name + ' さんがあなたとの相性を知りたがってます'
      : 'あの子があなたとの相性を知りたがってます';

  goToScreen('invite-welcome');
}

function startInviteFlow() {
  goToScreen('birthdate');
}

function cancelInviteMode() {
  isInviteMode = false;
  invitePartner = null;
  if (window.location.search) {
    const cleanUrl = window.location.origin + window.location.pathname;
    history.replaceState(null, '', cleanUrl);
  }
  goToScreen('opening');
}

function showCompatibilityResult() {
  const me = {
    mbti: state.finalMBTI,
    zodiac: state.zodiac,
    rareTypeId: state.rareType ? state.rareType.id : null,
    name: 'あなた'
  };
  const partner = {
    mbti: invitePartner.mbti,
    zodiac: invitePartner.zodiac,
    rareTypeId: invitePartner.rareType,
    name: invitePartner.name || 'あの子'
  };

  const result = buildCompatibilityResult(me, partner);

  document.getElementById('comp-rank-emoji').innerHTML = result.rankInfo.icon;
  document.getElementById('comp-rank-letter').textContent = result.rankInfo.rank;
  document.getElementById('comp-rank-score').innerHTML =
    result.total + '<span class="comp-rank-score-unit">点</span>';
  document.getElementById('comp-rank-label').textContent = result.rankInfo.label;
  document.getElementById('comp-rank-letter').style.color = result.rankInfo.color;

  const meCharKey = state.rareType
    ? (state.rareType.charKey || state.rareType.char)
    : state.finalMBTI;
  document.getElementById('comp-me-char').innerHTML = getCharHTML(meCharKey);
  document.getElementById('comp-me-name').textContent = 'あなた';
  const meTypeName = state.rareType ? state.rareType.name : MBTI_DETAILS[state.finalMBTI].name;
  document.getElementById('comp-me-type').textContent = meTypeName;

  const partnerRare = getRareTypeById(invitePartner.rareType);
  const partnerCharKey = partnerRare
    ? (partnerRare.charKey || partnerRare.char)
    : invitePartner.mbti;
  document.getElementById('comp-partner-char').innerHTML = getCharHTML(partnerCharKey);
  document.getElementById('comp-partner-name').textContent = invitePartner.name || 'あの子';
  const partnerTypeName = partnerRare ? partnerRare.name : MBTI_DETAILS[invitePartner.mbti].name;
  document.getElementById('comp-partner-type').textContent = partnerTypeName;

  document.getElementById('comp-same-badge').style.display =
    result.isSameType ? 'inline-block' : 'none';

  const heartEl = document.getElementById('comp-pair-heart');
  if (result.total >= 80) heartEl.style.fontSize = '56px';
  else if (result.total >= 60) heartEl.style.fontSize = '44px';
  else heartEl.style.fontSize = '36px';

  document.getElementById('comp-message-text').textContent = result.message;

  document.getElementById('comp-mbti-score').textContent = result.mbtiScore + ' / 60';
  document.getElementById('comp-zodiac-score').textContent = result.zodiacScore + ' / 30';
  document.getElementById('comp-rare-score').textContent = result.rareScore + ' / 10';

  setTimeout(() => {
    document.getElementById('comp-mbti-fill').style.width = (result.mbtiScore / 60 * 100) + '%';
    document.getElementById('comp-zodiac-fill').style.width = (result.zodiacScore / 30 * 100) + '%';
    document.getElementById('comp-rare-fill').style.width = (result.rareScore / 10 * 100) + '%';
  }, 200);

  window._lastCompResult = result;

  goToScreen('compatibility');
}

// ============================================
// 招待シェアモーダル
// ============================================
function openMyInviteShare() {
  if (!state.finalMBTI) {
    alert('まず占いを完了してね');
    return;
  }
  document.getElementById('invite-share-modal').classList.add('active');
  updateInviteUrl();
}

function updateInviteUrl() {
  const nameInput = document.getElementById('inviter-name-input');
  const name = nameInput.value.trim();
  state.inviterName = name || null;
  const url = generateInviteUrl({
    finalMBTI: state.finalMBTI,
    zodiac: state.zodiac,
    rareType: state.rareType,
    luck: state.luck,
    inviterName: state.inviterName
  });
  document.getElementById('invite-url-display').textContent = url;
  window._currentInviteUrl = url;
}

function copyInviteUrl() {
  const url = window._currentInviteUrl;
  if (!url) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(showCopySuccess).catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showCopySuccess();
  } catch (e) {
    alert('コピーできなかったから、URLを長押しして手動でコピーしてね');
  }
  document.body.removeChild(ta);
}

function showCopySuccess() {
  const el = document.getElementById('invite-copy-success');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

function shareInviteToLine() {
  const url = window._currentInviteUrl;
  if (!url) return;
  const text = encodeURIComponent('運命図鑑であなたとの相性をみてみない？♡ ');
  const lineUrl = `https://line.me/R/msg/text/?${text}${encodeURIComponent(url)}`;
  window.open(lineUrl, '_blank');
}

function closeInviteShareModal() {
  document.getElementById('invite-share-modal').classList.remove('active');
}
