"""Export Manim MP4s to web media and record dimensions, durations, and hashes."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

# Poster times show the resolution, before the loop returns to the opening state.
SCENES = {
    'Fragmentation': ('fragmentation', 13.0),
    'BlockMapping': ('block-mapping', 14.5),
    'PrefixReuse': ('prefix-reuse', 15.0),
    'ExactAttention': ('exact-attention', 16.0),
}

def run(*args):
    subprocess.run([str(arg) for arg in args],check=True)

def describe(path):
    return {'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--render-dir',type=Path,required=True)
    parser.add_argument('--output-dir',type=Path,required=True)
    parser.add_argument('--scene',action='append',choices=SCENES,help='Export only these scenes; retain other manifest entries.')
    args=parser.parse_args();args.output_dir.mkdir(parents=True,exist_ok=True)
    manifest_path=Path(__file__).parent/'media-manifest.json'
    manifest={'renderer':'Manim Community 0.21.0','font':'Kalam and Noto Sans Mono','scenes':{}}
    if args.scene and manifest_path.exists():manifest=json.loads(manifest_path.read_text())
    for name in args.scene or SCENES:
        slug,poster_time=SCENES[name]
        sources=list(args.render_dir.glob(f'videos/paged_attention_animations/*/{name}.mp4'))
        assert len(sources)==1,f'Expected one final render for {name}: {sources}'
        source=sources[0]
        meta=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(source)]))
        stream=next(s for s in meta['streams'] if s['codec_type']=='video')
        assert (stream['width'],stream['height'])==(1200,900)
        assert stream['r_frame_rate']=='30/1'
        duration=float(meta['format']['duration']);assert 18<=duration<=25
        assert poster_time<duration-2.5
        mp4=args.output_dir/f'{slug}.mp4';webm=args.output_dir/f'{slug}.webm';poster=args.output_dir/f'{slug}-poster.webp'
        common=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',source,'-an']
        run(*common,'-c:v','libx264','-crf','19','-preset','slow','-threads','4','-pix_fmt','yuv420p','-movflags','+faststart',mp4)
        run(*common,'-c:v','libvpx-vp9','-crf','30','-b:v','0','-row-mt','1','-threads','4','-cpu-used','4',webm)
        run('ffmpeg','-hide_banner','-loglevel','error','-y','-ss',poster_time,'-i',source,'-frames:v','1','-c:v','libwebp','-quality','92',poster)
        manifest['scenes'][name]={'duration_seconds':round(duration,3),'width':1200,'height':900,'fps':30,
                                  'poster_time_seconds':poster_time,'files':{p.name:describe(p) for p in [mp4,webm,poster]}}
        manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
        print(f'Exported {name}: {duration:.2f}s',flush=True)

if __name__=='__main__':main()
