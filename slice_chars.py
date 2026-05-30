"""
v15.1 キャラ画像 自動検出スライス（v2）
- グリッド固定分割ではなく、画像内の連結成分を検出して各キャラを個別切り出し
- 出力: assets/chars/ に Section 1.3 命名規則で 20体PNG (1024x1024)
"""

from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

SRC_DIR = Path(r"C:\Users\kkaji\Desktop\サイト作成")
V15_DIR = Path(r"C:\Users\kkaji\Desktop\サイト作成\unmei-v15.1")
OUT_DIR = V15_DIR / "assets" / "chars"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 高品質ソース（解像度は同じだが圧縮率が低い版）を優先使用
HIRES_SRC_16 = V15_DIR / "_hires_preview1.webp"

# 通常16キャラ: 4×4 = 上から左→右の順
NORMAL_NAMES = [
    # row 1
    "unmei_intj_blackcat_reading.png",
    "unmei_intp_whitecat_sleepy.png",
    "unmei_infp_purplerabbit_moon.png",
    "unmei_isfj_sheep_pink.png",
    # row 2
    "unmei_enfp_squirrel_rainbow.png",
    "unmei_esfp_chick_sun.png",
    "unmei_entj_blackcat_crown.png",
    "unmei_entp_raccoon.png",
    # row 3
    "unmei_istj_shibainu.png",
    "unmei_enfj_bear_heart.png",
    "unmei_istp_wolf_gray.png",
    "unmei_isfp_calico_paint.png",
    # row 4
    "unmei_estj_tiger.png",
    "unmei_estp_star.png",
    "unmei_esfj_bulldog.png",
    "unmei_infj_unicorn_pink.png",
]

# レア3体: 左→右
RARE_NAMES = [
    "rare_cursed_purplerabbit.png",
    "rare_blank_whitecat.png",
    "rare_bloodline_goldrabbit.png",
]

LEGENDARY_NAME = "rare_legendary_angelpoodle.png"

OUTPUT_SIZE = 1024
PADDING_RATIO = 0.08   # キャラ周囲の余白（出力サイズに対する割合）


