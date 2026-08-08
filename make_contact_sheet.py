# -*- coding: utf-8 -*-
"""
コンタクトシート生成
====================
モックアップ6枚(プロフィール＋フィード投稿5枚)を1枚に並べた
「Instagramモック一覧」画像を作る。検証チャット等に貼りやすい形。

出力: assets/mockups/contact_sheet.png

実行:
    python make_contact_sheet.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

import make_instagram_ads as M

BASE = Path(__file__).resolve().parent
MOCK = BASE / "assets" / "mockups"

BG = (244, 244, 247)
CARD_BORDER = (220, 220, 224)
INK = (38, 38, 38)
SUB = (120, 120, 128)

ITEMS = [
    ("mockup_profile.png", "プロフィール画面"),
    ("mockup_01_intro.png", "① イントロ（固定投稿）"),
    ("mockup_02_aruaru.png", "② あるある（カルーセル）"),
    ("mockup_03_eto.png", "③ 干支 × MBTI"),
    ("mockup_04_rare.png", "④ レアキャラ図鑑"),
    ("mockup_05_aisho.png", "⑤ 相性チェック"),
]

TILE_W = 640
GAP = 46
COLS = 3
HEADER_H = 200
LABEL_H = 68


def main():
    # 画像を読み込み・縮小
    imgs = []
    for fn, label in ITEMS:
        im = Image.open(MOCK / fn).convert("RGB")
        r = TILE_W / im.width
        im = im.resize((TILE_W, int(im.height * r)), Image.LANCZOS)
        imgs.append((im, label))

    rows = (len(imgs) + COLS - 1) // COLS
    # 行ごとの最大高さ
    row_h = []
    for rr in range(rows):
        hs = [imgs[i][0].height for i in range(rr * COLS, min((rr + 1) * COLS, len(imgs)))]
        row_h.append(max(hs))

    W = COLS * TILE_W + (COLS + 1) * GAP
    H = HEADER_H + sum(row_h) + rows * (LABEL_H + GAP) + GAP
    canvas = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(canvas)

    # ===== ヘッダ =====
    title = "運命図鑑ウンメイ ｜ Instagram モック一覧"
    tf = M.font(56)
    tw = M.text_size(tf, title)[0]
    d.text((W / 2 - tw / 2, 52), title, font=tf, fill=M.MAGENTA)
    sub = "実際のInstagram表示を再現したモックアップ（＋広告クリエイティブ12点は別途）"
    sf = M.font(32)
    sw = M.text_size(sf, sub)[0]
    d.text((W / 2 - sw / 2, 126), sub, font=sf, fill=SUB)

    # ===== タイル配置 =====
    lf = M.font(34)
    y = HEADER_H
    for rr in range(rows):
        x = GAP
        for cc in range(COLS):
            idx = rr * COLS + cc
            if idx >= len(imgs):
                break
            im, label = imgs[idx]
            # 影
            d.rounded_rectangle((x + 5, y + 6, x + TILE_W + 5, y + im.height + 6),
                                radius=18, fill=(228, 228, 232))
            canvas.paste(im, (x, y))
            d.rounded_rectangle((x, y, x + TILE_W, y + im.height),
                                radius=18, outline=CARD_BORDER, width=2)
            # ラベル
            lw = M.text_size(lf, label)[0]
            d.text((x + TILE_W / 2 - lw / 2, y + im.height + 18), label, font=lf, fill=INK)
            x += TILE_W + GAP
        y += row_h[rr] + LABEL_H + GAP

    canvas.save(MOCK / "contact_sheet.png", "PNG", optimize=True)
    canvas.save(MOCK / "contact_sheet.jpg", "JPEG", quality=88, optimize=True)
    kb = (MOCK / "contact_sheet.jpg").stat().st_size // 1024
    print(f"  -> contact_sheet.png / .jpg  ({canvas.size[0]}x{canvas.size[1]}, jpg {kb}KB)")


if __name__ == "__main__":
    main()
