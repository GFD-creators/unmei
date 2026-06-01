"""
ビジネスモデル図 Langaku風 v2 (1400×1700)
中央: アプリ
上: ユーザー (流入・読む)
左右: 収益源 (¥流入) と コスト
下: 起点 / 定説 / 逆説
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

OUT = Path(r"C:\Users\kkaji\Desktop\サイト作成\unmei-v15.1\assets\og\biz_model_v2.png")
OUT.parent.mkdir(parents=True, exist_ok=True)

FONT_BOLD = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_REG  = r"C:\Windows\Fonts\YuGothR.ttc"

W, H = 1400, 1700


def F(size, bold=True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def text(d, x, y, txt, font, fill, anchor='mm'):
    d.text((x, y), txt, font=font, fill=fill, anchor=anchor)


def box(d, x, y, w, h, fill='#fff', stroke=(74, 44, 92), sw=2, radius=8):
    d.rounded_rectangle((x, y, x + w, y + h), radius=radius,
                        fill=fill, outline=stroke, width=sw)


def arrow(d, x1, y1, x2, y2, color=(74, 44, 92), width=2, head=10, dashed=False):
    if dashed:
        # 破線
        dx, dy = x2 - x1, y2 - y1
        dist = math.sqrt(dx*dx + dy*dy)
        if dist == 0:
            return
        ux, uy = dx / dist, dy / dist
        step = 8
        gap = 5
        cur = 0
        while cur < dist - head:
            sx = x1 + ux * cur
            sy = y1 + uy * cur
            ex = x1 + ux * min(cur + step, dist - head)
            ey = y1 + uy * min(cur + step, dist - head)
            d.line([(sx, sy), (ex, ey)], fill=color, width=width)
            cur += step + gap
    else:
        d.line([(x1, y1), (x2, y2)], fill=color, width=width)
    # 矢印先端 (▶)
    ang = math.atan2(y2 - y1, x2 - x1)
    h1x = x2 - head * math.cos(ang - math.pi / 6)
    h1y = y2 - head * math.sin(ang - math.pi / 6)
    h2x = x2 - head * math.cos(ang + math.pi / 6)
    h2y = y2 - head * math.sin(ang + math.pi / 6)
    d.polygon([(x2, y2), (h1x, h1y), (h2x, h2y)], fill=color)


def yen_label(d, cx, cy, label, color=(232, 53, 140)):
    """¥アイコン付きラベル"""
    box(d, cx - 18, cy - 14, 36, 28, fill='#fff5e6', stroke=color, sw=2, radius=4)
    text(d, cx, cy, '¥', F(20), color)
    text(d, cx, cy + 28, label, F(13), (74, 44, 92))


# ベース
img = Image.new("RGB", (W, H), (252, 250, 254))
d = ImageDraw.Draw(img)

# ヘッダー右上の年バッジ
text(d, W - 80, 38, "BEFORE", F(18), (120, 120, 120), anchor='rt')
text(d, W - 80, 60, "2026", F(36), (74, 44, 92), anchor='rt')
box(d, W - 100, 105, 80, 36, fill=(74, 44, 92), stroke=(74, 44, 92), radius=4)
text(d, W - 60, 123, "時 点", F(16), '#fff')

# タイトル
text(d, W // 2, 70, "Unmei", F(72), (74, 44, 92))
text(d, W // 2, 110, "ウ ン メ イ", F(16, False), (120, 100, 140))
text(d, W // 2, 150, "MBTI × 干支 で わかる ジェネ Z 向け キャラクター 占い PWA", F(18, False), (74, 44, 92))

# 中央アプリアイコン
APP_CX, APP_CY = W // 2, 660
# 影
d.rounded_rectangle((APP_CX - 100 + 6, APP_CY - 100 + 8, APP_CX + 100 + 6, APP_CY + 100 + 8),
                    radius=20, fill=(220, 200, 230))
# 本体 (スマホ形)
box(d, APP_CX - 100, APP_CY - 100, 200, 200, fill=(255, 196, 221), stroke=(232, 53, 140), sw=4, radius=20)
# 画面
box(d, APP_CX - 80, APP_CY - 80, 160, 160, fill='#fff', stroke=(255, 143, 196), sw=2, radius=10)
text(d, APP_CX, APP_CY - 30, "♡", F(40), (255, 111, 179))
text(d, APP_CX, APP_CY + 20, "Unmei", F(22), (74, 44, 92))
text(d, APP_CX, APP_CY + 75, "ホームボタン", F(10, False), (200, 180, 210))
d.ellipse((APP_CX - 8, APP_CY + 100, APP_CX + 8, APP_CY + 116), outline=(255, 143, 196), width=2)
text(d, APP_CX, APP_CY + 145, "Unmei (アプリ)", F(18), (74, 44, 92))

# === ユーザー (上) ===
USER_CX, USER_CY = W // 2, 280
# 顔
d.ellipse((USER_CX - 40, USER_CY - 40, USER_CX + 40, USER_CY + 40),
          fill=(255, 230, 240), outline=(232, 53, 140), width=3)
# 目
d.ellipse((USER_CX - 14, USER_CY - 8, USER_CX - 6, USER_CY + 2), fill=(74, 44, 92))
d.ellipse((USER_CX + 6, USER_CY - 8, USER_CX + 14, USER_CY + 2), fill=(74, 44, 92))
text(d, USER_CX, USER_CY + 16, "♡", F(16), (255, 111, 179))
# 体 (簡易)
d.polygon([(USER_CX - 40, USER_CY + 35), (USER_CX + 40, USER_CY + 35),
           (USER_CX + 50, USER_CY + 80), (USER_CX - 50, USER_CY + 80)],
          fill=(255, 230, 240), outline=(232, 53, 140))
text(d, USER_CX, USER_CY + 110, "10〜20代 女子", F(18), (74, 44, 92))
text(d, USER_CX, USER_CY + 132, "（MBTIや占い好き）", F(13, False), (120, 100, 140))

# ユーザー → アプリ (左: 占う、右: シェアして拡散)
# 左: 占う
text(d, USER_CX - 200, USER_CY + 100, "♡ 占う ♡", F(16), (232, 53, 140))
arrow(d, USER_CX - 60, USER_CY + 60, APP_CX - 100, APP_CY - 60, color=(232, 53, 140), width=3, head=14)
text(d, USER_CX - 90, 440, "20問 × 3分", F(13, False), (120, 100, 140))

# 右: シェア・流入 (友達ループ)
text(d, USER_CX + 180, USER_CY + 100, "✦ 拡散 → 友達 → 新規 ✦", F(16), (255, 111, 179))
arrow(d, APP_CX + 100, APP_CY - 60, USER_CX + 60, USER_CY + 60, color=(255, 111, 179), width=3, head=14, dashed=True)
text(d, USER_CX + 100, 440, "K係数 3.0 想定", F(13, False), (120, 100, 140))

# === 左サイド: コスト (¥支出) ===
LEFT_X = 80
# 1. GitHub Pages (¥0)
box(d, LEFT_X, 500, 220, 100, fill=(240, 255, 248), stroke=(92, 184, 154), sw=3, radius=12)
text(d, LEFT_X + 110, 525, "GitHub Pages", F(18), (37, 122, 92))
text(d, LEFT_X + 110, 552, "サーバホスティング", F(13, False), (74, 44, 92))
text(d, LEFT_X + 110, 580, "¥0 / 月", F(20), (37, 122, 92))

# 矢印
arrow(d, LEFT_X + 220, 550, APP_CX - 100, 640, color=(92, 184, 154), width=2)
text(d, (LEFT_X + 220 + APP_CX - 100) / 2 - 30, 580, "配信 (¥0)", F(13), (37, 122, 92))

# 2. OpenAI DALL-E (¥0 残債)
box(d, LEFT_X, 620, 220, 100, fill=(240, 255, 248), stroke=(92, 184, 154), sw=3, radius=12)
text(d, LEFT_X + 110, 645, "ChatGPT / DALL-E", F(17), (37, 122, 92))
text(d, LEFT_X + 110, 672, "キャラ画像 (商用OK)", F(13, False), (74, 44, 92))
text(d, LEFT_X + 110, 700, "¥0 (生成済)", F(18), (37, 122, 92))

arrow(d, LEFT_X + 220, 670, APP_CX - 100, 680, color=(92, 184, 154), width=2)
text(d, (LEFT_X + 220 + APP_CX - 100) / 2 - 20, 660, "素材 (¥0)", F(13), (37, 122, 92))

# 3. 開発時間 (機会費用)
box(d, LEFT_X, 740, 220, 100, fill=(255, 244, 220), stroke=(200, 130, 0), sw=3, radius=12)
text(d, LEFT_X + 110, 765, "開発工数", F(18), (180, 110, 0))
text(d, LEFT_X + 110, 792, "あなたの時間", F(13, False), (74, 44, 92))
text(d, LEFT_X + 110, 820, "機会費用のみ", F(18), (180, 110, 0))

arrow(d, LEFT_X + 220, 790, APP_CX - 100, 720, color=(200, 130, 0), width=2)
text(d, (LEFT_X + 220 + APP_CX - 100) / 2 - 30, 740, "改善・運用", F(13), (200, 130, 0))

# === 右サイド: 収益源 (¥流入) ===
RIGHT_X = W - 80 - 240
revenue_sources = [
    {
        "title": "① Google AdSense",
        "sub":   "PV連動 広告",
        "income": "¥30k〜150k / 月",
        "phase": "Phase 2~ (DAU 1k↑)",
        "color": (255, 184, 0),
        "bg":    (255, 248, 220),
    },
    {
        "title": "② アフィリエイト",
        "sub":   "A8 / もしも",
        "income": "¥10k〜100k / 月",
        "phase": "Phase 2~ (DAU 1k↑)",
        "color": (255, 184, 0),
        "bg":    (255, 248, 220),
    },
    {
        "title": "③ SUZURI グッズ",
        "sub":   "キャラT・ケース等",
        "income": "¥50k〜200k / 月",
        "phase": "Phase 3~ (DAU 5k↑)",
        "color": (255, 111, 179),
        "bg":    (255, 240, 248),
    },
    {
        "title": "④ フリーミアム 課金",
        "sub":   "詳細結果 ¥300-500",
        "income": "¥100k〜500k / 月",
        "phase": "Phase 3~ (DAU 5k↑)",
        "color": (255, 111, 179),
        "bg":    (255, 240, 248),
    },
    {
        "title": "⑤ 企業 タイアップ",
        "sub":   "コスメ・スキンケア",
        "income": "¥500k〜3M / 月",
        "phase": "Phase 4~ (DAU 10k↑)",
        "color": (155, 135, 216),
        "bg":    (243, 230, 255),
    },
]

for i, src in enumerate(revenue_sources):
    y0 = 450 + i * 130
    box(d, RIGHT_X, y0, 240, 110, fill=src["bg"], stroke=src["color"], sw=3, radius=12)
    text(d, RIGHT_X + 120, y0 + 22, src["title"], F(17), src["color"])
    text(d, RIGHT_X + 120, y0 + 46, src["sub"], F(12, False), (74, 44, 92))
    text(d, RIGHT_X + 120, y0 + 75, src["income"], F(17), (74, 44, 92))
    text(d, RIGHT_X + 120, y0 + 96, src["phase"], F(11, False), (160, 140, 160))

    # 矢印 (アプリ → 収益源)
    target_x = RIGHT_X
    target_y = y0 + 55
    src_x = APP_CX + 100
    src_y = APP_CY - 60 + i * 30
    arrow(d, src_x, src_y, target_x, target_y, color=src["color"], width=2)

    # ¥バッジ on arrow
    yen_cx = (src_x + target_x) / 2
    yen_cy = (src_y + target_y) / 2
    d.ellipse((yen_cx - 14, yen_cy - 14, yen_cx + 14, yen_cy + 14),
              fill='#fff5e6', outline=src["color"], width=2)
    text(d, yen_cx, yen_cy, "¥", F(16), src["color"])

# === 中央下: ポイント (黒帯) ===
POINT_Y = 1110
box(d, 80, POINT_Y, W - 160, 110, fill=(74, 44, 92), stroke=(74, 44, 92), radius=12)
text(d, W // 2, POINT_Y + 35,
     "★ ポイント ★",
     F(20), (255, 217, 61))
text(d, W // 2, POINT_Y + 65,
     "完全 静的サイト ＋ ChatGPT 生成済 キャラ により",
     F(18, False), '#fff')
text(d, W // 2, POINT_Y + 90,
     "DAU 1万人 まで 月額コスト ¥0、収益 ¥0 〜 ¥3.4M / 月 の 拡張余地",
     F(18, False), '#fff')

# === 起点 / 定説 / 逆説 (Langaku風) ===
TYO_Y = 1280
text(d, 130, TYO_Y + 30, "M B T I 占 い", F(22, False), (74, 44, 92), anchor='lm')

# 矢印で 定説/逆説 へ
arrow(d, 360, TYO_Y + 30, 460, TYO_Y - 5, color=(74, 44, 92), width=2)
arrow(d, 360, TYO_Y + 30, 460, TYO_Y + 65, color=(74, 44, 92), width=2)

# 定説
box(d, 460, TYO_Y - 25, 110, 60, fill=(245, 245, 245), stroke=(120, 120, 120), radius=8)
text(d, 515, TYO_Y + 5, "定 説", F(20, False), (120, 120, 120))
text(d, 580, TYO_Y + 5,
     "16タイプの 当てっこゲーム ・ 結果単体で 終わる",
     F(17, False), (120, 120, 120), anchor='lm')

# 逆説
box(d, 460, TYO_Y + 35, 110, 60, fill=(255, 240, 248), stroke=(232, 53, 140), radius=8)
text(d, 515, TYO_Y + 65, "逆 説", F(20, False), (232, 53, 140))
text(d, 580, TYO_Y + 65,
     "占い × キャラ × ランキング で 自己語り 素材化 → 拡散 連鎖 ループ",
     F(17, False), (232, 53, 140), anchor='lm')

# フッター URL
box(d, 0, H - 60, W, 60, fill=(74, 44, 92), radius=0)
text(d, W // 2, H - 30,
     "https://kaji-lab-kj.github.io/unmei/   ♡   v15.1.6  /  2026-06",
     F(18, False), '#fff')

img.save(OUT, "PNG", optimize=True)
print(f"  -> {OUT.name}  ({OUT.stat().st_size // 1024}KB)")
