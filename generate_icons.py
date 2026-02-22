#!/usr/bin/env python3
"""Generate LoveSpark extension icons using Pillow."""

from PIL import Image, ImageDraw, ImageFont
import os

primary = "#6C3CE0"
accent = "#FFB3D9"
sizes = [16, 48, 128]

os.makedirs("icons", exist_ok=True)

for size in sizes:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Circle shape
    margin = size * 0.08
    draw.ellipse([margin, margin, size - margin, size - margin], fill=primary)
    inner_margin = size * 0.16
    draw.ellipse([inner_margin, inner_margin, size - inner_margin, size - inner_margin], fill=accent)

    # Draw center symbol
    try:
        font_size = int(size * 0.4)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", font_size)
        except OSError:
            font = ImageFont.load_default()
    text = "\u263d"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, (size - th) / 2 - bbox[1]), text, fill="white", font=font)
    img.save(f"icons/icon-{size}.png")
    print(f"Generated icons/icon-{size}.png")

print("Done! All icons generated.")
