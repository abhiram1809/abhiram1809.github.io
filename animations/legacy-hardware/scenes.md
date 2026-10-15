# RX 560X: three visual explanations

Audience: existing article readers with basic programming knowledge. Three silent, self-contained 3:2 ManimCE loops (~15 seconds each) with actual GIF exports, still posters and pause controls. Existing article determines scope and style; no narration.

## Narrative and key insight
Memory properties did not establish residency; batching reused weights while retaining private state; exact embedding equivalence included signed zero. Each clip sits beside its corresponding article passage. Fixed camera, generous margins, progressive reveal and a complete opening/closing state.

## MemoryResidency
Purpose: reveal the physical-placement surprise. System RAM/GTT and RX560X VRAM panels start with an orange recurrent-state block in RAM and a subdued requested destination in VRAM. Highlight mismatch, move state to explicit VRAM, reveal CPU mirror and synchronized refresh arrow. Hold, then reset for looping. Schematic placement only; no heap sizes encoded and no claim that all host-visible buffers spill. Caption gives historical recurrence timing9→0.8ms/token and explains mirror refresh. Use RoundedRectangle, VGroup, Arrow, FadeIn/Out and movement.

## IndependentBatch
Purpose: explain sharing without corrupting state, then interpret aggregate speed. One packed-weight slab branches to four representative private state lanes. Tokens advance in parallel. Fade into a metric screen:316.60 aggregate decode tokens/s ÷128≈2.473 tokens/s per sequence. Hold and return to schematic. Four drawn lanes are illustrative, not the measured batch size. Caption states capacity48, prompts16/24/32, eight decode steps, and about404ms per batch return. No single-user or merged-PR throughput claim. Use branching arrows in reserved gaps and sequential fades between views.

## SignedZero
Purpose: make the exactness failure concrete. CPU and GPU cards show−0 and+0; binary16 sign encodings0x8000 and0x0000 disagree despite numeric equality. Reveal supported denormal and signed-zero controls, replace GPU output with−0, then show508,559,360 values bit-identical in each coefficient format. Reset to mismatch. Availability remains gated with CPU fallback. This illustrates the existing FP16-round-trip contract, not a new precision change. Use Text/Pango and sequential replacements; no LaTeX dependency.

## Design and mathematics
Charcoal notebook, cream text, warm orange activity, mint verified state and muted red mismatch. Reuse existing Kalam font files and bundled OFL from ../inference-god-mode/fonts. No global font installation. Main labels stay large; caveats live in HTML captions. Only arithmetic is316.60/128≈2.473; bit patterns refer to binary16, not FP32 storage.

## Sources
Local RX560X_PROGRESS.md and the article's assets/data/rx560x-results.json. Vulkan memory and float-control semantics checked against https://docs.vulkan.org/spec/latest/chapters/memory.html and https://docs.vulkan.org/spec/latest/chapters/devsandqueues.html.

## Implementation / QA
Write source with frame/label assertions; render960×64024fps masters outside repository. Inspect transition/hold contact sheets. Export GIFs at800px12fps plus static WebP posters, record dimensions/durations/hashes. Verify both themes, mobile layout, actual image decoding, pause/resume, reduced-motion/no-JS stills, Hulk Speak captions and local links. Retain source, pinned requirements, exporter and manifest.
