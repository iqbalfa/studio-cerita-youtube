#!/usr/bin/env python3
"""
Dynamic Scene Timing v4 — Ilmu Lidi Edition
Adapted from Studio Cerita editor's creative rules:
- Rapid Fire: short sentences → merged into single scene
- Easter Egg (international pop culture) per scene
- Observer rule for abstract/metafora narratives
- Universal location [INDOOR]/[OUTDOOR]
- Text overlay from capitalization
- All scenes = SINGLE PANEL (no multi-panel/sequence)
- Gemini TTS per paragraph → Whisper → gap-free scene timing
"""

import json, subprocess, wave, os, re, time
from pathlib import Path
from datetime import datetime

# ============================================================
# CONFIGURATION
# ============================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyA3diFK84WbQ774dLQ-DnT4OWOJ5UHMEPA")
CHAR_REF = Path.home() / "studio-cerita/characters/Ilmu Lidi.jpg"
OUT = Path("/tmp/demo_v4")
IMAGE_MODEL = "gemini-3.1-flash-image-preview"
TTS_MODEL = "gemini-2.5-pro-preview-tts"
TTS_VOICE = "Iapetus"
FPS = 30
RESOLUTION = (1920, 1080)
UPSCALE = 8000
ZOOM = 0.08

# Ilmu Lidi style (from types.ts)
STYLE = (
    "Modern 2D webcomic style, white background, bold clean line art, "
    "stylized character design, flat colors with cel-shading, "
    "cinematic dramatic lighting, volumetric atmosphere, rim lighting, "
    "deep shadows, ambient occlusion, depth of field, sharp focus on subject, "
    "8k resolution, high quality digital illustration."
)

CHAR_NAME = "Ilmu Lidi"
NARRATIVE = """Ternyata selama ini kita semua kena scam berjamaah soal konsep produktivitas. Kita diajarkan bahwa bangun pagi jam 4 subuh, olahraga, meditasi, journaling, dan kerja 12 jam sehari adalah jalan menuju sukses. Tapi kalau kamu perhatikan, orang-orang yang paling stres dan burnout justru mereka yang paling disiplin mengikuti formula ini. Produktivitas bukan soal seberapa banyak yang kamu kerjakan. Produktivitas soal seberapa tepat kamu memilih apa yang mau dikerjakan. Dan ironisnya, semakin sibuk seseorang, semakin sedikit waktu yang dia punya untuk berpikir."""

# ============================================================
# EASTER EGG POOL (International Pop Culture — NO lokal Indonesia)
# ============================================================

EASTER_EGGS = [
    "retro sci-fi movie poster on the wall",
    "colorful handheld game console on desk",
    "superhero action figure collection on shelf",
    "animated cartoon poster with eccentric characters",
    "neon cyberpunk sign glowing in background",
    "sleek electric car logo badge visible",
    "minimalist laptop with fruit logo on table",
    "dark knight emblem shadow on wall",
    "spiky-haired anime figurine on shelf",
    "bounty hunter helmet displayed as decor",
    "game controller with colorful buttons nearby",
    "glowing arc reactor-like device on desk",
    "rocket ship model on the bookshelf",
    "golden cartridge game on display",
    "web-patterned wrist device catching light",
    "upside-down poster with strange creature",
    "dramatic ocean liner painting on wall",
    "iconic moonwalk silhouette poster",
    "retro RV vehicle toy model on shelf",
    "green digital rain code effect in background",
]

# ============================================================
# METAVERA / ABSTRACT KEYWORDS (Observer rule trigger)
# ============================================================

META_KEYWORDS = [
    "scam", "konsep", "produktivitas", "mental", "pola", "sistem",
    "bosan", "malas", "efek", "ilmiah", "psikologi", "riset",
    "fakta", "mitos", "hoax", "terbukti", "data", "angka",
    "persentase", "proporsi", "keseimbangan", "rumus", "formula",
]