def flood_fill_alpha(img: Image.Image, threshold: int = 240) -> Image.Image:
    """画像端から繋がっている純白領域をアルファ0に変換"""
    img = img.convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    is_white = (r >= threshold) & (g >= threshold) & (b >= threshold)

    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    # 四辺から白起点を投入
    for x in range(w):
        for y in (0, h - 1):
            if is_white[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_white[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_white[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))

    arr[..., 3] = np.where(visited, 0, arr[..., 3])
    return Image.fromarray(arr, mode="RGBA")


def detect_components(alpha_img: Image.Image, expected_count: int, min_area_ratio: float = 0.002,
                       dilation_iters: int = 3, orphan_min_ratio: float = 0.00005):
    """連結成分を検出し、bbox+面積+重心+マスク を返す（大きい順）
    小さな孤立成分（キラキラ等の装飾）は最寄りの主成分に併合する"""
    arr = np.array(alpha_img)
    alpha = arr[..., 3]
    mask = alpha > 30
    structure = np.ones((3, 3), dtype=bool)
    mask_dilated = ndimage.binary_dilation(mask, structure=structure, iterations=dilation_iters)

    labels, num = ndimage.label(mask_dilated)
    total_pix = arr.shape[0] * arr.shape[1]
    min_area = int(total_pix * min_area_ratio)
    orphan_min_area = int(total_pix * orphan_min_ratio)

    all_components = []
    for i in range(1, num + 1):
        component_mask = labels == i
        area = int(component_mask.sum())
        if area < orphan_min_area:
            continue
        ys, xs = np.where(component_mask)
        y0, y1 = ys.min(), ys.max()
        x0, x1 = xs.min(), xs.max()
        cy = (y0 + y1) / 2.0
        cx = (x0 + x1) / 2.0
        orig_mask = component_mask & mask
        if orig_mask.any():
            ys2, xs2 = np.where(orig_mask)
            y0, y1 = ys2.min(), ys2.max()
            x0, x1 = xs2.min(), xs2.max()
        all_components.append({
            'bbox': (x0, y0, x1 + 1, y1 + 1),
            'area': area,
            'centroid': (cy, cx),
            'mask': component_mask,
        })

    # 主成分（面積閾値超え）と孤児（小さい装飾）を分離
    mains = [c for c in all_components if c['area'] >= min_area]
    orphans = [c for c in all_components if c['area'] < min_area]
    mains.sort(key=lambda c: c['area'], reverse=True)
    mains = mains[:expected_count]

    # 各孤児を最寄り主成分に併合
    for orph in orphans:
        oy, ox = orph['centroid']
        # 距離 = 主成分のbbox外側からのユークリッド距離（bbox内なら0）
        best_idx = -1
        best_dist = float('inf')
        for i, m in enumerate(mains):
            mx0, my0, mx1, my1 = m['bbox']
            dx = max(mx0 - ox, 0, ox - (mx1 - 1))
            dy = max(my0 - oy, 0, oy - (my1 - 1))
            dist = (dx * dx + dy * dy) ** 0.5
            if dist < best_dist:
                best_dist = dist
                best_idx = i
        # 距離が画像幅の8%未満なら併合
        if best_idx >= 0 and best_dist < arr.shape[1] * 0.08:
            mains[best_idx]['mask'] = mains[best_idx]['mask'] | orph['mask']
            # bbox 拡張
            mx0, my0, mx1, my1 = mains[best_idx]['bbox']
            ox0, oy0, ox1, oy1 = orph['bbox']
            mains[best_idx]['bbox'] = (
                min(mx0, ox0), min(my0, oy0),
                max(mx1, ox1), max(my1, oy1)
            )

    return mains


def sort_components_grid(components, cols: int):
    """重心位置で 上→下, 左→右 の順にソート（行をクラスタリング）"""
    if not components:
        return []
    # y座標でソート→行に区切る
    sorted_by_y = sorted(components, key=lambda c: c['centroid'][0])
    rows_count = (len(components) + cols - 1) // cols
    rows = []
    chunk = len(sorted_by_y) // rows_count
    # 行クラスタリング: y重心の差が画像高さの相応量未満なら同じ行
    # シンプルに: 隣接rows_count個ずつブロックに分け、各ブロック内でx順
    for r in range(rows_count):
        row_items = sorted_by_y[r * cols:(r + 1) * cols]
        row_items.sort(key=lambda c: c['centroid'][1])
        rows.extend(row_items)
    return rows


def crop_with_padding(src_img: Image.Image, comp, output_size: int, padding_ratio: float):
    """質量重心で中央配置し、最大寸法+余白で正方形に切り出し→リサイズ"""
    x0, y0, x1, y1 = comp['bbox']
    comp_mask = comp['mask']
    w = x1 - x0
    h = y1 - y0
    # bbox を完全に内包できる最小正方形サイズ
    side = max(w, h)
    pad = int(side * padding_ratio * 2)
    side_padded = side + pad
    half = side_padded // 2

    # 質量重心 (アルファ加重) を取得して中央配置
    src_arr = np.array(src_img).copy()
    alpha = src_arr[..., 3].astype(np.float32)
    alpha_masked = np.where(comp_mask, alpha, 0)
    total = alpha_masked.sum()
    if total > 0:
        ys, xs = np.indices(alpha_masked.shape)
        cy = float((ys * alpha_masked).sum() / total)
        cx = float((xs * alpha_masked).sum() / total)
    else:
        cy = (y0 + y1) / 2.0
        cx = (x0 + x1) / 2.0
    cx, cy = int(round(cx)), int(round(cy))

    # 重心からの最大距離を求めて、左右上下すべて入る正方形サイズを保証
    # （bbox 端まで余裕を持って収まるように再計算）
    dist_left   = cx - x0
    dist_right  = x1 - cx
    dist_top    = cy - y0
    dist_bottom = y1 - cy
    required_half = max(dist_left, dist_right, dist_top, dist_bottom)
    half = max(half, required_half + pad // 2)
    side_padded = half * 2

    crop_x0 = cx - half
    crop_y0 = cy - half
    crop_x1 = cx + half
    crop_y1 = cy + half

    src_w, src_h = src_img.size

    # 他キャラを透明化
    src_arr[..., 3] = np.where(comp_mask, src_arr[..., 3], 0)
    masked_src = Image.fromarray(src_arr, mode="RGBA")

    # 正方形キャンバスに貼り付け
    canvas = Image.new("RGBA", (side_padded, side_padded), (0, 0, 0, 0))
    sx0 = max(0, crop_x0)
    sy0 = max(0, crop_y0)
    sx1 = min(src_w, crop_x1)
    sy1 = min(src_h, crop_y1)
    if sx1 > sx0 and sy1 > sy0:
        piece = masked_src.crop((sx0, sy0, sx1, sy1))
        canvas.paste(piece, (sx0 - crop_x0, sy0 - crop_y0))

    # 縮小/拡大は LANCZOS。アップサンプル時はアンシャープマスクで輪郭強調
    resized = canvas.resize((output_size, output_size), Image.LANCZOS)
    if output_size > side_padded:
        resized = resized.filter(ImageFilter.UnsharpMask(radius=1.6, percent=140, threshold=2))
    return resized


def process_grid(src_path: Path, names: list[str], cols: int):
    print(f"\n[grid] {src_path.name} -> {len(names)} chars ({cols} cols)")
    img = Image.open(src_path).convert("RGBA")
    alpha_img = flood_fill_alpha(img)
    components = detect_components(alpha_img, expected_count=len(names))
    print(f"  detected {len(components)} components")
    components = sort_components_grid(components, cols=cols)

    for i, comp in enumerate(components):
        if i >= len(names):
            break
        cropped = crop_with_padding(alpha_img, comp, OUTPUT_SIZE, PADDING_RATIO)
        out_path = OUT_DIR / names[i]
        cropped.save(out_path, "PNG", optimize=True)
        x0, y0, x1, y1 = comp['bbox']
        size_kb = out_path.stat().st_size // 1024
        print(f"  [{i:2d}] {names[i]:42s}  bbox=({x0},{y0})-({x1},{y1})  {size_kb}KB")


def process_legendary(src_path: Path):
    print(f"\n[lgd] {src_path.name}")
    img = Image.open(src_path).convert("RGBA")
    alpha_img = flood_fill_alpha(img)
    bbox = alpha_img.getbbox()
    if bbox is None:
        bbox = (0, 0, alpha_img.width, alpha_img.height)
    # 1キャラだけなので全画素をマスクとして渡す
    arr = np.array(alpha_img)
    full_mask = arr[..., 3] > 0
    fake_comp = {'bbox': bbox, 'mask': full_mask}
    cropped = crop_with_padding(alpha_img, fake_comp, OUTPUT_SIZE, PADDING_RATIO)
    out_path = OUT_DIR / LEGENDARY_NAME
    cropped.save(out_path, "PNG", optimize=True)
    print(f"  -> {LEGENDARY_NAME}  bbox={bbox}  {out_path.stat().st_size // 1024}KB")


def main():
    # 16キャラは高品質版が存在すればそちらを使用
    p16   = HIRES_SRC_16 if HIRES_SRC_16.exists() else SRC_DIR / "preview.webp"
    prare = SRC_DIR / "preview (1).webp"
    plgd  = SRC_DIR / "ChatGPT Image 2026年5月27日 17_57_02.png"

    print(f"src16: {p16.name} ({p16.stat().st_size // 1024}KB)")
    print(f"rare:  {prare.name} ({prare.stat().st_size // 1024}KB)")
    print(f"lgd:   {plgd.name} ({plgd.stat().st_size // 1024}KB)")
    assert p16.exists(),   f"missing: {p16}"
    assert prare.exists(), f"missing: {prare}"
    assert plgd.exists(),  f"missing: {plgd}"

    process_grid(p16, NORMAL_NAMES, cols=4)
    process_grid(prare, RARE_NAMES, cols=3)
    process_legendary(plgd)

    files = sorted(OUT_DIR.glob("*.png"))
    total_kb = sum(f.stat().st_size for f in files) // 1024
    print(f"\n=== {len(files)} files, {total_kb}KB total ===")


if __name__ == "__main__":
    main()
