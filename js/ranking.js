// ============================================
// 7軸バズるランキング機能 (v15.1 Day 3-4)
// ハンドオフ書 Section 3 準拠
// ============================================

// 仮想全国母集団（10〜20代前半女子の概算）
const VIRTUAL_POPULATION = 8000000;

// 7軸の重み付け定義（ハンドオフ Section 3.1）
const RANKING_AXES = {
  mote: {
    key: 'mote',
    label: 'モテ偏差値',
    icon: '🌹',
    color: '#ff6fb3',
    calc: (mbti, zodiac, rareId) => {
      let s = 50;
      if (mbti[0] === 'E') s += 10;            // E系+10
      if (mbti[2] === 'F') s += 8;             // F系+8
      if (['巳','酉','未'].includes(zodiac)) s += 8;
      if (rareId === 'rare_legendary')  s += 20;
      else if (rareId === 'rare_bloodline') s += 18;
      else if (rareId === 'rare_blank')     s += 17;
      else if (rareId === 'rare_cursed')    s += 15;
      // 副次バフ: 第二文字Nだと神秘性+3、第四文字Pだと自由さ+2
      if (mbti[1] === 'N') s += 3;
      if (mbti[3] === 'P') s += 2;
      return clamp(s);
    }
  },
  commu: {
    key: 'commu',
    label: 'コミュ力',
    icon: '💬',
    color: '#ffaa42',
    calc: (mbti, zodiac, rareId) => {
      let s = 50;
      if (mbti[0] === 'E') s += 15;
      if (mbti[2] === 'F') s += 10;
      if (['辰','午','申'].includes(zodiac)) s += 8;
      if (mbti[3] === 'J') s += 4;             // 計画性で会話運営
      if (rareId === 'rare_legendary') s += 12;
      else if (rareId === 'rare_bloodline') s += 8;
      else if (rareId === 'rare_blank') s += 5;
      return clamp(s);
    }
  },
  money: {
    key: 'money',
    label: '金運',
    icon: '💰',
    color: '#ffd93d',
    calc: (mbti, zodiac, rareId) => {
      let s = 50;
      if (mbti[2] === 'T') s += 10;
      if (mbti[3] === 'J') s += 10;
      if (['辰','酉','巳'].includes(zodiac)) s += 10;
      if (mbti[1] === 'S') s += 5;             // 現実主義で実利
      if (rareId === 'rare_bloodline') s += 30; // 伝説の血統=最強
      else if (rareId === 'rare_legendary') s += 15;
      else if (rareId === 'rare_blank') s += 6;
      else if (rareId === 'rare_cursed') s += 4;
      return clamp(s);
    }
  },
  loyal: {
    key: 'loyal',
    label: '一途度',
    icon: '💖',
    color: '#e8358c',
    calc: (mbti, zodiac, rareId) => {
      let s = 50;
      if (mbti[0] === 'I') s += 10;
      if (mbti[2] === 'F') s += 10;
      if (['丑','戌','亥'].includes(zodiac)) s += 10;
      if (mbti[3] === 'J') s += 5;             // 計画的=本気
      if (rareId === 'rare_blank') s += 15;
      else if (rareId === 'rare_legendary') s += 12;
      else if (rareId === 'rare_cursed') s += 8;
      else if (rareId === 'rare_bloodline') s += 5;
      return clamp(s);
    }
  },
  genius: {
    key: 'genius',
    label: '天才度',
    icon: '🧠',
    color: '#9b87d8',
    calc: (mbti, zodiac, rareId) => {
      let s = 50;
      if (mbti === 'INTJ') s += 20;
      else if (mbti === 'INTP') s += 18;
      else if (mbti === 'ENTJ') s += 15;
      else if (mbti === 'ENTP') s += 12;
      else if (mbti[1] === 'N' && mbti[2] === 'T') s += 10;  // N+T一般ボーナス
      else if (mbti[1] === 'N') s += 6;
      else if (mbti[2] === 'T') s += 4;
      if (['辰','巳'].includes(zodiac)) s += 8;
      if (rareId === 'rare_legendary')  s += 25;
      else if (rareId === 'rare_blank')     s += 15;
      else if (rareId === 'rare_cursed')    s += 10;
      else if (rareId === 'rare_bloodline') s += 8;
      return clamp(s);
    }
  },
  mental: {
    key: 'mental',
    label: 'メンタル最強',
    icon: '💪',
    color: '#5cb89a',
    calc: (mbti, zodiac, rareId) => {
      let s = 50;
      if (mbti[0] === 'E') s += 8;
      if (mbti[2] === 'T') s += 10;
      if (mbti[3] === 'J') s += 8;
      if (['寅','午','申'].includes(zodiac)) s += 10;
      if (rareId === 'rare_bloodline') s += 12;
      else if (rareId === 'rare_legendary') s += 10;
      else if (rareId === 'rare_blank') s += 6;
      return clamp(s);
    }
  },
  yandere: {
    key: 'yandere',
    label: 'ヤンデレ度',
    icon: '🖤',
    color: '#3d2a4d',
    calc: (mbti, zodiac, rareId) => {
      let s = 50;
      if (mbti[0] === 'I') s += 10;
      if (mbti[2] === 'F') s += 10;
      if (mbti[3] === 'P') s += 8;
      if (['亥','巳','酉'].includes(zodiac)) s += 10;
      if (rareId === 'rare_cursed')    s += 20;
      else if (rareId === 'rare_blank')    s += 12;
      else if (rareId === 'rare_legendary') s += 6;
      return clamp(s);
    }
  }
};