# ============================================================
# UTILITY
# ============================================================

def log(msg, tag="info"):
    icons = {"ok": "✓", "err": "✗", "gen": "⟳", "tts": "🔊", "vid": "🎬", "img": "🖼️", "wh": "📝", "prm": "🎨"}
    print(f"  {icons.get(tag, '•')} {msg}")

def pcm_to_wav(pcm_bytes, wav_path, sr=24000, ch=1, sw=2):
    with wave.open(str(wav_path), 'wb') as wf:
        wf.setnchannels(ch); wf.setsampwidth(sw); wf.setframerate(sr)
        wf.writeframes(pcm_bytes)

def probe_duration(path):
    r = subprocess.run(['ffprobe','-v','quiet','-show_format','-of','json',str(path)],
                       capture_output=True, text=True)
    return float(json.loads(r.stdout)['format']['duration'])

def concat_wavs(wavs, out):
    cl = out.parent / "concat.txt"
    with open(cl, 'w') as f:
        for w in wavs:
            f.write(f"file '{w.absolute()}'\n")
    subprocess.run(['ffmpeg','-y','-f','concat','-safe','0','-i',str(cl),
                   '-c:a','pcm_s16le',str(out)], capture_output=True)
    cl.unlink()

def get_easter_egg(seed=None):
    """Pick an Easter Egg deterministically based on seed."""
    idx = (seed or 0) % len(EASTER_EGGS)
    return EASTER_EGGS[idx]

# ============================================================
# RAPID FIRE DETECTION (gabungan kalimat pendek)
# ============================================================

def is_rapid_fire_group(sentences):
    """
    Detect rapid fire: 3+ short sentences (<=5 words each) separated by period.
    These should be merged into ONE scene despite being separate sentences.
    Returns merged text if rapid fire, else None.
    """
    if len(sentences) < 2:
        return None

    short_count = sum(1 for s in sentences if len(s.split()) <= 5)
    if short_count >= 3 and short_count == len(sentences):
        return " ".join(sentences)
    return None

def detect_rapid_fire(narrative):
    """
    Split narrative into scenes with RAPID FIRE logic:
    - 3+ short sentences (<=5 words) separated by period → merge into 1 scene
    - Otherwise each sentence = 1 scene
    Returns list of scene texts.
    """
    # Split by sentence-ending punctuation
    raw_sentences = re.split(r'(?<=[.!?])\s+', narrative.strip())
    raw_sentences = [s.strip() for s in raw_sentences if s.strip()]

    scenes = []
    i = 0
    while i < len(raw_sentences):
        # Look ahead for rapid fire group
        group = [raw_sentences[i]]
        j = i + 1
        while j < len(raw_sentences) and len(raw_sentences[j].split()) <= 5:
            group.append(raw_sentences[j])
            j += 1

        if len(group) >= 3:
            # Rapid fire detected — merge into 1 scene
            merged = " ".join(group)
            scenes.append(merged)
            log(f"  🔥 Rapid Fire: {len(group)} short sentences merged", "gen")
            i = j
        else:
            scenes.append(raw_sentences[i])
            i += 1

    return scenes

# ============================================================
# IS ABSTRACT / METAVERA? (Observer rule)
# ============================================================

def is_abstract_text(text):
    """Check if text is abstract/metafora (needs Observer rule)."""
    text_lower = text.lower()
    score = sum(1 for kw in META_KEYWORDS if kw in text_lower)
    # Also check for common abstract patterns
    abstract_patterns = [
        r'^[\d\W]+$',  # Only numbers/symbols
        r'^(fakta|mitos|hoax|rumus|kunci|rahasia)',  # Starts with abstract noun
    ]
    for p in abstract_patterns:
        if re.search(p, text_lower):
            score += 2
    return score >= 2

# ============================================================
# DETECT TEXT OVERLAY FROM CAPITALIZATION
# ============================================================

