# Inference God Mode: three visual explanations

## Overview
- Topic: deployment constraints, the measured optimization loop, and cache/load-aware routing.
- Audience: readers of the engineering article; no prior serving-system knowledge required.
- Format: three silent, self-contained 4:3 ManimCE clips, approximately 18–22 seconds each. Native video controls, posters, and reduced-motion handling on the article.
- Hook: a successful model load is only the start of a useful deployment.
- Key insight: preserve the workload requirements, verify the whole client path, and measure before choosing a configuration.
- Source: project skill at revision `03f87c65aabe74ac426d3234c58a9eda8daf02c1`; vLLM benchmark documentation and llm-d architecture were checked during planning.

## Narrative arc
First show the separate memory costs hidden behind a checkpoint. Then connect capacity, correctness, measurement, and tuning into a repeatable loop. Finally show why a router must balance useful cached prefixes against worker load.

## Scene 1: MemoryBudget
- Duration: about 20 seconds.
- Purpose: distinguish weight quantization from KV-cache precision, while retaining runtime space and headroom.
- Visuals: NVIDIA mark; rounded GPU budget with mint weights, lavender KV, gold runtime, and slate headroom; two independent precision cards; handwritten annotations.
- Sequence: a complete baseline budget is visible immediately. Highlight the weight choice and shrink its segment schematically. Independently highlight the KV choice and shrink its segment. Hold the complete optimized candidate; emphasize quality and full-context verification. Smoothly restore the starting layout for replay.
- Accuracy: segment proportions are schematic, not measured capacities or compression ratios. No model-specific benchmark or guaranteed gain is implied.
- Technical: Text with locally registered Kalam, SVG logo, Transform for the budget, sequential fade-out/fade-in for annotations. No LaTeX dependency.
- Caption: weights, KV cache, runtime allocations, and headroom all contribute to the deployment budget; the two precision choices require separate validation.

## Scene 2: OptimizationLoop
- Duration: about 20 seconds.
- Purpose: make the measure-and-tune process concrete without invented performance numbers.
- Visuals: a spacious 2×2 arrangement of Fit, Verify, Measure, and Tune; NVIDIA, Lucide shield-check, gauge, and sliders icons; connecting arrows and a traveling token.
- Sequence: reveal all four stages, then visit them clockwise. Each stage receives a calm outline highlight and a concise annotation. The final transition returns to Fit, preserving the same workload contract.
- Accuracy: fit means full-context memory; verification means required APIs and quality; measurement means representative traffic; tuning changes one dimension and retests.
- Technical: VGroup cards, pre-generated SVGs, Arrow, MoveAlongPath, and color/stroke interpolation. Labels stay in fixed positions during movement.

## Scene 3: CacheRouting
- Duration: about 20 seconds.
- Purpose: show prefix-cache affinity and load awareness as complementary routing signals.
- Visuals: Kubernetes mark, a server icon for llm-d, three GPU workers, purple prefix blocks, load bars, mint request tokens.
- Sequence: route a shared prefix to warm worker A. Raise A's load and show that worker C has the same prefix. Route a second request to C. Hold the conclusion: reuse the cache while respecting load. Restore the initial load for replay.
- Accuracy: routing to a cache owner does not transfer KV between workers. This schematic does not assert measured throughput or a production pool size.
- Technical: reusable worker cards, independent cache/load state, SVG logos, token paths, Transform for load bars. Keep paths in the empty space between the router and workers.

## Transitions and visual language
- Never start or end on an empty frame; hold complete explanatory states.
- Keep a fixed camera, generous margins, and brief pauses after each idea.
- Dark notebook background with restrained grid lines. Mint is the active signal, lavender cache/verification, warm gold a constraint, and slate spare capacity.
- Use Kalam Regular and Bold from Google Fonts for readable handwriting. Preserve brand marks as SVGs, avoiding emoji or font-based logo substitutes.
- Main labels are kept large; short phrases replace paragraphs inside the animation. Explanations and caveats stay in HTML captions.

## Color palette
- Background `#0D1625`, panels `#162337`, ink `#EEF3FA`, muted `#B4C4D6`.
- Mint `#86DFC5`, lavender `#AAA7FF`, gold `#F1C77D`, spare capacity `#31445E`.
- NVIDIA and Kubernetes retain their recognizable brand colors.

## Mathematical content
No benchmark figures or equations. Segment sizes and worker loads are illustrative, not measured data.

## Implementation and verification order
1. Prepare pinned local font and icon assets and provenance notes.
2. Render each scene at draft quality; inspect contact sheets at transitions and holds.
3. Check label containment, frame bounds, and typography; repair any overlap.
4. Render final 1200×900 at 30 fps and export H.264 MP4, VP9 WebM, and a clear WebP poster.
5. Review final contact sheets and browser playback at desktop and mobile widths, in both themes.
6. Verify pause/play controls, asset loading, reduced-motion behavior, metadata, and local links before pushing.
