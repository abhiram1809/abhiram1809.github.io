"""Export real GIFs, still posters and contact sheets from rendered Manim MP4s."""
import argparse, hashlib, json, subprocess
from pathlib import Path
SCENES={'MemoryResidency':('memory-residency',8.5),'IndependentBatch':('independent-batch',9),'SignedZero':('signed-zero',8.8)}
def run(*args):subprocess.run([str(a) for a in args],check=True)
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--render-dir',type=Path,required=True);ap.add_argument('--output-dir',type=Path,required=True);ap.add_argument('--qa-dir',type=Path,default=Path('/tmp/legacy-hardware-qa'));a=ap.parse_args()
    a.output_dir.mkdir(parents=True,exist_ok=True);a.qa_dir.mkdir(parents=True,exist_ok=True)
    manifest={'renderer':'Manim Community 0.21.0','font':'Kalam (existing repository assets)','scenes':{}}
    for scene,(slug,poster_time) in SCENES.items():
        matches=list(a.render_dir.glob(f'videos/legacy_animations/*/{scene}.mp4'));assert len(matches)==1,matches
        src=matches[0];meta=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(src)]));s=meta['streams'][0]
        assert (s['width'],s['height'])==(960,640)
        duration=float(meta['format']['duration']);assert 10<duration<20
        gif=a.output_dir/f'{slug}.gif';poster=a.output_dir/f'{slug}-still.webp'
        run('ffmpeg','-hide_banner','-loglevel','error','-y','-i',src,'-filter_complex','fps=12,scale=800:534:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',gif)
        run('ffmpeg','-hide_banner','-loglevel','error','-y','-ss',poster_time,'-i',src,'-frames:v','1','-vf','scale=800:534:flags=lanczos','-c:v','libwebp','-quality','92',poster)
        run('ffmpeg','-hide_banner','-loglevel','error','-y','-i',src,'-vf',f'fps=1/2,scale=480:320,tile=4x2','-frames:v','1',a.qa_dir/f'{slug}-contact.png')
        run('ffmpeg','-hide_banner','-loglevel','error','-i',gif,'-f','null','-')
        files={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [gif,poster]}
        manifest['scenes'][scene]={'duration_seconds':duration,'width':800,'height':534,'gif_fps':12,'poster_time_seconds':poster_time,'files':files}
        print(f'{slug}: {duration:.2f}s, GIF {gif.stat().st_size/1024:.0f} KiB',flush=True)
    (Path(__file__).parent/'media-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
if __name__=='__main__':main()
