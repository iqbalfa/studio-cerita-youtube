#!/usr/bin/env python3
"""
Studio Cerita — Video Production Pipeline
Automated: Narrative → Scenes → Images → TTS → Ken Burns → Video

Usage:
    python3 pipeline.py --narrative "Teks narasi..." --channel "ilmu-lidi"
    python3 pipeline.py --narrative-file script.txt --channel "ilmu-lidi"
    python3 pipeline.py --narrative-file script.txt --channel "ilmu-lidi" --output ~/output/video-001

Channels: ilmu-lidi, ilmu-survival, ilmu-nyantuy
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

# ============================================================
# CONFIGURATION
# ============================================================

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
CHARACTERS_DIR = PROJECT_DIR / "characters"

CHANNELS = {
    "ilmu-lidi": {
        "name": "Ilmu Lidi",
        "character_ref": "Ilmu Lidi.jpg",
        "style": "Modern 2D webcomic style, white background, bold clean line art, stylized character design, flat colors with cel-shading, cinematic dramatic lighting, volumetric atmosphere, rim lighting, deep shadows, ambient occlusion, depth of field, sharp focus on subject, 8k resolution, high quality digital illustration.",
        "tts_voice": "Iapetus",
        "tts_preset": "Gunakan persona Teman Cerita yang KASUAL, BERSAHABAT, dan sedikit NYELENEH. Gunakan PITCH SEDANG, tempo NORMAL yang mengalir wajar. Suara harus NATURAL DAN BERCELOTEH, seolah sedang nongkrong sambil ngopi. Beri JEDA MANUSIAWI sebelum fakta penting. Gunakan ayunan intonasi pada akhir kalimat tanya. Sampaikan materi dengan gaya akrab 'eh dengerin deh'.",
    },
    "ilmu-survival": {
        "name": "Ilmu Survival",
        "character_ref": "Ilmu Survival.jpg",
        "style": "Gritty brush-and-ink noir illustration, raw and expressive textured brushstrokes, heavy shadow pooling, stark white minimal background, decaying post-apocalyptic textures, selective crimson red coloring, high contrast, sharp focus, 8k resolution, high quality digital art.",
        "tts_voice": "Iapetus",
        "tts_preset": "Gunakan persona Survivor yang TANGGUH, WASPADA, namun tetap TENANG. Gunakan PITCH SEDANG-RENDAH, tempo SEDIKIT LEBIH LAMBAT dan TEGAS. Suara harus terdengar SERIUS, BERWIBAWA, dan PENGALAMAN. Beri JEDA MANUSIAWI yang cukup panjang sebelum poin krusial.",
    },
    "ilmu-nyantuy": {
        "name": "Ilmu Nyantuy",
        "character_ref": "Ilmu Nyantuy.jpg",
        "style": "Ultra-minimalist 2D cartoon style, crude MS Paint aesthetic, basic flat colors, unpolished rough outlines, intentionally simple drawing, humorous deadpan tone, solid white background, low-effort high-comedy internet meme vibe, lo-fi digital art.",
        "tts_voice": "Iapetus",
        "tts_preset": "Gunakan persona Teman Cerita yang KASUAL dan BERSAHABAT. Gunakan PITCH SEDANG, TEMPO NORMAL yang mengalir wajar. Suara harus NATURAL DAN BERCELOTEH. Tunjukkan pembawaan rileks seolah sedang menjelaskan sesuatu yang menarik sambil menikmati segelas kopi.",
    },
}

IMAGE_MODEL = "gemini-3.1-flash-image-preview"
TTS_MODEL = "gemini-2.5-pro-preview-tts"
OUTPUT_RESOLUTION = (1920, 1080)
FPS = 30
ZOOM_RANGE = 0.08  # 8% zoom
FRAMES_PER_SCENE = 249  # ~8.31s at 30fps
UPSCALE_WIDTH = 8000  # For smooth zoompan

# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def log(msg, level="info"):
    icons = {"info": "ℹ️", "ok": "✅", "warn": "⚠️", "error": "❌", "gen": "🎨", "tts": "🔊", "vid": "🎬"}
    icon = icons.get(level, "•")
    print(f"  {icon} {msg}")


def retry(func, max_attempts=3, delay=5, *args, **kwargs):
    """Retry with exponential backoff."""
    for attempt in range(max_attempts):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if attempt < max_attempts - 1:
                log(f"Attempt {attempt+1} failed: {e}. Retrying in {delay}s...", "warn")
                time.sleep(delay)
                delay *= 1.5
            else:
                raise


def api_call(url, payload, api_key, timeout=120):
    """Make a Gemini API call with retry."""
    full_url = f"{url}?key={api_key}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(full_url, data=data, headers={"Content-Type": "application/json"})
    
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


# ============================================================
# STEP 1: BREAK NARRATIVE INTO SCENES
# ============================================================

def break_into_scenes(narrative, channel_config):
    """Use Gemini to break narrative into scenes with visual prompts."""
    log("Breaking narrative into scenes...", "gen")
    
    style = channel_config["style"]
    char_name = channel_config["name"]
    
    prompt = f"""Break the following narrative into individual scenes for a YouTube video storyboard.

