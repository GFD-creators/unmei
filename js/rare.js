// ============================================
// レア判定ロジック（v15.1: Section 2.1 採用）
// 旧: state.year * 10000 + state.month * 100 + state.day で固定
//   → 同じ誕生日なら必ず同じレア結果になる致命バグ
// 新: localStorage デバイスシード + MBTI回答パターン + 誕生日 を合成
//     端末ごと/回答ごとに乱数化、ただし rare_legendary だけは2001/7/23固定発動
// ============================================

function getDeviceSeed() {
  let s = localStorage.getItem('unmei_device_seed');
  if (!s) {
    s = Date.now().toString() + Math.random().toString(36);
    localStorage.setItem('unmei_device_seed', s);
  }
  return s;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// レア判定本体。state.year/month/day/answerHistory を参照
// 返り値: RARE_TYPES のエントリ or null
function determineRare(state) {
  // 最優先：2001/7/23 = rare_legendary 固定発動
  if (state.year === 2001 && state.month === 7 && state.day === 23) {
    return RARE_TYPES.rare_legendary;
  }

  const deviceSeed = getDeviceSeed();
  const answerHash = (state.answerHistory || []).join('');
  const combinedSeed = hashCode(deviceSeed + answerHash + state.year + state.month + state.day);
  const rareRandom = Math.abs((Math.sin(combinedSeed) * 10000) % 1) ;

  // 確率配分（v14と同じ閾値）
  if (rareRandom > 0.999) return RARE_TYPES.rare_bloodline;
  if (rareRandom > 0.995) return RARE_TYPES.rare_blank;
  if (rareRandom > 0.99)  return RARE_TYPES.rare_cursed;
  return null;
}

// 運勢スコア（誕生日由来）
function calcLuck(state) {
  const seed = state.year * 10000 + state.month * 100 + state.day;
  const random = Math.abs(Math.sin(seed) * 10000);
  return Math.floor(60 + (random % 40));
}

// レアタイプIDから詳細を取得
function getRareTypeById(id) {
  if (!id) return null;
  for (const key in RARE_TYPES) {
    if (RARE_TYPES[key].id === id || key === id) return RARE_TYPES[key];
  }
  return null;
}
