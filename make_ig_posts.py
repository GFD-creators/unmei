# -*- coding: utf-8 -*-
"""
Instagram オーガニック投稿用サンプル画像生成
============================================
広告(make_instagram_ads.py)よりも "売り込み感" を抑えた、コンテンツ寄りの
フィード投稿画像を生成する。

- サイズ: 4:5 (1080 x 1350)  ※フィード推奨
- 5テンプレ: イントロ / MBTIあるある / 干支×MBTI / レアキャラ図鑑 / 相性ネタ
- ブランド・装飾・フォントは make_instagram_ads.py の資産を再利用
- カルーセル表紙には「→ スワイプ」ヒント、下部に控えめなブランド＋導線

実行:
    python make_ig_posts.py
"""
from pathlib import Path
from PIL import ImageDraw

import make_instagram_ads as M  # 既存のヘルパー・カラー・フォントを流用

BASE = Path(__file__).resolve().parent
OUT = BASE / "assets" / "posts"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1350
TOP, BOTTOM = 96, 116

# ラベル色（カテゴリ別のアクセント）
LABEL_COLORS = {
    "intro": M.CTA_FILL,
    "aruaru": (255, 150, 90),
    "eto": (150, 110, 200),
    "rare": (232, 53, 140),
    "aisho": (255, 111, 179),
}

POSTS = [
    {
        "key": "01_intro",
        "cat": "intro",
        "label": "はじめまして ♡",
        "headline": ["生まれた日でわかる", "あなたの", "《運命キャラ》"],
        "sub": "MBTI × 干支 ＝ 192タイプの無料診断",
        "chars": [("rare_legendary_angelpoodle.png", 1.0, 0.0)],
        "footer": "プロフィールのリンクから 無料で診断できるよ",
        "swipe": False,
    },
    {
        "key": "02_aruaru",
        "cat": "aruaru",
        "label": "MBTI別あるある",
        "headline": ["“好き”が", "バレちゃう瞬間"],
        "sub": "あなたの型は…？ 続きはスワイプ →",
        "chars": [
            ("unmei_infp_purplerabbit_moon.png", 0.92, -0.24),
            ("unmei_enfp_squirrel_rainbow.png", 0.92, 0.24),
        ],
        "footer": "自分の型をコメントで教えてね ♡",
        "swipe": True,
    },
    {
        "key": "03_eto",
        "cat": "eto",
        "label": "干支 × MBTI",
        "headline": ["同じMBTIでも", "干支で運命が", "変わる…？"],
        "sub": "16タイプ × 干支12種 ＝ 192の運命キャラ",
        "chars": [
            ("unmei_estj_tiger.png", 0.86, -0.26),
            ("unmei_istj_shibainu.png", 0.80, 0.26),
        ],
        "footer": "あなたの組み合わせは？ リンクから診断 ♡",
        "swipe": False,
    },
    {
        "key": "04_rare",
        "cat": "rare",
        "label": "隠れレアキャラ図鑑",
        "headline": ["出現率わずか1%", "レアキャラ 全4体"],
        "sub": "引けたらスクショして自慢しよう",
        "chars": [
            ("rare_legendary_angelpoodle.png", 0.54, -0.345),
            ("rare_bloodline_goldrabbit.png", 0.48, -0.115),
            ("rare_cursed_purplerabbit.png", 0.50, 0.115),
            ("rare_blank_whitecat.png", 0.48, 0.345),
        ],
        "footer": "あなたは引ける？ プロフィールのリンクから",
        "swipe": False,
    },
    {
        "key": "05_aisho",
        "cat": "aisho",
        "label": "相性がいいのは？",
        "headline": ["ふたりの相性", "何点だと思う？"],
        "sub": "MBTI×干支×レアで 100点満点 採点",
        "chars": [
            ("unmei_enfj_bear_heart.png", 0.90, -0.25),
            ("unmei_infj_unicorn_pink.png", 0.90, 0.25),
        ],
        "footer": "気になるあの人と試してみて",
        "swipe": False,
    },
]


def compose(post):
    canvas = M.gradient_bg(W, H)
    M.scatter_decor(canvas, W, H, TOP, BOTTOM)
    d = ImageDraw.Draw(canvas)
    cx = W / 2
    accent = LABEL_COLORS[post["cat"]]

    # --- 上部カテゴリラベル(ピル) ---
    y = TOP
    lf = M.font(34)
    lh = M.pill(d, cx, y + M.text_size(lf, post["label"])[1] / 2 + 20, post["label"], lf,
                fill=accent, text_fill=M.WHITE, pad_x=40, pad_y=18,
                border=M.WHITE, border_w=5, shadow=(0, 0, 0, 40))
    y += lh + 40

    # --- 見出し(自動フィット・複数行) ---
    for line in post["headline"]:
        f = M.fit_font(line, W - 120, 96)
        hh = M.draw_center(d, cx, y, line, f, M.MAGENTA, bold=2,
                           shadow=M.MAGENTA_SH, shadow_off=(0, 5))
        y += hh + 14
    y += 16

    # --- フッター位置を先に確保 ---
    footer_f = M.font(30)
    footer_y = H - BOTTOM
    # サブ文
    sub_f = M.font(36)
    sub_h = M.text_size(sub_f, post["sub"])[1]

    # --- キャラ帯 ---
    band_top = y
    band_bot = footer_y - 40 - sub_h - 44
    band_cy = band_top + (band_bot - band_top) * 0.46
    band_h = band_bot - band_top
    base_h = min(560, band_h * 0.98)
    for fname, scale, off in post["chars"]:
        ch = M.load_char(fname, int(base_h * scale))
        M.paste_center(canvas, ch, cx + off * W, band_cy)
    d = ImageDraw.Draw(canvas)

    # 相性は中央にハート
    if post["cat"] == "aisho":
        M.draw_heart(d, cx, band_cy, base_h * 0.15, M.PINK)
        M.draw_heart(d, cx, band_cy, base_h * 0.15 - 7, M.WHITE)
        M.draw_heart(d, cx, band_cy, base_h * 0.10, M.PINK)

    # --- サブ文 ---
    M.draw_center(d, cx, band_bot + 12, post["sub"], sub_f, M.INK, bold=1)

    # --- スワイプヒント(カルーセル表紙) ---
    if post.get("swipe"):
        sw_f = M.font(30)
        M.pill(d, W - 150, band_top + 30, "→", M.font(40),
               fill=(255, 255, 255, 230), text_fill=accent,
               pad_x=22, pad_y=14, border=accent, border_w=4)

    # --- フッター(控えめなブランド＋導線) ---
    M.draw_heart(d, cx - M.text_size(footer_f, post["footer"])[0] / 2 - 26,
                 footer_y + M.text_size(footer_f, "あ")[1] / 2, 12, M.PINK)
    M.draw_center(d, cx, footer_y, post["footer"], footer_f, M.PURPLE)
    # 最下部の極小ブランド
    bf = M.font(24)
    M.draw_center(d, cx, footer_y + 42, "運命図鑑ウンメイ ｜ MBTI × 干支 占い", bf, (190, 160, 205))

    return canvas.convert("RGB")


def main():
    n = 0
    for post in POSTS:
        img = compose(post)
        name = f"post_{post['key']}.png"
        img.save(OUT / name, "PNG", optimize=True)
        img.save(OUT / name.replace(".png", ".jpg"), "JPEG", quality=90, optimize=True)
        print(f"  -> {name}  ({(OUT / name).stat().st_size // 1024}KB)")
        n += 1
    print(f"[OK] {n} posts -> {OUT}")


if __name__ == "__main__":
    main()
