# Usage: assemble.py <framedir> <out.webp>
import json, sys, glob
from PIL import Image

d, out = sys.argv[1:]
durations = json.load(open(f"{d}/durations.json"))
frames = [Image.open(p).convert("RGB") for p in sorted(glob.glob(f"{d}/*.png"))]
frames[0].save(out, save_all=True, append_images=frames[1:], duration=durations,
               loop=0, quality=75, method=6, minimize_size=True)
print(out, len(frames))
