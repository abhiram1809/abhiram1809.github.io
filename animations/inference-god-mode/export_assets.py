"""Export web videos, posters, and a reproducible media manifest from Manim MP4s."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

SCENES = {
    "MemoryBudget": ("memory-budget", 15.5),
    "OptimizationLoop": ("optimization-loop", 16.6),
    "CacheRouting": ("cache-routing", 15.2),
}


def run(*args):
    subprocess.run([str(arg) for arg in args], check=True)


def describe(path):
    return {"bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--render-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"renderer": "Manim Community 0.21.0", "font": "Kalam", "scenes": {}}
    for scene, (slug, poster_time) in SCENES.items():
        candidates = list(args.render_dir.glob(f"videos/inference_animations/*/{scene}.mp4"))
        assert len(candidates) == 1, f"Expected one final render for {scene}: {candidates}"
        source = candidates[0]
        meta = json.loads(subprocess.check_output([
            "ffprobe", "-v", "quiet", "-show_format", "-show_streams", "-of", "json", str(source)]))
        stream = next(s for s in meta["streams"] if s["codec_type"] == "video")
        assert (stream["width"], stream["height"]) == (1200, 900)
        assert stream["r_frame_rate"] == "30/1"
        duration = float(meta["format"]["duration"])
        assert 18 <= duration <= 23
        mp4 = args.output_dir / f"{slug}.mp4"
        webm = args.output_dir / f"{slug}.webm"
        poster = args.output_dir / f"{slug}-poster.webp"
        common = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", source, "-an"]
        run(*common, "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4)
        run(*common, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-row-mt", "1", "-cpu-used", "2", webm)
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", poster_time,
            "-i", source, "-frames:v", "1", "-c:v", "libwebp", "-quality", "92", poster)
        manifest["scenes"][scene] = {"duration_seconds": round(duration, 3), "width": 1200,
                                     "height": 900, "fps": 30, "poster_time_seconds": poster_time,
                                     "files": {p.name: describe(p) for p in [mp4, webm, poster]}}
        print(f"Exported {scene}: {duration:.2f}s", flush=True)
    (Path(__file__).parent / "media-manifest.json").write_text(json.dumps(manifest, indent=2)+"\n")


if __name__ == "__main__":
    main()
