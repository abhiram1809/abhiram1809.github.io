"""ManimCE loops for the PagedAttention article; composition lives in scenes.md."""
from pathlib import Path
import json
import os
import manimpango
import numpy as np
from manim import (Scene, Text, VGroup, RoundedRectangle, Line, Arrow, FadeIn,
                   FadeOut, TransformFromCopy, Indicate, Circumscribe, config, BOLD)

ROOT = Path(__file__).resolve().parent
for font in (ROOT.parent / 'inference-god-mode' / 'fonts').glob('*.ttf'):
    if not manimpango.register_font(str(font)):
        raise RuntimeError(f'Cannot register {font}')
assert 'Kalam' in manimpango.list_fonts()
assert 'Noto Sans Mono' in manimpango.list_fonts(), 'The numeric font must be available.'
config.frame_width, config.frame_height = 12, 9
BG, PANEL, INK = '#0D1625', '#162337', '#EEF3FA'
MUTED, EDGE, SPARE = '#B4C4D6', '#354B64', '#31445E'
MINT, LAVENDER, GOLD, RED = '#86DFC5', '#AAA7FF', '#F1C77D', '#F28C91'


def text(content, size=42, color=INK, width=10.6, mono=False, bold=False):
    obj = Text(content, font='Noto Sans Mono' if mono else 'Kalam',
               font_size=size, color=color, weight=BOLD if bold else 'NORMAL')
    if obj.width > width:
        ratio = width / obj.width
        assert ratio >= .82, f'Edit label rather than shrink it: {content}'
        obj.scale(ratio)
    obj.qa_label = content
    return obj


def box(w, h, pos, color=EDGE, fill=PANEL):
    return RoundedRectangle(width=w, height=h, corner_radius=.13, stroke_color=color,
                            stroke_width=2.4, fill_color=fill, fill_opacity=1).move_to(pos)


def card(label, pos, w=4.5, h=1.05, color=MINT, size=42):
    return VGroup(box(w,h,pos,color), text(label,size,color,width=w-.35).move_to(pos))


def arrow(a, b, color=MUTED):
    return Arrow(a,b,buff=.1,color=color,stroke_width=3,max_tip_length_to_length_ratio=.14)


class PageScene(Scene):
    def setup(self):
        self.camera.background_color = BG
        self.qa = []
        self.background = VGroup(
            *[Line([x,-4.5,0],[x,4.5,0],color=EDGE,stroke_width=.55) for x in np.arange(-6,6.01,.5)],
            *[Line([-6,y,0],[6,y,0],color=EDGE,stroke_width=.55) for y in np.arange(-4.5,4.51,.5)]
        ).set_opacity(.17)
        self.add(self.background)

    def heading(self,index,label):
        tag=text(f'0{index} / PagedAttention',27,MUTED).move_to([0,4,0])
        title=text(label,55,bold=True).move_to([0,3.28,0])
        self.add(tag,title);self.check(tag,title)
        self.fixed=[self.background,tag,title]

    def footer(self,label,color=MINT):
        obj=text(label,42,color).move_to([0,-3.82,0]);self.check(obj);return obj

    def check(self,*objects):
        for obj in objects:
            assert obj.get_left()[0]>=-5.72 and obj.get_right()[0]<=5.72,getattr(obj,'qa_label','horizontal bounds')
            assert obj.get_bottom()[1]>=-4.3 and obj.get_top()[1]<=4.3,getattr(obj,'qa_label','vertical bounds')
            self.qa.append({'label':getattr(obj,'qa_label',type(obj).__name__),'width':round(obj.width,3),'height':round(obj.height,3)})

    def inside(self,label,frame):
        assert label.get_left()[0]>frame.get_left()[0]+.1 and label.get_right()[0]<frame.get_right()[0]-.1
        assert label.get_bottom()[1]>frame.get_bottom()[1]+.1 and label.get_top()[1]<frame.get_top()[1]-.1

    def snapshot(self):
        return VGroup(*[m.copy() for m in self.mobjects if m not in self.fixed])

    def reset(self,opening):
        self.play(*[FadeOut(m) for m in self.mobjects if m not in self.fixed],run_time=.65)
        self.play(FadeIn(opening),run_time=.65);self.wait(1.2)

    def tear_down(self):
        qa=Path(os.environ.get('PAGED_QA_DIR','/tmp/paged-attention-manim-qa'));qa.mkdir(parents=True,exist_ok=True)
        (qa/f'{type(self).__name__}-layout.json').write_text(json.dumps(self.qa,indent=2)+'\n')


