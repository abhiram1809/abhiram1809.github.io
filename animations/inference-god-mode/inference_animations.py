"""Three reproducible ManimCE scenes for the Inference God Mode article.

Render from this folder: manim -r 1200,900 --fps 30 inference_animations.py
See scenes.md and README.md for design, provenance, and export commands.
"""
from pathlib import Path
import json
import os

import manimpango
import numpy as np
from manim import (
    Scene, Text, VGroup, RoundedRectangle, Line, Arrow,
    Dot, SVGMobject, FadeIn, FadeOut, Succession, Transform, MoveAlongPath, Indicate,
    config, RIGHT, LEFT, UP, DOWN, BOLD, smooth,
)

ROOT = Path(__file__).resolve().parent
for font_file in (ROOT / "fonts").glob("*.ttf"):
    if not manimpango.register_font(str(font_file)):
        raise RuntimeError(f"Cannot register font: {font_file}")
assert "Kalam" in manimpango.list_fonts(), "Kalam must be available; do not silently substitute."

config.frame_width = 12
config.frame_height = 9
BG = "#0D1625"
PANEL = "#162337"
INK = "#EEF3FA"
MUTED = "#B4C4D6"
EDGE = "#354B64"
MINT = "#86DFC5"
LAVENDER = "#AAA7FF"
GOLD = "#F1C77D"
SPARE = "#31445E"


def label(content, size=42, color=INK, bold=False, max_width=None):
    text = Text(content, font="Kalam", font_size=size,
                weight=BOLD if bold else "NORMAL", color=color,
                disable_ligatures=False)
    if max_width is not None and text.width > max_width:
        ratio = max_width / text.width
        assert ratio >= .85, f"Label needs editing, not excessive shrinking: {content}"
        text.scale(ratio)
    text.qa_label = content
    return text


def swap(old, new):
    """Replace text without superimposing two sets of handwritten glyphs."""
    return Succession(FadeOut(old, run_time=.25), FadeIn(new, run_time=.35))


def panel(width, height, center, color=EDGE, fill=PANEL):
    return RoundedRectangle(width=width, height=height, corner_radius=.18,
                            stroke_color=color, stroke_width=2,
                            fill_color=fill, fill_opacity=1).move_to(center)


def logo(name, width=.75):
    obj = SVGMobject(str(ROOT / "icons" / f"{name}.svg"))
    obj.scale_to_fit_width(width)
    return obj


def icon(name, width=.7):
    obj = logo(name, width)
    obj.set_stroke(INK, width=2.7).set_fill(opacity=0)
    return obj


def inside(child, parent, margin=.12):
    for axis in [0, 1]:
        low = child.get_critical_point(LEFT if axis == 0 else DOWN)[axis]
        high = child.get_critical_point(RIGHT if axis == 0 else UP)[axis]
        lo = parent.get_critical_point(LEFT if axis == 0 else DOWN)[axis]
        hi = parent.get_critical_point(RIGHT if axis == 0 else UP)[axis]
        assert low >= lo + margin and high <= hi - margin, getattr(child, 'qa_label', 'card content')


class NotebookScene(Scene):
    def setup(self):
        self.camera.background_color = BG
        self.qa = []
        grid = VGroup(
            *[Line([x, -4.5, 0], [x, 4.5, 0], color=EDGE, stroke_width=.6)
              for x in np.arange(-6, 6.01, .5)],
            *[Line([-6, y, 0], [6, y, 0], color=EDGE, stroke_width=.6)
              for y in np.arange(-4.5, 4.51, .5)],
        ).set_opacity(.19)
        self.add(grid)

    def heading(self, number, title):
        tag = label(f"{number} / Inference God Mode", size=27, color=MUTED).move_to([-3.55, 4.0, 0])
        title_obj = label(title, size=55, bold=True, max_width=10.7).move_to([0, 3.3, 0])
        self.add(tag, title_obj)
        self.check(tag, title_obj)
        return title_obj

    def footer(self, text):
        obj = label(text, size=43, color=MINT, max_width=10.7).move_to([0, -3.85, 0])
        self.check(obj)
        return obj

    def check(self, *objects):
        for obj in objects:
            assert obj.get_left()[0] >= -5.72 and obj.get_right()[0] <= 5.72, getattr(obj, 'qa_label', 'horizontal bounds')
            assert obj.get_bottom()[1] >= -4.3 and obj.get_top()[1] <= 4.3, getattr(obj, 'qa_label', 'vertical bounds')
            self.qa.append({"label": getattr(obj, 'qa_label', type(obj).__name__),
                            "width": round(obj.width, 3), "height": round(obj.height, 3)})

    def tear_down(self):
        qa_dir = Path(os.environ.get("INFERENCE_QA_DIR", "/tmp/inference-manim-qa"))
        qa_dir.mkdir(parents=True, exist_ok=True)
        (qa_dir / f"{type(self).__name__}-layout.json").write_text(json.dumps(self.qa, indent=2))


