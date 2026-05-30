// ============================================
// ランキングUI描画 + 偏差値カード生成 (v15.1 Day 3-4)
// ============================================

// 結果画面に7軸ランキング行を描画
function renderRankingSection(st) {
  const listEl = document.getElementById('ranking-list');
  if (!listEl) return;

  const rareId = st.rareType ? st.rareType.id : null;
  const all = calcAllRankings(st.finalMBTI, st.zodiac, rareId);

  // 表示順序: スコアの高い順（最も自慢できる軸が一番上に）
  const ordered = Object.values(all).sort((a, b) => b.score - a.score);

  // state に保持（偏差値カード生成で再利用）
  window._rankingResults = ordered;

  const html = ordered.map((r, idx) => {
    const tierClass = r.tier === 'top'  ? 'tier-top'
                    : r.tier === 'high' ? 'tier-high'
                    : r.tier === 'rare' ? 'tier-rare'
                    : '';
    return `
      <div class="ranking-row ${tierClass}">
        <div class="ranking-head">
          <span class="ranking-icon">${r.axis.icon}</span>
          <span class="ranking-label">${r.axis.label}</span>
          <span class="ranking-score">${r.score}<span class="ranking-grade">${r.grade}</span></span>
        </div>
        <span class="ranking-bar"><span class="ranking-fill" data-pct="${r.score}"></span></span>
        <div class="ranking-meta">${r.metaText}</div>
      </div>
    `;
  }).join('');

  listEl.innerHTML = html;

  // バー幅アニメーション
  setTimeout(() => {
    listEl.querySelectorAll('.ranking-fill').forEach(el => {
      const pct = parseInt(el.dataset.pct, 10);
      el.style.width = pct + '%';
    });
  }, 100);
}


