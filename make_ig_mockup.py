# -*- coding: utf-8 -*-
"""
Instagram 投稿画面モックアップ生成
==================================
生成済みの投稿画像(assets/posts/)を、実際のInstagramフィード投稿の見た目
(プロフィール行・いいね/コメント/シェアアイコン・キャプション・ハッシュタグ)で
囲んだ "投稿画面プレビュー" 画像を作る。

- ライトモード想定・端末幅1080基準
- アバターは天使プードルの顔をトリミングして使用
- 出力: assets/mockups/

実行:
    python make_ig_mockup.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

import make_instagram_ads as M

BASE = Path(__file__).resolve().parent
POSTS = BASE / "assets" / "posts"
CHARS = BASE / "assets" / "chars"
OUT = BASE / "assets" / "mockups"
OUT.mkdir(parents=True, exist_ok=True)

W = 1080
PAD = 42
INK = (38, 38, 38)          # Instagramの濃いグレー
GRAY = (142, 142, 142)      # 補助テキスト
BLUE = (55, 151, 239)       # リンク(ハッシュタグ/メンション)
LIKE_RED = (237, 73, 86)
WHITE = (255, 255, 255)


# ------------------------------------------------------------------
# アイコン(ラインアート)
# ------------------------------------------------------------------
def icon_heart(d, cx, cy, s, color, filled=False):
    if filled:
        M.draw_heart(d, cx, cy - s * 0.1, s, color)
    else:
        M.draw_heart(d, cx, cy - s * 0.1, s, color)
        M.draw_heart(d, cx, cy - s * 0.1, s - 7, WHITE)


def icon_comment(d, cx, cy, s, color):
    r = s
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=6)
    # 吹き出しの尻尾
    d.line([(cx - r * 0.55, cy + r * 0.75), (cx - r * 0.15, cy + r * 0.55)], fill=color, width=6)


def icon_share(d, cx, cy, s, color):
    # 紙飛行機(送信)アイコン風
    p_tip = (cx + s, cy - s)
    p_bl = (cx - s, cy - s * 0.05)
    p_mid = (cx - s * 0.05, cy + s * 0.15)
    p_br = (cx + s * 0.15, cy + s)
    d.line([p_tip, p_bl, p_mid, p_tip, p_br, p_mid], fill=color, width=6, joint="curve")


def icon_bookmark(d, cx, cy, s, color):
    x0, x1 = cx - s * 0.72, cx + s * 0.72
    y0, y1 = cy - s, cy + s
    d.line([(x0, y0), (x1, y0), (x1, y1), (cx, cy + s * 0.35), (x0, y1), (x0, y0)],
           fill=color, width=6, joint="curve")


def icon_carousel(d, cx, cy, s, color):
    # 複数枚(カルーセル)インジケータ: 重なった紙 右上
    d.rounded_rectangle((cx - s + 10, cy - s - 10, cx + s + 10, cy + s - 10),
                        radius=6, outline=color, width=5)
    d.rounded_rectangle((cx - s, cy - s, cx + s, cy + s), radius=6, fill=color)


def circle_avatar(path, size):
    im = Image.open(path).convert("RGBA")
    # 顔まわり(上部中央)をトリミング
    w, h = im.size
    crop = im.crop((int(w * 0.20), int(h * 0.10), int(w * 0.80), int(h * 0.70)))
    crop = crop.resize((size, size), Image.LANCZOS)
    # 白背景に合成(透過キャラを白地に)
    base = Image.new("RGBA", (size, size), WHITE)
    base.alpha_composite(crop)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    base.putalpha(mask)
    return base


# ------------------------------------------------------------------
# テキスト折り返し
# ------------------------------------------------------------------
def wrap(text, f, max_w):
    lines, cur = [], ""
    for ch in text:
        if ch == "\n":
            lines.append(cur); cur = ""; continue
        if M.text_size(f, cur + ch)[0] <= max_w:
            cur += ch
        else:
            lines.append(cur); cur = ch
    if cur:
        lines.append(cur)
    return lines


def build(post_img, username, likes, caption, hashtags, comments, when,
          carousel=False, pages=6):
    img = Image.open(POSTS / post_img).convert("RGB")
    r = W / img.width
    img = img.resize((W, int(img.height * r)), Image.LANCZOS)

    header_h = 150
    action_h = 150 if carousel else 120
    # 本文領域の高さを見積り
    f_user = M.font(38)
    f_body = M.font(36)
    f_small = M.font(32)
    body_w = W - PAD * 2
    cap_lines = wrap(username + " " + caption, f_body, body_w)[:3]
    tag_lines = wrap(hashtags, f_body, body_w)
    footer_h = 70 + 8 + len(cap_lines) * 48 + 8 + len(tag_lines) * 48 + 56 + 46 + 40
    H = header_h + img.height + action_h + footer_h

    canvas = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(canvas)

    # --- ヘッダ(プロフィール行) ---
    av = 92
    avatar = circle_avatar(CHARS / "rare_legendary_angelpoodle.png", av)
    # ピンクのリング
    d.ellipse((PAD - 5, header_h // 2 - av // 2 - 5, PAD + av + 5, header_h // 2 + av // 2 + 5),
              outline=M.CTA_FILL, width=5)
    canvas.paste(avatar, (PAD, header_h // 2 - av // 2), avatar)
    d.text((PAD + av + 26, header_h // 2 - 22), username, font=f_user, fill=INK)
    # 3点メニュー
    for i in range(3):
        cxx = W - PAD - 8 - i * 22
        d.ellipse((cxx - 5, header_h // 2 - 5, cxx + 5, header_h // 2 + 5), fill=INK)

    # --- 投稿画像 ---
    canvas.paste(img, (0, header_h))
    if carousel:
        icon_carousel(d, W - 62, header_h + 58, 20, WHITE)

    # --- カルーセルのページドット + アクションバー ---
    action_top = header_h + img.height
    if carousel:
        n = min(pages, 5)
        dot_r, spacing = 8, 34
        total = (n - 1) * spacing
        for i in range(n):
            dx = W / 2 - total / 2 + i * spacing
            col = BLUE if i == 0 else (200, 200, 200)
            d.ellipse((dx - dot_r, action_top + 30 - dot_r, dx + dot_r, action_top + 30 + dot_r), fill=col)
        ay = action_top + 98
    else:
        ay = action_top + action_h // 2
    icon_heart(d, PAD + 30, ay, 30, INK)
    icon_comment(d, PAD + 120, ay, 28, INK)
    icon_share(d, PAD + 210, ay, 28, INK)
    icon_bookmark(d, W - PAD - 26, ay, 30, INK)

    # --- いいね ---
    y = header_h + img.height + action_h + 6
    d.text((PAD, y), f"いいね！{likes}件", font=f_user, fill=INK)
    y += 62

    # --- キャプション(ユーザー名太字風 + 本文) ---
    for i, line in enumerate(cap_lines):
        d.text((PAD, y), line, font=f_body, fill=INK)
        y += 48
    if len(wrap(username + " " + caption, f_body, body_w)) > 3:
        d.text((PAD, y - 48 + 0), "", font=f_body, fill=GRAY)
    y += 6

    # --- ハッシュタグ(青) ---
    for line in tag_lines:
        d.text((PAD, y), line, font=f_body, fill=BLUE)
        y += 48
    y += 8

    # --- コメントを見る / 時刻 ---
    d.text((PAD, y), f"コメント{comments}件をすべて見る", font=f_small, fill=GRAY)
    y += 50
    d.text((PAD, y), when, font=M.font(28), fill=GRAY)

    return canvas


MOCKS = [
    dict(
        out="mockup_01_intro.png",
        post_img="post_01_intro.jpg",
        username="unmei_uranai",
        likes="1,842",
        caption="生まれた日を入れるだけ。あなたの“運命キャラ”がわかる。MBTI×干支＝全192タイプを無料診断。プロフィールのリンクから試してね♡",
        hashtags="#運命図鑑ウンメイ #MBTI診断 #性格診断 #占い #無料占い #心理テスト",
        comments="63",
        when="3時間前",
    ),
    dict(
        out="mockup_05_aisho.png",
        post_img="post_05_aisho.jpg",
        username="unmei_uranai",
        likes="2,517",
        caption="気になるあの人との相性、何点だと思う…？ MBTI×干支×レアで100点満点採点。2人の生まれた日を入れるだけ、無料だよ。",
        hashtags="#相性診断 #MBTI相性 #恋愛占い #好きな人 #占い #心理テスト",
        comments="128",
        when="5時間前",
    ),
    dict(
        out="mockup_03_eto.png",
        post_img="post_03_eto.jpg",
        username="unmei_uranai",
        likes="1,326",
        caption="同じMBTIなのに性格がちがう…その正体、干支かも？ MBTI×干支で全192タイプに診断できるよ。あなたの組み合わせは何タイプ？プロフィールのリンクから無料診断♡",
        hashtags="#MBTI #MBTI診断 #干支 #占い #無料占い #運命図鑑ウンメイ",
        comments="47",
        when="1日前",
    ),
    dict(
        out="mockup_02_aruaru.png",
        post_img="post_02_aruaru.jpg",
        username="unmei_uranai",
        likes="3,904",
        caption="“好き”ってこんな所でバレてる…？【MBTI別】気になる人の前でつい出ちゃう仕草、タイプごとに全然ちがう！あなたはどれ？自分の型はコメントで教えてね♡",
        hashtags="#MBTIあるある #MBTI診断 #性格診断 #恋愛あるある #心理テスト #占い",
        comments="256",
        when="2日前",
        carousel=True,
        pages=6,
    ),
    dict(
        out="mockup_04_rare.png",
        post_img="post_04_rare.jpg",
        username="unmei_uranai",
        likes="5,271",
        caption="出現率わずか1%…あなたは“レアキャラ”を引けるか。ふつうは出会えない隠れレアが全4体。引けたらスクショして自慢してね。運命キャラを無料診断、リンクから♡",
        hashtags="#運命図鑑ウンメイ #レアキャラ #占い #無料占い #MBTI #診断メーカー",
        comments="341",
        when="6時間前",
    ),
]


def main():
    for m in MOCKS:
        out = m.pop("out")
        canvas = build(**m)
        canvas.save(OUT / out, "PNG", optimize=True)
        canvas.save(OUT / out.replace(".png", ".jpg"), "JPEG", quality=90, optimize=True)
        print(f"  -> {out}  ({(OUT / out).stat().st_size // 1024}KB, {canvas.size[0]}x{canvas.size[1]})")
    print(f"[OK] mockups -> {OUT}")


if __name__ == "__main__":
    main()