class MemoryBudget(NotebookScene):
    def budget(self, widths):
        x = -5.0
        segments = VGroup()
        for width, color in zip(widths, [MINT, LAVENDER, GOLD, SPARE]):
            segment = RoundedRectangle(width=width-.055, height=1.02, corner_radius=.09,
                                       stroke_width=0, fill_color=color, fill_opacity=1)
            segment.move_to([x+width/2, 1.35, 0])
            segments.add(segment)
            x += width
        assert abs(sum(widths)-10) < .001
        self.check(segments)
        return segments

    def precision(self, x, title, color):
        box = panel(4.65, 1.4, [x, -2.1, 0])
        top = label(title, size=36, color=MUTED).move_to([x, -1.8, 0])
        value = label("higher precision", size=39, color=color).move_to([x, -2.38, 0])
        inside(top, box); inside(value, box)
        self.check(box)
        return VGroup(box, top, value)

    def construct(self):
        self.heading("01", "A model needs more than weights")
        mark = logo("nvidia", .75).move_to([4.75, 2.45, 0])
        gpu = label("GPU memory budget", size=45, bold=True).move_to([-1.65, 2.4, 0])
        shell = panel(10.35, 1.38, [0, 1.35, 0])
        budget = self.budget([3.7, 3.2, 1.2, 1.9])
        legend = VGroup()
        for text, color, x, y in [
            ("Weights", MINT, -3.6, .1), ("KV cache", LAVENDER, 1.5, .1),
            ("Runtime", GOLD, -3.6, -.7), ("Headroom", SPARE, 1.5, -.7),
        ]:
            square = RoundedRectangle(width=.24, height=.24, corner_radius=.045,
                                      fill_color=color, fill_opacity=1, stroke_width=0).move_to([x, y, 0])
            text_obj = label(text, size=43).next_to(square, RIGHT, buff=.24)
            legend.add(VGroup(square, text_obj))
        weights = self.precision(-2.65, "Weight precision", MINT)
        kv = self.precision(2.65, "KV precision", LAVENDER)
        foot = self.footer("Start with a complete memory budget.")
        note = label("schematic · not to scale", size=26, color=MUTED).move_to([0, -3.12, 0])
        self.check(mark, gpu, legend, weights, kv, note)
        self.add(mark, gpu, shell, budget, legend, weights, kv, foot, note)
        self.wait(2)

        weight_candidate = label("4-bit candidate", size=39, color=MINT).move_to(weights[2])
        inside(weight_candidate, weights[0])
        next_foot = self.footer("Weight precision is one choice.")
        self.play(Transform(budget, self.budget([2.0, 3.2, 1.2, 3.6])),
                  weights[0].animate.set_stroke(MINT, width=3),
                  swap(weights[2], weight_candidate),
                  swap(foot, next_foot), run_time=1.8)
        self.play(Indicate(legend[0], color=MINT, scale_factor=1.06), run_time=.7)
        self.wait(3)

        cache_candidate = label("FP8 candidate", size=39, color=LAVENDER).move_to(kv[2])
        inside(cache_candidate, kv[0])
        cache_foot = self.footer("The cache is a separate choice.")
        self.play(Transform(budget, self.budget([2.0, 1.9, 1.2, 4.9])),
                  kv[0].animate.set_stroke(LAVENDER, width=3),
                  swap(kv[2], cache_candidate),
                  swap(next_foot, cache_foot), run_time=1.8)
        self.play(Indicate(legend[1], color=LAVENDER, scale_factor=1.06), run_time=.7)
        self.wait(3)

        verified = self.footer("Verify quality + full context.")
        self.play(swap(cache_foot, verified), run_time=.7)
        self.wait(3.5)
        baseline_w = label("higher precision", size=39, color=MINT).move_to(weight_candidate)
        baseline_k = label("higher precision", size=39, color=LAVENDER).move_to(cache_candidate)
        initial_foot = self.footer("Start with a complete memory budget.")
        self.play(Transform(budget, self.budget([3.7, 3.2, 1.2, 1.9])),
                  swap(weight_candidate, baseline_w), swap(cache_candidate, baseline_k),
                  weights[0].animate.set_stroke(EDGE, width=2), kv[0].animate.set_stroke(EDGE, width=2),
                  swap(verified, initial_foot), run_time=1.5)
        self.wait(1)


