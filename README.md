# 運命図鑑 ウンメイ (UNMEI) v15.1

> あなたの生まれた日にきざまれた運命のしるしを占う、可愛い系 MBTI × 干支占い PWA

## 🌸 機能

- **MBTI 16 タイプ × 干支 12 種** = 192 タイプから運命を診断
- **レアキャラ 4 体**（くらやみのうさぎ / まっしろねこ / こうきのうさぎ / てんしのまもりぬ）
  - 1.0% 出現確率 (端末固有シードで乱数化)
  - 2001/7/23 生まれは「てんしの まもりぬ」固定発動
- **7軸全国ランキング**（モテ / コミュ / 金運 / 一途 / 天才 / メンタル / ヤンデレ）
  - 全国800万人中の順位を表示
  - スコア低くても「内に秘めた魅力派」等で不安照ケア
- **ふたりの相性チェック** — MBTI + 干支 + レアボーナスで100点満点採点
- **シェア機能** — Web Share API / 画像DL / X / LINE / クリップボード
- **PWA 対応** — ホーム画面に追加可能、オフラインでも動作

## 🛠️ 技術スタック

- 純粋な HTML / CSS / Vanilla JavaScript（フレームワーク不使用）
- Service Worker でキャッシュ管理
- Canvas API でシェア画像生成（TikTok縦長 1080×1920）
- Python + Pillow + scipy でキャラ画像前処理（`slice_chars.py`）

## 📁 ディレクトリ構造

```
unmei-v15.1/
├── index.html                 メインHTML
├── manifest.json              PWA マニフェスト
├── service-worker.js          オフライン対応
├── css/style.css
├── js/
│   ├── data.js                データ定数（CHAR_IMG / MBTI_DETAILS / RARE_TYPES 等）
│   ├── rare.js                レア判定ロジック
│   ├── compatibility.js       相性計算
│   ├── ranking.js             7軸ランキング
│   ├── share_actions.js       シェアアクション
│   ├── ranking_card.js        偏差値カード描画
│   ├── flow.js                画面遷移
│   ├── share.js               シェア画像生成
│   └── main.js                起動処理 + SW登録
├── assets/
│   ├── chars/                 キャラPNG 20体
│   └── icons/                 PWAアイコン
├── slice_chars.py             画像前処理
└── make_icons.py              アイコン生成
```

## 🚀 ローカル起動

```bash
cd unmei-v15.1
python -m http.server 8765
# ブラウザで http://localhost:8765 を開く
```

## 📜 著作権

キャラクター画像は ChatGPT (DALL-E 3) で生成。OpenAI 利用規約に基づき生成者が所有権を保持。

---

🤖 v15.1 — 2026-05 リリース
