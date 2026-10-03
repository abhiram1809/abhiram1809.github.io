# Scattered memory, exact attention

## Overview
- Topic: the memory problem PagedAttention solves and why paging preserves attention.
- Audience: beginners reading the accompanying article; no calculus assumed.
- Format: four silent, independently playable loops, approximately 18–24 seconds each.
- Hook: enough free memory can still fail a contiguous allocation; scattering KV storage does not scatter the mathematics.
- Key insight: logical order and globally normalized sums survive physical relocation.
- Delivery: 1200 × 900, 30 fps, MP4 and WebM, static WebP posters. Match the existing article animations with a dark notebook canvas, locally registered Kalam labels, restrained motion, and persistent numeric examples.

## Narrative arc
Show the failed contiguous allocation, then reveal how a table connects an ordered logical sequence to scattered physical blocks. Show shared prefix ownership and safe reuse of idle memory. Finish by merging block sums into the same output as contiguous attention.

## Scene 1 — Fragmentation
Duration: approximately 20 seconds. Embed after section 1.
Visuals: twelve 1 MB cells in physical order. Free regions have 3, 2, and 3 cells; occupied runs have two cells each. A six-cell request appears above them.
Sequence: highlight eight free cells; show that no free run holds six. Divide the request into six 1 MB pages and map these to six available cells without relocating the occupied cells. Two cells remain free.
Resolution: “One large gap fails. Small pages fit.”
Technical: RoundedRectangle cells, VGroup, TransformFromCopy, color transitions. Preserve the numerical invariant: eight free before allocation, six allocated, two remaining. This is a toy uniform page pool, not an actual GPU allocator trace.

## Scene 2 — Logical order, physical placement
Duration: approximately 20 seconds. Embed after section 5.
Visuals: three vertically stacked logical blocks, a central three-row block table, and physical blocks ordered 2, 9, 14 on the right. Logical tokens 0–3 map to block 9; 4–7 to block 2; 8–9 to block 14, which includes two empty slots. Each logical block has a distinct color and explicit token IDs.
Sequence: reveal table entries and route a read highlight through each mapping in logical order. Physical reads visit 9, 2, 14. Show the resulting token sequence 0 through 9 in order.
Resolution: “The table keeps token order.”
Technical: arrows connect row edges with generous gaps. Use fixed layout, no moving camera. Keep the token-order row visible while individual lookups animate. The engine/kernel follows this table; this is not a CPU MMU remapping GPU blocks.

## Scene 3 — Prefix reuse and safe eviction
Duration: approximately 22 seconds. Embed after section 6.
Visuals: requests A and B, two shared full prefix blocks (four tokens each), separate suffix blocks, and reference-count badges. An idle cached block is separate from all active blocks.
Sequence: A uses the two prefix blocks (one reference). B starts with the same prefix and shares them (two references). A finishes; its private suffix becomes idle, and the shared prefix reference counts decrease to one. Reclaim A’s now-idle suffix for a new allocation while B’s prefix and suffix remain intact.
Resolution: “Share prefixes. Reclaim idle blocks.”
Technical: use explicit full-block labels, ownership colors, and numeric reference counts. Never animate overwriting a block with an active reference. Mention prefix prefill reuse in the caption; no claim that decode avoids reading history. The toy eviction is an eligible idle block, not an exact depiction of every release’s LRU ordering.

## Scene 4 — Exact block sums
Duration: approximately 22 seconds. Embed after section 10, before stable-softmax derivation.
Visuals: four value rows [1,0], [0,2], [3,1], [2,4], and unnormalized attention weights 1, 2, 3, 4. Split tokens 0–1 into page 9 and tokens 2–3 into page 2. Use two cards to compute page numerators and denominators.
Sequence: weight each value; collect page A numerator [1,4] and Z=3, page B numerator [17,19] and Z=7. Move copies of the numerators into a shared sum, then divide [18,23] by 10 to produce [1.8,2.3]. Show contiguous calculation yielding that same result.
Resolution: “Add sums. Normalize once.”
Technical: use vector rows and plain numeric expressions rendered with Pango Text; no TeX syntax or TeX dependency is needed. Do not independently normalize and average pages. Result is mathematical equivalence at unchanged model, mask, and precision; floating-point reproducibility is explained in the article.

## Transitions and loop resets
Each scene starts with a complete static diagram, progressively reveals one claim, pauses on the resolution, and fades the changed elements back to the opening state. Posters show the resolved state. Keep headings and framing fixed during loops; no flashing, spinning, or rapid cuts. Existing article controls pause offscreen, respect reduced motion, and allow manual playback/fullscreen.

## Palette
- Background: #0D1625
- Panels: #162337
- Text: #EEF3FA
- Secondary text: #B4C4D6
- Lines: #354B64
- Logical/page A: #86DFC5
- Logical/page B: #AAA7FF
- Third block/query: #F1C77D
- Allocation failure: #F28C91
- Occupied/unavailable: #31445E
Color is reinforced by names, token IDs, table entries, and reference counts.

## Mathematical content
- Free capacity: 3 + 2 + 3 = 8 MB; maximum contiguous free run = 3 MB.
- Logical block = floor(t/B); slot = t mod B; illustrative B=4.
- Page A: N=[1,4], Z=3. Page B: N=[17,19], Z=7.
- Global attention: ([1,4]+[17,19])/(3+7) = [18,23]/10 = [1.8,2.3].
- The exact-math scene uses B=2, a separate worked example from the B=4 lookup scene.

## Implementation order and validation
1. Create shared drawing/text/bounds helpers and render drafts of all four scenes.
2. Review contact sheets at the opening, each text transition, and the resolution; correct clipping, overlaps, and misleading motion.
3. Render finals, export media and posters, record durations/dimensions/hashes.
4. Embed at the relevant article sections and add English/Hulk Speak captions.
5. Validate decoding, actual browser playback/pause/fullscreen, reduced motion, no-JavaScript fallback, desktop/mobile layout, and icon switching.

## Sources
Content follows the linked sources and independently verified arithmetic in the article: the original PagedAttention paper, vLLM paged-attention and prefix-cache designs, and Operating Systems: Three Easy Pieces. API usage follows the official ManimCE 0.21.0 documentation. These are schematic explanatory animations, not measured performance results.
