#!/usr/bin/env python3
"""Add a browser-gesture audio unlock export to the pinned Starfait web source."""
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("Usage: patch-starfait-web.py path/to/StarfaitRunner.kt")

source_path = Path(sys.argv[1])
text = source_path.read_text(encoding="utf-8")
marker = "@JsExport\nfun onKeyDown(key: Int) {"
addition = (
    "// Modified by the hmm webport build: expose browser audio resume on user input.\n"
    "@JsExport\n"
    "fun resumeAudioContext() {\n"
    "    (gRunner.audioManager as WebAudioManager).resumeAudioContext()\n"
    "}\n\n"
)

if "fun resumeAudioContext()" in text:
    print("Starfait audio resume export already exists; no patch needed.")
    raise SystemExit(0)
if text.count(marker) != 1:
    raise SystemExit("Pinned Starfait source no longer matches the expected patch location.")

source_path.write_text(text.replace(marker, addition + marker, 1), encoding="utf-8")
print("Patched Starfait web runner with resumeAudioContext() export.")
