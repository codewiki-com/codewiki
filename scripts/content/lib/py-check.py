#!/usr/bin/env python3
"""Syntax-check a Python snippet read from stdin.

Prints ``OK`` and exits 0 when the snippet parses, otherwise prints
``line N: message`` and exits 1. Called once per fenced code block by
``scripts/content/lib/code-check.ts``; keep it dependency-free and fast to start.
"""

import ast
import sys


def main() -> int:
    source = sys.stdin.read()
    try:
        ast.parse(source)
    except SyntaxError as error:
        print(f"line {error.lineno or 1}: {error.msg}")
        return 1
    except ValueError as error:
        # Raised instead of SyntaxError for sources containing null bytes.
        print(f"line 1: {error}")
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
