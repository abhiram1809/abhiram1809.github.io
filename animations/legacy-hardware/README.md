# Legacy hardware article animations

Three original Manim Community scenes accompany the [RX 560X article](../../blogs/pushing-legacy-hardware/index.html). See [scenes.md](scenes.md) for the narrative plan, factual boundaries and sources.

## Reproduce

Use Python 3.12 with `manim==0.21.0`, system Cairo/Pango development libraries, a C compiler and FFmpeg. A virtual environment keeps rendering dependencies separate from the static site. Some Python distributions need `CC=gcc CXX=g++` while building ManimPango.

From this directory:

```bash
python -m pip install -r requirements.txt
python -m manim -r 960,640 --fps 24 --disable_caching \
  --media_dir /tmp/legacy-hardware-manim \
  legacy_animations.py MemoryResidency IndependentBatch SignedZero
python export_assets.py --render-dir /tmp/legacy-hardware-manim \
  --output-dir ../../assets/media/legacy-hardware
```

The font is the existing repository's Kalam, registered locally from [the shared font directory](../inference-god-mode/fonts/), with its [SIL OFL license](../inference-god-mode/fonts/OFL.txt). No LaTeX or global font installation is required. Graphics are original Manim shapes and text; no external icons are used.

The exporter produces real looping GIFs at 800×534 and 12 fps, static WebP posters, a manifest with dimensions, durations, sizes and SHA256 hashes, and contact sheets in `/tmp/legacy-hardware-qa`. Master MP4s, temporary renders and contact sheets remain outside the repository.

The article uses the existing image animation controller. Static posters are the default without JavaScript; JavaScript enables GIFs unless reduced motion is requested. The pause/resume button swaps between the GIF and explanatory still. Captions retain the measured workload, illustrative-lane warning and exactness/fallback qualifications. Hulk Speak supplies shorter captions.

## Verification

Text helpers assert frame bounds and prevent oversized labels. Contact sheets cover transitions and held explanations; the GIF exports are decoded with FFmpeg. Browser QA checks image loading, actual frame changes, pause/resume, reduced-motion and no-JavaScript stills, both themes, mobile widths, aspect ratio, captions and local links. The animation's four representative lanes do not encode a four-sequence performance result. Memory blocks do not encode allocation sizes. Signed-zero hex values are binary16 encodings.
