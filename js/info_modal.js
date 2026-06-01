// ============================================
// 解説モーダル ([?] ボタン -> 各要素の解説表示)
// ============================================

const INFO_CONTENT = {
  mbti: {
    icon: '🧠',
    title: 'MBTI タイプ って？',
    body: `世界で<strong>1番有名な性格診断</strong>。<br><br>
あなたの性格を<strong>4つの軸</strong>で分けて、全16タイプにする方法だよ。
<ul>
  <li><strong>E / I</strong>：外向 か 内向</li>
  <li><strong>S / N</strong>：現実派 か 直感派</li>
  <li><strong>T / F</strong>：論理派 か 感情派</li>
  <li><strong>J / P</strong>：計画派 か 自由派</li>
</ul>
組み合わせで <strong>INTJ / ENFP</strong> みたいな4文字タイプになる ♡<br>
ウンメイでは、20問のしつもんでこの4文字を判定してるよ。`
  },
  zodiac: {
    icon: '🌙',
    title: 'しるし (干支) って？',
    body: `<strong>生まれ年</strong>で決まる、東洋に古くから伝わる<strong>12種類のしるし</strong>。<br><br>
子 (ねずみ) ・ 丑 (うし) ・ 寅 (とら) ・ 卯 (うさぎ) ・ 辰 (たつ) ・ 巳 (へび) ・ 午 (うま) ・ 未 (ひつじ) ・ 申 (さる) ・ 酉 (とり) ・ 戌 (いぬ) ・ 亥 (いのしし)<br><br>
ウンメイでは、しるし同士の<strong>四柱推命の相性</strong>（三合・六合・冲・害）も計算に使ってるよ ♡`
  },
  color: {
    icon: '🎨',
    title: '運命の色 って？',
    body: `あなたの<strong>MBTIタイプ</strong>に対応した、<strong>あなたを表す色</strong>だよ。<br><br>
たとえば INTJ なら<strong>ラベンダー</strong>、ENFP なら<strong>サンセットオレンジ</strong> ✦<br><br>
身につけたり、SNS のアイコンにしたりすると、<strong>運気アップ</strong>って言われてるよ ♡`
  },
  luck: {
    icon: '✦',
    title: 'きょうの運 って？',
    body: `あなたの<strong>生年月日</strong>から計算した、<strong>今日の運勢スコア</strong>（60〜99）。<br><br>
<ul>
  <li><strong>90 ↑</strong>：奇跡が起きる予感 ♡</li>
  <li><strong>80 ↑</strong>：いい出会いがあるかも</li>
  <li><strong>70 ↑</strong>：おだやかな1日</li>
  <li><strong>60 〜</strong>：マイペースに過ごそ</li>
</ul>
※毎日変動はしません（誕生日固定）`
  },
  ranking: {
    icon: '🏆',
    title: '全国 ランキング って？',
    body: `<strong>全国 約800万人</strong> という仮想母集団のなかで、<br>
あなたが <strong>7つの軸 (モテ / コミュ力 / 金運 / 一途度 / 天才度 / メンタル / ヤンデレ度)</strong> でどこに位置するか算出 ♡<br><br>
スコアは <strong>MBTI × 干支 × レアキャラ</strong> の組合せで決定。<br><br>
低スコアは<strong>「内に秘めた魅力派」</strong>等の<strong>救済コピー</strong>で表示するから、誰でも安心して楽しんでね ★`
  },
  mirror: {
    icon: '⇄',
    title: '鏡うつし の子 って？',
    body: `あなたと<strong>MBTI が完全に正反対</strong>（4文字すべて逆）の子。<br><br>
表面的にはぶつかりやすいけど、<strong>お互いに無いものを持ってる</strong>から、本当は学べることが多い相手 ♡<br><br>
「うるさい」「冷たい」「めんどくさい」と感じる相手こそ、<strong>あなたを成長させてくれる存在</strong>かも ✦`
  },
  warning: {
    icon: '⚠',
    title: 'ニガテ な子 って？',
    body: `MBTI の価値観が<strong>合いにくいタイプ</strong>。<br><br>
一緒にいると、<strong>疲れたり / イラッとしたり / すれ違ったり</strong> しがちな相手。<br><br>
でも、避ければよいわけじゃなくて、<strong>距離感をうまく取る</strong>ことで関係はうまくいくよ ♡`
  },
  soulmate: {
    icon: '♡',
    title: 'うんめい の子 って？',
    body: `あなたと<strong>性格バランスが最高にぴったり</strong>な MBTI タイプ。<br><br>
出会えば<strong>長く深い関係</strong>が築ける、まさに運命の相手かも ♡<br><br>
恋愛だけじゃなく、<strong>親友・仕事のパートナー</strong>としても抜群の相性 ✦`
  }
};

function showInfo(key) {
  const info = INFO_CONTENT[key];
  if (!info) return;
  document.getElementById('info-modal-icon').textContent = info.icon;
  document.getElementById('info-modal-title').textContent = info.title;
  document.getElementById('info-modal-body').innerHTML = info.body;
  document.getElementById('info-modal').classList.add('active');
}

function closeInfoModal() {
  document.getElementById('info-modal').classList.remove('active');
}
