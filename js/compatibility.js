// ============================================
// 招待URL生成 / 解析
// ============================================
function generateInviteUrl(resultData) {
  const payload = {
    mbti: resultData.finalMBTI,
    zodiac: resultData.zodiac,
    rareType: resultData.rareType ? resultData.rareType.id : null,
    name: resultData.inviterName || null,
    luck: resultData.luck,
    v: 1
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?invite=${b64}`;
}

function parseInviteParam(b64) {
  try {
    const fixed = b64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = fixed + '='.repeat((4 - fixed.length % 4) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const data = JSON.parse(json);
    if (data.v !== 1) return null;

    // --- 入力検証（防御の多層化）: 想定外の値は弾く / 名前は記号除去＋長さ制限 ---
    const VALID_MBTI = ['INTJ','INTP','INFJ','INFP','ENFP','ENFJ','ENTJ','ENTP','ISTJ','ISFJ','ISTP','ISFP','ESTJ','ESFJ','ESTP','ESFP'];
    if (!VALID_MBTI.includes(data.mbti)) return null;
    if (typeof ZODIACS !== 'undefined' && !ZODIACS.includes(data.zodiac)) return null;
    if (data.rareType != null && !(typeof RARE_TYPES !== 'undefined' && RARE_TYPES[data.rareType])) {
      data.rareType = null;
    }
    if (typeof data.name === 'string') {
      data.name = data.name.replace(/[<>"'`]/g, '').trim().slice(0, 20) || null;
    } else {
      data.name = null;
    }
    if (typeof data.luck !== 'number' || !isFinite(data.luck)) data.luck = null;
    return data;
  } catch (e) {
    console.error('Invalid invite param:', e);
    return null;
  }
}

// ============================================
// 相性スコア計算
// ============================================
// MBTI相性スコア（60点満点）
function calcMbtiCompatibility(mbti1, mbti2) {
  if (!mbti1 || !mbti2) return 30;
  const a = mbti1.split('');
  const b = mbti2.split('');
  let matchCount = 0;
  for (let i = 0; i < 4; i++) {
    if (a[i] === b[i]) matchCount++;
  }
  // 0一致(鏡映し)=60, 1=55, 2=45, 3=35, 4(同タイプ)=50
  const scoreTable = [60, 55, 45, 35, 50];
  return scoreTable[matchCount];
}

// 干支相性スコア（30点満点）
function calcZodiacCompatibility(z1, z2) {
  if (!z1 || !z2) return 18;
  if (z1 === z2) return 22;
  if (ZODIAC_RELATIONS.sanGo.some(set => set.includes(z1) && set.includes(z2))) return 30;
  if (ZODIAC_RELATIONS.rikuGo.some(pair => pair.includes(z1) && pair.includes(z2))) return 28;
  if (ZODIAC_RELATIONS.chu.some(pair => pair.includes(z1) && pair.includes(z2))) return 10;
  if (ZODIAC_RELATIONS.gai.some(pair => pair.includes(z1) && pair.includes(z2))) return 12;
  return 18;
}

// レアボーナス（10点満点）
function calcRareBonus(rare1Id, rare2Id) {
  if (rare1Id === 'rare_bloodline' && rare2Id === 'rare_bloodline') return 10;
  if (rare1Id && rare2Id) return 8;
  if (rare1Id || rare2Id) return 5;
  return 3;
}

// 総合スコア → ランク変換
function getCompatibilityRank(score) {
  if (score >= 90) return { rank: 'SS', label: '運命の出会い', color: '#FF6FB3', icon: RANK_ICONS.SS };
  if (score >= 80) return { rank: 'S',  label: '最高の相性',   color: '#FF8FC4', icon: RANK_ICONS.S };
  if (score >= 70) return { rank: 'A',  label: 'とても良い',   color: '#FFB6C1', icon: RANK_ICONS.A };
  if (score >= 60) return { rank: 'B',  label: '良い相性',     color: '#C4B5FD', icon: RANK_ICONS.B };
  if (score >= 50) return { rank: 'C',  label: 'ふつう',       color: '#B5F5D8', icon: RANK_ICONS.C };
  if (score >= 40) return { rank: 'D',  label: 'すこし努力',   color: '#FFD93D', icon: RANK_ICONS.D };
  return              { rank: 'E',  label: '正反対',        color: '#FF8C42', icon: RANK_ICONS.E };
}

function pickCompatibilityMessage(rank, seed) {
  const msgs = COMPATIBILITY_MESSAGES[rank];
  const idx = Math.abs(seed) % msgs.length;
  return msgs[idx];
}

function buildCompatibilityResult(meData, partnerData) {
  const mbtiScore = calcMbtiCompatibility(meData.mbti, partnerData.mbti);
  const zodiacScore = calcZodiacCompatibility(meData.zodiac, partnerData.zodiac);
  const rareScore = calcRareBonus(meData.rareTypeId, partnerData.rareTypeId);
  const total = mbtiScore + zodiacScore + rareScore;
  const rankInfo = getCompatibilityRank(total);
  const seed = (meData.mbti + partnerData.mbti).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const message = pickCompatibilityMessage(rankInfo.rank, seed);
  const isSameType = (meData.mbti === partnerData.mbti && meData.zodiac === partnerData.zodiac);
  return { mbtiScore, zodiacScore, rareScore, total, rankInfo, message, isSameType };
}