CHANNEL: {char_name}
STYLE: {style}

NARRATIVE:
{narrative}

RULES:
1. Each sentence (ending with '.', '?', or '!') should be a separate scene.
2. Headings/subtitles (like "Tanda #2:", "Nomor 3.") should be separate scenes.
3. All scenes must be SINGLE PANEL format (no multi-panel or sequence).
4. Each visual prompt MUST start with "[INDOOR]" or "[OUTDOOR]" and a location description.
5. Each prompt MUST include the character "{char_name}" performing an action.
6. Each prompt MUST include a text overlay matching key words from the narrative.
7. Each prompt MUST end with: "{style}"
8. Write all prompts in Indonesian.

OUTPUT FORMAT (JSON):
{{
  "scenes": [
    {{
      "narrativeText": "the original sentence",
      "visualPrompt": "[INDOOR] - Location description. Character doing action. Text overlay 'KEYWORD'. {style}"
    }}
  ]
}}

Return ONLY valid JSON, no markdown code blocks."""

    # This function is a placeholder - in practice we'd call Gemini
    # For now, we do sentence-based splitting as fallback
    sentences = re.split(r'(?<=[.!?])\s+', narrative.strip())
    scenes = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        scenes.append({
            "narrativeText": sentence,
            "visualPrompt": f"[INDOOR] - Scene for: {sentence[:50]}... {style}"
        })
    
    log(f"Created {len(scenes)} scenes", "ok")
    return scenes


def generate_scene_prompts(narrative, scenes, channel_config, api_key):
    """Generate proper visual prompts using Gemini."""
    log("Generating visual prompts with Gemini...", "gen")
    
    style = channel_config["style"]
    char_name = channel_config["name"]
    
    scenes_text = json.dumps([s["narrativeText"] for s in scenes], ensure_ascii=False, indent=1)
    
    prompt = f"""Generate visual prompts for each scene in a YouTube storyboard.

CHANNEL: {char_name}
CHARACTER: The character is named "{char_name}". Always include them in the scene.

SCENES:
{scenes_text}

STYLE TO APPEND TO EVERY PROMPT:
{style}

RULES:
1. Each prompt must start with "[INDOOR]" or "[OUTDOOR]" and a specific location.
2. Character "{char_name}" must be in every scene (doing the action described).
3. Include text overlay for key capitalized/emphasized words.
4. Each prompt must end with the style description above.
5. Single panel only (no split screen, no sequence).
6. Min half-body shot framing.
7. Include 1 pop culture easter egg per scene.
8. Write in Indonesian.

Return JSON array matching the scenes order:
{{"prompts": ["[INDOOR] - location. {char_name} doing X. Text overlay 'Y'. {style}", ...]}}"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "prompts": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    }
                },
                "required": ["prompts"]
            }
        }
    }
    
    def _call():
        result = api_call(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            payload, api_key
        )
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(text)
        return data["prompts"]
    
    prompts = retry(_call)
    
    for i, scene in enumerate(scenes):
        if i < len(prompts):
            scene["visualPrompt"] = prompts[i]
    
    log(f"Generated {len(prompts)} visual prompts", "ok")
    return scenes


# ============================================================
# STEP 2: GENERATE IMAGES
# ============================================================

