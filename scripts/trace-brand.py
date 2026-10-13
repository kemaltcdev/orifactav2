"""Create faithful monochrome SVG outlines from the supplied raster logo.

The outlines follow the anti-aliased edge of the original at sub-pixel
precision (iso-contour of the ink coverage), so they stay smooth when the
wordmark is shown far larger than the source raster.
Usage: python scripts/trace-brand.py [output-dir]
"""
import sys
from pathlib import Path

import contourpy
import numpy as np
from PIL import Image
from scipy import ndimage

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'public/assets/brand'
im = np.asarray(Image.open(root / 'public/assets/brand/orifacta-original.jpg').convert('RGB')).astype(float)

# Ink coverage: 0 on the white board, 1 on the darkest ink or the most saturated colour.
ink = np.clip((255 - im.min(axis=2)) / 200, 0, 1)
ink = ndimage.gaussian_filter(ink, .7)
mask = ink > .5
labels, count = ndimage.label(mask)
areas = np.bincount(labels.ravel()); areas[0] = 0
keep = np.isin(labels, np.where(areas > 120)[0])
ink *= ndimage.binary_dilation(keep, iterations=3)
y, x = np.where(keep); x0, x1, y0, y1 = x.min(), x.max() + 1, y.min(), y.max() + 1


def simplify(pts, eps=.16):
    """Ramer-Douglas-Peucker; small epsilon keeps curves round and corners sharp."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]; d = b - a; den = np.hypot(*d)
    dist = np.abs(d[0] * (pts[:, 1] - a[1]) - d[1] * (pts[:, 0] - a[0])) / den if den else np.hypot(*(pts - a).T)
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return np.vstack([simplify(pts[:i + 1], eps)[:-1], simplify(pts[i:], eps)])
    return np.vstack([a, b])


def svg(field, ox, oy, w, h, name):
    pad = np.pad(field, 1)
    gen = contourpy.contour_generator(z=pad, line_type=contourpy.LineType.Separate)
    paths = []
    for line in gen.lines(.5):
        if len(line) < 12:
            continue
        line = line - 1 - [ox, oy]
        half = len(line) // 2
        pts = np.vstack([simplify(line[:half + 1])[:-1], simplify(line[half:])])
        paths.append('M' + 'L'.join(f'{px:.2f},{py:.2f}' for px, py in pts) + 'Z')
    content = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><title>ORIFACTA</title>'
               f'<path fill="#fff" fill-rule="evenodd" d="{"".join(paths)}"/></svg>')
    (out / name).write_text(content)
    print(name, w, h, len(content))


svg(ink[:, :], x0, y0, x1 - x0, y1 - y0, 'orifacta-white.svg')
symbol = ink.copy(); symbol[:, 450:] = 0
svg(symbol, x0, y0, 450 - x0, y1 - y0, 'orifacta-symbol.svg')
word = ink.copy(); word[:, :450] = 0
yy, xx = np.where(keep[:, 450:]); xx = xx + 450
svg(word, xx.min(), yy.min(), xx.max() + 1 - xx.min(), yy.max() + 1 - yy.min(), 'orifacta-wordmark.svg')
