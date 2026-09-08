#!/usr/bin/env python3
"""Convert baked-in checkerboard backgrounds to true PNG alpha.

Skips scene/concept art (high border chroma). Sprite sheets are processed
in-place after originals are copied to assets/raw/_originals/.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "raw"
BACKUP = RAW / "_originals"
SKIP_NAMES = {"style_bible.png", "shihuang_CG.png", "zeus_CG.png"}


def chroma(rgb: np.ndarray) -> np.ndarray:
    return rgb.max(axis=2) - rgb.min(axis=2)


def estimate_cell_size(gray: np.ndarray) -> int:
    lines = [
        gray[:6].mean(0),
        gray[-6:].mean(0),
        gray[:, :5].mean(1),
        gray[:, -5:].mean(1),
    ]
    best = None
    for arr in lines:
        jumps = np.where(np.abs(np.diff(arr.astype(np.float32))) > 14)[0]
        if len(jumps) < 6:
            continue
        ds = np.diff(jumps)
        ds = ds[ds >= 10]
        if len(ds) < 4:
            continue
        med = float(np.median(ds))
        score = float(np.mean(np.abs(ds - med) <= 3) * len(ds))
        if best is None or score > best[0]:
            best = (score, med)
    return int(round(best[1])) if best else 20


def shift(arr: np.ndarray, dy: int, dx: int) -> np.ndarray:
    return np.roll(np.roll(arr, dy, 0), dx, 1)


def checker_pattern_mask(rgb: np.ndarray, sizes: list[int]) -> np.ndarray:
    color = rgb.astype(np.float32)
    ch = chroma(rgb)

    def dist(a: np.ndarray, b: np.ndarray) -> np.ndarray:
        return np.sqrt(((a - b) ** 2).sum(axis=2))

    acc = np.zeros(rgb.shape[:2], dtype=bool)
    for s in sizes:
        same = 34.0
        diff = 16.0
        m = (
            (dist(color, shift(color, s, s)) < same)
            & (dist(color, shift(color, s, -s)) < same)
            & (dist(color, shift(color, 0, s)) > diff)
            & (dist(color, shift(color, s, 0)) > diff)
            & (
                (dist(color, shift(color, 0, 2 * s)) < same)
                | (dist(color, shift(color, 2 * s, 0)) < same)
            )
            & (ch < 22)
        )
        pad = min(2 * s, 36)
        m[:pad] = False
        m[-pad:] = False
        m[:, :pad] = False
        m[:, -pad:] = False
        acc |= m
    return acc


def pure_tile_mask(rgb: np.ndarray, tile: int = 48, stride: int = 24) -> np.ndarray:
    h, w, _ = rgb.shape
    ch = chroma(rgb)
    mask = np.zeros((h, w), dtype=bool)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 8, 1.0)
    for y0 in range(0, h, stride):
        for x0 in range(0, w, stride):
            y1, x1 = min(h, y0 + tile), min(w, x0 + tile)
            patch = rgb[y0:y1, x0:x1]
            pch = ch[y0:y1, x0:x1]
            if pch.mean() > 6.0:
                continue
            pix = patch.reshape(-1, 3).astype(np.float32)
            if len(pix) < 40:
                continue
            _, _, centers = cv2.kmeans(pix, 2, None, crit, 2, cv2.KMEANS_PP_CENTERS)
            if (centers.max(1) - centers.min(1)).max() > 16:
                continue
            sep = float(np.linalg.norm(centers[0] - centers[1]))
            d = np.minimum(
                np.linalg.norm(patch.astype(np.float32) - centers[0], axis=2),
                np.linalg.norm(patch.astype(np.float32) - centers[1], axis=2),
            )
            mask[y0:y1, x0:x1] |= (d < (24 if sep >= 16 else 12)) & (pch < 14)
    return mask


def fill_small_holes(fg: np.ndarray, max_area: int) -> np.ndarray:
    inv = np.where(fg == 0, 255, 0).astype(np.uint8)
    h, w = fg.shape
    padded = np.zeros((h + 2, w + 2), np.uint8)
    padded[1:-1, 1:-1] = inv
    filled = padded.copy()
    cv2.floodFill(filled, None, (0, 0), 0)
    holes = filled[1:-1, 1:-1]
    n_labels, labels, stats, _ = cv2.connectedComponentsWithStats(holes, 8)
    out = fg.copy()
    for i in range(1, n_labels):
        if stats[i, cv2.CC_STAT_AREA] <= max_area:
            out[labels == i] = 255
    return out


def guess_frames(width: int, height: int, name: str = "") -> tuple[int, int]:
    lower = name.lower()
    if "3facets" in lower and width % 4 == 0:
        return 4, 1
    if width % 6 == 0 and width / max(height, 1) > 3:
        return 6, 1
    if width % 4 == 0 and height == 512:
        return 4, 1
    return 1, 1


def grabcut_frame(frame: np.ndarray) -> np.ndarray:
    h, w, _ = frame.shape
    ch = chroma(frame)
    lum = frame.mean(axis=2)
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    border = max(3, min(h, w) // 20)

    def paint_border(value: int) -> None:
        mask[:border] = value
        mask[-border:] = value
        mask[:, :border] = value
        mask[:, -border:] = value

    paint_border(cv2.GC_BGD)
    core = (ch > 16) | (lum > 205)
    k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    k11 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    core_u8 = core.astype(np.uint8) * 255
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    if int(core_u8.sum()) < 50:
        rect = (border, border, w - 2 * border, h - 2 * border)
        cv2.grabCut(frame, mask, rect, bgd, fgd, 4, cv2.GC_INIT_WITH_RECT)
    else:
        mask[cv2.dilate(core_u8, k11, 2) > 0] = cv2.GC_PR_FGD
        mask[cv2.erode(core_u8, k5, 1) > 0] = cv2.GC_FGD
        paint_border(cv2.GC_BGD)
        cv2.grabCut(frame, mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    fg[core] = 255
    return fg


def process(rgb: np.ndarray, name: str = "") -> tuple[np.ndarray | None, dict]:
    h, w, _ = rgb.shape
    ch = chroma(rgb)
    border_chroma = np.concatenate(
        [ch[:8].ravel(), ch[-8:].ravel(), ch[:, :8].ravel(), ch[:, -8:].ravel()]
    )
    if float(border_chroma.mean()) > 8:
        return None, {"skip": True, "reason": "scene/concept", "border_chroma": float(border_chroma.mean())}

    lum = rgb.mean(axis=2)
    cell = estimate_cell_size(lum)
    sizes = sorted({max(8, cell + d) for d in (-4, -2, 0, 2, 4)} | {12, 16, 18, 20, 22, 24})
    chk = checker_pattern_mask(rgb, sizes) | pure_tile_mask(rgb)

    cols, rows = guess_frames(w, h, name)
    frame_w, frame_h = w // cols, h // rows
    coarse = np.zeros((h, w), np.uint8)
    for row in range(rows):
        for col in range(cols):
            x0, y0 = col * frame_w, row * frame_h
            x1 = w if col == cols - 1 else (col + 1) * frame_w
            y1 = h if row == rows - 1 else (row + 1) * frame_h
            coarse[y0:y1, x0:x1] = grabcut_frame(rgb[y0:y1, x0:x1])

    k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    k9 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    coarse = cv2.morphologyEx(coarse, cv2.MORPH_CLOSE, k5, 1)
    coarse = fill_small_holes(coarse, 1200)
    thin = cv2.erode(coarse, k9, iterations=2)

    core = (ch > 18) | (lum > 205)
    core_u8 = np.where(core, 0, 255).astype(np.uint8)
    dist_core = cv2.distanceTransform(core_u8, cv2.DIST_L2, 5)

    fg = coarse.copy()
    punch = chk & ((thin == 0) | (dist_core > 12))
    fg[punch] = 0
    fg[core] = 255
    fg[(thin > 0) & ~chk] = 255

    # Eat leftover checker cards: flood checker pixels from already-transparent areas.
    # Stops at colorful/white cores, so black robes are kept unless they match the grid.
    k_peel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    for _ in range(max(cell * 2, 24)):
        near_empty = cv2.dilate((fg == 0).astype(np.uint8), k_peel, 1) > 0
        peel = (fg > 0) & chk & near_empty & ~core
        if not np.any(peel):
            break
        fg[peel] = 0
    fg[core] = 255

    # Peel gray fringe on the silhouette edge, keep colorful outline pixels.
    edge = (fg > 0) & (cv2.erode(fg, k3, 1) == 0)
    fg[edge & (ch < 14) & (dist_core > 2) & ~core] = 0
    fg[core] = 255

    # Punch leftover interior checker islands (armpits, glow cards, FX boxes).
    remain = ((fg > 0) & chk & ~core).astype(np.uint8) * 255
    n_chk, lab_chk, stats_chk, _ = cv2.connectedComponentsWithStats(remain, 8)
    for i in range(1, n_chk):
        if stats_chk[i, cv2.CC_STAT_AREA] >= 80 and float(ch[lab_chk == i].mean()) < 14:
            fg[lab_chk == i] = 0
    fg[core] = 255
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k3, 1)
    fg = fill_small_holes(fg, 800)
    fg[chk & ~core] = 0
    fg[core] = 255

    n_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(fg, 8)
    min_area = max(120, int(0.00035 * h * w))
    cleaned = np.zeros_like(fg)
    for i in range(1, n_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        ww, hh = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
        cy = centroids[i][1]
        if (hh <= 3 and ww >= 25) or (ww <= 3 and hh >= 25):
            continue
        # Drop bottom labels that are much smaller than a character body.
        if cy > 0.82 * h and area < 0.015 * h * w:
            continue
        if area >= min_area:
            cleaned[labels == i] = 255
    fg = cleaned
    fg[core] = 255
    fg = fill_small_holes(fg, 800)
    fg[chk & ~core] = 0
    fg[core] = 255

    rgba = np.dstack([rgb, fg])
    rgba[fg == 0, :3] = 0
    return rgba, {
        "skip": False,
        "cell": cell,
        "frames": (cols, rows),
        "fg_pct": float(fg.mean() / 255 * 100),
        "border_chroma": float(border_chroma.mean()),
    }


def main() -> int:
    BACKUP.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in RAW.glob("*.png") if p.name not in SKIP_NAMES)
    if not files:
        print("No sprite PNGs found.")
        return 1

    for src in files:
        backup_path = BACKUP / src.name
        if not backup_path.exists():
            shutil.copy2(src, backup_path)
        rgb = np.asarray(Image.open(backup_path).convert("RGB"))
        rgba, info = process(rgb, src.name)
        if info.get("skip"):
            print(f"SKIP {src.name}: {info}")
            continue
        Image.fromarray(rgba, "RGBA").save(src)
        print(
            f"OK   {src.name}: frames={info['frames']} "
            f"cell={info['cell']} fg={info['fg_pct']:.1f}%"
        )

    for name in sorted(SKIP_NAMES):
        path = RAW / name
        if path.exists():
            print(f"KEEP {name} (scene/concept, not a sprite sheet)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
