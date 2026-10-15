"""Three ManimCE article loops. See scenes.md for plan, accuracy and sources."""
from pathlib import Path
import manimpango
import numpy as np
from manim import Scene, Text, VGroup, RoundedRectangle, Arrow, Line, Dot, FadeIn, FadeOut, Indicate, config, BOLD
for font in (Path(__file__).resolve().parent.parent/'inference-god-mode/fonts').glob('*.ttf'):
    assert manimpango.register_font(str(font))
assert 'Kalam' in manimpango.list_fonts()
config.frame_width=12
config.frame_height=8
BG,PANEL,EDGE='#171717','#22211F','#49433D'
INK,MUTED,ORANGE,MINT,RED='#F0EEEB','#BDB7AF','#F09458','#A6DBBC','#EF9E9E'
def text(s,x=0,y=0,size=36,color=INK,width=10.8,bold=False):
    t=Text(s,font='Kalam',font_size=size,color=color,weight=BOLD if bold else 'NORMAL').move_to([x,y,0])
    assert t.width<=width,f'Edit label: {s}: {t.width:.2f}>{width}'
    assert abs(x)+t.width/2<5.8 and abs(y)+t.height/2<3.85,s
    return t
def box(x,y,w,h,color=EDGE):
    return RoundedRectangle(width=w,height=h,corner_radius=.16,stroke_color=color,stroke_width=2,fill_color=PANEL,fill_opacity=1).move_to([x,y,0])
def chip(s,x,y,w=2.5,color=ORANGE):
    t=text(s,x,y,30,color,width=w-.25)
    assert t.height<.6
    return VGroup(box(x,y,w,.8,color),t)
class Notebook(Scene):
    def setup(self):
        self.camera.background_color=BG
        grid=VGroup(*[Line([x,-4,0],[x,4,0],color=EDGE,stroke_width=.5) for x in np.arange(-6,6.1,.5)],*[Line([-6,y,0],[6,y,0],color=EDGE,stroke_width=.5) for y in np.arange(-4,4.1,.5)])
        self.add(grid.set_opacity(.22))
    def heading(self,n,title):
        self.add(text(f'{n} / RX 560X field notes',0,3.46,26,MUTED),text(title,0,2.72,46,bold=True))
    def swap(self,a,b):
        self.play(FadeOut(a),run_time=.2)
        self.play(FadeIn(b),run_time=.35)
class MemoryResidency(Notebook):
    def construct(self):
        self.heading('01','Where did the state go?')
        ram,vram=box(-3,0,5,3.6),box(3,0,5,3.6)
        labels=VGroup(text('System RAM / GTT',-3,1.14,34,width=4.5),text('RX 560X VRAM',3,1.14,34,width=4.5))
        state=chip('Recurrent state',-3,-.12,3.7)
        ghost=chip('Requested here',3,-.12,3.7,MUTED).set_opacity(.42)
        diagnosis=text('Requested VRAM ≠ resident VRAM',0,-2.3,38,RED)
        foot=text('Schematic of the observed allocation',0,-3.34,26,MUTED)
        self.add(ram,vram,labels,state,ghost,diagnosis,foot)
        self.wait(2);self.play(Indicate(state,color=ORANGE),run_time=1)
        self.play(FadeOut(ghost),run_time=.4)
        self.play(state.animate.move_to([3,-.12,0]),run_time=1.6)
        corrected=text('Explicit VRAM + synchronized mirrors',0,-2.3,36,MINT)
        self.swap(diagnosis,corrected)
        mirror=chip('CPU mirror',-3,-.12,3.7,MINT)
        arrow=Arrow([.9,-.65,0],[-.9,-.65,0],buff=.06,color=MINT,stroke_width=4)
        copy_label=text('refresh before export',0,-1.25,27,MINT,width=4.6)
        self.play(FadeIn(mirror),FadeIn(arrow),FadeIn(copy_label),run_time=.8)
        self.play(Indicate(mirror,color=MINT),run_time=1);self.wait(3)
        self.play(FadeOut(mirror),FadeOut(arrow),FadeOut(copy_label),run_time=.5)
        self.play(state.animate.move_to([-3,-.12,0]),run_time=1)
        self.swap(corrected,diagnosis);self.play(FadeIn(ghost),run_time=.4);self.wait(1.5)
