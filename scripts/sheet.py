# usage: python3 scripts/sheet.py out.png cols img1 img2 ... [--label]   (contact sheet; --label stamps the progress % parsed from the filename)
import sys, re
from PIL import Image, ImageDraw
args = [x for x in sys.argv[1:] if x != '--label']
label = '--label' in sys.argv
out, cols, files = args[0], int(args[1]), args[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (w * cols, h * rows))
for i, (im, f) in enumerate(zip(ims, files)):
    if label:
        m = re.search(r'-([0-9.]+)\.png$', f)
        if m:
            d = ImageDraw.Draw(im)
            t = f"{float(m.group(1)) * 100:.0f}%"
            d.rectangle([0, 0, 13 + 9 * len(t), 22], fill=(0, 0, 0))
            d.text((6, 5), t, fill=(255, 210, 120))
    sh.paste(im, ((i % cols) * w, (i // cols) * h))
sh.save(out)
