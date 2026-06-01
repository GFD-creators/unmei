"""
運命図鑑 ビジネスモデル図 (1600×1200) 生成
4段階フェーズ × DAU 連動の収益モデル
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"C:\Users\kkaji\Desktop\サイト作成\unmei-v15.1\assets\og\business_model.png")
OUT.parent.mkdir(parents=True, exist_ok=True)

FONT_BOLD = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_REG  = r"C:\Windows\Fonts\YuGothR.ttc"

W, H = 1600, 1200


def F(size, bold=True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def round_rect(d, xy, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def text(d, x, y, txt, font, fill, anchor='lt'):
    d.text((x, y), txt, font=font, fill=fill, anchor=anchor)


# ベース
img = Image.new("RGB", (W, H), (255, 245, 250))
d = ImageDraw.Draw(img)

# ドットパターン
for x in range(20, W, 32):
    for y in range(20, H, 32):
        d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=(255, 143, 196, 80))

# ヘッダー
round_rect(d, (40, 30, W - 40, 150), 24, fill=(255, 111, 179), outline=(232, 53, 140), width=4)
text(d, W // 2, 78, "♡ 運命図鑑 ウンメイ — ビジネスモデル ♡", F(46), (255, 255, 255), anchor='mm')
text(d, W // 2, 124, "DAU 0 → 1,000 → 5,000 → 10,000+ の段階的マネタイズ戦略",
     F(22, False), (255, 230, 240), anchor='mm')

# フェーズ4ボックスの色
PHASE_COLORS = [
    {"bg": (240, 255, 248), "border": (92, 184, 154), "accent": (37, 122, 92)},   # P1 緑
    {"bg": (255, 244, 233), "border": (255, 184, 0), "accent": (184, 121, 0)},    # P2 黄
    {"bg": (255, 234, 247), "border": (255, 111, 179), "accent": (232, 53, 140)},  # P3 ピンク
    {"bg": (243, 230, 255), "border": (155, 135, 216), "accent": (90, 67, 153)},   # P4 紫
]

PHASE_DATA = [
    {
        "no": 1,
        "title": "無料運用 フェーズ",
        "dau":  "DAU 0 〜 1,000",
        "goal": "PMF 検証 (人気の有無を確認)",
        "income": "¥0 / 月",
        "cost":   "¥0 / 月",
        "actions": [
            "• 友達3〜5人に LINE で URL シェア",
            "• 反応OK → TikTok 投稿で 50-100人テスト",
            "• GitHub Pages 無料運用継続",
            "• GA4 で DAU・離脱率を毎日チェック",
        ],
    },
    {
        "no": 2,
        "title": "広告 フェーズ",
        "dau":  "DAU 1,000 〜 5,000",
        "goal": "受動収益の確立",
        "income": "¥40k 〜 ¥250k / 月",
        "cost":   "¥0 〜 ¥2k / 月",
        "actions": [
            "• Google AdSense 申請 (DAU 500↑ で承認しやすい)",
            "  → ¥30k-150k/月 (PV単価 ¥0.5-2)",
            "• アフィリエイト埋込 (A8/もしも アフィ)",
            "  → 「INTJ に似合うブランド」「干支別 ラッキー」",
            "  → ¥10k-100k/月 (CVR 1-3%)",
            "• 独自ドメイン取得 (任意 ¥2k/年)",
        ],
    },
    {
        "no": 3,
        "title": "物販 ＆ 課金 フェーズ",
        "dau":  "DAU 5,000 〜 10,000",
        "goal": "1人あたり単価UP (ARPU)",
        "income": "¥150k 〜 ¥700k / 月",
        "cost":   "¥2k 〜 ¥10k / 月",
        "actions": [
            "• SUZURI でキャラグッズ販売 (初期投資¥0)",
            "  → Tシャツ・スマホケース・ステッカー",
            "  → ¥50k-200k/月 (販売10%還元)",
            "• フリーミアム (詳細結果 ¥300-500)",
            "  → 「30歳までの完全予言」「本当の魅力」",
            "  → ¥100k-500k/月 (課金率2-5%)",
        ],
    },
    {
        "no": 4,
        "title": "拡大 フェーズ",
        "dau":  "DAU 10,000 以上",
        "goal": "B2B 案件 + IP 化",
        "income": "¥630k 〜 ¥3.4M / 月",
        "cost":   "¥20k 〜 ¥50k / 月",
        "actions": [
            "• 企業タイアップ (コスメ・スキンケアブランド)",
            "  → 「あなたのMBTI に似合う化粧品」コラボ",
            "  → ¥500k-3M/月 (1案件 ¥50-300万)",
            "• PWA 朝7:37通知 + 通知広告",
            "  → ¥30k-100k/月",
            "• 月1 新キャラ「ガチャ」課金 ¥120",
            "  → ¥100k-300k/月",
        ],
    },
]

# 2x2 グリッドでフェーズボックス配置
BOX_W = 720
BOX_H = 440
BOX_GAP_X = 40
BOX_GAP_Y = 40
START_X = 60
START_Y = 190

for i, phase in enumerate(PHASE_DATA):
    col = i % 2
    row = i // 2
    x0 = START_X + col * (BOX_W + BOX_GAP_X)
    y0 = START_Y + row * (BOX_H + BOX_GAP_Y)
    x1 = x0 + BOX_W
    y1 = y0 + BOX_H
    c = PHASE_COLORS[i]

    # 影
    round_rect(d, (x0 + 5, y0 + 7, x1 + 5, y1 + 7), 20, fill=(220, 200, 210))
    # 本体
    round_rect(d, (x0, y0, x1, y1), 20, fill=c["bg"], outline=c["border"], width=4)

    # フェーズ番号バッジ
    badge_size = 60
    badge_x = x0 + 30
    badge_y = y0 + 30
    d.ellipse((badge_x, badge_y, badge_x + badge_size, badge_y + badge_size),
              fill=c["accent"], outline=(255, 255, 255), width=3)
    text(d, badge_x + badge_size // 2, badge_y + badge_size // 2 - 4,
         f"P{phase['no']}", F(24), (255, 255, 255), anchor='mm')

    # タイトル
    text(d, x0 + 110, y0 + 38, phase["title"], F(30), c["accent"])
    text(d, x0 + 110, y0 + 75, phase["dau"], F(18, False), c["accent"])

    # 目標
    text(d, x0 + 30, y0 + 115, f"目標: {phase['goal']}", F(18, False), (74, 44, 92))

    # 収益・コスト
    income_y = y0 + 150
    round_rect(d, (x0 + 30, income_y, x0 + 360, income_y + 56), 12,
               fill=(255, 255, 255), outline=c["border"], width=2)
    text(d, x0 + 50, income_y + 12, "月 収 益", F(13), c["accent"])
    text(d, x0 + 50, income_y + 28, phase["income"], F(22), (74, 44, 92))

    round_rect(d, (x0 + 380, income_y, x0 + 690, income_y + 56), 12,
               fill=(255, 255, 255), outline=c["border"], width=2)
    text(d, x0 + 400, income_y + 12, "コスト", F(13), c["accent"])
    text(d, x0 + 400, income_y + 28, phase["cost"], F(22), (74, 44, 92))

    # アクション
    act_y = y0 + 226
    text(d, x0 + 30, act_y, "▼ 主要アクション", F(16), c["accent"])
    for j, act in enumerate(phase["actions"]):
        text(d, x0 + 30, act_y + 30 + j * 28, act, F(15, False), (74, 44, 92))

# フッター
footer_y = H - 80
round_rect(d, (40, footer_y, W - 40, H - 30), 16,
           fill=(74, 44, 92), outline=(232, 53, 140), width=2)
text(d, W // 2, footer_y + 16,
     "★ KPI: ハンドオフ目標 DAU 8,000 / シェア率 40% / K係数 3.0 / 課金率 5% ★",
     F(20), (255, 255, 255), anchor='mt')

# 装飾
text(d, 60, 220, "♡", F(36), (255, 217, 61))
text(d, W - 80, 220, "✦", F(36), (196, 181, 253))

img.save(OUT, "PNG", optimize=True)
print(f"  -> {OUT.name}  ({OUT.stat().st_size // 1024}KB)")