function clamp(v) {
  return Math.max(30, Math.min(99, Math.round(v)));
}

// ============================================
// スコア分布キャッシュ
// 各軸ごとに 16 MBTI × 12 干支 = 192パターンのスコアを事前計算
// レアキャラは出現確率1%未満なので分布からは除外（=非レアで分布計算）
// ハンドオフ書 3.2 の「不安照ケア」のため上位%表示用
// ============================================
const _distributionCache = {};

function getDistribution(axisKey) {
  if (_distributionCache[axisKey]) return _distributionCache[axisKey];
  const axis = RANKING_AXES[axisKey];
  const mbtis = ['INTJ','INTP','INFJ','INFP','ENFP','ENFJ','ENTJ','ENTP',
                 'ISTJ','ISFJ','ISTP','ISFP','ESTJ','ESFJ','ESTP','ESFP'];
  const zods = ['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'];
  const scores = [];
  for (const m of mbtis) {
    for (const z of zods) {
      scores.push(axis.calc(m, z, null));
    }
  }
  scores.sort((a, b) => a - b);
  _distributionCache[axisKey] = scores;
  return scores;
}

// 上位 X% / 全国順位 を算出
function getRankInfo(axisKey, score) {
  const dist = getDistribution(axisKey);
  let below = 0;
  for (const s of dist) {
    if (s < score) below++;
    else break;
  }
  const percentile = below / dist.length;
  const topRatio   = 1 - percentile;
  const topPercent = Math.max(0.1, topRatio * 100);
  const rank       = Math.max(1, Math.round(topRatio * VIRTUAL_POPULATION));

  // スコア帯のグレード矢印
  let grade = '';
  if (score >= 85) grade = '⬆⬆';
  else if (score >= 70) grade = '⬆';

  // ハンドオフ書 3.2「不安照ケア原則」:
  // 低スコアでも体験を悪化させない tier を導入
  //   top:    上位明示OK（自慢素材）
  //   high:   上位明示OK
  //   mid:    順位は出すが控えめ
  //   rare:   「希少派」メッセージで救済（ランキングは絶対値で出さない）
  let tier;
  if (score >= 80)      tier = 'top';
  else if (score >= 70) tier = 'high';
  else if (score >= 55) tier = 'mid';
  else                  tier = 'rare';   // 救済tier

  // tier別の表示用メタテキスト
  // 軸別の救済キャッチコピー（rare tier用 — 各軸の弱みを「内に秘めた魅力」に転換）
  const RARE_LINES = {
    mote:    '内に秘めた 魅力派 ★ 玄人好み タイプ',
    commu:   '聞き上手の 静かなる 賢者',
    money:   '質素を 愛する 自由人 ★ お金じゃない 価値観',
    loyal:   '広く 浅く 派 ★ 多くの 人を 愛せる',
    genius:  '感性 タイプ ★ 数字 じゃない 才能の 持ち主',
    mental:  '繊細で 共感力の 高い 子 ★ 人の 痛みが 分かる',
    yandere: '健全な 愛 タイプ ★ 重さ ゼロの 軽やかさ',
  };

  let metaText;
  switch (tier) {
    case 'top':
    case 'high':
      metaText = `全国800万人中 約<strong>${formatRank(rank)}</strong>（上位 ${formatTopPercent(topPercent)}）`;
      break;
    case 'mid':
      metaText = `バランス型 ★ <strong>並み外れない 安定感</strong>`;
      break;
    case 'rare':
    default:
      metaText = `<strong>${RARE_LINES[axisKey] || '隠れた魅力派'}</strong>`;
      break;
  }

  return {
    score,
    percentile,
    topPercent,
    rank,
    population: VIRTUAL_POPULATION,
    grade,
    tier,
    metaText
  };
}

// 全7軸のスコア＋ランクを一括算出
function calcAllRankings(mbti, zodiac, rareId) {
  const result = {};
  for (const key in RANKING_AXES) {
    const axis = RANKING_AXES[key];
    const score = axis.calc(mbti, zodiac, rareId);
    result[key] = {
      axis,
      ...getRankInfo(key, score)
    };
  }
  return result;
}

// 数値を「54万位」形式に変換（不安照ケア: 桁数を圧縮）
function formatRank(rank) {
  if (rank >= 10000) {
    // 1万以上はすべて「N万位」（小数を許可: 75.0万位は避け、四捨五入で）
    return Math.round(rank / 10000) + '万位';
  }
  if (rank >= 1000) {
    return Math.round(rank / 1000) + '千位';
  }
  return rank.toLocaleString() + '位';
}

// 上位%表示（小数点1桁、最小0.1%）
function formatTopPercent(p) {
  if (p >= 10) return Math.round(p) + '%';
  return p.toFixed(1) + '%';
}
