# contact sheet with filename labels. usage: python3 qa/sheet.py out.jpg cols scale img...
import sys, os
from PIL import Image, ImageDraw
out, cols, scale, files = sys.argv[1], int(sys.argv[2]), float(sys.argv[3]), sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = int(ims[0].width * scale), int(ims[0].height * scale)
rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (w * cols, h * rows), (255, 255, 255))
for i, (im, f) in enumerate(zip(ims, files)):
    im = im.resize((w, h), Image.LANCZOS); d = ImageDraw.Draw(im); t = os.path.basename(f)[:-4]
    d.rectangle([0, 0, 8 + 7 * len(t), 18], fill=(0, 0, 0)); d.text((5, 3), t, fill=(255, 255, 255))
    sh.paste(im, ((i % cols) * w, (i // cols) * h))
sh.save(out, quality=88)