class OptimizationLoop(NotebookScene):
    def stage(self, center, name, subtitle, image):
        box = panel(4.7, 2.1, center)
        img = (logo("nvidia", .76) if image == "nvidia" else icon(image, .72)).move_to(np.array(center)+[-1.55, .27, 0])
        title = label(name, size=51, bold=True).move_to(np.array(center)+[.4, .27, 0])
        sub = label(subtitle, size=35, color=MUTED).move_to(np.array(center)+[0, -.6, 0])
        inside(img, box); inside(title, box); inside(sub, box)
        self.check(box)
        return VGroup(box, img, title, sub)

    def construct(self):
        self.heading("02", "Measure. Change one thing. Repeat.")
        centers = [[-2.75, 1.45, 0], [2.75, 1.45, 0], [2.75, -1.35, 0], [-2.75, -1.35, 0]]
        stages = VGroup(
            self.stage(centers[0], "Fit", "full context", "nvidia"),
            self.stage(centers[1], "Verify", "APIs + quality", "shield-check"),
            self.stage(centers[2], "Measure", "real traffic", "gauge"),
            self.stage(centers[3], "Tune", "one change", "sliders-horizontal"),
        )
        arrows = VGroup(
            Arrow(stages[0][0].get_right(), stages[1][0].get_left(), buff=.12, color=EDGE, stroke_width=3, max_tip_length_to_length_ratio=.25),
            Arrow(stages[1][0].get_bottom(), stages[2][0].get_top(), buff=.12, color=EDGE, stroke_width=3, max_tip_length_to_length_ratio=.25),
            Arrow(stages[2][0].get_left(), stages[3][0].get_right(), buff=.12, color=EDGE, stroke_width=3, max_tip_length_to_length_ratio=.25),
            Arrow(stages[3][0].get_top(), stages[0][0].get_bottom(), buff=.12, color=EDGE, stroke_width=3, max_tip_length_to_length_ratio=.25),
        )
        foot = self.footer("Keep the best verified setup.")
        self.add(arrows, stages, foot)
        self.wait(1.5)
        notes = ["Keep requirements fixed.", "Test the real client.", "Measure latency, memory, quality.", "Change one thing. Re-test."]
        colors = [MINT, LAVENDER, GOLD, MINT]
        for index, (stage, note, color) in enumerate(zip(stages, notes, colors)):
            target_foot = self.footer(note)
            previous = stages[(index-1)%4][0]
            animations = [stage[0].animate.set_stroke(color, width=3.5), swap(foot, target_foot)]
            if index:
                animations.append(previous.animate.set_stroke(EDGE, width=2))
            self.play(*animations, run_time=.7)
            foot = target_foot
            self.wait(2.7)
            path = arrows[index]
            packet = Dot(path.get_start(), radius=.085, color=color)
            self.add(packet)
            self.play(MoveAlongPath(packet, path, rate_func=smooth), run_time=.85)
            self.remove(packet)
        restored = self.footer("Keep the best verified setup.")
        self.play(stages[-1][0].animate.set_stroke(EDGE, width=2), swap(foot, restored), run_time=.7)
        self.wait(1)


