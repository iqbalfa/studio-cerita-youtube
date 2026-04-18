# Studio Cerita — Video Production Pipeline

## Setup

```bash
# Set API key
export GEMINI_API_KEY="your-key-here"

# Pastikan characters ada
ls ~/studio-cerita/characters/
# → Ilmu Lidi.jpg, Ilmu Survival.jpg, Ilmu Nyantuy.jpg
```

## Usage

### Single Video
```bash
cd ~/studio-cerita/pipeline

# Dari teks langsung
python3 pipeline.py --narrative "Ternyata selama ini..." --channel ilmu-lidi

# Dari file
python3 pipeline.py --narrative-file scripts/test_ilmu_lidi.txt --channel ilmu-lidi

# Custom output directory
python3 pipeline.py --narrative-file script.txt --channel ilmu-lidi --output ~/videos/001
```

### Batch (Mass Production)
```bash
# Taruh semua script .txt di satu folder
mkdir -p ~/scripts/
# script_001.txt, script_002.txt, ...

# Jalankan batch
python3 batch.py --input-dir ~/scripts/ --channel ilmu-lidi

# Output: ~/studio-cerita/output/batch_ilmu-lidi_<timestamp>/
#   ├── 001_script_001/
#   │   ├── narrative.txt
#   │   ├── scenes.json
#   │   ├── images/
#   │   ├── video_parts/
#   │   ├── tts_audio.wav
#   │   └── video_final.mp4
#   ├── 002_script_002/
#   └── ...
```

### Resume / Skip Steps
```bash
# Skip image generation (pakai gambar yang sudah ada)
python3 pipeline.py --narrative-file script.txt --channel ilmu-lidi --skip-images

# Skip TTS (pakai audio yang sudah ada)
python3 pipeline.py --narrative-file script.txt --channel ilmu-lidi --skip-tts

# Skip video render (hanya generate gambar + TTS)
python3 pipeline.py --narrative-file script.txt --channel ilmu-lidi --skip-video
```

## Pipeline Steps

```
1. Break Narrative → Scenes (Hermes/sentence splitting)
2. Generate Visual Prompts → Gemini 2.5 Flash
3. Generate Images → Gemini 3.1 Flash Image Preview
4. Generate TTS → Gemini 2.5 Pro Preview TTS
5. Ken Burns Effect → FFmpeg (upscale 8000px → zoompan)
6. Final Render → FFmpeg (concat + audio + mobile profile)
```

## Supported Channels

| Channel | Character Ref | TTS Voice |
|---------|--------------|-----------|
| ilmu-lidi | Ilmu Lidi.jpg | Iapetus |
| ilmu-survival | Ilmu Survival.jpg | Iapetus |
| ilmu-nyantuy | Ilmu Nyantuy.jpg | Iapetus |

## Adding New Characters

1. Place character image in `~/studio-cerita/characters/`
2. Filename must match character name (e.g., "Pak Tani.jpg")
3. Add to CHANNELS dict in pipeline.py if it's a new channel

## Output Specs

- Resolution: 1920×1080 (16:9)
- FPS: 30
- Video: H.264 Baseline (mobile compatible)
- Audio: AAC 128kbps stereo
- Zoom: 8% smooth Ken Burns (alternating in/out)
- Duration: matches TTS length (~8s per scene)
