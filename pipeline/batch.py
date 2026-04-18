#!/usr/bin/env python3
"""
Studio Cerita — Batch Video Production
Process multiple scripts in sequence.

Usage:
    python3 batch.py --input-dir ~/scripts/ --channel ilmu-lidi
    python3 batch.py --input-dir ~/scripts/ --channel ilmu-lidi --parallel 3
"""

import argparse
import os
import sys
import time
from pathlib import Path
from datetime import datetime

# Import pipeline
sys.path.insert(0, str(Path(__file__).parent))
from pipeline import run_pipeline, CHANNELS


def run_batch(input_dir, channel, output_base, api_key, parallel=1):
    """Process all .txt files in input_dir as separate videos."""
    input_dir = Path(input_dir)
    scripts = sorted(input_dir.glob("*.txt"))
    
    if not scripts:
        print(f"❌ No .txt files found in {input_dir}")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print(f"  🏭 STUDIO CERITA — Batch Production")
    print(f"  Channel: {CHANNELS[channel]['name']}")
    print(f"  Scripts: {len(scripts)}")
    print(f"  Output:  {output_base}")
    print("=" * 60)
    print()
    
    results = {"success": [], "failed": []}
    start_batch = time.time()
    
    for idx, script_path in enumerate(scripts, 1):
        video_name = script_path.stem
        output_dir = Path(output_base) / f"{idx:03d}_{video_name}"
        
        print(f"\n{'='*60}")
        print(f"  📹 VIDEO {idx}/{len(scripts)}: {video_name}")
        print(f"{'='*60}\n")
        
        with open(script_path, 'r') as f:
            narrative = f.read()
        
        try:
            run_pipeline(narrative, channel, output_dir, api_key)
            results["success"].append(video_name)
        except Exception as e:
            print(f"\n  ❌ FAILED: {e}")
            results["failed"].append((video_name, str(e)))
        
        # Brief pause between videos
        if idx < len(scripts):
            print(f"\n  ⏳ Cooling down 10s before next video...")
            time.sleep(10)
    
    elapsed = time.time() - start_batch
    
    print()
    print("=" * 60)
    print(f"  🏭 BATCH COMPLETE!")
    print(f"  Total time: {int(elapsed//60)}m {int(elapsed%60)}s")
    print(f"  Success:    {len(results['success'])}/{len(scripts)}")
    print(f"  Failed:     {len(results['failed'])}")
    if results["failed"]:
        print(f"  Failed videos:")
        for name, err in results["failed"]:
            print(f"    ❌ {name}: {err[:60]}")
    print("=" * 60)
    print()


def main():
    parser = argparse.ArgumentParser(description="Batch Video Production")
    parser.add_argument("--input-dir", type=str, required=True,
                        help="Directory containing .txt script files")
    parser.add_argument("--channel", type=str, required=True, choices=list(CHANNELS.keys()))
    parser.add_argument("--output", type=str, default=None,
                        help="Output base directory")
    parser.add_argument("--api-key", type=str, default=None)
    
    args = parser.parse_args()
    
    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Set GEMINI_API_KEY or use --api-key")
        sys.exit(1)
    
    output_base = args.output or str(
        Path.home() / "studio-cerita" / "output" / 
        f"batch_{args.channel}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    )
    
    run_batch(args.input_dir, args.channel, output_base, api_key)


if __name__ == "__main__":
    main()
