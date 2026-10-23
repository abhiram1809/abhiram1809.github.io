# Abhiram Sharma — portfolio

Static HTML, CSS, and JavaScript, published with GitHub Pages.
Preview locally with `python3 -m http.server 4173`.

Blog prose, captions, metadata, and accessibility labels are available in English,
German, French, Spanish, and Dutch. Shared translations live in `assets/js/i18n.js`;
`assets/js/blog-i18n.js` completes the article-specific copy and loads before
`main.js`. When adding or editing an article, update all four translation
dictionaries using the exact English text as keys. Code, equations, technical
identifiers, and published source titles retain their original notation.

Blog pages also offer **Hulk Speak**, a hand-written English reading style with
shorter sentences. It covers the archive and every published article, preserving
code, equations, source titles, and technical names. The `blog-language` preference
is separate from `portfolio-language`, so choosing it never changes the main
portfolio. Add new blog readings to `assets/js/blog-hulk.js`; source HTML remains
the complete English article and works without JavaScript.

The language picker always translates from that English source. Its initializer
runs once so repeated script execution cannot capture already-translated text or
attach competing click handlers. Pages using the picker opt out of automatic
browser translation (`translate="no"` and `notranslate`) to keep it from rewriting
the selected copy. Keep shared script versions aligned across the blog pages
when deploying translation changes.

The Hulk Speak picker uses an original comic face SVG. The PagedAttention blog
includes four Manim scenes with playback controls, reduced-motion posters, and
English/Hulk Speak captions. See [rendering instructions](animations/paged-attention/README.md)
for the scene plan, source, and reproducible media exports.

The RX 560X article includes three original Manim GIFs covering memory residency,
independent batching, and signed-zero exactness. Each has a pause control and
static reduced-motion/no-JavaScript poster. See [source and rendering instructions](animations/legacy-hardware/README.md).

The [Timestral experiment](blogs/timestral-561-trades/) documents the completed
561-trade directional-confidence run. Its result table comes from the saved
summary; unmodified ledgers, metrics, protocol, audit, equity curves, and research
bundle live in `assets/data/timestral-561/`. `provenance.json` records their SHA-256
hashes. The original `465` archive name refers to the target, not the final count.

## UI design references

The navigation and article details are original, dependency-free implementations
inspired by [Rare UI](https://www.rareui.com/):

- [Gooey Nav](https://www.rareui.com/components/gooeynav): a subtle current-section
  pill, adapted to the portfolio header and mobile menu.
- [Scroll Progress](https://www.rareui.com/components/scrollprogressindicator): an
  article progress ring with a collapsible section index.
- [Code Block](https://www.rareui.com/components/codeblock): an accent-colored
  frame and a copy action with success and failure feedback.

No Rare UI source code or React dependencies are bundled. These details use the
existing theme tokens, support all five site languages, retain semantic links
and selectable code, and honor reduced-motion preferences. Source content
remains readable without JavaScript.

## Themes and home-page motion

The shared palette uses black and charcoal with orange borders and motion in dark
mode, and light gray surfaces, beige accents, and gray text in light mode.
Browser chrome and the saved theme preference stay synchronized across the
portfolio and blog pages.

`home-motion.css` and `home-motion.js` load only on the home page. An elastic
point lattice responds to a fine pointer and sends a wave to every viewport corner
on a click or tap, including over sections with opaque backgrounds. Its layer
passes all input through to the page. Canvas
resolution and node count are bounded, connections use adjacent nodes, and
rendering stops once the field settles or the tab is hidden. Touch devices use a
smaller rendering budget and react to taps without tracking swipes. Reduced
motion and hidden tabs disable the background and release its backing store.
Both themes share the hero layout, portrait mat, crop, and unfiltered photo;
switching themes changes the palette without moving or recoloring the portrait.

The experience timeline fills between role markers as you scroll and reveals each role's labeled technology icons. Its
content is readable without JavaScript and under reduced-motion preferences.

Contact links scroll the email action into view and cue it on arrival with
three decreasing jumps. The cue can replay on subsequent clicks and yields to
manual scrolling; reduced motion focuses the link without jumping. Mobile service
and project rows allow both horizontal swipes and vertical page scrolling.

Technology logos reuse the local toolkit SVG sprite. Capability icons in
`experience-icons.svg` illustrate the labels already listed for each role; they
do not add claims about tools used during those periods.