// ============================================
// 偏差値カード Canvas描画 (TikTok縦長 1080x1920)
// ============================================
function generateRankingCard() {
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1080, H = 1920;
  canvas.width = W;
  canvas.height = H;

  if (!window._rankingResults) {
    alert('ランキングデータが見つかりません');
    return;
  }
  const rankings = window._rankingResults;

  // 背景: 淡いピンクグラデ
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fff5fa');
  bg.addColorStop(0.5, '#ffe4f1');
  bg.addColorStop(1, '#ffd9e8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ドットパターン
  ctx.fillStyle = 'rgba(255, 143, 196, 0.18)';
  for (let x = 30; x < W; x += 40) {
    for (let y = 30; y < H; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 外枠（2重）
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  roundRect(ctx, 50, 50, W - 100, H - 100, 40);
  ctx.stroke();
  ctx.strokeStyle = '#ff6fb3';
  ctx.lineWidth = 4;
  roundRect(ctx, 50, 50, W - 100, H - 100, 40);
  ctx.stroke();

  // 装飾コーナー
  ctx.font = '50px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd93d';
  ctx.fillText('★', 110, 130);
  ctx.fillStyle = '#ff8fc4';
  ctx.fillText('✦', 970, 130);
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('♡', 90, H - 110);
  ctx.fillStyle = '#ffd93d';
  ctx.fillText('★', 990, H - 110);

  // ヘッダー
  ctx.fillStyle = '#ff6fb3';
  ctx.font = 'bold 52px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText('♡ 私 の 全 国 ラ ン キ ン グ ♡', W / 2, 160);

  ctx.fillStyle = '#b08bc4';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('U N M E I  ★  7 R A N K I N G S', W / 2, 200);

  // タイプ名
  ctx.fillStyle = '#4a2c5c';
  ctx.font = 'bold 44px "M PLUS Rounded 1c", sans-serif';
  const typeName = state.rareType ? state.rareType.name : state.details.name;
  if (typeName.length > 10) {
    const split = typeName.indexOf('の');
    if (split > 0) {
      ctx.fillText(typeName.substring(0, split + 1), W / 2, 270);
      ctx.fillText(typeName.substring(split + 1), W / 2, 320);
    } else {
      ctx.fillText(typeName, W / 2, 295);
    }
  } else {
    ctx.fillText(typeName, W / 2, 295);
  }

  // レーダーチャート描画
  drawRadarChart(ctx, W / 2, 540, 200, rankings);

  // キャラ画像（レーダーチャートの中央に重ねる）
  const charKey = state.rareType
    ? (CHAR_IMG[state.rareType.charKey] ? state.rareType.charKey : state.rareType.char)
    : state.finalMBTI;
  const imgSrc = CHAR_IMG[charKey];

  if (imgSrc) {
    const img = new Image();
    img.onload = function () {
      // 中央に小さくキャラ配置（レーダーチャートの内側）
      ctx.drawImage(img, W / 2 - 80, 540 - 80, 160, 160);
      drawRankingList(ctx, W, H, rankings);
    };
    img.onerror = () => drawRankingList(ctx, W, H, rankings);
    img.src = imgSrc;
  } else {
    drawRankingList(ctx, W, H, rankings);
  }
}

// レーダーチャート描画
function drawRadarChart(ctx, cx, cy, radius, rankings) {
  const n = rankings.length;          // 7軸
  const angles = [];
  for (let i = 0; i < n; i++) {
    angles.push(-Math.PI / 2 + (2 * Math.PI * i) / n);
  }

  // グリッド（同心多角形 4段）
  ctx.strokeStyle = 'rgba(255, 143, 196, 0.5)';
  ctx.lineWidth = 2;
  for (let g = 1; g <= 4; g++) {
    const r = (radius * g) / 4;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = cx + r * Math.cos(angles[i]);
      const y = cy + r * Math.sin(angles[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 軸線
  ctx.strokeStyle = 'rgba(255, 143, 196, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angles[i]), cy + radius * Math.sin(angles[i]));
    ctx.stroke();
  }

  // データポリゴン
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const v = (rankings[i].score - 30) / 70;   // 30-99 → 0-1
    const r = radius * Math.max(0.1, v);
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 111, 179, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#ff6fb3';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 各頂点に小さな円
  for (let i = 0; i < n; i++) {
    const v = (rankings[i].score - 30) / 70;
    const r = radius * Math.max(0.1, v);
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd93d';
    ctx.fill();
    ctx.strokeStyle = '#e8358c';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 軸ラベル
  ctx.fillStyle = '#4a2c5c';
  ctx.font = 'bold 24px "M PLUS Rounded 1c", sans-serif';
  for (let i = 0; i < n; i++) {
    const labelR = radius + 38;
    const x = cx + labelR * Math.cos(angles[i]);
    const y = cy + labelR * Math.sin(angles[i]);
    ctx.textAlign = 'center';
    ctx.fillText(rankings[i].axis.icon, x, y - 6);
    ctx.font = 'bold 18px "M PLUS Rounded 1c", sans-serif';
    ctx.fillText(rankings[i].axis.label, x, y + 18);
    ctx.font = 'bold 24px "M PLUS Rounded 1c", sans-serif';
  }
}

// ランキングリスト描画（レーダーの下）
function drawRankingList(ctx, W, H, rankings) {
  const startY = 880;
  const rowH = 95;

  rankings.forEach((r, i) => {
    const y = startY + i * rowH;

    // tier別カラー
    const colors = {
      top:  { bg: '#fff099', border: '#ffb800', meta: '#5c3a00', score: '#b87900' },
      high: { bg: '#ffe4f1', border: '#ff8fc4', meta: '#7a5290', score: '#e8358c' },
      mid:  { bg: '#fff5fa', border: '#ff8fc4', meta: '#7a5290', score: '#e8358c' },
      rare: { bg: '#f3e6ff', border: '#c4b5fd', meta: '#7a5290', score: '#9b87d8' }
    };
    const c = colors[r.tier] || colors.mid;

    // 行背景
    ctx.fillStyle = c.bg;
    roundRect(ctx, 100, y, W - 200, rowH - 10, 16);
    ctx.fill();
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // アイコン
    ctx.font = '38px serif';
    ctx.fillStyle = '#4a2c5c';
    ctx.textAlign = 'left';
    ctx.fillText(r.axis.icon, 130, y + 50);

    // 軸名
    ctx.fillStyle = '#4a2c5c';
    ctx.font = 'bold 28px "M PLUS Rounded 1c", sans-serif';
    ctx.fillText(r.axis.label, 195, y + 38);

    // メタテキスト (tier別) — HTMLメタテキストからstrong等を剥がして再構築
    ctx.fillStyle = c.meta;
    ctx.font = 'bold 18px "M PLUS Rounded 1c", sans-serif';
    const plainMeta = r.metaText.replace(/<[^>]+>/g, '').replace('800万人中 ', '');
    ctx.fillText(plainMeta + (r.grade ? ' ' + r.grade : ''), 195, y + 68);

    // スコア
    ctx.fillStyle = c.score;
    ctx.font = 'bold 56px "M PLUS Rounded 1c", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(r.score, W - 130, y + 60);
  });

  // フッター
  const footerY = startY + 7 * rowH + 30;
  ctx.fillStyle = '#ff6fb3';
  ctx.font = 'bold 38px "M PLUS Rounded 1c", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('♡ あなたの 偏 差 値 は ？ ♡', W / 2, footerY);

  ctx.fillStyle = '#7a5290';
  ctx.font = 'bold 44px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText('unmei.app', W / 2, footerY + 60);

  ctx.fillStyle = '#b08bc4';
  ctx.font = '22px monospace';
  ctx.fillText('★ 友達もやってみて ★', W / 2, footerY + 100);

  // モーダル表示
  const dataUrl = ctx.canvas.toDataURL('image/png');
  document.getElementById('share-image-preview').src = dataUrl;

  // シェアコンテキスト: 偏差値カード
  setShareContext({
    text: buildShareTextRanking(rankings),
    url:  getBaseShareUrl(),
    filename: `unmei_ranking_${state.finalMBTI}.png`
  });

  document.getElementById('share-modal').classList.add('active');
}