def generate_image(scene_index, visual_prompt, char_ref_path, channel_name, api_key, output_path):
    """Generate a single scene image using Gemini."""
    with open(char_ref_path, 'rb') as f:
        ref_b64 = base64.b64encode(f.read()).decode()
    
    mime = "image/jpeg" if str(char_ref_path).endswith(".jpg") else "image/png"
    
    parts = [
        {"inlineData": {"mimeType": mime, "data": ref_b64}},
        {"text": f'Reference image 1 represents character: {channel_name}.\n\n'
                 f'Generate: "{visual_prompt}"\n\n'
                 f'Use reference image for character consistency. '
                 f'Half-Body Shot minimum. Text overlay must be clear and legible.'}
    ]
    
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
    }
    
    result = api_call(
        f"https://generativelanguage.googleapis.com/v1beta/models/{IMAGE_MODEL}:generateContent",
        payload, api_key, timeout=120
    )
    
    for part in result["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            img_data = base64.b64decode(part["inlineData"]["data"])
            with open(output_path, 'wb') as f:
                f.write(img_data)
            return len(img_data)
    
    raise RuntimeError(f"No image in response for scene {scene_index}")


def generate_all_images(scenes, channel_config, api_key, output_dir):
    """Generate images for all scenes with rate limiting."""
    log(f"Generating {len(scenes)} images with {IMAGE_MODEL}...", "gen")
    
    images_dir = output_dir / "images"
    images_dir.mkdir(exist_ok=True)
    
    char_ref = CHARACTERS_DIR / channel_config["character_ref"]
    if not char_ref.exists():
        log(f"Character ref not found: {char_ref}", "error")
        log(f"Available: {list(CHARACTERS_DIR.glob('*'))}", "warn")
        raise FileNotFoundError(f"Missing character reference: {char_ref}")
    
    success = 0
    for i, scene in enumerate(scenes, 1):
        out_path = images_dir / f"scene_{i:03d}.png"
        
        if out_path.exists() and out_path.stat().st_size > 10000:
            log(f"Scene {i}/{len(scenes)}: cached", "ok")
            success += 1
            continue
        
        for attempt in range(3):
            try:
                size = retry(
                    generate_image, max_attempts=2, delay=5,
                    scene_index=i,
                    visual_prompt=scene["visualPrompt"],
                    char_ref_path=char_ref,
                    channel_name=channel_config["name"],
                    api_key=api_key,
                    output_path=out_path
                )
                log(f"Scene {i}/{len(scenes)}: {size//1024}KB", "ok")
                success += 1
                break
            except Exception as e:
                if attempt < 2:
                    log(f"Scene {i}: retry {attempt+1} ({e})", "warn")
                    time.sleep(5 * (attempt + 1))
                else:
                    log(f"Scene {i}: FAILED after 3 attempts ({e})", "error")
        
        time.sleep(3)  # Rate limit
    
    log(f"Images: {success}/{len(scenes)} generated", "ok")
    return success


# ============================================================
# STEP 3: GENERATE TTS
# ============================================================

def generate_tts(narrative, channel_config, api_key, output_path):
    """Generate TTS audio using Gemini."""
    log(f"Generating TTS with {TTS_MODEL}...", "tts")
    
    payload = {
        "contents": [{"parts": [{"text": narrative}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": channel_config["tts_voice"]
                    }
                }
            }
        }
    }
    
    def _call():
        result = api_call(
            f"https://generativelanguage.googleapis.com/v1beta/models/{TTS_MODEL}:generateContent",
            payload, api_key, timeout=180
        )
        
        for part in result["candidates"][0]["content"]["parts"]:
            if "inlineData" in part:
                audio_data = base64.b64decode(part["inlineData"]["data"])
                return audio_data
        
        raise RuntimeError("No audio in TTS response")
    
    audio_data = retry(_call)
    
    # Save raw PCM and convert to WAV
    raw_path = output_path.with_suffix('.raw')
    with open(raw_path, 'wb') as f:
        f.write(audio_data)
    
    subprocess.run([
        'ffmpeg', '-y', '-f', 's16le', '-ar', '24000', '-ac', '1',
        '-i', str(raw_path), str(output_path)
    ], capture_output=True, check=True)
    
    raw_path.unlink()
    
    # Get duration
    probe = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-show_format', '-of', 'json', str(output_path)],
        capture_output=True, text=True
    )
    info = json.loads(probe.stdout)
    duration = float(info['format']['duration'])
    size = os.path.getsize(output_path)
    
    log(f"TTS: {size//1024}KB, {duration:.1f}s", "ok")
    return duration


# ============================================================
# STEP 4: KEN BURNS EFFECT (SMOOTH ZOOM)
# ============================================================