class CacheRouting(NotebookScene):
    def worker(self, x, name, cached, load):
        box = panel(2.85, 1.9, [x, -1.1, 0])
        mark = logo("nvidia", .5).move_to([x-.9, -.61, 0])
        title = label(f"GPU {name}", size=39, bold=True).move_to([x+.35, -.62, 0])
        blocks = VGroup(*[RoundedRectangle(width=.32, height=.30, corner_radius=.045,
                                         stroke_color=LAVENDER if cached else EDGE, stroke_width=1.5,
                                         fill_color=LAVENDER if cached else PANEL, fill_opacity=1)
                          for _ in range(3)]).arrange(RIGHT, buff=.09).move_to([x, -1.25, 0])
        cache_label = label("warm prefix" if cached else "cold cache", size=30, color=LAVENDER if cached else MUTED).move_to([x, -1.75, 0])
        track = panel(2.3, .18, [x, -2.42, 0], fill=BG)
        loadbar = self.loadbar(x, load, MINT)
        state = label("available", size=32, color=MUTED).move_to([x, -2.87, 0])
        for obj in [mark, title, blocks, cache_label]: inside(obj, box, margin=.07)
        self.check(box, track, state)
        return VGroup(box, mark, title, blocks, cache_label, track, loadbar, state)

    def loadbar(self, x, amount, color):
        width = 2.16 * amount
        return RoundedRectangle(width=width, height=.105, corner_radius=.035,
                                stroke_width=0, fill_color=color, fill_opacity=1).move_to([x-1.08+width/2, -2.42, 0])

    def send_request(self, arrow, destination):
        packet = Dot(arrow.get_start(), radius=.11, color=MINT)
        self.add(packet)
        self.play(arrow.animate.set_color(MINT), MoveAlongPath(packet, arrow, rate_func=smooth), run_time=1.3)
        self.remove(packet)
        self.play(Indicate(destination[3], color=LAVENDER, scale_factor=1.08), run_time=.7)
        self.play(arrow.animate.set_color(EDGE), run_time=.4)

    def construct(self):
        self.heading("03", "Cache-aware routing")
        k8s = logo("kubernetes", .64).move_to([4.85, 3.32, 0])
        subtitle = label("Keep reuse and load in balance.", size=43, color=MUTED).move_to([0, 2.47, 0])
        router = panel(3.45, 1.15, [0, 1.13, 0])
        server = icon("server", .6).move_to([-.97, 1.13, 0])
        name = label("llm-d", size=47, bold=True).move_to([.44, 1.13, 0])
        inside(server, router); inside(name, router)
        workers = VGroup(self.worker(-3.7, "A", True, .27), self.worker(0, "B", False, .4), self.worker(3.7, "C", True, .23))
        arrows = VGroup(*[Arrow(router.get_bottom(), w[0].get_top(), buff=.1,
                               color=EDGE, stroke_width=3, tip_length=.17, max_tip_length_to_length_ratio=.4)
                          for w in workers])
        foot = self.footer("Reuse a cached prefix.")
        self.check(k8s, subtitle, router, workers)
        self.add(k8s, subtitle, arrows, router, server, name, workers, foot)
        self.wait(1.8)
        self.send_request(arrows[0], workers[0])
        self.wait(1.8)
        busy = label("busy", size=32, color=GOLD).move_to(workers[0][7])
        alternative = self.footer("A is busy. C has the same prefix.")
        self.play(Transform(workers[0][6], self.loadbar(-3.7, .92, GOLD)),
                  workers[0][0].animate.set_stroke(GOLD, width=3),
                  swap(workers[0][7], busy), swap(foot, alternative), run_time=1)
        self.wait(1.8)
        self.send_request(arrows[2], workers[2])
        self.wait(1.8)
        summary = self.footer("Cache affinity + load awareness")
        self.play(swap(alternative, summary), run_time=.7)
        self.wait(3.2)
        available = label("available", size=32, color=MUTED).move_to(busy)
        initial = self.footer("Reuse a cached prefix.")
        self.play(Transform(workers[0][6], self.loadbar(-3.7, .27, MINT)),
                  workers[0][0].animate.set_stroke(EDGE, width=2),
                  swap(busy, available), swap(summary, initial), run_time=1.2)
        self.wait(1)
