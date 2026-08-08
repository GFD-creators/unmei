// ============================================================
// タイプ別OGP生成用のデータ書き出し (Node.js)
// ------------------------------------------------------------
// js/data.js + js/ranking.js を単一の真実源として読み込み、
// 192タイプ(MBTI16 × 干支12) + 16タイプ分のメタ情報を JSON に出す。
// 出力: assets/og/types/_data.json  (make_type_ogp.py が読む)
//
// 使い方: node dump_type_data.js
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'assets', 'og', 'types');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- data.js + ranking.js を評価して定数/関数を取り出す（make_type_pages.js と同じ手法）----
const dataCode = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
const rankCode = fs.readFileSync(path.join(ROOT, 'js', 'ranking.js'), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  dataCode + '\n' + rankCode +
  '\nvar __OUT = { MBTI_DETAILS, CHAR_IMG, calcAllRankings };',
  sandbox
);
const { MBTI_DETAILS, CHAR_IMG, calcAllRankings } = sandbox.__OUT;

const MBTI_ORDER = [
  'INTJ','INTP','INFJ','INFP','ENFP','ENFJ','ENTJ','ENTP',
  'ISTJ','ISFJ','ISTP','ISFP','ESTJ','ESFJ','ESTP','ESFP'
];

// make_type_pages.js と同じ干支定義（romaji はファイル名に対応）
const ZODIAC_INFO = {
  '子': { romaji:'ne',      yomi:'ねずみ' },
  '丑': { romaji:'ushi',    yomi:'うし'   },
  '寅': { romaji:'tora',    yomi:'とら'   },
  '卯': { romaji:'u',       yomi:'うさぎ' },
  '辰': { romaji:'tatsu',   yomi:'たつ'   },
  '巳': { romaji:'mi',      yomi:'へび'   },
  '午': { romaji:'uma',     yomi:'うま'   },
  '未': { romaji:'hitsuji', yomi:'ひつじ' },
  '申': { romaji:'saru',    yomi:'さる'   },
  '酉': { romaji:'tori',    yomi:'とり'   },
  '戌': { romaji:'inu',     yomi:'いぬ'   },
  '亥': { romaji:'i',       yomi:'いのしし' }
};

// 偏差値の中から「自慢できる=シェアされやすい」軸を1つ選ぶ。
// 軸ごとに分布が違うので、スコアの高さではなく "全国順位が最も上位(topPercentが最小)" で選ぶ。
// ranking.js の tier 設計（不安照ケア原則）を尊重し、順位を明示してよいのは top/high のみ。
function bestAxis(rankings) {
  let best = null;
  for (const key in rankings) {
    const r = rankings[key];
    if (!best || r.topPercent < best.topPercent) {
      best = {
        key,
        label: r.axis ? r.axis.label : key,
        score: r.score,
        rank: r.rank,
        topPercent: r.topPercent,
        tier: r.tier
      };
    }
  }
  return best;
}

const out = { mbti: {}, types: [] };

// --- MBTI単体(16) ---
for (const m of MBTI_ORDER) {
  const d = MBTI_DETAILS[m];
  out.mbti[m] = { name: d.name, catch: d.catch, color: d.color, img: CHAR_IMG[m] };
}

// --- MBTI × 干支(192) ---
for (const m of MBTI_ORDER) {
  for (const z in ZODIAC_INFO) {
    const zi = ZODIAC_INFO[z];
    const r = calcAllRankings(m, z, null);
    const b = bestAxis(r);
    out.types.push({
      slug: `${m.toLowerCase()}-${zi.romaji}`,
      mbti: m,
      zodiac: z,
      zodiacYomi: zi.yomi,
      name: MBTI_DETAILS[m].name,
      catch: MBTI_DETAILS[m].catch,
      color: MBTI_DETAILS[m].color,
      img: CHAR_IMG[m],
      bestAxisKey: b ? b.key : null,
      bestAxisLabel: b ? b.label : null,
      bestScore: b ? b.score : null,
      bestRank: b ? b.rank : null,
      bestTopPercent: b ? b.topPercent : null,
      bestTier: b ? b.tier : null
    });
  }
}

const outPath = path.join(OUT_DIR, '_data.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 1), 'utf8');
console.log(`  -> ${path.relative(ROOT, outPath)}  (mbti:${Object.keys(out.mbti).length}, types:${out.types.length})`);