def apply_ken_burns(image_path, output_path, zoom_in=True, frames=FRAMES_PER_SCENE, fps=FPS):
    """Apply smooth Ken Burns effect using FFmpeg with upscale trick."""
    W, H = OUTPUT_RESOLUTION
    
    if zoom_in:
        zoom_expr = f"min(zoom+{ZOOM_RANGE/frames:.6f},{1+ZOOM_RANGE})"
    else:
        zoom_expr = f"if(eq(on\\,0)\\,{1+ZOOM_RANGE}\\,max(zoom-{ZOOM_RANGE/frames:.6f}\\,1))"
    
    subprocess.run([
        'ffmpeg', '-y', '-loop', '1', '-i', str(image_path),
        '-vf', f'scale={UPSCALE_WIDTH}:-1,zoompan=z=\'{zoom_expr}\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d={frames}:s={W}x{H}:fps={fps}',
        '-t', str(frames / fps),
        '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
        str(output_path)
    ], capture_output=True, check=True)


def apply_all_ken_burns(scenes, output_dir):
    """Apply Ken Burns to all scene images."""
    log(f"Applying Ken Burns effect ({len(scenes)} scenes)...", "vid")
    
    images_dir = output_dir / "images"
    video_dir = output_dir / "video_parts"
    video_dir.mkdir(exist_ok=True)
    
    success = 0
    for i, scene in enumerate(scenes, 1):
        img_path = images_dir / f"scene_{i:03d}.png"
        vid_path = video_dir / f"scene_{i:03d}.mp4"
        
        if not img_path.exists():
            log(f"Scene {i}: image missing, skipping", "warn")
            continue
        
        if vid_path.exists() and vid_path.stat().st_size > 10000:
            success += 1
            continue
        
        zoom_in = (i % 2 == 1)  # Alternating
        
        try:
            apply_ken_burns(img_path, vid_path, zoom_in=zoom_in)
            success += 1
            if i % 10 == 0 or i == len(scenes):
                log(f"Scene {i}/{len(scenes)}: done", "ok")
        except Exception as e:
            log(f"Scene {i}: Ken Burns failed ({e})", "error")
    
    log(f"Ken Burns: {success}/{len(scenes)} done", "ok")
    return success


# ============================================================
# STEP 5: FINAL RENDER
# ============================================================

def final_render(scenes, output_dir, audio_duration):
    """Concatenate all scene videos with audio."""
    log("Rendering final video...", "vid")
    
    video_dir = output_dir / "video_parts"
    tts_path = output_dir / "tts_audio.wav"
    final_path = output_dir / "video_final.mp4"
    
    # Create concat list
    concat_file = output_dir / "concat_list.txt"
    with open(concat_file, 'w') as f:
        for i in range(1, len(scenes) + 1):
            vid = video_dir / f"scene_{i:03d}.mp4"
            if vid.exists():
                f.write(f"file '{vid.absolute()}'\n")
    
    # Concat + audio
    subprocess.run([
        'ffmpeg', '-y',
        '-f', 'concat', '-safe', '0', '-i', str(concat_file),
        '-i', str(tts_path),
        '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1',
        '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20',
        '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
        '-movflags', '+faststart',
        '-shortest',
        str(final_path)
    ], capture_output=True, check=True)
    
    size = os.path.getsize(final_path)
    probe = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-show_format', '-of', 'json', str(final_path)],
        capture_output=True, text=True
    )
    info = json.loads(probe.stdout)
    duration = float(info['format']['duration'])
    
    log(f"Final: {final_path}", "ok")
    log(f"  Duration: {duration:.1f}s | Size: {size//1024}KB | 1920x1080", "info")
    
    # Cleanup
    concat_file.unlink()
    
    return final_path


# ============================================================
# MAIN PIPELINE
# ============================================================