class Fragmentation(PageScene):
    def construct(self):
        self.heading(1,'Enough free memory. No big gap.')
        subtitle=text('Need one contiguous 6 MB region',39,MUTED).move_to([0,2.45,0])
        request=VGroup(*[box(.72,.72,[-2.05+i*.82,1.4,0],GOLD) for i in range(6)])
        free=[0,1,2,5,6,9,10,11]
        pool=VGroup(*[box(.78,.82,[-4.84+i*.88,-.3,0],MINT if i in free else EDGE,
                         PANEL if i in free else SPARE) for i in range(12)])
        legend=text('Each cell = 1 MB      Gray = in use',32,MUTED).move_to([0,-1.16,0])
        totals=text('Free: 3 + 2 + 3 = 8 MB',46,MINT).move_to([0,-2,0])
        footer=self.footer('Largest free gap: only 3 MB',RED)
        self.add(subtitle,request,pool,legend,totals,footer);self.check(subtitle,request,pool,legend,totals,footer)
        opening=self.snapshot();self.wait(2.5)
        self.play(Circumscribe(request,color=RED,buff=.08),*[Circumscribe(pool[i],color=MINT,buff=.05) for i in free],run_time=1.5);self.wait(2)
        new_sub=text('Split into six 1 MB pages',39,MUTED).move_to(subtitle)
        self.play(FadeOut(subtitle),FadeIn(new_sub),run_time=.7)
        targets=[pool[i].copy().set_fill(MINT,opacity=.85).set_stroke(MINT) for i in free[:6]]
        self.play(*[TransformFromCopy(request[j],targets[j]) for j in range(6)],run_time=2.1)
        self.play(*[pool[i].animate.set_fill(MINT,opacity=.85) for i in free[:6]],*[FadeOut(t) for t in targets],run_time=.4)
        remaining=text('6 pages allocated. 2 MB still free.',43,MINT).move_to(totals)
        resolution=self.footer('Small pages fit scattered free space')
        self.check(new_sub,remaining,resolution)
        self.play(FadeOut(totals),FadeIn(remaining),FadeOut(footer),FadeIn(resolution),run_time=.7)
        self.wait(6);self.reset(opening)


class BlockMapping(PageScene):
    def construct(self):
        self.heading(2,'Logical order. Scattered KV blocks.')
        labels=VGroup(text('Sequence',40,MUTED).move_to([-3.9,2.35,0]),
                      text('Block table',40,MUTED).move_to([0,2.35,0]),
                      text('GPU blocks',40,MUTED).move_to([3.9,2.35,0]))
        colors=[MINT,LAVENDER,GOLD];ys=[1.25,-.15,-1.55]
        logical=VGroup(*[card(s,[-3.9,ys[i],0],2.95,1,colors[i],36)
                        for i,s in enumerate(['tokens 0–3','tokens 4–7','tokens 8–9'])])
        table=VGroup(*[card(s,[0,ys[i],0],2.45,1,colors[i],38) for i,s in enumerate(['0 → 9','1 → 2','2 → 14'])])
        physical=VGroup(*[card(s,[3.9,ys[i],0],2.95,1,c,36)
                         for i,(s,c) in enumerate([('2: 4 5 6 7',LAVENDER),('9: 0 1 2 3',MINT),('14: 8 9 · ·',GOLD)])])
        note=text('B = 4 tokens     · = unused slot',31,MUTED).move_to([0,-2.52,0])
        footer=self.footer('Read order: 0 1 2 3 4 5 6 7 8 9')
        self.add(labels,logical,table,physical,note,footer);self.check(labels,logical,table,physical,note,footer)
        opening=self.snapshot();self.wait(2.5)
        for i,physical_i in enumerate([1,0,2]):
            left_path=arrow(logical[i].get_right(),table[i].get_left(),colors[i])
            right_path=arrow(table[i].get_right(),physical[physical_i].get_left(),colors[i])
            self.play(FadeIn(left_path),Circumscribe(logical[i],color=colors[i],buff=.08),run_time=.7)
            self.play(Circumscribe(table[i],color=colors[i],buff=.08),FadeIn(right_path),run_time=.7)
            self.play(Circumscribe(physical[physical_i],color=colors[i],buff=.08),run_time=.8);self.wait(.8)
            self.play(FadeOut(left_path),FadeOut(right_path),run_time=.3)
        resolution=text('Physical reads: 9 → 2 → 14',37,MINT).move_to(note)
        self.play(FadeOut(note),FadeIn(resolution),run_time=.7);self.check(resolution)
        self.wait(4.8);self.reset(opening)


