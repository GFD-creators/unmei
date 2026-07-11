# -*- coding: utf-8 -*-
# note用アイキャッチ(横長1280x670)を16タイプ分生成 + 下書きmdの見出し画像パスを更新
from PIL import Image, ImageDraw, ImageFont
import os, glob

PROJ   = r"C:\Users\kkaji\Desktop\サイト作成\unmei-v15.1"
CHARS  = os.path.join(PROJ, "assets", "chars")
DRAFTS = r"C:\Users\kkaji\Desktop\運命図鑑-note下書き"
OUT    = os.path.join(DRAFTS, "アイキャッチ")
os.makedirs(OUT, exist_ok=True)

FONT_B = r"C:\Windows\Fonts\meiryob.ttc"   # 太字
FONT_R = r"C:\Windows\Fonts\meiryo.ttc"    # 標準

DATA = {
 'INTJ':('unmei_intj_blackcat_reading.png','さみしがりの ものしりねこ','#5b3a7a'),
 'INTP':('unmei_intp_whitecat_sleepy.png','ぼんやりの てんさいねこ','#9aa4b2'),
 'INFJ':('unmei_infj_unicorn_pink.png','しずかなる つきうさぎ','#a87bd8'),
 'INFP':('unmei_infp_purplerabbit_moon.png','つよがりの ゆめみひつじ','#ff9ab0'),
 'ENFP':('unmei_enfp_squirrel_rainbow.png','こわがりの ぼうけんりす','#ff8c42'),
 'ENFJ':('unmei_enfj_bear_heart.png','おせっかいな おひさまひよこ','#f5b342'),
 'ENTJ':('unmei_entj_blackcat_crown.png','やさしがりの くろねこじょおう','#3d2a4d'),
 'ENTP':('unmei_entp_raccoon.png','てれやの いたずらあらいぐま','#ff8c42'),
 'ISTJ':('unmei_istj_shibainu.png','ふあんしょうの まじめいぬ','#d49060'),
 'ISFJ':('unmei_isfj_sheep_pink.png','どきどきの やさしいくま','#d9a866'),
 'ISTP':('unmei_istp_wolf_gray.png','てれやの くーるおおかみ','#8f99a6'),
 'ISFP':('unmei_isfp_calico_paint.png','ないしょの おしゃれねこ','#ff7f50'),
 'ESTJ':('unmei_estj_tiger.png','てれやの しっかりいぬ','#8f8f8f'),
 'ESFJ':('unmei_esfj_bulldog.png','つかれやの ゆめみるユニコーン','#ff6fb3'),
 'ESTP':('unmei_estp_star.png','さみしがりの げんきとら','#ff4500'),
 'ESFP':('unmei_esfp_chick_sun.png','ふあんしょうの きらきらほし','#f5b342'),
}

W, H = 1280, 670

def grad(top, bot):
    img = Image.new('RGB', (W, H)); dr = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        dr.line((0, y, W, y), fill=tuple(int(top[i] + (bot[i]-top[i]) * t) for i in range(3)))
    return img

def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

count = 0
for mbti, (fn, name, color) in DATA.items():
    bg = grad((255, 245, 250), (255, 220, 238)).convert('RGBA')
    dr = ImageDraw.Draw(bg)
    # ドット装飾
    dot = Image.new('RGBA', (W, H), (0,0,0,0)); dd = ImageDraw.Draw(dot)
    for x in range(40, W, 54):
        for y in range(40, H, 54):
            dd.ellipse((x-2, y-2, x+2, y+2), fill=(255, 143, 196, 45))
    bg = Image.alpha_composite(bg, dot); dr = ImageDraw.Draw(bg)

    # キャラ（左・縦中央）
    ch = Image.open(os.path.join(CHARS, fn)).convert('RGBA')
    th = 520; r = th / ch.height
    ch = ch.resize((int(ch.width * r), th), Image.LANCZOS)
    bg.alpha_composite(ch, (70, (H - th)//2))

    tx = 660
    dr.text((tx, 120), '★ 運命図鑑 完全鑑定 ★', font=ImageFont.truetype(FONT_B, 27), fill=(232, 53, 140))
    # MBTI ピル
    fm = ImageFont.truetype(FONT_B, 40); acc = hx(color)
    pw = dr.textlength(mbti, font=fm) + 46
    dr.rounded_rectangle((tx, 166, tx + pw, 166 + 60), 30, fill=acc)
    lum = 0.299*acc[0] + 0.587*acc[1] + 0.114*acc[2]
    dr.text((tx + 23, 177), mbti, font=fm, fill=(255,255,255) if lum < 150 else (60,40,75))
    # 名前（スペースで2行）
    fnme = ImageFont.truetype(FONT_B, 62); ny = 258
    for p in name.split(' '):
        dr.text((tx, ny), p, font=fnme, fill=(74, 44, 92)); ny += 76
    dr.text((tx, ny + 8), '恋愛・相性・2026運勢を 完全鑑定', font=ImageFont.truetype(FONT_R, 30), fill=(122, 82, 144))
    dr.text((tx, H - 58), '運命図鑑 ウンメイ ｜ MBTI × 干支', font=ImageFont.truetype(FONT_R, 22), fill=(180, 150, 198))

    bg.convert('RGB').save(os.path.join(OUT, mbti + '.png'), quality=95)
    count += 1

    # 下書きmdの見出し画像パスを新アイキャッチに差し替え
    old = os.path.join(PROJ, 'assets', 'chars', fn)
    new = os.path.join(OUT, mbti + '.png')
    for md in glob.glob(os.path.join(DRAFTS, mbti + '_*.md')):
        with open(md, encoding='utf-8') as f: t = f.read()
        if old in t:
            with open(md, 'w', encoding='utf-8') as f: f.write(t.replace(old, new))

print(f"[OK] eyecatch {count} images + md paths updated -> {OUT}")
