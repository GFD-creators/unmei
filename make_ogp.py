"""
OGP バナー画像生成 (1200×630)
- LINE / X / Discord 等でURLシェア時に表示される横長プレビュー
- 左にキャラ集合 + 右にタイトル & タグライン & CTA
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = Path(r"C:\Users\kkaji\Desktop\サイト作成\unmei-v15.1")
CHARS = BASE / "assets" / "chars"
OUT = BASE / "assets" / "og"
OUT.mkdir(parents=True, exist_ok=True)

# 日本語フォント (Yu Gothic Bold / Noto Sans JP)
FONT_BOLD_PATH = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_REG_PATH  = r"C:\Windows\Fonts\YuGothR.ttc"
FONT_NOTO_PATH = r"C:\Windows\Fonts\NotoSansJP-VF.ttf"

W, H = 1200, 630


def gradient_bg():
    """ピンクのグラデ + ドットパターン"""
    img = Image.new("RGBA", (W, H), (255, 245, 250, 255))
    # 縦グラデ
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        ratio = y / H
        r = int(255 * (1 - ratio * 0.05))
        g = int(245 - 30 * ratio)
        b = int(250 - 10 * ratio)
        gd.line([(0, y), (W, y)], fill=(r, g, b, 255))
    img = Image.alpha_composite(img, grad)
    # ドットパターン
    dot = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dot)
    for x in range(20, W, 36):
        for y in range(20, H, 36):
            dd.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(255, 143, 196, 60))
    img = Image.alpha_composite(img, dot)
    return img


def paste_centered(canvas, img, cx, cy):
    """中心座標 cx, cy に img を貼り付け"""
    w, h = img.size
    canvas.paste(img, (int(cx - w / 2), int(cy - h / 2)), img)


def round_rect_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def circle_avatar(char_path, size):
    """キャラ画像を白縁の円形アバターに"""
    char = Image.open(char_path).convert("RGBA")
    char = char.resize((size, size), Image.LANCZOS)
    # 円形マスク
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    # 白背景円
    bg = Image.new("RGBA", (size + 16, size + 16), (255, 255, 255, 255))
    bgmask = Image.new("L", (size + 16, size + 16), 0)
    ImageDraw.Draw(bgmask).ellipse((0, 0, size + 16, size + 16), fill=255)
    bg.putalpha(bgmask)
    # 縁取り (ピンク)
    border = Image.new("RGBA", (size + 16, size + 16), (0, 0, 0, 0))
    ImageDraw.Draw(border).ellipse((0, 0, size + 16, size + 16),
                                    outline=(255, 143, 196, 255), width=4)
    # 合成
    out = Image.new("RGBA", (size + 16, size + 16), (0, 0, 0, 0))
    out.paste(bg, (0, 0), bgmask)
    # キャラを白背景の中心に
    out.paste(char, (8, 8), char)
    out.paste(border, (0, 0), border)
    return out


def main():
    canvas = gradient_bg()

    # === 左側: キャラ集合 ===
    # メインに天使プードル、周りに4キャラ
    main_char_path = CHARS / "rare_legendary_angelpoodle.png"
    main_char = Image.open(main_char_path).convert("RGBA")
    main_char = main_char.resize((360, 360), Image.LANCZOS)
    paste_centered(canvas, main_char, 280, H // 2)

    # 周りに小キャラ (左上、左下、右上、右下)
    side_chars = [
        ("unmei_enfp_squirrel_rainbow.png", 120, 130, 130),   # 左上
        ("unmei_infp_purplerabbit_moon.png", 130, 130, H - 130),  # 左下
        ("unmei_intj_blackcat_reading.png", 130, 520, 110),       # 中上
        ("unmei_infj_unicorn_pink.png", 130, 510, H - 100),       # 中下
    ]
    for fname, sz, cx, cy in side_chars:
        path = CHARS / fname
        ch = Image.open(path).convert("RGBA")
        ch = ch.resize((sz, sz), Image.LANCZOS)
        paste_centered(canvas, ch, cx, cy)

    # === 右側: テキスト ===
    draw = ImageDraw.Draw(canvas)

    # タイトル 「運命図鑑」(大きく)
    try:
        font_title = ImageFont.truetype(FONT_BOLD_PATH, 110)
    except:
        font_title = ImageFont.truetype(FONT_NOTO_PATH, 110)
    title = "運命図鑑"
    # 影
    draw.text((640, 110), title, font=font_title, fill=(255, 143, 196, 150))
    draw.text((636, 106), title, font=font_title, fill=(232, 53, 140, 255))

    # サブ 「U N M E I」
    try:
        font_sub = ImageFont.truetype(FONT_BOLD_PATH, 38)
    except:
        font_sub = ImageFont.truetype(FONT_NOTO_PATH, 38)
    draw.text((642, 240), "U  N  M  E  I", font=font_sub, fill=(176, 139, 196, 255))

    # タグライン
    try:
        font_tag = ImageFont.truetype(FONT_BOLD_PATH, 32)
    except:
        font_tag = ImageFont.truetype(FONT_NOTO_PATH, 32)
    draw.text((640, 320), "あなたの 生まれた日に", font=font_tag, fill=(74, 44, 92, 255))
    draw.text((640, 365), "きざまれた 運命の しるし", font=font_tag, fill=(74, 44, 92, 255))

    # CTA ピル
    cta_y = 460
    cta_w = 450
    cta_h = 80
    cta_x = 640
    # 影
    draw.rounded_rectangle((cta_x + 4, cta_y + 6, cta_x + cta_w + 4, cta_y + cta_h + 6),
                           radius=40, fill=(232, 53, 140, 100))
    # ピンクピル
    draw.rounded_rectangle((cta_x, cta_y, cta_x + cta_w, cta_y + cta_h),
                           radius=40, fill=(255, 111, 179, 255), outline=(255, 255, 255, 255), width=4)
    # CTAテキスト
    try:
        font_cta = ImageFont.truetype(FONT_BOLD_PATH, 32)
    except:
        font_cta = ImageFont.truetype(FONT_NOTO_PATH, 32)
    cta_text = "▼ いまここで 占ってみる ♡"
    bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cta_x + (cta_w - tw) / 2, cta_y + (cta_h - th) / 2 - 4),
              cta_text, font=font_cta, fill=(255, 255, 255, 255))

    # 装飾の星・ハート (PIL のポリゴンで描画 — フォント依存ナシ)
    def draw_star(d, cx, cy, r, fill):
        import math
        pts = []
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5
            rad = r if i % 2 == 0 else r * 0.42
            pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
        d.polygon(pts, fill=fill + (255,))

    def draw_heart(d, cx, cy, r, fill):
        # シンプルなハート: 2円+三角形
        d.ellipse((cx - r, cy - r * 0.8, cx, cy + r * 0.2), fill=fill + (255,))
        d.ellipse((cx, cy - r * 0.8, cx + r, cy + r * 0.2), fill=fill + (255,))
        d.polygon([(cx - r, cy - r * 0.05), (cx + r, cy - r * 0.05), (cx, cy + r)],
                  fill=fill + (255,))

    def draw_sparkle(d, cx, cy, r, fill):
        # 4方向の細長いひし形 = ✦
        for ang_deg in [0, 90]:
            import math
            ang = math.radians(ang_deg)
            dx, dy = math.cos(ang) * r, math.sin(ang) * r
            px = math.cos(ang + math.pi / 2) * r * 0.25
            py = math.sin(ang + math.pi / 2) * r * 0.25
            d.polygon([(cx + dx, cy + dy), (cx + px, cy + py),
                       (cx - dx, cy - dy), (cx - px, cy - py)], fill=fill + (255,))

    # 大きめ装飾4隅
    draw_star(draw, 70, 70, 25, (255, 217, 61))
    draw_sparkle(draw, W - 70, 80, 22, (196, 181, 253))
    draw_heart(draw, W - 90, H - 90, 22, (255, 111, 179))
    draw_star(draw, 80, H - 90, 20, (255, 217, 61))

    # 小さめサブ装飾
    draw_heart(draw, 920, 110, 14, (255, 143, 196))
    draw_sparkle(draw, 1100, 350, 18, (255, 217, 61))
    draw_sparkle(draw, 580, 200, 12, (196, 181, 253))

    # 出力
    out_path = OUT / "ogp.png"
    canvas.convert("RGB").save(out_path, "JPEG", quality=88, optimize=True)
    # JPEG版（小さい）
    out_jpg = OUT / "ogp.jpg"
    canvas.convert("RGB").save(out_jpg, "JPEG", quality=88, optimize=True)
    # PNG版（高品質）
    canvas.save(OUT / "ogp.png", "PNG", optimize=True)

    print(f"  -> ogp.png  ({(OUT / 'ogp.png').stat().st_size // 1024}KB)")
    print(f"  -> ogp.jpg  ({(OUT / 'ogp.jpg').stat().st_size // 1024}KB)")


if __name__ == "__main__":
    main()