def detect_text_overlay(text):
    """
    Detect words that should appear as text overlay.
    Rule: ONLY words in ALL CAPS (3+ chars) in the narrative become overlay.
    Returns empty list if no emphasis/caps found — NO FALLBACK to longest words.
    """
    # Find ALL CAPS words (3+ chars) — ONLY this triggers overlay
    caps_words = re.findall(r'\b[A-Z]{3,}\b', text)
    if caps_words:
        return caps_words[:3]  # Max 3 overlays
    return []  # NO fallback — only actual caps emphasis

# ============================================================
# BUILD VISUAL PROMPT (per scene)
# ============================================================

LOCATION_POOL_INDOOR = [
    "modern minimalist coffee shop interior",
    "clean white-walled studio apartment",
    "sleek tech startup office space",
    "cozy bookstore cafe corner",
    "modern rooftop lounge",
]

LOCATION_POOL_OUTDOOR = [
    "busy metropolitan city sidewalk",
    "lush green park with walking path",
    "trendy urban street market",
    "modern cityscape rooftop view",
    "quiet suburban neighborhood",
]

# ============================================================
# ACTION EXTRACTION (context-aware per scene)
# ============================================================

# Keywords → specific actions (contextual to narrative content)
ACTION_KEYWORDS = {
    # Scam/productivity concepts
    "scam": "standing shocked, facepalming in disbelief",
    "produktivitas": "standing confused, scratching head while looking at floating productivity icons",
    "pagi|jam 4| bangun": "yawning and rubbing eyes, looking at clock showing 4 AM",
    "olahraga|meditasi|journaling": "looking exhausted while staring at checklist of morning routines",
    "sukses": "standing tall, looking hopeful with arms raised in victory pose",
    "stres|burnout": "slouching exhausted, dark circles under eyes, visibly tired",
    "disiplin": "nodding seriously while holding discipline checklist",
    "memilih|pilihan": "standing at crossroads, holding scale to weigh options",
    "sibuk|banyak": "surrounded by floating clocks and busy schedules, overwhelmed",
    "sedikit|waktu": "looking at empty hourglass, limited time symbol",
    "berpikir|mental": "standing with thought bubbles showing gears and lightbulb",
    "terbukti|ilmiah|riset|data": "reading research paper, citing scientific evidence",
    "mitos|hoax|terbukti": "crossing out myth with red marker, showing facts instead",
    "formula|rumus": "standing near chalkboard with mathematical formulas",
    "ironi|kontras": "standing ironically laughing at contradictory signs",
    "efek|dampak": "showing before/after effect comparison",
    "stop| Awal": "standing determined, fist pump in motivation pose",
    "fokus|utama": "standing laser-focused with target bullseye behind",
}

def extract_action(scene_text):
    """
    Extract contextually relevant action from narrative text.
    Tries to match keywords and generate appropriate action.
    Falls back to a neutral but non-generic action.
    """
    text_lower = scene_text.lower()

    # Find matching keywords
    for keyword, action in ACTION_KEYWORDS.items():
        if re.search(keyword, text_lower):
            return action

    # Fallback: neutral expressive actions (NOT generic "surprised")
    FALLBACK_ACTIONS = [
        "standing thoughtfully, hand on chin in deep consideration",
        "gesturing emphatically while explaining key points",
        "nodding with understanding, showing realization",
        "standing with arms crossed, analyzing the situation",
        "pointing at key elements while delivering the message",
    ]
    import random
    return FALLBACK_ACTIONS[hash(scene_text) % len(FALLBACK_ACTIONS)]


# ============================================================
# BUILD VISUAL PROMPT (per scene)
# ============================================================

