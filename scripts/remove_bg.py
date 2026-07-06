#!/usr/bin/env python3
"""
Remove background from illustration images using rembg (ISNet neural network).
Handles: between legs, fine hair edges, ground shadows, thin sketch lines.

Usage:
    python scripts/remove_bg.py <input> <output>
    python scripts/remove_bg.py <input_dir> <output_dir>

Examples:
    python scripts/remove_bg.py src/public/images/illustrations/ptsd_sufferer4_original.png src/public/images/illustrations/ptsd_sufferer4.png
    python scripts/remove_bg.py src/public/images/illustrations/ out/
"""

import sys
import io
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_erosion

try:
    from rembg import remove, new_session
except ImportError:
    print("rembg not installed. Run: pip install rembg[cpu] --break-system-packages")
    sys.exit(1)


def sample_bg_color(orig: np.ndarray) -> np.ndarray:
    """Sample background color from image corners and top/bottom edges."""
    h, w = orig.shape[:2]
    samples = [
        orig[0, 0], orig[0, w - 1], orig[h - 1, 0], orig[h - 1, w - 1],
        orig[0, w // 2], orig[3, 3], orig[3, w - 4],
    ]
    return np.median(samples, axis=0)


def defringe(orig: np.ndarray, alpha: np.ndarray, bg_color: np.ndarray, tolerance: float = 22.0) -> np.ndarray:
    """
    Remove near-background colored pixels that rembg left as semi-opaque halos.
    Only acts on pixels whose original color is within `tolerance` of the bg_color.
    """
    diff = np.sqrt(np.sum((orig - bg_color) ** 2, axis=2))
    # Ramp: within tolerance/2 → fully transparent, up to tolerance → partial
    bg_proximity = np.clip(1.0 - (diff - tolerance * 0.4) / (tolerance * 0.6), 0.0, 1.0)
    # Only affect pixels that rembg already made semi-transparent or that are
    # solid but very close to bg (speckle halos).
    is_semi = alpha < 220
    is_speckle = (alpha >= 220) & (diff < tolerance * 0.4)
    scale = np.where(is_semi | is_speckle, 1.0 - bg_proximity * 0.95, 1.0)
    return np.clip(alpha * scale, 0, 255)


def remove_ground_shadow(orig: np.ndarray, alpha: np.ndarray, bottom_fraction: float = 0.18) -> np.ndarray:
    """
    Erase cast ground-shadows: low-saturation, medium-brightness pixels in the
    bottom portion of the image that aren't dark enough to be shoes/clothing.
    """
    h = orig.shape[0]
    r, g, b = orig[:, :, 0], orig[:, :, 1], orig[:, :, 2]
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    saturation = np.where(max_c > 1, (max_c - min_c) / max_c, 0.0)
    brightness = max_c / 255.0

    bottom = np.zeros(orig.shape[:2], dtype=bool)
    bottom[int(h * (1 - bottom_fraction)):, :] = True

    # Shadows: low saturation, medium brightness — not dark enough to be footwear
    is_shadow = bottom & (saturation < 0.10) & (brightness > 0.40) & (brightness < 0.88)
    return np.where(is_shadow, 0.0, alpha)


def recover_thin_lines(orig: np.ndarray, alpha: np.ndarray, brightness_thresh: float = 0.55) -> np.ndarray:
    """
    Restore dark sketch-lines (e.g. the mental-tangle) that the model may have
    clipped as background.  Only operates inside the figure's bounding box.
    """
    h, w = orig.shape[:2]
    fg = alpha > 40

    if not fg.any():
        return alpha

    rows = np.where(fg.any(axis=1))[0]
    cols = np.where(fg.any(axis=0))[0]
    rmin, rmax = max(0, rows[0] - 15), min(h - 1, rows[-1] + 15)
    cmin, cmax = max(0, cols[0] - 15), min(w - 1, cols[-1] + 15)

    in_bbox = np.zeros((h, w), dtype=bool)
    in_bbox[rmin:rmax, cmin:cmax] = True

    brightness = (orig[:, :, 0].astype(float) + orig[:, :, 1] + orig[:, :, 2]) / 3.0 / 255.0
    is_dark = brightness < brightness_thresh
    missing = is_dark & (alpha < 15) & in_bbox
    return np.where(missing, 210.0, alpha)


def smooth_edges(alpha: np.ndarray, sigma: float = 0.7) -> np.ndarray:
    """Blur only the transition zone so hard pixel stairs disappear."""
    blurred = gaussian_filter(alpha, sigma=sigma)
    transition = (alpha > 4) & (alpha < 251)
    return np.where(transition, blurred, alpha)


def process(input_path: Path, output_path: Path, session) -> None:
    orig_img = Image.open(input_path).convert("RGB")
    orig = np.array(orig_img, dtype=np.float32)

    with open(input_path, "rb") as f:
        raw = f.read()

    result_bytes = remove(raw, session=session)
    result_img = Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    data = np.array(result_img, dtype=np.float32)
    alpha = data[:, :, 3]

    bg_color = sample_bg_color(orig)

    alpha = defringe(orig, alpha, bg_color, tolerance=22.0)
    alpha = remove_ground_shadow(orig, alpha)
    alpha = recover_thin_lines(orig, alpha)
    alpha = smooth_edges(alpha)
    alpha = np.clip(alpha, 0, 255)

    data[:, :, 3] = alpha
    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(data.astype(np.uint8), "RGBA").save(str(output_path), "PNG")
    print(f"  {input_path.name} -> {output_path}")


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    input_arg = Path(sys.argv[1])
    output_arg = Path(sys.argv[2])

    print("Loading ISNet model (downloads once, ~180MB)...")
    session = new_session("isnet-general-use")

    if input_arg.is_dir():
        exts = {".png", ".jpg", ".jpeg", ".webp"}
        files = sorted(f for f in input_arg.iterdir() if f.suffix.lower() in exts)
        if not files:
            print(f"No image files found in {input_arg}")
            sys.exit(1)
        for f in files:
            process(f, output_arg / f.name, session)
    else:
        if not input_arg.exists():
            print(f"Input not found: {input_arg}")
            sys.exit(1)
        process(input_arg, output_arg, session)

    print("Done.")


if __name__ == "__main__":
    main()
