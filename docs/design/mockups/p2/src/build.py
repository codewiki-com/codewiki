#!/usr/bin/env python3
"""Assemble the P2 mockup artboards from the shared head, nav and per-page bodies.

Usage: python3 build.py            (writes ../*.dc.html and the dark variants)

Each `*.body.html` starts with `<!-- active: <nav key> -->`; that nav item is rendered in the
ink colour, the same way the P1 mockups mark the current section. `{{NAV}}` is replaced by the
shared nav. Dark variants are generated with ../../mkdark.py so the token swap stays in one place.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent
OUT = SRC.parent
MKDARK = OUT.parent / 'mkdark.py'
DARK = {'Kata', 'Flashcards', 'PromptBuilder'}

head = (SRC / 'head.part.html').read_text(encoding='utf-8')
nav = (SRC / 'nav.part.html').read_text(encoding='utf-8')
tail = '</x-dc>\n</body>\n</html>\n'

for body_path in sorted(SRC.glob('*.body.html')):
    name = body_path.name.removesuffix('.body.html')
    body = body_path.read_text(encoding='utf-8')
    m = re.match(r'<!-- active: (\w+) -->\n', body)
    active = m.group(1) if m else ''
    body = body[m.end():] if m else body
    page_nav = nav.replace(f'data-nav="{active}"', f'data-nav="{active}" style="color: var(--ink);"')
    if active == 'ai':
        page_nav = nav  # the AI-era item is already accented
    html = head + body.replace('{{NAV}}', page_nav) + tail
    out = OUT / f'{name}.dc.html'
    out.write_text(html, encoding='utf-8')
    print('wrote', out.relative_to(OUT.parent), len(html.splitlines()), 'lines')
    if name in DARK:
        dark = OUT / f'{name}Dark.dc.html'
        subprocess.run([sys.executable, str(MKDARK), str(out), str(dark)], check=True)
        print('wrote', dark.relative_to(OUT.parent))
