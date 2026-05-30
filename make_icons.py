"""
PWA アイコン生成
- 天使プードル (rare_legendary) をピンクグラデ円背景に配置
- 192x192 / 512x512 / maskable 512x512 の3枚
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

BASE = Path(r"C:\Users\kkaji\Desktop\サイト作成\unmei-v15.1")
SRC_CHAR = BASE / "assets" / "chars" / "rare_legendary_angelpoodle.png"
OUT_DIR = BASE / "assets" / "icons"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ピンクグラデーション背景作成
def make_bg(size, radius_ratio=0.22):
    """ピンクのスクエア背景 + 角丸"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # グラデ風（外側ピンク濃→内側薄）を radial で
    bg = Image.new("RGBA", (size, size), (255, 196, 221, 255))
    # 中央に明るい円
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    cx = cy = size // 2
    for r in range(int(size * 0.55), 0, -2):
        alpha = int(40 * (1 - r / (size * 0.55)))
        od.ellipse((cx - r, cy - r, cx + r, cy + r),
                   fill=(255, 245, 250, alpha))
    bg = Image.alpha_composite(bg, overlay)

    # 角丸マスク
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    radius = int(size * radius_ratio)
    md.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    img.paste(bg, (0, 0), mask)
    return img


def make_icon(size, char_scale=0.78, padding_for_mask=0):
    """size x size のアイコンを生成。padding_for_mask は maskable 用に内側余白"""
    bg = make_bg(size)
    # キャラ画像
    char = Image.open(SRC_CHAR).convert("RGBA")
    # スケーリング
    char_size = int(size * char_scale)
    char = char.resize((char_size, char_size), Image.LANCZOS)
    cx = (size - char_size) // 2
    cy = (size - char_size) // 2 + int(size * 0.02)  # わずかに下げる
    bg.paste(char, (cx, cy), char)

    # キラキラ装飾（小さな白星）
    draw = ImageDraw.Draw(bg)
    for x, y, r in [(0.15, 0.18, 0.025), (0.85, 0.20, 0.022),
                     (0.10, 0.75, 0.020), (0.88, 0.70, 0.025)]:
        cx_ = int(x * size); cy_ = int(y * size); rr = int(r * size)
        draw.ellipse((cx_ - rr, cy_ - rr, cx_ + rr, cy_ + rr),
                     fill=(255, 217, 61, 220))

    return bg


def make_maskable(size):
    """maskable icon: 中央 80% が safe zone なので、キャラを少し小さく配置"""
    # フチに余白を取った正方形（全画素ピンク塗り）
    bg = Image.new("RGBA", (size, size), (255, 196, 221, 255))
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    cx = cy = size // 2
    for r in range(int(size * 0.55), 0, -2):
        alpha = int(40 * (1 - r / (size * 0.55)))
        od.ellipse((cx - r, cy - r, cx + r, cy + r),
                   fill=(255, 245, 250, alpha))
    bg = Image.alpha_composite(bg, overlay)

    # キャラはやや小さめ（外側10%は切られる可能性あるため）
    char = Image.open(SRC_CHAR).convert("RGBA")
    char_size = int(size * 0.62)
    char = char.resize((char_size, char_size), Image.LANCZOS)
    cx = (size - char_size) // 2
    cy = (size - char_size) // 2
    bg.paste(char, (cx, cy), char)

    return bg


def main():
    sizes_standard = [192, 512]
    for s in sizes_standard:
        icon = make_icon(s)
        out = OUT_DIR / f"icon-{s}.png"
        icon.save(out, "PNG", optimize=True)
        print(f"  -> {out.name} ({out.stat().st_size // 1024}KB)")

    # maskable 512
    icon_mask = make_maskable(512)
    out = OUT_DIR / "icon-maskable-512.png"
    icon_mask.save(out, "PNG", optimize=True)
    print(f"  -> {out.name} ({out.stat().st_size // 1024}KB)")

    # apple-touch-icon (iOS用 180x180)
    icon_180 = make_icon(180)
    out = OUT_DIR / "apple-touch-icon.png"
    icon_180.save(out, "PNG", optimize=True)
    print(f"  -> {out.name} ({out.stat().st_size // 1024}KB)")

    # favicon-32 (タブ用)
    icon_32 = make_icon(64).resize((32, 32), Image.LANCZOS)
    out = OUT_DIR / "favicon-32.png"
    icon_32.save(out, "PNG", optimize=True)
    print(f"  -> {out.name} ({out.stat().st_size // 1024}KB)")

    print(f"\n=== icons written to {OUT_DIR} ===")


if __name__ == "__main__":
    main()