def build_visual_prompt(scene_text, scene_index, is_abstract, overlay_words):
    """
    Build Gemini image prompt following Ilmu Lidi editor rules:
    1. [INDOOR] or [OUTDOOR] + universal location
    2. Character doing RELEVANT action (context-aware)
    3. Easter Egg (international pop culture)
    4. Text overlay ONLY if caps/emphasis detected (NO fallback)
    5. Style suffix
    6. Observer rule for abstract content
    """
    # Pick location based on scene index (alternating)
    if scene_index % 2 == 0:
        location = LOCATION_POOL_INDOOR[scene_index % len(LOCATION_POOL_INDOOR)]
        loc_prefix = "[INDOOR]"
    else:
        location = LOCATION_POOL_OUTDOOR[scene_index % len(LOCATION_POOL_OUTDOOR)]
        loc_prefix = "[OUTDOOR]"

    # Easter Egg
    easter = EASTER_EGGS[scene_index % len(EASTER_EGGS)]

    # Observer rule: abstract/metafora → character observes
    if is_abstract:
        action = f"{CHAR_NAME} standing on the side, observing and pointing at the concept"
    else:
        # Context-aware action extracted from narrative
        action = f"{CHAR_NAME} {extract_action(scene_text)}"

    # Build prompt (only include overlay if caps words found)
    prompt_parts = [f"{loc_prefix} - {location}.", f"{action}.", f"{easter}."]
    if overlay_words:
        prompt_parts.append(f'Text overlay "{" ".join(overlay_words)}" clearly visible on the image.')
    prompt_parts.append(STYLE)

    return " ".join(prompt_parts)

# ============================================================
# TTS
# ============================================================

def gemini_tts(text, out_wav):
    import base64, urllib.request
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": TTS_VOICE}}}
        }
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{TTS_MODEL}:generateContent?key={GEMINI_API_KEY}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                result = json.loads(resp.read())
            for part in result["candidates"][0]["content"]["parts"]:
                if "inlineData" in part:
                    pcm = base64.b64decode(part["inlineData"]["data"])
                    pcm_to_wav(pcm, out_wav)
                    return
            raise RuntimeError("No audio in response")
        except Exception as e:
            if attempt < 2:
                log(f"  TTS retry {attempt+1}: {e}", "err")
                time.sleep(5)
            else:
                raise

# ============================================================
# WHISPER
# ============================================================

def whisper_timestamp(audio_path):
    from faster_whisper import WhisperModel
    log("Loading Whisper small...", "wh")
    model = WhisperModel("small", device="cpu", compute_type="int8")
    log("Transcribing...", "wh")
    segments, info = model.transcribe(str(audio_path), language="id",
                                     word_timestamps=True, vad_filter=True)

    words = []
    segs = []
    for seg in segments:
        sdata = {"start": round(seg.start, 3), "end": round(seg.end, 3),
                 "text": seg.text.strip(), "words": []}
        if seg.words:
            for w in seg.words:
                wdata = {"word": w.word.strip(), "start": round(w.start, 3),
                         "end": round(w.end, 3), "prob": round(w.probability, 3)}
                words.append(wdata)
                sdata["words"].append(wdata)
        segs.append(sdata)
    log(f"Whisper: {len(words)} words, {len(segs)} segments", "ok")
    return words, segs

# ============================================================
# SCENE BUILDER (gap-free with Whisper timestamps)
# ============================================================

