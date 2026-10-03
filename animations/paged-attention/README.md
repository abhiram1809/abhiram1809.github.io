# PagedAttention article animations

Four silent Manim Community scenes accompany the [article](../../blogs/paged-attention/index.html). The composition, numerical invariants, pacing, and embedding locations are specified in [scenes.md](scenes.md).

## Reproduce

Use Python with `manim==0.21.0`, Cairo/Pango, and FFmpeg with libx264, libvpx-vp9, and libwebp. Render from this directory:

```bash
python -m manim -r 1200,900 --fps 30 --disable_caching \
  --media_dir /tmp/paged-attention-manim-final \
  paged_attention_animations.py Fragmentation BlockMapping PrefixReuse ExactAttention

python export_assets.py \
  --render-dir /tmp/paged-attention-manim-final \
  --output-dir ../../assets/media/paged-attention
```

Kalam is registered locally from the existing `../inference-god-mode/fonts/` assets and their bundled SIL Open Font License. Numeric vectors use Noto Sans Mono, supplied by the rendering environment. No system font installation or LaTeX compiler is required. Illustrations are original Manim vector shapes; the related Hulk icon is an original hand-drawn SVG in `assets/img/hulk-face.svg`.

The memory and ownership diagrams are illustrative. Fragmentation uses twelve 1 MB cells, including eight free cells in runs of 3, 2, and 3. Mapping uses four tokens per block; the separate exact-attention calculation uses two tokens per block. Prefix reference counts protect actively used state. Reclaiming an idle block is schematic and does not claim a particular release's exact eviction ordering.

The exact calculation preserves the article's values and unnormalized weights. Global numerator [18,23] and denominator 10 produce [1.8,2.3]. It does not independently normalize each page, omit any token, or promise bit-for-bit equivalence between different floating-point kernel configurations.

## Verification

Scene helpers reject excessive text shrinking, off-frame objects, and text escaping the math cards. Layout records are written to `/tmp/paged-attention-manim-qa` or `PAGED_QA_DIR`. Drafts and final renders are reviewed with contact sheets across transitions and resolved states. Final media metadata and SHA-256 hashes are recorded in `media-manifest.json`.

The blog supplies native controls and WebP posters before JavaScript runs. Existing enhanced controls handle manual pause/resume, offscreen pausing, fullscreen, and reduced motion. English and Hulk Speak captions explain each animation; mathematical labels in the silent videos retain the same numbers and names.
