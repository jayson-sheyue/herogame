#!/usr/bin/env python3
"""Fast local syntax and PVE regression checks."""
from pathlib import Path
import shutil
import subprocess
import sys


def main():
    root = Path(__file__).resolve().parent
    node = shutil.which('node')
    if not node:
        raise SystemExit('检查需要 Node.js 22 或更高版本；运行游戏本身无需 Node.js。')
    for source in root.glob('*.py'):
        compile(source.read_text(encoding='utf-8'), str(source), 'exec')
    for source in sorted((root / 'src').glob('*.js')):
        subprocess.run([node, '--check', str(source)], check=True)
    subprocess.run([node, '--test', *map(str, sorted((root / 'tests').glob('*.test.cjs')))], check=True)
    print('PASS: Python syntax, JavaScript syntax, regression checks')


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.exit(error.returncode)