class PrefixReuse(PageScene):
    def construct(self):
        self.heading(3,'Share prefixes. Reclaim idle blocks.')
        note=text('Two full blocks = same 8-token prefix',36,MUTED).move_to([0,2.5,0])
        request_a=card('Request A',[-2.8,1.63,0],3.8,.92,MINT,40)
        request_b=card('Request B',[2.8,1.63,0],3.8,.92,LAVENDER,40).set_opacity(.25)
        prefix=VGroup(card('Prefix block 0',[-2.15,-.05,0],3.85,1.02,MINT,39),
                      card('Prefix block 1',[2.15,-.05,0],3.85,1.02,MINT,39))
        refs=VGroup(*[text('Active refs: 1',34,MINT).move_to([x,-.88,0]) for x in [-2.15,2.15]])
        suffix_a=card('A suffix: active',[-2.8,-2.05,0],4.4,1.05,MINT,38)
        suffix_b=card('B suffix: separate',[2.8,-2.05,0],4.4,1.05,LAVENDER,37).set_opacity(.25)
        bus=Line([-2.8,.95,0],[2.8,.95,0],color=MUTED,stroke_width=2.5)
        a_path=Line(request_a.get_bottom(),[-2.8,.95,0],color=MINT,stroke_width=3)
        b_path=Line(request_b.get_bottom(),[2.8,.95,0],color=LAVENDER,stroke_width=3)
        down=VGroup(*[arrow([x,.95,0],prefix[i].get_top(),MINT) for i,x in enumerate([-2.15,2.15])])
        footer=self.footer('A uses the prefix. B can reuse it.')
        self.add(note,request_a,request_b,prefix,refs,suffix_a,suffix_b,bus,a_path,down,footer)
        self.check(note,request_a,request_b,prefix,refs,suffix_a,suffix_b,footer)
        opening=self.snapshot();self.wait(2.8)
        two_refs=VGroup(*[text('Active refs: 2',34,MINT).move_to(refs[i]) for i in range(2)])
        sharing=self.footer('Same prefix. Two users. One KV copy.')
        self.play(request_b.animate.set_opacity(1),suffix_b.animate.set_opacity(1),FadeIn(b_path),
                  FadeOut(refs),FadeIn(two_refs),FadeOut(footer),FadeIn(sharing),run_time=1.2)
        self.play(Circumscribe(prefix,color=MINT,buff=.08),run_time=1);self.wait(3)
        finished=card('A finished',[-2.8,1.63,0],3.8,.92,MUTED,40)
        idle=card('A suffix: idle',[-2.8,-2.05,0],4.4,1.05,MUTED,38)
        one_ref=VGroup(*[text('Active refs: 1',34,MINT).move_to(refs[i]) for i in range(2)])
        safe=self.footer('B still needs both prefix blocks.')
        self.play(FadeOut(request_a),FadeIn(finished),FadeOut(a_path),FadeOut(suffix_a),FadeIn(idle),
                  FadeOut(two_refs),FadeIn(one_ref),FadeOut(sharing),FadeIn(safe),run_time=1.1);self.wait(2.5)
        new=card('New allocation',[-2.8,-2.05,0],4.4,1.05,GOLD,38)
        reclaim=self.footer('Reuse idle space. Keep B’s KV intact.')
        self.play(FadeOut(idle),FadeIn(new),FadeOut(safe),FadeIn(reclaim),run_time=1)
        self.play(Circumscribe(prefix,color=MINT,buff=.08),Circumscribe(suffix_b,color=LAVENDER,buff=.08),run_time=.9)
        self.check(two_refs,sharing,finished,idle,one_ref,safe,new,reclaim)
        self.wait(5);self.reset(opening)


