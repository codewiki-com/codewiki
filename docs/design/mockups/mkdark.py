#!/usr/bin/env python3
"""Generate dark-theme variants of token-based artboards by swapping the token block."""
import re, sys, pathlib

DARK = """/* TOKENS:START dark */
      --bg:#0b1020; --sur:#111a2e; --sur2:#172341; --line:#22304f; --ink:#e9edf7; --ink2:#a8b1c9; --ink3:#8b95b3;
      --acc:#5ee1ff; --acc-h:#9eeeff; --acc-ink:#06111f; --acc-soft:rgba(94,225,255,0.14); --acc2:#ffbf47; --acc2-soft:rgba(255,191,71,0.14);
      --ok:#b7f0a1; --ok-soft:rgba(183,240,161,0.14); --warn:#ffbf47; --warn-soft:rgba(255,191,71,0.12); --bad:#ff7ab6; --bad-soft:rgba(255,122,182,0.12);
      --on-bg:#172341; --on-ink:#e9edf7; --glow: 0 0 0 1px rgba(94,225,255,0.25), 0 30px 80px -40px rgba(94,225,255,0.35);
      --code-bg:#0d1426; --code-line:#22304f; --code-ink:#dbe2f3; --code-out:#0b1020; --k:#ff7ab6; --s:#b7f0a1; --f:#5ee1ff; --c:#7f8bad; --n:#ffbf47; --run-bg:#5ee1ff; --run-ink:#06111f;
    /* TOKENS:END */"""

pat = re.compile(r"/\* TOKENS:START \w+ \*/.*?/\* TOKENS:END \*/", re.S)

def convert(src: str, dst: str) -> None:
    text = pathlib.Path(src).read_text(encoding="utf-8")
    if not pat.search(text):
        sys.exit(f"no token block in {src}")
    pathlib.Path(dst).write_text(pat.sub(DARK, text), encoding="utf-8")
    print(f"{src} -> {dst}")

if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) % 2:
        sys.exit("usage: mkdark.py SRC DST [SRC DST ...]")
    for i in range(0, len(args), 2):
        convert(args[i], args[i + 1])
