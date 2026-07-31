# -*- coding: utf-8 -*-
"""
Instagram 広告クリエイティブ生成
================================
運命図鑑 ウンメイ の Instagram / Facebook 広告用バナーを生成する。

- ブランド: ピンクのグラデ + ドット + 星/ハート/キラキラ装飾 + マゼンタ見出し + ピンクCTAピル
  (make_ogp.py / make_note_eyecatch.py の世界観を踏襲)
- 4コンセプト × 3サイズ = 12点を assets/ads/ に出力
    - フィード正方形  1:1  (1080 x 1080)
    - フィード縦長    4:5  (1080 x 1350)   ※Metaが推奨する最大占有比
    - ストーリーズ/リール 9:16 (1080 x 1920)
- フォント: 環境に応じて IPA / Yu Gothic / Noto を自動選択 (Linux/Windows両対応)
- キャラ画像は assets/chars/ の透過PNGを使用

実行:
    python make_instagram_ads.py
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent
CHARS = BASE / "assets" / "chars"
OUT = BASE / "assets" / "ads"
OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------
# フォント (環境に合わせて最初に見つかったものを使う)
# ------------------------------------------------------------------
FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf",   # Linux (IPA Pゴシック)
    "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",    # Linux (IPAゴシック)
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.otf",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    r"C:\Windows\Fonts\YuGothB.ttc",                          # Windows (游ゴシック Bold)
    r"C:\Windows\Fonts\meiryob.ttc",                          # Windows (メイリオ Bold)
]


def _font_path():
    for p in FONT_CANDIDATES:
        if Path(p).exists():
            return p
    raise RuntimeError("日本語フォントが見つかりません: " + ", ".join(FONT_CANDIDATES))


FONT_PATH = _font_path()
_font_cache = {}


def font(size):
    size = int(size)
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(FONT_PATH, size)
    return _font_cache[size]


# ------------------------------------------------------------------
# ブランドカラー
# ------------------------------------------------------------------
BG_TOP = (255, 246, 251)
BG_BOT = (255, 223, 240)
DOT = (255, 143, 196, 55)
MAGENTA = (232, 53, 140)          # 見出しメイン
MAGENTA_SH = (255, 168, 205)      # 見出し影
INK = (74, 44, 92)                # 濃い紫(本文)
PURPLE = (150, 110, 180)          # サブ
CTA_FILL = (255, 111, 179)
CTA_SHADOW = (232, 53, 140, 110)
GOLD = (255, 209, 92)
LILAC = (196, 181, 253)
PINK = (255, 122, 186)
WHITE = (255, 255, 255)


# ------------------------------------------------------------------
# 背景・装飾
# ------------------------------------------------------------------
def gradient_bg(W, H):
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line((0, y, W, y),
               fill=tuple(int(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3)))
    img = img.convert("RGBA")
    # ドットパターン
    dot = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dot)
    step = 54
    for x in range(30, W, step):
        for y in range(30, H, step):
            dd.ellipse((x - 2, y - 2, x + 2, y + 2), fill=DOT)
    return Image.alpha_composite(img, dot)


def draw_star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=fill)


def draw_heart(d, cx, cy, r, fill):
    d.ellipse((cx - r, cy - r * 0.8, cx, cy + r * 0.2), fill=fill)
    d.ellipse((cx, cy - r * 0.8, cx + r, cy + r * 0.2), fill=fill)
    d.polygon([(cx - r, cy - r * 0.05), (cx + r, cy - r * 0.05), (cx, cy + r)], fill=fill)


def draw_sparkle(d, cx, cy, r, fill):
    for ang_deg in (0, 90):
        ang = math.radians(ang_deg)
        dx, dy = math.cos(ang) * r, math.sin(ang) * r
        px = math.cos(ang + math.pi / 2) * r * 0.22
        py = math.sin(ang + math.pi / 2) * r * 0.22
        d.polygon([(cx + dx, cy + dy), (cx + px, cy + py),
                   (cx - dx, cy - dy), (cx - px, cy - py)], fill=fill)


def scatter_decor(canvas, W, H, top_safe, bottom_safe):
    """四隅・余白にキラキラを散らす (安全域は避ける)"""
    d = ImageDraw.Draw(canvas)
    u = W / 1080.0
    items = [
        ("star", 0.09, 0.045, 26, GOLD),
        ("sparkle", 0.90, 0.05, 22, LILAC),
        ("heart", 0.94, 0.13, 16, PINK),
        ("sparkle", 0.06, 0.15, 15, LILAC),
        ("star", 0.93, 0.93, 22, GOLD),
        ("heart", 0.08, 0.95, 18, PINK),
        ("sparkle", 0.50, 0.03, 13, GOLD),
        ("heart", 0.12, 0.60, 13, PINK),
        ("sparkle", 0.88, 0.62, 17, LILAC),
        ("star", 0.05, 0.40, 14, GOLD),
    ]
    for kind, fx, fy, r, col in items:
        x, y = fx * W, fy * H
        if y < top_safe - 10 or y > H - bottom_safe + 10:
            continue
        rr = r * u
        if kind == "star":
            draw_star(d, x, y, rr, col)
        elif kind == "heart":
            draw_heart(d, x, y, rr, col)
        else:
            draw_sparkle(d, x, y, rr, col)


# ------------------------------------------------------------------
# テキスト補助
# ------------------------------------------------------------------
def text_size(f, s):
    b = f.getbbox(s)
    return b[2] - b[0], b[3] - b[1]


def fit_font(text, max_w, start, min_size=24):
    size = start
    while size > min_size:
        if text_size(font(size), text)[0] <= max_w:
            break
        size -= 2
    return font(size)


def draw_center(d, cx, y, text, f, fill, bold=0, shadow=None, shadow_off=(3, 4)):
    w, h = text_size(f, text)
    b = f.getbbox(text)
    x = cx - w / 2 - b[0]
    yy = y - b[1]
    if shadow:
        d.text((x + shadow_off[0], yy + shadow_off[1]), text, font=f, fill=shadow,
               stroke_width=bold, stroke_fill=shadow)
    d.text((x, yy), text, font=f, fill=fill, stroke_width=bold, stroke_fill=fill)
    return h


def pill(d, cx, cy, text, f, fill, text_fill=WHITE, pad_x=44, pad_y=26,
         border=WHITE, border_w=5, shadow=None):
    tw, th = text_size(f, text)
    b = f.getbbox(text)
    w = tw + pad_x * 2
    h = th + pad_y * 2
    x0, y0 = cx - w / 2, cy - h / 2
    x1, y1 = cx + w / 2, cy + h / 2
    r = h / 2
    if shadow:
        d.rounded_rectangle((x0 + 4, y0 + 7, x1 + 4, y1 + 7), radius=r, fill=shadow)
    d.rounded_rectangle((x0, y0, x1, y1), radius=r, fill=fill,
                        outline=border, width=border_w)
    d.text((cx - tw / 2 - b[0], cy - th / 2 - b[1]), text, font=f, fill=text_fill)
    return h


def play_triangle(d, cx, cy, r, fill):
    d.polygon([(cx - r * 0.6, cy - r), (cx - r * 0.6, cy + r), (cx + r, cy)], fill=fill)


# ------------------------------------------------------------------
# キャラ配置
# ------------------------------------------------------------------
def load_char(fname, target_h):
    im = Image.open(CHARS / fname).convert("RGBA")
    r = target_h / im.height
    return im.resize((int(im.width * r), target_h), Image.LANCZOS)


def paste_center(canvas, im, cx, cy):
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


# ------------------------------------------------------------------
# コンセプト定義
# ------------------------------------------------------------------
BADGE = "運命図鑑ウンメイ ｜ MBTI × 干支"
FOOTER = "gfd-creators.github.io/unmei"

CONCEPTS = [
    {
        "key": "01_hook",
        "badge": "無料 うらない",
        "headline": ["生まれた日で", "わかる、あなたの", "《運命キャラ》"],
        "sub": "16タイプ × 干支12種 ＝ 192の運命",
        "cta": "いますぐ無料で占う",
        "chars": [("rare_legendary_angelpoodle.png", 1.0, 0.0)],
    },
    {
        "key": "02_rare",
        "badge": "出現確率 わずか 1%",
        "headline": ["あなたは", "《レアキャラ》を", "引けるか？"],
        "sub": "隠れた4体のレアキャラを探せ",
        "cta": "いま運試しする",
        "chars": [
            ("rare_legendary_angelpoodle.png", 0.52, -0.345),
            ("rare_bloodline_goldrabbit.png", 0.46, -0.115),
            ("rare_cursed_purplerabbit.png", 0.48, 0.115),
            ("rare_blank_whitecat.png", 0.46, 0.345),
        ],
    },
    {
        "key": "03_aisho",
        "badge": "ふたりの 相性チェック",
        "headline": ["気になるあの人と", "相性は 何点？"],
        "sub": "MBTI×干支×レアで 100点満点 採点",
        "cta": "相性を診断する",
        "chars": [
            ("unmei_enfj_bear_heart.png", 0.72, -0.24),
            ("unmei_infj_unicorn_pink.png", 0.72, 0.24),
        ],
    },
    {
        "key": "04_ranking",
        "badge": "全国 800万人 ランキング",
        "headline": ["モテ・金運・メンタル…", "あなたは 何位？"],
        "sub": "7つの運命ステータスを 全国診断",
        "cta": "順位を見てみる",
        "chars": [
            ("unmei_esfp_chick_sun.png", 0.60, -0.30),
            ("unmei_entj_blackcat_crown.png", 0.66, 0.02),
            ("unmei_enfp_squirrel_rainbow.png", 0.58, 0.30),
        ],
    },
]

# サイズごとのレイアウト係数
SIZES = {
    "1x1": dict(W=1080, H=1080, top=70, bottom=70,
                hl=78, hl_gap=12, char_h=360, sub=34, badge=30),
    "4x5": dict(W=1080, H=1350, top=96, bottom=104,
                hl=88, hl_gap=14, char_h=430, sub=38, badge=32),
    "9x16": dict(W=1080, H=1920, top=270, bottom=290,
                 hl=94, hl_gap=18, char_h=470, sub=40, badge=34),
}


def compose(concept, size_key):
    cfg = SIZES[size_key]
    W, H = cfg["W"], cfg["H"]
    canvas = gradient_bg(W, H)
    scatter_decor(canvas, W, H, cfg["top"], cfg["bottom"])
    d = ImageDraw.Draw(canvas)
    cx = W / 2

    y = cfg["top"]

    # --- バッジ (小ピル) ---
    bf = font(cfg["badge"])
    bh = pill(d, cx, y + text_size(bf, concept["badge"])[1] / 2 + 22, concept["badge"], bf,
              fill=(255, 255, 255, 235), text_fill=MAGENTA, pad_x=34, pad_y=16,
              border=CTA_FILL, border_w=4)
    y += bh + 34

    # --- 見出し (複数行 / 自動フィット) ---
    max_w = W - 130
    for i, line in enumerate(concept["headline"]):
        f = fit_font(line, max_w, cfg["hl"])
        h = draw_center(d, cx, y, line, f, MAGENTA, bold=2,
                        shadow=MAGENTA_SH, shadow_off=(0, 5))
        y += h + cfg["hl_gap"]
    y += 18

    # --- CTA と フッターの位置を先に確保 ---
    footer_f = font(26)
    cta_f = font(int(cfg["hl"] * 0.52))
    cta_h_est = text_size(cta_f, concept["cta"])[1] + 52
    footer_y = H - cfg["bottom"]
    cta_cy = footer_y - 40 - cta_h_est / 2

    # --- キャラ帯 (見出し下〜サブ〜CTAの間) ---
    sub_f = font(cfg["sub"])
    sub_h = text_size(sub_f, concept["sub"])[1]
    band_top = y
    band_bot = cta_cy - cta_h_est / 2 - sub_h - 46
    band_cy = band_top + (band_bot - band_top) * 0.44   # やや上寄せで余白の間延びを防ぐ
    band_h = band_bot - band_top

    base_h = min(cfg["char_h"], band_h * 0.96)
    for fname, scale, off in concept["chars"]:
        ch = load_char(fname, int(base_h * scale))
        paste_center(canvas, ch, cx + off * W, band_cy)
    d = ImageDraw.Draw(canvas)  # 再取得(alpha_composite後)

    # 相性コンセプトは中央にハート
    if concept["key"].startswith("03"):
        draw_heart(d, cx, band_cy, base_h * 0.16, PINK)
        draw_heart(d, cx, band_cy, base_h * 0.16 - 7, WHITE)
        draw_heart(d, cx, band_cy, base_h * 0.11, PINK)

    # --- サブテキスト ---
    sub_y = band_bot + 10
    draw_center(d, cx, sub_y, concept["sub"], sub_f, INK, bold=1)

    # --- CTA ピル ---
    tw = text_size(cta_f, concept["cta"])[0]
    total_w = tw + 90 + 88
    pill(d, cx, cta_cy, concept["cta"], cta_f, fill=CTA_FILL, pad_x=88, pad_y=26,
         border=WHITE, border_w=6, shadow=CTA_SHADOW)
    # ▶ アイコン + ハート
    play_triangle(d, cx - tw / 2 - 42, cta_cy, text_size(cta_f, "あ")[1] * 0.34, WHITE)
    draw_heart(d, cx + tw / 2 + 40, cta_cy - 2, text_size(cta_f, "あ")[1] * 0.30, WHITE)

    # --- フッター ---
    draw_center(d, cx, footer_y, FOOTER, footer_f, PURPLE)
    # ブランド帯(最上部の極小表記)
    draw_center(d, cx, cfg["top"] - 2 if size_key != "9x16" else cfg["top"] - 40,
                "", font(20), PURPLE)

    return canvas.convert("RGB")


def main():
    n = 0
    for concept in CONCEPTS:
        for size_key in SIZES:
            img = compose(concept, size_key)
            name = f"ad_{concept['key']}_{size_key}.png"
            img.save(OUT / name, "PNG", optimize=True)
            # JPEG(軽量版)も出力
            img.save(OUT / name.replace(".png", ".jpg"), "JPEG", quality=90, optimize=True)
            kb = (OUT / name).stat().st_size // 1024
            print(f"  -> {name}  ({kb}KB)")
            n += 1
    print(f"[OK] {n} creatives -> {OUT}")


if __name__ == "__main__":
    main()