class IndependentBatch(Notebook):
    def construct(self):
        self.heading('02','Shared weights. Private state.')
        weight=chip('One packed weight set',0,1.55,6.5)
        lanes,arrows,tokens=VGroup(),VGroup(),VGroup()
        for i,x in enumerate([-4.2,-1.4,1.4,4.2]):
            lanes.add(chip(f'State {i+1}',x,-.35,2.35,MINT))
            arrows.add(Arrow([x*.64,1.1,0],[x,.12,0],buff=.08,color=ORANGE,stroke_width=3))
            tokens.add(Dot([x,-.88,0],radius=.10,color=ORANGE))
        note=text('Four representative sequences',0,-1.9,31,MUTED)
        foot=text('Each keeps its own KV, recurrence and position',0,-3.34,27,MUTED)
        drawing=VGroup(weight,lanes,arrows,note)
        self.add(weight,note,foot);self.play(FadeIn(lanes),FadeIn(arrows),run_time=.8);self.wait(1)
        self.add(tokens);self.play(*[t.animate.shift([0,-.4,0]) for t in tokens],run_time=1.2)
        self.play(FadeOut(tokens),run_time=.3);self.wait(1)
        self.play(FadeOut(drawing),FadeOut(foot),run_time=.5)
        metrics=VGroup(text('316.60',0,1.3,86,ORANGE,bold=True),text('aggregate decode tokens/s',0,.25,36),text('÷ 128 independent sequences',0,-.67,36,MUTED),text('≈ 2.473 tokens/s per sequence',0,-1.68,40,MINT),text('Short context · capacity 48 · eight decode steps',0,-3.34,26,MUTED))
        self.play(FadeIn(metrics),run_time=.6);self.wait(4)
        self.play(FadeOut(metrics),run_time=.5);self.play(FadeIn(drawing),FadeIn(foot),run_time=.6);self.wait(2)
class SignedZero(Notebook):
    def construct(self):
        self.heading('03','One zero broke the exactness check')
        panels=VGroup(box(-3,.25,5,3.4),box(3,.25,5,3.4))
        labels=VGroup(text('CPU reference',-3,1.34,35,width=4.5),text('GPU candidate',3,1.34,35,width=4.5))
        cpu,gpu=text('−0',-3,.3,88,MINT),text('+0',3,.3,88,RED)
        cpu_bits=text('FP16 bits: 0x8000',-3,-.71,29,MINT,width=4.4)
        gpu_bits=text('FP16 bits: 0x0000',3,-.71,29,RED,width=4.4)
        note=text('Equal numerically. Different sign bits.',0,-2.08,35,RED)
        foot=text('The inherited FP16 round-trip is part of the contract',0,-3.34,25,MUTED)
        self.add(panels,labels,cpu,gpu,cpu_bits,gpu_bits,note,foot);self.wait(2)
        self.play(Indicate(gpu_bits,color=RED),run_time=1)
        controls=text('Preserve denormals + signed zero',0,-2.08,36,ORANGE)
        self.swap(note,controls);self.wait(1)
        self.play(FadeOut(gpu),FadeOut(gpu_bits),run_time=.2)
        gpu,gpu_bits=text('−0',3,.3,88,MINT),text('FP16 bits: 0x8000',3,-.71,29,MINT,width=4.4)
        self.play(FadeIn(gpu),FadeIn(gpu_bits),run_time=.35)
        matched=text('508,559,360 values: bit-identical',0,-2.08,37,MINT)
        self.swap(controls,matched)
        verified=text('Both coefficient formats audited; CPU fallback retained',0,-3.34,25,MUTED)
        self.swap(foot,verified);self.wait(3)
        self.play(FadeOut(gpu),FadeOut(gpu_bits),run_time=.2)
        gpu,gpu_bits=text('+0',3,.3,88,RED),text('FP16 bits: 0x0000',3,-.71,29,RED,width=4.4)
        self.play(FadeIn(gpu),FadeIn(gpu_bits),run_time=.35)
        self.swap(matched,note);self.swap(verified,foot);self.wait(1.5)
