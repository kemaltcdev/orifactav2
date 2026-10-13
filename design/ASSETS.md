# Asset provenance

The user supplied all ORIFACTA logo and gradient references. The gradient image is used intact in `public/assets/brand/orifacta-gradient.jpg`. White SVG outlines and the wordmark were traced deterministically from the provided raster identity, preserving its shapes. `scripts/trace-brand.py` follows the anti-aliased edge of the original at sub-pixel precision (iso-contour of ink coverage), so the outlines stay smooth at the large footer size; it needs Pillow, NumPy, SciPy and contourpy. The original is retained for reference.

The live ribbon is original code-generated geometry in `lib/ribbon-geometry.mjs`: three parametric bands, each given a closed, lens-shaped thickness. `public/assets/ribbon-poster.webp` is a transparent render of the same geometry at its resting angle (pitch −.08, yaw .25, roll −.2), captured from the live renderer using its still-view option (`createRibbon(canvas, onReady, {yaw, pitch, roll})`); it is not an AI-generated image.

## Architectural concept photo

Saved asset: `public/assets/atelier-residence.webp`.
Method: built-in ImageGen, generated for this website and then encoded as WebP.
Original source: `exec-5386984f-e113-4a9d-8164-19583a4601e9.png`.

Prompt:

> Use case: photorealistic-natural. Asset type: editorial architectural photograph for an illustrative architecture studio website concept inside an IT studio portfolio demo. Generate a single landscape 16:10 high-end architectural photograph, no typography or UI. A quiet sculptural contemporary Mediterranean residence in pale ivory travertine, one massive cylindrical volume and a monolithic rectangular cantilever, long steps descending toward a narrow still reflecting pool, dramatic diagonal shadows, one olive tree partly cropped at far left. Shot from a low slightly oblique angle with a 35mm architectural lens, straight verticals, tactile natural stone and brushed concrete, restrained beige, warm bone, faded olive, soft blue-gray sky. Building fills right two thirds, serene empty sky and shaded stone left third to hold black website typography. Very believable published architecture photography, late afternoon, sophisticated composition, fine material detail, no people, no vehicles, no text, no logos, no watermark. Avoid sci-fi buildings, impossible geometry, oversaturated sunset, shiny render appearance.

## Font

Mona Sans variable Latin WOFF2 (wght 200–900, wdth 75–125), downloaded from Google Fonts and served locally. The OFL license is at `public/assets/fonts/OFL-MonaSans.txt`. The previous Manrope file and its license remain in the folder but are no longer loaded.
