#!/usr/bin/env python3
"""Fast local checks; add --lan-url to exercise an already-running play server."""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys
import os


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lan-url', help='Example: http://127.0.0.1:8788 (server must already be running)')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    node = shutil.which('node')
    if not node:
        raise SystemExit('检查需要 Node.js 22 或更高版本；运行游戏本身无需 Node.js。')
    for source in root.glob('*.py'):
        compile(source.read_text(encoding='utf-8'), str(source), 'exec')
    for source in sorted((root / 'src').glob('*.js')):
        subprocess.run([node, '--check', str(source)], check=True)
    subprocess.run([node, '--test', *map(str, sorted((root / 'tests').glob('*.test.cjs')))], check=True)
    if args.lan_url:
        env = {**os.environ, 'HEROGAME_URL': args.lan_url}
        subprocess.run([node, str(root / 'tests' / 'lan-smoke.cjs')], check=True, env=env)
    print('PASS: Python syntax, JavaScript syntax, regression checks' + (', LAN integration' if args.lan_url else ''))


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.exit(error.returncode)
