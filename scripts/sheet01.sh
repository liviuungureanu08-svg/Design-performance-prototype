#!/bin/bash
# contact sheet: sheet01.sh out.jpg "<query>" WxH p1 p2 ...
out=$1; q=$2; size=$3; shift 3
i=0; files=()
for p in "$@"; do f=/tmp/s/sh_$i.png; node scripts/shot01.mjs $f "p=$p&$q" $size >/dev/null; files+=($f); i=$((i+1)); done
python3 - "$out" "${files[@]}" <<'PY'
import sys
from PIL import Image
out=sys.argv[1]; fs=sys.argv[2:]
ims=[Image.open(f).convert('RGB') for f in fs]
cols=3 if len(ims)>3 else len(ims)
w,h=ims[0].size; sc=0.5 if w>900 else 0.6
tw,th=int(w*sc),int(h*sc)
rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*tw,rows*th),'white')
for i,im in enumerate(ims): sheet.paste(im.resize((tw,th)),((i%cols)*tw,(i//cols)*th))
sheet.save(out,quality=88)
PY