class ExactAttention(PageScene):
    def construct(self):
        self.heading(4,'Two scattered pages. Same answer.')
        note=text('Unnormalized weights: 1, 2, 3, 4',38,MUTED).move_to([0,2.46,0])
        frames=VGroup(box(4.85,3.45,[-2.65,.38,0],MINT),box(4.85,3.45,[2.65,.38,0],LAVENDER))
        names=VGroup(text('Page 9 · tokens 0–1',36,MINT,width=4.45).move_to([-2.65,1.7,0]),
                     text('Page 2 · tokens 2–3',36,LAVENDER,width=4.45).move_to([2.65,1.7,0]))
        rows=VGroup(text('1 × [1,0] = [1,0]',32,width=4.45,mono=True).move_to([-2.65,.93,0]),
                    text('2 × [0,2] = [0,4]',32,width=4.45,mono=True).move_to([-2.65,.25,0]),
                    text('3 × [3,1] = [9,3]',32,width=4.45,mono=True).move_to([2.65,.93,0]),
                    text('4 × [2,4] = [8,16]',32,width=4.45,mono=True).move_to([2.65,.25,0]))
        footer=self.footer('Add page sums. Normalize once.')
        self.add(note,frames,names,rows,footer);self.check(note,frames,names,rows,footer)
        for i,n in enumerate(names):self.inside(n,frames[i])
        for i,row in enumerate(rows):self.inside(row,frames[i//2])
        opening=self.snapshot();self.wait(3)
        sums=VGroup(text('N = [1,4]',38,MINT,width=4.45,mono=True).move_to([-2.65,-.5,0]),
                    text('N = [17,19]',38,LAVENDER,width=4.45,mono=True).move_to([2.65,-.5,0]))
        z=VGroup(text('Z = 1 + 2 = 3',33,MINT,width=4.45,mono=True).move_to([-2.65,-1.03,0]),
                 text('Z = 3 + 4 = 7',33,LAVENDER,width=4.45,mono=True).move_to([2.65,-1.03,0]))
        self.play(Indicate(rows[:2],color=MINT,scale_factor=1.04),FadeIn(sums[0]),FadeIn(z[0]),run_time=1.2)
        self.play(Indicate(rows[2:],color=LAVENDER,scale_factor=1.04),FadeIn(sums[1]),FadeIn(z[1]),run_time=1.2);self.wait(2.4)
        merge=text('[1,4] + [17,19] = [18,23]',36,INK,mono=True).move_to([0,-2.03,0])
        denom=text('Global Z = 3 + 7 = 10',34,MUTED,mono=True).move_to([0,-2.62,0])
        self.play(TransformFromCopy(VGroup(*sums),merge),FadeIn(denom),run_time=1.3);self.wait(2.7)
        result=text('[18,23] / 10 = [1.8,2.3]',43,MINT,mono=True).move_to([0,-2.3,0])
        equal=self.footer('Contiguous attention: [1.8,2.3]')
        self.play(FadeOut(merge),FadeOut(denom),FadeIn(result),FadeOut(footer),FadeIn(equal),run_time=.9)
        self.play(Indicate(result,color=MINT),run_time=1);self.check(sums,z,merge,denom,result,equal)
        for i in range(2):self.inside(sums[i],frames[i]);self.inside(z[i],frames[i])
        self.wait(5);self.reset(opening)
