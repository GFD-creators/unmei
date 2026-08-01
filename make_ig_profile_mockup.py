# -*- coding: utf-8 -*-
"""
Instagram プロフィール画面モックアップ生成
==========================================
アイコン・統計・bio・ハイライト・投稿グリッド(3x3)を含む
Instagramプロフィール画面のプレビュー画像を作る。

- ライトモード・端末幅1080基準
- アバター/ハイライトはキャラ画像をトリミング
- グリッドは posts/ads の画像を正方形にセンタークロップ
- 出力: assets/mockups/

実行:
    python make_ig_profile_mockup.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

import make_instagram_ads as M

BASE = Path(__file__).resolve().parent
CHARS = BASE / "assets" / "chars"
POSTS = BASE / "assets" / "posts"
ADS = BASE / "assets" / "ads"
OUT = BASE / "assets" / "mockups"
OUT.mkdir(parents=True, exist_ok=True)

W = 1080
INK = (38, 38, 38)
GRAY = (142, 142, 142)
BLUE = (0, 55, 107)        # Instagramのリンク色(濃紺寄り)
LINKBLUE = (0, 111, 214)
BTN_BLUE = (0, 149, 246)
BTN_GRAY = (239, 239, 239)
WHITE = (255, 255, 255)
LINE = (219, 219, 219)


def circle_crop(path, size, ring=None, face=True):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    if face:
        box = (int(w * 0.20), int(h * 0.08), int(w * 0.80), int(h * 0.68))
    else:
        s = min(w, h)
        box = ((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2)
    crop = im.crop(box).resize((size, size), Image.LANCZOS)
    base = Image.new("RGBA", (size, size), WHITE)
    base.alpha_composite(crop)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    base.putalpha(mask)
    return base


def square_crop(path, size):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    s = min(w, h)
    box = ((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2)
    return im.crop(box).resize((size, size), Image.LANCZOS)


def hamburger(d, x, y, s, color):
    for i in range(3):
        d.line([(x, y + i * 12), (x + s, y + i * 12)], fill=color, width=6)


def plus_box(d, cx, cy, s, color):
    d.rounded_rectangle((cx - s, cy - s, cx + s, cy + s), radius=8, outline=color, width=6)
    d.line([(cx - s * 0.5, cy), (cx + s * 0.5, cy)], fill=color, width=6)
    d.line([(cx, cy - s * 0.5), (cx, cy + s * 0.5)], fill=color, width=6)


def icon_grid(d, cx, cy, s, color):
    step = s * 2 / 3
    for i in range(3):
        for j in range(3):
            x = cx - s + j * step
            y = cy - s + i * step
            d.rectangle((x, y, x + step - 6, y + step - 6), outline=color, width=4)


def icon_reels(d, cx, cy, s, color):
    d.rounded_rectangle((cx - s, cy - s, cx + s, cy + s), radius=10, outline=color, width=5)
    d.line([(cx - s, cy - s * 0.3), (cx + s, cy - s * 0.3)], fill=color, width=4)
    d.polygon([(cx - s * 0.2, cy - s * 0.05), (cx - s * 0.2, cy + s * 0.5),
               (cx + s * 0.3, cy + s * 0.22)], fill=color)


def icon_tagged(d, cx, cy, s, color):
    d.rounded_rectangle((cx - s, cy - s, cx + s, cy + s), radius=10, outline=color, width=5)
    d.ellipse((cx - s * 0.28, cy - s * 0.55, cx + s * 0.28, cy + s * 0.0), outline=color, width=5)
    d.arc((cx - s * 0.55, cy - s * 0.1, cx + s * 0.55, cy + s * 0.9), 200, 340, fill=color, width=5)


def build():
    # 概算の高さで大きめキャンバスを作り、最後にトリミング
    canvas = Image.new("RGB", (W, 2400), WHITE)
    d = ImageDraw.Draw(canvas)
    f_name = M.font(44)
    f_num = M.font(46)
    f_lbl = M.font(30)
    f_body = M.font(34)
    f_btn = M.font(36)
    f_hl = M.font(28)

    # ===== トップバー =====
    d.text((40, 40), "unmei_uranai", font=M.font(48), fill=INK)
    # ⌄
    d.line([(430, 62), (446, 78)], fill=INK, width=6)
    d.line([(446, 78), (462, 62)], fill=INK, width=6)
    plus_box(d, W - 150, 62, 26, INK)
    hamburger(d, W - 90, 46, 46, INK)

    # ===== ヘッダ(アバター + 統計) =====
    top = 150
    av = 200
    avatar = circle_crop(CHARS / "rare_legendary_angelpoodle.png", av)
    ring_pad = 8
    d.ellipse((60 - ring_pad, top - ring_pad, 60 + av + ring_pad, top + av + ring_pad),
              outline=M.CTA_FILL, width=6)
    canvas.paste(avatar, (60, top), avatar)

    stats = [("9", "投稿"), ("8,742", "フォロワー"), ("15", "フォロー")]
    sx0 = 330
    col_w = (W - sx0 - 40) / 3
    for i, (num, lbl) in enumerate(stats):
        cxx = sx0 + col_w * i + col_w / 2
        nw = M.text_size(f_num, num)[0]
        d.text((cxx - nw / 2, top + 40), num, font=f_num, fill=INK)
        lw = M.text_size(f_lbl, lbl)[0]
        d.text((cxx - lw / 2, top + 100), lbl, font=f_lbl, fill=INK)

    # ===== 表示名・カテゴリ・bio・リンク =====
    y = top + av + 30
    d.text((60, y), "運命図鑑ウンメイ｜MBTI×干支占い", font=f_name, fill=INK)
    y += 58
    d.text((60, y), "エンタメ・ウェブサイト", font=f_body, fill=GRAY)
    y += 54
    bio = [
        "生まれた日でわかる“運命キャラ”🐰",
        "MBTI × 干支 = 192タイプを無料診断",
        "相性・全国ランキング・レアキャラも♡",
    ]
    # 絵文字tofu回避: 絵文字は落として描画
    bio_clean = [
        "生まれた日でわかる“運命キャラ”",
        "MBTI × 干支 = 192タイプを無料診断",
        "相性・全国ランキング・レアキャラも ♡",
    ]
    for line in bio_clean:
        d.text((60, y), line, font=f_body, fill=INK)
        y += 50
    # リンク(小さな地球アイコン + URL)
    y += 6
    gx, gy = 74, y + 20
    d.ellipse((gx - 16, gy - 16, gx + 16, gy + 16), outline=LINKBLUE, width=4)
    d.line([(gx - 16, gy), (gx + 16, gy)], fill=LINKBLUE, width=3)
    d.arc((gx - 8, gy - 16, gx + 8, gy + 16), 0, 360, fill=LINKBLUE, width=3)
    d.text((104, y), "gfd-creators.github.io/unmei", font=f_body, fill=LINKBLUE)
    y += 70

    # ===== ボタン(フォローする / メッセージ / ▾) =====
    bh = 76
    gap = 16
    small = 80
    bw = (W - 120 - gap * 2 - small) / 2
    bx = 60
    d.rounded_rectangle((bx, y, bx + bw, y + bh), radius=12, fill=BTN_BLUE)
    t = "フォローする"
    tw = M.text_size(f_btn, t)[0]
    d.text((bx + bw / 2 - tw / 2, y + bh / 2 - 22), t, font=f_btn, fill=WHITE)
    bx += bw + gap
    d.rounded_rectangle((bx, y, bx + bw, y + bh), radius=12, fill=BTN_GRAY)
    t = "メッセージ"
    tw = M.text_size(f_btn, t)[0]
    d.text((bx + bw / 2 - tw / 2, y + bh / 2 - 22), t, font=f_btn, fill=INK)
    bx += bw + gap
    d.rounded_rectangle((bx, y, bx + small, y + bh), radius=12, fill=BTN_GRAY)
    d.line([(bx + small / 2 - 12, y + bh / 2 - 6), (bx + small / 2, y + bh / 2 + 8)], fill=INK, width=5)
    d.line([(bx + small / 2, y + bh / 2 + 8), (bx + small / 2 + 12, y + bh / 2 - 6)], fill=INK, width=5)
    y += bh + 44

    # ===== ハイライト =====
    hls = [
        ("rare_legendary_angelpoodle.png", "診断してみた"),
        ("rare_bloodline_goldrabbit.png", "レアキャラ"),
        ("unmei_enfj_bear_heart.png", "相性"),
        ("unmei_infj_unicorn_pink.png", "つかいかた"),
    ]
    hsize = 150
    hx0 = 60
    hstep = 176
    for i, (fn, label) in enumerate(hls):
        cx = hx0 + hstep * i
        cover = circle_crop(CHARS / fn, hsize)
        d.ellipse((cx - 6, y - 6, cx + hsize + 6, y + hsize + 6), outline=LINE, width=4)
        canvas.paste(cover, (cx, y), cover)
        lw = M.text_size(f_hl, label)[0]
        d.text((cx + hsize / 2 - lw / 2, y + hsize + 14), label, font=f_hl, fill=INK)
    y += hsize + 70

    # ===== タブ =====
    d.line([(0, y), (W, y)], fill=LINE, width=3)
    ty = y + 46
    icon_grid(d, W / 6, ty, 26, INK)
    icon_reels(d, W / 2, ty, 28, GRAY)
    icon_tagged(d, W * 5 / 6, ty, 28, GRAY)
    # 選択下線(グリッド)
    d.line([(W / 6 - 60, y + 92), (W / 6 + 60, y + 92)], fill=INK, width=5)
    y += 100

    # ===== 投稿グリッド(3x3) =====
    tiles = [
        (POSTS, "post_01_intro.jpg"),
        (ADS, "ad_02_rare_1x1.jpg"),
        (POSTS, "post_05_aisho.jpg"),
        (POSTS, "post_03_eto.jpg"),
        (ADS, "ad_04_ranking_1x1.jpg"),
        (POSTS, "post_02_aruaru.jpg"),
        (ADS, "ad_03_aisho_1x1.jpg"),
        (POSTS, "post_04_rare.jpg"),
        (ADS, "ad_01_hook_1x1.jpg"),
    ]
    g = 6
    tile = (W - g * 2) // 3
    for idx, (folder, fn) in enumerate(tiles):
        r, c = divmod(idx, 3)
        x = c * (tile + g)
        yy = y + r * (tile + g)
        canvas.paste(square_crop(folder / fn, tile), (x, yy))
    y += tile * 3 + g * 2 + 20

    return canvas.crop((0, 0, W, y))


def main():
    img = build()
    img.save(OUT / "mockup_profile.png", "PNG", optimize=True)
    img.save(OUT / "mockup_profile.jpg", "JPEG", quality=90, optimize=True)
    print(f"  -> mockup_profile.png  ({(OUT / 'mockup_profile.png').stat().st_size // 1024}KB, {img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