def build_scenes(scene_texts, words):
    """
    Build scenes with gap-free timing.
    scene_texts: list of text chunks (from detect_rapid_fire)
    words: Whisper word timestamps
    """
    scenes = []
    search_from = 0

    for scene_idx, scene_text in enumerate(scene_texts):
        sw = scene_text.split()
        if not sw:
            continue

        first_w = sw[0].lower().strip('.,!?')
        last_w = sw[-1].lower().strip('.,!?')

        w_start = None
        w_end = None
        w_end_idx = search_from

        # Find first word
        for wi in range(search_from, min(len(words), search_from + 50)):
            if words[wi]["word"].lower().strip('.,!?') == first_w:
                w_start = words[wi]["start"]
                w_end_idx = wi
                break

        # Find last word
        if w_start is not None:
            for wi in range(w_end_idx, min(len(words), w_end_idx + 80)):
                if words[wi]["word"].lower().strip('.,!?') == last_w:
                    w_end = words[wi]["end"]
                    w_end_idx = wi + 1
                    break

        # Fallback
        if w_start is None or w_end is None:
            prev_end = scenes[-1]["video_end"] if scenes else 0.0
            w_start = prev_end
            w_end = prev_end + len(sw) / 2.17
            w_end_idx = search_from
            log(f"  ⚠ Fallback: '{scene_text[:50]}...'", "gen")

        # GAP-FREE continuity
        video_start = scenes[-1]["video_end"] if scenes else w_start

        # Breathing room
        audio_dur = w_end - w_start
        breathing = min(audio_dur * 0.08, 0.5)
        video_end = w_end + breathing

        duration = max(video_end - video_start, 0.3)
        frames = max(int(duration * FPS), 9)

        # Abstract check
        is_abstract = is_abstract_text(scene_text)

        # Text overlay detection
        overlay_words = detect_text_overlay(scene_text)

        # Visual prompt
        visual_prompt = build_visual_prompt(scene_text, len(scenes), is_abstract, overlay_words)

        scenes.append({
            "index": len(scenes) + 1,
            "text": scene_text,
            "is_abstract": is_abstract,
            "word_idx_start": search_from,
            "word_idx_end": w_end_idx,
            "audio_start": round(w_start, 3),
            "audio_end": round(w_end, 3),
            "video_start": round(video_start, 3),
            "video_end": round(video_end, 3),
            "duration": round(duration, 3),
            "frames": frames,
            "breathing": round(breathing, 3),
            "overlay_words": overlay_words,
            "visual_prompt": visual_prompt,
        })
        search_from = w_end_idx

    return scenes

# ============================================================
# IMAGE GEN
# ============================================================