def run_pipeline(narrative, channel, output_dir, api_key, skip_images=False, skip_tts=False, skip_video=False):
    """Run the full production pipeline."""
    start_time = time.time()
    
    if channel not in CHANNELS:
        print(f"❌ Unknown channel: {channel}")
        print(f"   Available: {', '.join(CHANNELS.keys())}")
        sys.exit(1)
    
    channel_config = CHANNELS[channel]
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print()
    print("=" * 60)
    print(f"  🎬 STUDIO CERITA — Video Production Pipeline")
    print(f"  Channel: {channel_config['name']}")
    print(f"  Output:  {output_dir}")
    print(f"  Time:    {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    print()
    
    # Save narrative
    with open(output_dir / "narrative.txt", 'w') as f:
        f.write(narrative)
    
    # Step 1: Break into scenes
    print("📋 STEP 1: Break Narrative into Scenes")
    print("-" * 40)
    scenes = break_into_scenes(narrative, channel_config)
    
    if not scenes:
        log("No scenes generated!", "error")
        sys.exit(1)
    
    # Step 1b: Generate visual prompts
    print()
    print("🎨 STEP 1b: Generate Visual Prompts")
    print("-" * 40)
    scenes = generate_scene_prompts(narrative, scenes, channel_config, api_key)
    
    # Save scenes
    with open(output_dir / "scenes.json", 'w') as f:
        json.dump(scenes, f, ensure_ascii=False, indent=2)
    log(f"Scenes saved to {output_dir / 'scenes.json'}", "ok")
    
    # Step 2: Generate images
    print()
    print("🖼️  STEP 2: Generate Images")
    print("-" * 40)
    if not skip_images:
        generate_all_images(scenes, channel_config, api_key, output_dir)
    else:
        log("Skipped (--skip-images)", "warn")
    
    # Step 3: Generate TTS
    print()
    print("🔊 STEP 3: Generate TTS")
    print("-" * 40)
    tts_path = output_dir / "tts_audio.wav"
    if not skip_tts and not tts_path.exists():
        audio_duration = generate_tts(narrative, channel_config, api_key, tts_path)
    elif tts_path.exists():
        probe = subprocess.run(
            ['ffprobe', '-v', 'quiet', '-show_format', '-of', 'json', str(tts_path)],
            capture_output=True, text=True
        )
        info = json.loads(probe.stdout)
        audio_duration = float(info['format']['duration'])
        log(f"TTS cached: {audio_duration:.1f}s", "ok")
    else:
        log("Skipped (--skip-tts)", "warn")
        audio_duration = len(scenes) * (FRAMES_PER_SCENE / FPS)
    
    # Step 4: Ken Burns effect
    print()
    print("🎬 STEP 4: Ken Burns Effect")
    print("-" * 40)
    if not skip_video:
        apply_all_ken_burns(scenes, output_dir)
    else:
        log("Skipped (--skip-video)", "warn")
    
    # Step 5: Final render
    print()
    print("🎞️  STEP 5: Final Render")
    print("-" * 40)
    if not skip_video:
        final_path = final_render(scenes, output_dir, audio_duration)
    else:
        log("Skipped (--skip-video)", "warn")
        final_path = None
    
    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)
    
    print()
    print("=" * 60)
    print(f"  ✅ PIPELINE COMPLETE!")
    print(f"  Channel:   {channel_config['name']}")
    print(f"  Scenes:    {len(scenes)}")
    print(f"  Duration:  ~{audio_duration:.0f}s ({audio_duration/60:.1f}min)")
    print(f"  Time:      {minutes}m {seconds}s")
    if final_path:
        print(f"  Output:    {final_path}")
    print("=" * 60)
    print()
    
    return final_path


# ============================================================
# CLI ENTRYPOINT
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Studio Cerita — Video Production Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 pipeline.py --narrative "Ternyata selama ini..." --channel ilmu-lidi
  python3 pipeline.py --narrative-file script.txt --channel ilmu-lidi --output ~/videos/001
  python3 pipeline.py --narrative-file script.txt --channel ilmu-survival --skip-images
        """
    )
    
    parser.add_argument("--narrative", type=str, help="Narrative text directly")
    parser.add_argument("--narrative-file", type=str, help="Path to narrative text file")
    parser.add_argument("--channel", type=str, required=True, choices=list(CHANNELS.keys()),
                        help="Channel to use")
    parser.add_argument("--output", type=str, default=None,
                        help="Output directory (default: ~/studio-cerita/output/<timestamp>)")
    parser.add_argument("--api-key", type=str, default=None,
                        help="Gemini API key (or set GEMINI_API_KEY env var)")
    parser.add_argument("--skip-images", action="store_true", help="Skip image generation")
    parser.add_argument("--skip-tts", action="store_true", help="Skip TTS generation")
    parser.add_argument("--skip-video", action="store_true", help="Skip video rendering")
    
    args = parser.parse_args()
    
    # Get narrative
    if args.narrative:
        narrative = args.narrative
    elif args.narrative_file:
        with open(args.narrative_file, 'r') as f:
            narrative = f.read()
    else:
        print("❌ Provide --narrative or --narrative-file")
        sys.exit(1)
    
    # Get API key
    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Set GEMINI_API_KEY env var or use --api-key")
        sys.exit(1)
    
    # Set output dir
    if args.output:
        output_dir = Path(args.output)
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path.home() / "studio-cerita" / "output" / f"{args.channel}_{timestamp}"
    
    run_pipeline(narrative, args.channel, output_dir, api_key,
                 skip_images=args.skip_images, skip_tts=args.skip_tts, skip_video=args.skip_video)


if __name__ == "__main__":
    main()
