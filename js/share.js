// ============================================
// シェア画像生成（Canvas 1080x1920）
// ============================================
function generateShareImage() {
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1920;

  // 背景グラデーション
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#fff5fa');
  bgGrad.addColorStop(0.5, '#ffe4f1');
  bgGrad.addColorStop(1, '#ffd9e8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ドットパターン
  ctx.fillStyle = 'rgba(255, 143, 196, 0.25)';
  for (let x = 30; x < W; x += 40) {
    for (let y = 30; y < H; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 装飾の星・ハート
  ctx.font = '50px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd93d';
  ctx.fillText('★', 110, 220);
  ctx.fillStyle = '#ff8fc4';
  ctx.fillText('✦', 970, 240);
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('♡', 90, H - 280);
  ctx.fillStyle = '#ffd93d';
  ctx.fillText('★', 990, H - 320);

  // 外枠
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  roundRect(ctx, 50, 50, W - 100, H - 100, 40);
  ctx.stroke();
  ctx.strokeStyle = '#ff6fb3';
  ctx.lineWidth = 4;
  roundRect(ctx, 50, 50, W - 100, H - 100, 40);
  ctx.stroke();

  // ヘッダー
  ctx.fillStyle = '#ff6fb3';
  ctx.font = 'bold 60px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText('♡ 運 命 図 鑑 ♡', W/2, 180);

  ctx.fillStyle = '#b08bc4';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('U N M E I', W/2, 222);

  let nextY = 280;
  if (state.rareType) {
    const bg = ctx.createLinearGradient(W/2 - 220, nextY, W/2 + 220, nextY + 60);
    bg.addColorStop(0, '#fff099');
    bg.addColorStop(1, '#ffb800');
    ctx.fillStyle = bg;
    roundRect(ctx, W/2 - 240, nextY, 480, 60, 30);
    ctx.fill();
    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#5c3a00';
    ctx.font = 'bold 24px "M PLUS Rounded 1c", sans-serif';
    ctx.fillText(state.rareType.badge, W/2, nextY + 40);
    nextY += 90;
  }

  // キャラ円
  const charCircleY = nextY + 280;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(W/2, charCircleY, 240, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff8fc4';
  ctx.lineWidth = 8;
  ctx.stroke();

  // キャラ描画（非同期）
  const charKey = state.rareType
    ? (CHAR_IMG[state.rareType.charKey] ? state.rareType.charKey : state.rareType.char)
    : state.finalMBTI;

  const imgSrc = CHAR_IMG[charKey];
  if (imgSrc) {
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, W/2 - 220, charCircleY - 220, 440, 440);
      drawRestOfImage(ctx, W, H, charCircleY);
    };
    img.onerror = function() {
      // 画像ロード失敗時もテキストは描く
      drawRestOfImage(ctx, W, H, charCircleY);
    };
    img.src = imgSrc;
  } else {
    drawRestOfImage(ctx, W, H, charCircleY);
  }
}

function drawRestOfImage(ctx, W, H, charCircleY) {
  const name = state.rareType ? state.rareType.name : state.details.name;
  const catchphrase = state.rareType ? state.rareType.catch : state.details.catch;

  let nameY = charCircleY + 320;
  ctx.fillStyle = '#4a2c5c';
  ctx.textAlign = 'center';

  if (name.length > 9) {
    const splitPos = name.indexOf('の');
    if (splitPos > 0 && splitPos < name.length - 1) {
      ctx.font = 'bold 56px "M PLUS Rounded 1c", sans-serif';
      ctx.fillText(name.substring(0, splitPos + 1), W/2, nameY);
      ctx.fillText(name.substring(splitPos + 1), W/2, nameY + 72);
      nameY += 72;
    } else {
      ctx.font = 'bold 52px "M PLUS Rounded 1c", sans-serif';
      ctx.fillText(name, W/2, nameY);
    }
  } else {
    ctx.font = 'bold 64px "M PLUS Rounded 1c", sans-serif';
    ctx.fillText(name, W/2, nameY);
  }

  ctx.fillStyle = '#7a5290';
  ctx.font = '32px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText(catchphrase, W/2, nameY + 70);

  ctx.fillStyle = '#ff6fb3';
  roundRect(ctx, W/2 - 50, nameY + 100, 100, 6, 3);
  ctx.fill();

  // 属性ボックス2×2
  const attrY = nameY + 200;
  const boxW = 220;
  const boxH = 110;
  const boxGap = 24;
  const col1X = W/2 - (boxW + boxGap) / 2;
  const col2X = W/2 + (boxW + boxGap) / 2;

  const attrs = [
    { label: 'しるし', value: state.zodiac, x: col1X, y: attrY },
    { label: 'タイプ', value: state.finalMBTI, x: col2X, y: attrY },
    { label: '運命の色', value: state.rareType ? state.rareType.colorName : state.details.colorName, x: col1X, y: attrY + boxH + 20 },
    { label: '運勢', value: state.luck.toString(), x: col2X, y: attrY + boxH + 20 }
  ];

  attrs.forEach((attr) => {
    ctx.fillStyle = '#ffe4f1';
    roundRect(ctx, attr.x - boxW/2, attr.y, boxW, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = '#ff8fc4';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ff6fb3';
    ctx.font = 'bold 22px "M PLUS Rounded 1c", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(attr.label, attr.x, attr.y + 32);

    let fontSize = 40;
    if (attr.value.length >= 8) fontSize = 22;
    else if (attr.value.length >= 7) fontSize = 26;
    else if (attr.value.length >= 6) fontSize = 30;
    else if (attr.value.length >= 5) fontSize = 34;
    ctx.fillStyle = '#4a2c5c';
    ctx.font = `bold ${fontSize}px "M PLUS Rounded 1c", sans-serif`;
    ctx.fillText(attr.value, attr.x, attr.y + 82);
  });

  // ニガテ・うんめい
  const relY = attrY + boxH * 2 + 80;
  const relBoxW = 380;
  const relBoxH = 130;
  const relGap = 30;
  const relCol1X = W/2 - (relBoxW + relGap) / 2;
  const relCol2X = W/2 + (relBoxW + relGap) / 2;

  ctx.fillStyle = '#fff5f7';
  roundRect(ctx, relCol1X - relBoxW/2, relY, relBoxW, relBoxH, 16);
  ctx.fill();
  ctx.strokeStyle = '#ff7a8a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e85068';
  ctx.font = 'bold 22px "M PLUS Rounded 1c", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ ニガテな子', relCol1X, relY + 42);
  ctx.fillStyle = '#4a2c5c';
  ctx.font = 'bold 30px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText(WARNING_PAIRS[state.finalMBTI], relCol1X, relY + 92);

  ctx.fillStyle = '#fff0f7';
  roundRect(ctx, relCol2X - relBoxW/2, relY, relBoxW, relBoxH, 16);
  ctx.fill();
  ctx.strokeStyle = '#ff6fb3';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e8358c';
  ctx.font = 'bold 22px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText('♡ うんめいの子', relCol2X, relY + 42);
  ctx.fillStyle = '#4a2c5c';
  ctx.font = 'bold 30px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText(SOULMATE_PAIRS[state.finalMBTI], relCol2X, relY + 92);

  const footerY = Math.max(H - 240, relY + relBoxH + 60);
  ctx.fillStyle = '#ff6fb3';
  ctx.font = 'bold 42px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText('♡ あなたの運命は？ ♡', W/2, footerY);

  ctx.fillStyle = '#7a5290';
  ctx.font = 'bold 52px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText('unmei.app', W/2, footerY + 80);

  ctx.fillStyle = '#b08bc4';
  ctx.font = '24px monospace';
  ctx.fillText('★ 友達もやってみて ★', W/2, footerY + 130);

  const dataUrl = ctx.canvas.toDataURL('image/png');
  document.getElementById('share-image-preview').src = dataUrl;

  // シェアコンテキスト: 運命カード
  setShareContext({
    text: buildShareTextResult(state),
    url:  getBaseShareUrl(),
    filename: `unmei_${state.finalMBTI}_${state.zodiac}.png`
  });

  document.getElementById('share-modal').classList.add('active');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================
// ふたりの相性 シェア画像生成
// ============================================
function generatePairShareImage() {
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  const result = window._lastCompResult;
  if (!result) {
    alert('相性データが見つかりません');
    return;
  }

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#fff5fa');
  grad.addColorStop(1, '#ffeaf3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255, 143, 196, 0.08)';
  for (let i = 0; i < W; i += 60) {
    for (let j = 0; j < H; j += 60) {
      ctx.beginPath();
      ctx.arc(i, j, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#e8358c';
  ctx.font = 'bold 72px "DotGothic16", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('♡ 運命図鑑 ♡', W / 2, 130);

  ctx.fillStyle = '#4a2c5c';
  ctx.font = 'bold 36px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText('ふたりの 運命の 相性', W / 2, 200);

  ctx.strokeStyle = '#ff8fc4';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(120, 250);
  ctx.lineTo(W - 120, 250);
  ctx.stroke();
  ctx.setLineDash([]);

  const rankCardY = 290;
  const rankCardH = 380;
  ctx.fillStyle = '#fff';
  roundRect(ctx, 80, rankCardY, W - 160, rankCardH, 40);
  ctx.fill();
  ctx.strokeStyle = '#ffaad4';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = result.rankInfo.color;
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText('♡', W / 2 - 90, rankCardY + 110);
  ctx.fillText('♡', W / 2 + 90, rankCardY + 110);
  ctx.font = 'bold 80px sans-serif';
  ctx.fillText('♡', W / 2, rankCardY + 115);
  ctx.fillStyle = '#ffd93d';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('✦', W / 2 - 170, rankCardY + 90);
  ctx.fillText('✦', W / 2 + 170, rankCardY + 90);

  ctx.fillStyle = result.rankInfo.color;
  ctx.font = 'bold 140px "DotGothic16", monospace';
  ctx.fillText(result.rankInfo.rank, W / 2, rankCardY + 240);

  ctx.fillStyle = '#4a2c5c';
  ctx.font = 'bold 70px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText(result.total + ' 点', W / 2, rankCardY + 310);

  ctx.fillStyle = '#e8358c';
  ctx.font = 'bold 36px "M PLUS Rounded 1c", sans-serif';
  ctx.fillText(result.rankInfo.label, W / 2, rankCardY + 360);

  const pairY = 750;
  const charSize = 280;
  const leftX = 200;
  const rightX = W - 200 - charSize;

  const meCharKey = state.rareType ? (state.rareType.charKey || state.rareType.char) : state.finalMBTI;
  const partnerRare = getRareTypeById(invitePartner.rareType);
  const partnerCharKey = partnerRare ? (partnerRare.charKey || partnerRare.char) : invitePartner.mbti;

  let loadedCount = 0;
  function onCharLoaded() {
    loadedCount++;
    if (loadedCount >= 2) finalizeImage();
  }

  drawCharOnCanvasAsync(ctx, meCharKey, leftX, pairY, charSize, onCharLoaded);
  drawCharOnCanvasAsync(ctx, partnerCharKey, rightX, pairY, charSize, onCharLoaded);

  function finalizeImage() {
    ctx.fillStyle = '#ff6fb3';
    const heartSize = result.total >= 80 ? 130 : (result.total >= 60 ? 110 : 90);
    ctx.font = `bold ${heartSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('♡', W / 2, pairY + charSize / 2 + 30);

    ctx.fillStyle = '#e8358c';
    ctx.font = 'bold 36px "M PLUS Rounded 1c", sans-serif';
    ctx.fillText('あなた', leftX + charSize / 2, pairY + charSize + 50);
    ctx.fillText(invitePartner.name || 'あの子', rightX + charSize / 2, pairY + charSize + 50);

    ctx.fillStyle = '#4a2c5c';
    ctx.font = 'bold 26px "M PLUS Rounded 1c", sans-serif';
    const meTypeName = state.rareType ? state.rareType.name : MBTI_DETAILS[state.finalMBTI].name;
    const partnerTypeName = partnerRare ? partnerRare.name : MBTI_DETAILS[invitePartner.mbti].name;
    wrapText(ctx, meTypeName, leftX + charSize / 2, pairY + charSize + 100, charSize + 40, 32);
    wrapText(ctx, partnerTypeName, rightX + charSize / 2, pairY + charSize + 100, charSize + 40, 32);

    if (result.isSameType) {
      const badgeY = pairY + charSize + 170;
      ctx.fillStyle = '#ff6fb3';
      roundRect(ctx, W / 2 - 220, badgeY, 440, 60, 30);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px "DotGothic16", monospace';
      ctx.fillText('★ 奇跡の 同タイプ ★', W / 2, badgeY + 42);
    }

    const msgY = result.isSameType ? 1390 : 1370;
    ctx.fillStyle = '#fff';
    roundRect(ctx, 80, msgY, W - 160, 240, 30);
    ctx.fill();
    ctx.strokeStyle = '#ffaad4';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#e8358c';
    ctx.font = 'bold 28px "DotGothic16", monospace';
    ctx.fillText('♡ ふたりへの メッセージ ♡', W / 2, msgY + 50);

    ctx.fillStyle = '#4a2c5c';
    ctx.font = 'bold 32px "M PLUS Rounded 1c", sans-serif';
    wrapText(ctx, result.message, W / 2, msgY + 120, W - 200, 50);

    const footerY = msgY + 280;
    ctx.fillStyle = '#e8358c';
    ctx.font = 'bold 32px "DotGothic16", monospace';
    ctx.fillText('♡ あなたも 試してみて ♡', W / 2, footerY);

    ctx.fillStyle = '#4a2c5c';
    ctx.font = 'bold 36px "M PLUS Rounded 1c", sans-serif';
    ctx.fillText('unmei.app', W / 2, footerY + 60);

    const dataUrl = canvas.toDataURL('image/png');
    document.getElementById('share-image-preview').src = dataUrl;

    // シェアコンテキスト: ペアカード（招待URL同梱）
    const inviteUrl = generateInviteUrl({
      finalMBTI: state.finalMBTI,
      zodiac: state.zodiac,
      rareType: state.rareType,
      luck: state.luck,
      inviterName: state.inviterName
    });
    setShareContext({
      text: buildShareTextPair(result, invitePartner?.name),
      url:  inviteUrl,
      filename: `unmei_pair_${state.finalMBTI}.png`
    });

    document.getElementById('share-modal').classList.add('active');
  }
}

// Canvasにキャラを非同期描画
function drawCharOnCanvasAsync(ctx, charKey, x, y, size, onComplete) {
  const imgSrc = CHAR_IMG[charKey];
  if (imgSrc) {
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, x, y, size, size);
      onComplete();
    };
    img.onerror = function() {
      onComplete();  // エラーでも進める
    };
    img.src = imgSrc;
  } else {
    onComplete();
  }
}

// テキスト折返し描画（日本語は文字単位）
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split('');
  let line = '';
  let curY = y;
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, curY);
      line = chars[i];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