def gen_image(idx, prompt, out):
    import base64, urllib.request
    with open(CHAR_REF, 'rb') as f:
        ref = base64.b64encode(f.read()).decode()
    mime = "image/jpeg" if str(CHAR_REF).endswith(".jpg") else "image/png"
    parts = [
        {"inlineData": {"mimeType": mime, "data": ref}},
        {"text": f"Reference image 1 represents character: {CHAR_NAME}.\n\n"
                 f"Generate: \"{prompt}\"\n\n"
                 f"Use reference image for character consistency. "
                 f"Half-Body Shot minimum. Text overlay must be clear and legible."}
    ]
    payload = {"contents": [{"parts": parts}],
               "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{IMAGE_MODEL}:generateContent?key={GEMINI_API_KEY}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
            if "error" in result:
                raise RuntimeError(f"API Error: {result['error']}")
            if "candidates" not in result:
                raise RuntimeError(f"No candidates in response: {str(result)[:200]}")
            cand = result["candidates"][0]
            finish = cand.get("finishReason", "")
            if finish == "PROHIBITED_CONTENT":
                raise RuntimeError("PROHIBITED_CONTENT — prompt blocked by safety filter")
            if "content" not in cand or "parts" not in cand.get("content", {}):
                raise RuntimeError(f"No content/parts. finishReason={finish}")
            parts = cand["content"]["parts"]
            for part in parts:
                if "inlineData" in part:
                    with open(out, 'wb') as f:
                        f.write(base64.b64decode(part["inlineData"]["data"]))
                    return
            raise RuntimeError(f"No image in response. Parts: {len(parts)}")
        except Exception as e:
            if attempt < 2:
                log(f"  retry {attempt+1}: {e}", "err")
                time.sleep(5)
            else:
                raise

# ============================================================
# KEN BURNS
# ============================================================

def ken_burns(img, out, frames, zoom_in=True):
    W, H = RESOLUTION
    if zoom_in:
        z = f"min(zoom+{ZOOM/frames:.8f},{1+ZOOM})"
    else:
        z = f"if(eq(on\\,0)\\,{1+ZOOM}\\,max(zoom-{ZOOM/frames:.8f}\\,1))"
    dur = frames / FPS
    subprocess.run(['ffmpeg','-y','-loop','1','-i',str(img),
                   '-vf',(f'scale={UPSCALE}:-1,'
                          f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':"
                          f"y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS}"),
                   '-t',str(dur),'-pix_fmt','yuv420p','-c:v','libx264',
                   '-preset','fast','-crf','20',str(out)], capture_output=True)

# ============================================================
# MAIN
# ============================================================

def main():
    OUT.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("  🎬 DYNAMIC SCENE TIMING v4 — Ilmu Lidi Edition")
    print("  Rapid Fire + Easter Egg + Observer + Universal Location")
    print("=" * 60)

    (OUT/"narrative.txt").write_text(NARRATIVE)

    # 1. Rapid Fire detection
    print("\n📋 STEP 1: Scene Detection (Rapid Fire)")
    print("-" * 40)
    scene_texts = detect_rapid_fire(NARRATIVE)
    log(f"Narasi: {len(NARRATIVE.split())} kata → {len(scene_texts)} scene(s)")
    for i, t in enumerate(scene_texts):
        is_rf = " [RAPID FIRE]" if len(t.split()) > 15 else ""
        is_abs = " [ABSTRACT]" if is_abstract_text(t) else ""
        overlay = detect_text_overlay(t)
        overlay_str = f" | overlay: {overlay}" if overlay else ""
        log(f"  Scene {i+1:2d}: {len(t.split()):3d} kata{is_rf}{is_abs}{overlay_str}")
        log(f"    → {t[:80]}...")

    # 2. Paragraph split for TTS
    print("\n📋 STEP 2: Paragraphs (for TTS)")
    print("-" * 40)
    paras = [p.strip() for p in NARRATIVE.strip().split("\n\n") if p.strip()]
    log(f"TTS: {len(paras)} paragraph(s)")
    for i, p in enumerate(paras):
        log(f"  Para {i+1}: {len(p.split())} kata")

    # 3. Gemini TTS per paragraph
    print("\n🔊 STEP 3: Gemini TTS")
    print("-" * 40)
    tts_dir = OUT/"tts_chunks"
    tts_dir.mkdir()
    chunks = []
    for i, p in enumerate(paras):
        cw = tts_dir / f"c{i+1:03d}.wav"
        log(f"  Chunk {i+1}/{len(paras)} ({len(p.split())} kata)...", "tts")
        gemini_tts(p, cw)
        d = probe_duration(cw)
        chunks.append(cw)
        log(f"    → {d:.1f}s", "ok")
        time.sleep(2)

    full_wav = OUT/"full_audio.wav"
    concat_wavs(chunks, full_wav)
    full_dur = probe_duration(full_wav)
    log(f"Full audio: {full_dur:.1f}s", "ok")

    # 4. Whisper on actual audio
    print("\n📝 STEP 4: Whisper timestamps")
    print("-" * 40)
    words, segs = whisper_timestamp(full_wav)
    (OUT/"whisper_words.json").write_text(json.dumps(words, ensure_ascii=False, indent=2))
    (OUT/"whisper_segs.json").write_text(json.dumps(segs, ensure_ascii=False, indent=2))

    # 5. Build gap-free scenes with visual prompts
    print("\n⏱️  STEP 5: Gap-free scene timing + Visual prompts")
    print("-" * 40)
    scenes = build_scenes(scene_texts, words)
    (OUT/"scenes.json").write_text(json.dumps(scenes, ensure_ascii=False, indent=2))

    # Print scene summary
    total_gap = 0.0
    for i in range(1, len(scenes)):
        gap = scenes[i]["video_start"] - scenes[i-1]["video_end"]
        if gap > 0.01:
            total_gap += gap
        scenes[i]["_gap"] = gap

    total_vid = sum(s["frames"] for s in scenes) / FPS
    log(f"Scenes: {len(scenes)}, video: {total_vid:.1f}s, gap: {total_gap:.3f}s", "ok")
    for s in scenes:
        gap_str = f"gap={s.get('_gap', 0):+.3f}s" if "_gap" in s else ""
        log(f"  {s['index']:2d}: vid[{s['video_start']:5.2f}-{s['video_end']:5.2f}] "
            f"{s['duration']:5.2f}s/{s['frames']:3d}f "
            f"audio[{s['audio_start']:5.2f}-{s['audio_end']:5.2f}] "
            f"{gap_str}")

    # 6. Generate images
    print("\n🖼️  STEP 6: Images (with Easter Egg + Observer)")
    print("-" * 40)
    img_dir = OUT/"images"
    img_dir.mkdir()
    for s in scenes:
        p = img_dir / f"s{s['index']:03d}.png"
        if p.exists() and p.stat().st_size > 10000:
            log(f"  Scene {s['index']}: cached", "img")
            continue
        log(f"  Scene {s['index']}/{len(scenes)}:", "prm")
        log(f"    PROMPT: {s['visual_prompt'][:100]}...", "prm")
        gen_image(s['index'], s['visual_prompt'], p)
        log(f"    → {p.stat().st_size//1024}KB", "ok")
        time.sleep(3)

    # 7. Ken Burns
    print("\n🎬 STEP 7: Ken Burns")
    print("-" * 40)
    vid_dir = OUT/"video_parts"
    vid_dir.mkdir()
    for s in scenes:
        p = vid_dir / f"s{s['index']:03d}.mp4"
        if p.exists() and p.stat().st_size > 5000:
            log(f"  Scene {s['index']}: cached ({s['duration']:.1f}s, {s['frames']}f)", "vid")
            continue
        img = img_dir / f"s{s['index']:03d}.png"
        zi = s['index'] % 2 == 1
        log(f"  Scene {s['index']}/{len(scenes)}: {s['duration']:.1f}s, {s['frames']}f, "
            f"{'zoom-in' if zi else 'zoom-out'}", "vid")
        ken_burns(img, p, s['frames'], zi)

    # 8. Final render
    print("\n📼 STEP 8: Final render")
    print("-" * 40)
    concat = OUT/"concat.txt"
    with open(concat, 'w') as f:
        for s in scenes:
            v = vid_dir / f"s{s['index']:03d}.mp4"
            if v.exists():
                f.write(f"file '{v.absolute()}'\n")
    final = OUT/"video_final.mp4"
    subprocess.run(['ffmpeg','-y',
                   '-f','concat','-safe','0','-i',str(concat),
                   '-i',str(full_wav),
                   '-c:v','libx264','-profile:v','baseline','-level','3.1',
                   '-pix_fmt','yuv420p','-preset','medium','-crf','20',
                   '-c:a','aac','-b:a','128k','-ac','2',
                   '-movflags','+faststart','-shortest',str(final)],
                  capture_output=True)
    concat.unlink()

    dur = probe_duration(final)
    size = final.stat().st_size // 1024
    log(f"Final: {final}", "ok")
    log(f"  {dur:.1f}s | {size}KB | {RESOLUTION[0]}x{RESOLUTION[1]}", "ok")

    # Summary
    total_vid = sum(s["frames"] for s in scenes) / FPS
    fixed_vid = len(scenes) * 8.31
    print("\n" + "=" * 60)
    print(f"  ✅ DONE! Video: {dur:.1f}s ({len(scenes)} scenes)")
    print(f"  Gap-free: {'YES ✅' if total_gap < 0.01 else 'NO ❌'}")
    print(f"  vs Fixed 8.31s: saved {fixed_vid - total_vid:.1f}s")
    print("=" * 60)

if __name__ == "__main__":
    main()
