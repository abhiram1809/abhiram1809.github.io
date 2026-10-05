# Abhiram Sharma — portfolio

Static HTML, CSS, and JavaScript, published with GitHub Pages.
Preview locally with `python3 -m http.server 4173`.

Blog pages also offer **Hulk Speak**, a hand-written English reading style with
shorter sentences. It covers the archive and every published article, preserving
code, equations, source titles, and technical names. The `blog-language` preference
is separate from `portfolio-language`, so choosing it never changes the main
portfolio. Add new blog readings to `assets/js/blog-hulk.js`; source HTML remains
the complete English article and works without JavaScript.

The Hulk Speak picker uses an original comic face SVG. The PagedAttention blog
includes four Manim scenes with playback controls, reduced-motion posters, and
English/Hulk Speak captions. See [rendering instructions](animations/paged-attention/README.md)
for the scene plan, source, and reproducible media exports.

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
mode, and warm light gray, beige, and gray in light mode. Browser chrome and the
saved theme preference stay synchronized across the portfolio and blog pages.

`home-motion.css` and `home-motion.js` load only on the home page. A faint glow
and dot grid follow a fine pointer with easing; rendering stops once settled,
when the pointer leaves, or when the tab is hidden. Touch pointers and reduced
motion disable the background. The experience timeline fills between role
markers as you scroll and reveals each role's labeled technology icons. Its
content is readable without JavaScript and under reduced-motion preferences.

Technology logos reuse the local toolkit SVG sprite. Capability icons in
`experience-icons.svg` illustrate the labels already listed for each role; they
do not add claims about tools used during those periods.
