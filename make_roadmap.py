"""
バズるまでのロードマップ図 (1400×2200)
週単位 / 月単位の TODO とKPIゲート
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"C:\Users\kkaji\Desktop\サイト作成\unmei-v15.1\assets\og\roadmap.png")
FONT_BOLD = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_REG  = r"C:\Windows\Fonts\YuGothR.ttc"

W, H = 1400, 2400


def F(s, b=True):
    return ImageFont.truetype(FONT_BOLD if b else FONT_REG, s)


def text(d, x, y, t, f, c, anchor='mm'):
    d.text((x, y), t, font=f, fill=c, anchor=anchor)


def box(d, x, y, w, h, fill='#fff', stroke=(74, 44, 92), sw=2, radius=8):
    d.rounded_rectangle((x, y, x + w, y + h), radius=radius,
                        fill=fill, outline=stroke, width=sw)


img = Image.new("RGB", (W, H), (252, 250, 254))
d = ImageDraw.Draw(img)

# === ヘッダー ===
box(d, 40, 30, W - 80, 130, fill=(74, 44, 92), stroke=(74, 44, 92), radius=20)
text(d, W // 2, 70, "♡ Unmei バズるまでの ロードマップ ♡", F(40), (255, 217, 61))
text(d, W // 2, 115, "DAU 0 → 100 → 1,000 → 8,000 を 6ヶ月で目指す デイリー TODO", F(20, False), '#fff')
text(d, W // 2, 145, "判断ゲート式: KPI 未達なら戻る・達成なら次フェーズへ", F(15, False), (200, 200, 220))

# === フェーズデータ ===
PHASES = [
    {
        "no": "Day 0",
        "name": "今日 (準備)",
        "color": (92, 184, 154), "bg": (240, 255, 248),
        "goal": "ローンチ準備 整える",
        "todos": [
            "✓ サイト本番デプロイ済 (https://kaji-lab-kj.github.io/unmei/)",
            "✓ GA4 設置済 (リアルタイムで動作確認)",
            "✓ OGP・PWA 対応済",
            "□ 自分のスマホで占い 1周 → ホーム画面追加体験",
            "□ シェア画像を 1枚 保存しておく",
        ],
        "kpi": "✅ 自分が違和感ゼロで体験できる",
    },
    {
        "no": "Week 1",
        "name": "Day 1〜7 (身内ローンチ)",
        "color": (92, 184, 154), "bg": (240, 255, 248),
        "goal": "信頼できる3〜5人にテスト依頼",
        "todos": [
            "Day 1: LINE で友達3人に URL 送付 + 「ベータテスト♡」と書く",
            "Day 2-3: 反応・バグ報告ヒアリング (DM/LINE で個別)",
            "Day 4: 致命的バグ修正・違和感箇所の改善",
            "Day 5-6: 改善版でもう一度 友達に試してもらう",
            "Day 7: GA4 で 全員の動き確認 (完了率・離脱箇所)",
        ],
        "kpi": "✅ 完了率 60%以上 / シェア率 20%以上 / 友達3人の感想ポジ",
    },
    {
        "no": "Week 2",
        "name": "Day 8〜14 (TikTok 1投稿)",
        "color": (255, 184, 0), "bg": (255, 248, 220),
        "goal": "外部初露出 50〜200人 流入",
        "todos": [
            "Day 8: TikTok 動画素材 作成 (占い実演 20秒)",
            "Day 9: キャプション準備「MBTI×干支占いやってみた♡」#運命図鑑",
            "Day 10: 朝7時 or 夜21時 投稿 (z世代女子の活発時間)",
            "Day 11-13: コメント返信・他投稿に「いいね」回り",
            "Day 14: GA4 で流入数・離脱率 確認、再投稿企画",
        ],
        "kpi": "✅ DAU 100以上 / TikTok 視聴1k以上 / コメ20以上",
    },
    {
        "no": "Week 3-4",
        "name": "Day 15〜28 (量産改善)",
        "color": (255, 184, 0), "bg": (255, 248, 220),
        "goal": "「キャラ別動画」シリーズ化",
        "todos": [
            "Day 15-21: MBTI タイプ別 動画 投稿 (週3-5本)",
            "  例: 「INTJ さみしがりねこ」「INFJ つきうさぎ」",
            "Day 22-25: 効いた1本の フォーマット 量産",
            "Day 26-28: アフィリ仕込み・SUZURI グッズ準備",
            "毎日: GA4 で当日の動き 5分チェック",
        ],
        "kpi": "✅ DAU 500以上 / 1日500人流入の動画1本",
    },
    {
        "no": "Month 2",
        "name": "Day 29〜60 (バズ仕掛け)",
        "color": (255, 111, 179), "bg": (255, 240, 248),
        "goal": "1本でも バズ動画 (10万再生) 作る",
        "todos": [
            "Week 5-6: TikTok 14本 一気投稿 (毎日 1-2本)",
            "  各キャラ × 干支 のクロスパターンで バリエ作る",
            "Week 7-8: 反応のいい型を見つけて 集中投稿",
            "Phase 2 収益化開始: Google AdSense 申請 (DAU 1k で承認しやすい)",
            "Phase 2 アフィリ埋込: A8 / もしも へ登録",
        ],
        "kpi": "✅ DAU 1,000以上 / バズ動画 1本 / 月収益 ¥10k〜¥50k",
    },
    {
        "no": "Month 3",
        "name": "Day 61〜90 (収益化拡大)",
        "color": (255, 111, 179), "bg": (255, 240, 248),
        "goal": "課金 と グッズ 動かす",
        "todos": [
            "SUZURI に キャラT・スマホケース 出品 (20品)",
            "結果画面に「詳細結果 ¥300」フリーミアム 実装",
            "Instagram 進出 (TikTok と二刀流)",
            "X (Twitter) で バズ画像 投稿実験",
            "明らかに反応薄い軸は撤退・効くものに集中",
        ],
        "kpi": "✅ DAU 3,000以上 / 月収益 ¥150k〜¥400k",
    },
    {
        "no": "Month 6",
        "name": "Day 91〜180 (スケール)",
        "color": (155, 135, 216), "bg": (243, 230, 255),
        "goal": "Phase 4: 企業案件 取りに行く",
        "todos": [
            "コスメ・スキンケアブランドに DM (10社へ)",
            "「MBTI × 商品 タイアップ」企画書 1枚 持参",
            "独自ドメイン取得 (unmei.app or unmei.fun)",
            "PWA Phase 2 朝7:37 プッシュ通知 実装",
            "月1 新キャラ ガチャ ¥120 課金 実験",
        ],
        "kpi": "✅ DAU 8,000以上 / タイアップ 1案件 ¥50万〜 / 月収益 ¥1M↑",
    },
]

# === 各フェーズボックス ===
START_Y = 200
BOX_H = 280
GAP = 20

for i, p in enumerate(PHASES):
    y0 = START_Y + i * (BOX_H + GAP)
    # 影
    d.rounded_rectangle((44, y0 + 6, W - 36, y0 + BOX_H + 6), radius=16,
                        fill=(220, 200, 230))
    # 本体
    box(d, 40, y0, W - 80, BOX_H, fill=p["bg"], stroke=p["color"], sw=4, radius=16)

    # 左端 タイムラベル
    badge_w = 200
    d.rounded_rectangle((40, y0, 40 + badge_w, y0 + BOX_H), radius=16, fill=p["color"])
    # 右側は直角にしたい → 上書き
    d.rectangle((40 + badge_w - 16, y0, 40 + badge_w, y0 + BOX_H), fill=p["color"])
    text(d, 40 + badge_w / 2, y0 + 70, p["no"], F(34), '#fff')
    text(d, 40 + badge_w / 2, y0 + 110, p["name"], F(16, False), '#fff')
    # 区切り点線
    d.line([(40 + badge_w + 5, y0 + 30), (40 + badge_w + 5, y0 + BOX_H - 30)],
           fill='#fff', width=2)

    # 右側 コンテンツ
    cx = 40 + badge_w + 25
    text(d, cx, y0 + 35, "🎯  " + p["goal"], F(20), p["color"], anchor='lm')

    # TODOs
    for j, todo in enumerate(p["todos"]):
        text(d, cx + 10, y0 + 75 + j * 30, todo, F(15, False), (74, 44, 92), anchor='lm')

    # KPI ライン (下部右側)
    kpi_y = y0 + BOX_H - 50
    box(d, cx, kpi_y, W - 80 - badge_w - 60, 36, fill='#fff', stroke=p["color"], sw=2, radius=8)
    text(d, cx + 15, kpi_y + 18, "🎯  ゲート KPI:  " + p["kpi"], F(15), p["color"], anchor='lm')

# === フッター ===
FOOTER_Y = H - 100
box(d, 40, FOOTER_Y, W - 80, 80, fill=(74, 44, 92), radius=12)
text(d, W // 2, FOOTER_Y + 25,
     "★ 共通ルール ★",
     F(20), (255, 217, 61))
text(d, W // 2, FOOTER_Y + 55,
     "週1で KPI レビュー / 達成→次フェーズ / 未達→1週間延長 or 戦略変更",
     F(16, False), '#fff')

img.save(OUT, "PNG", optimize=True)
print(f"  -> {OUT.name}  ({OUT.stat().st_size // 1024}KB)")
