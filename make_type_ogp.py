# -*- coding: utf-8 -*-
"""
タイプ別 OGP 画像生成 (1200×630)
================================
192タイプ(MBTI×干支) + 16タイプ(MBTI単体) それぞれ固有のOGP画像を作る。

なぜ必要か:
  現状 209枚のタイプページが全て共通の ogp.png を参照しており、X/LINE等で
  結果リンクをシェアしても全員同じカードが出る。バイラルの一番おいしい所
  (シェアされた瞬間のクリック率)を捨てている状態。個別カードにして解消する。

設計:
  - ブランド(ゆめかわピンク)は固定 = キャラIPの一貫性が"堀"なので崩さない
  - 「誰の結果か」が一目で分かる: キャラ / タイプ名 / MBTI+干支 / 自慢できる偏差値
  - ranking.js の tier 設計(不安照ケア原則)を尊重し、
    全国順位を明示するのは top/high tier のみ。mid はキャッチコピーで見せる
  - 画像内テキストに絵文字は使わない(フォントに絵文字グリフが無いため)

前提: 先に `node dump_type_data.js` を実行して _data.json を作っておく

使い方:
    python make_type_ogp.py --sample   # サンプル4枚だけ生成(デザイン確認用)
    python make_type_ogp.py            # 全208枚を生成
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw

import make_instagram_ads as M

BASE = Path(__file__).resolve().parent
OUT = BASE / "assets" / "og" / "types"
DATA = OUT / "_data.json"

W, H = 1200, 630


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _luminance(rgb):
    """相対輝度 (WCAG)"""
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def readable(rgb, min_contrast=3.2):
    """
    白背景/白文字に対して薄すぎるキャラ色(例: INTPのシルバー #b0b8c4)は
    そのまま使うと文字が読めないので、コントラスト比を満たすまで暗くする。
    ブランドの色みは保ったまま明度だけ落とす。
    """
    def contrast(c):
        l = _luminance(c)
        return (1.05) / (l + 0.05)   # 白(輝度1.0)との比

    out = tuple(rgb)
    for _ in range(24):
        if contrast(out) >= min_contrast:
            break
        out = tuple(max(0, int(c * 0.9)) for c in out)
    return out


def fmt_top(p):
    """上位◯% の表記（1未満は小数1桁）"""
    return f"{p:.1f}%" if p < 10 else f"{round(p)}%"


def load_char(rel_path, target_h):
    im = Image.open(BASE / rel_path).convert("RGBA")
    r = target_h / im.height
    return im.resize((int(im.width * r), target_h), Image.LANCZOS)


def split_name(name):
    """『さみしがりの ものしりねこ』を2行に割る（スペース区切り優先）"""
    if " " in name:
        a, b = name.split(" ", 1)
        return [a, b]
    if len(name) > 8:
        mid = len(name) // 2
        return [name[:mid], name[mid:]]
    return [name]


def compose(t, is_mbti_only=False):
    canvas = M.gradient_bg(W, H)
    d = ImageDraw.Draw(canvas)
    accent = readable(hex2rgb(t.get("color", "#e8358c")))

    # 装飾（控えめに四隅）
    M.draw_star(d, 46, 52, 20, M.GOLD)
    M.draw_sparkle(d, W - 52, 60, 18, M.LILAC)
    M.draw_heart(d, W - 60, H - 58, 15, M.PINK)
    M.draw_star(d, 54, H - 56, 16, M.GOLD)

    # ---- 左: キャラ ----
    ch = load_char(t["img"], 430)
    M.paste_center(canvas, ch, 262, H / 2 + 6)
    d = ImageDraw.Draw(canvas)

    # ---- 右: テキスト ----
    x0 = 520
    col_w = W - x0 - 56

    y = 74
    # バッジ: MBTI / 干支
    bf = M.font(30)
    badge = t["mbti"]
    bw = M.text_size(bf, badge)[0] + 52
    d.rounded_rectangle((x0, y, x0 + bw, y + 54), radius=27, fill=accent)
    d.text((x0 + 26, y + 27 - M.text_size(bf, badge)[1] / 2 - 2), badge, font=bf, fill=M.WHITE)

    if not is_mbti_only:
        zbadge = f"{t['zodiac']}年（{t['zodiacYomi']}）"
        zw = M.text_size(bf, zbadge)[0] + 52
        zx = x0 + bw + 14
        d.rounded_rectangle((zx, y, zx + zw, y + 54), radius=27,
                            fill=(255, 255, 255, 240), outline=accent, width=4)
        d.text((zx + 26, y + 27 - M.text_size(bf, zbadge)[1] / 2 - 2), zbadge, font=bf, fill=accent)
    y += 54 + 26

    # タイプ名（大きく・2行まで）
    for line in split_name(t["name"]):
        f = M.fit_font(line, col_w, 68, min_size=40)
        h = M.draw_center(d, x0 + col_w / 2, y, line, f, M.MAGENTA, bold=2,
                          shadow=M.MAGENTA_SH, shadow_off=(0, 4))
        y += h + 12
    y += 10

    # キャッチコピー
    cf = M.fit_font(t["catch"], col_w, 34, min_size=24)
    M.draw_center(d, x0 + col_w / 2, y, t["catch"], cf, M.INK, bold=1)
    y += M.text_size(cf, t["catch"])[1] + 30

    # 偏差値ピル（自慢できる tier のみ順位を明示）
    if t.get("bestTier") in ("top", "high") and t.get("bestTopPercent") is not None:
        stat = f"{t['bestAxisLabel']} 全国上位 {fmt_top(t['bestTopPercent'])}"
        sf = M.fit_font(stat, col_w - 60, 34, min_size=24)
        M.pill(d, x0 + col_w / 2, y + 34, stat, sf, fill=M.CTA_FILL, text_fill=M.WHITE,
               pad_x=34, pad_y=18, border=M.WHITE, border_w=5, shadow=M.CTA_SHADOW)
    else:
        stat = f"{t['bestAxisLabel']} タイプ"
        sf = M.fit_font(stat, col_w - 60, 34, min_size=24)
        M.pill(d, x0 + col_w / 2, y + 34, stat, sf, fill=(255, 255, 255, 240),
               text_fill=accent, pad_x=34, pad_y=18, border=accent, border_w=4)

    # フッター（ブランド + 無料訴求）
    ff = M.font(26)
    M.draw_center(d, x0 + col_w / 2, H - 62, "運命図鑑ウンメイ ｜ MBTI × 干支 で無料診断", ff, M.PURPLE)

    return canvas.convert("RGB")


SAMPLES = ["intj-ne", "enfp-u", "infp-tatsu", "esfp-tora"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", action="store_true", help="サンプル数枚だけ生成")
    args = ap.parse_args()

    data = json.loads(DATA.read_text(encoding="utf-8"))
    types = data["types"]

    if args.sample:
        targets = [t for t in types if t["slug"] in SAMPLES]
        for t in targets:
            img = compose(t)
            p = OUT / f"{t['slug']}.png"
            img.save(p, "PNG", optimize=True)
            print(f"  -> {p.name}  ({p.stat().st_size // 1024}KB)")
        print(f"[OK] sample {len(targets)} -> {OUT}")
        return

    n = 0
    # MBTI×干支 192枚
    for t in types:
        img = compose(t)
        img.save(OUT / f"{t['slug']}.png", "PNG", optimize=True)
        n += 1
    # MBTI単体 16枚
    for mbti, m in data["mbti"].items():
        t = dict(m, mbti=mbti, zodiac="", zodiacYomi="",
                 bestAxisLabel="", bestTier=None, bestTopPercent=None)
        t["bestAxisLabel"] = "192タイプ診断"
        img = compose(t, is_mbti_only=True)
        img.save(OUT / f"{mbti.lower()}.png", "PNG", optimize=True)
        n += 1
    print(f"[OK] {n} OGP images -> {OUT}")


if __name__ == "__main__":
    main()
