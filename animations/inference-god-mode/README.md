# Inference God Mode animations

Three silent ManimCE scenes accompany the [article](../../blogs/inference-god-mode/index.html). The design and content plan lives in [scenes.md](scenes.md).

## Reproduce

Use Python with the system Cairo/Pango dependencies and `manim==0.21.0` installed. FFmpeg must provide libx264, libvpx-vp9, and libwebp.

```bash
python -m manim -r 1200,900 --fps 30 --disable_caching \
  --media_dir /tmp/inference-manim-final \
  inference_animations.py MemoryBudget OptimizationLoop CacheRouting

python export_assets.py \
  --render-dir /tmp/inference-manim-final \
  --output-dir ../../assets/media/inference-god-mode
```

The fonts are registered locally through Pango; no system font installation or LaTeX compiler is required. Render paths can be changed without modifying the scene code. Full renders and draft contact sheets are kept outside the repository; only the source assets, final web media, and manifest are checked in.

## Asset provenance

- **Kalam Regular and Bold:** [Google Fonts Kalam](https://github.com/google/fonts/tree/main/ofl/kalam), under the [bundled SIL Open Font License](fonts/OFL.txt). Original TTF files are kept alongside the scenes.
- **Shield-check, gauge, sliders-horizontal, and server:** [Lucide icons](https://github.com/lucide-icons/lucide/tree/main/icons), under the [bundled Lucide license](icons/LICENSE-lucide.txt). SVGs use a fixed light stroke for the dark animation background.
- **NVIDIA and Kubernetes marks:** extracted from this site's existing `assets/img/toolkit-icons.svg` sprite. The reusable paths follow the [Simple Icons catalog](https://github.com/simple-icons/simple-icons); NVIDIA and Kubernetes retain their familiar green and blue.

The illustration uses schematic memory and load states. It does not encode measured compression ratios, hardware capacities, latency, or throughput.

## Verification

Scene helpers check frame bounds and text containment inside cards, and reject excessive label shrinking. Each render writes layout records to `/tmp/inference-manim-qa` (or `INFERENCE_QA_DIR`). Draft and final contact sheets are reviewed at multiple timestamps, including text changes and loop resets. Final metadata, formats, duration, and file hashes are recorded in `media-manifest.json`.

Browser review covers desktop/mobile layout, both site themes, all supported caption languages, actual video decoding and progression, manual pause/resume, offscreen pausing, and reduced-motion behavior. The HTML supplies static posters and native video controls before JavaScript initializes; the enhanced controls live outside the animation so they cannot cover its text.

The completed export was checked at 1200 × 900 and 30 fps. All six MP4/WebM files decoded without errors; poster dimensions and manifest hashes matched. The loops were checked against their opening frames, and contact sheets were visually reviewed for clipping, overlapping text, spacing, and transitions. Browser verification passed 34 checks with no failures, including 1440, 375, and 320 px viewports, dark/light themes, four translated caption languages, keyboard pause, fullscreen, and the existing article GIF controls. All individual video files are under 1 MB.
