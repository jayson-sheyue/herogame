#!/usr/bin/env python3
"""Local PVE play server. Serves game/ and assets/game using the standard library."""
from __future__ import annotations
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

GAME_ROOT = Path(__file__).resolve().parent
ASSETS_GAME = GAME_ROOT.parent / "assets" / "game"
PORT = 8788

class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def translate_path(self, path: str) -> str:
        parsed = unquote(urlparse(path).path)
        if parsed.startswith("/assets/game/"):
            rel = Path(parsed[len("/assets/game/") :])
            target = (ASSETS_GAME / rel).resolve()
            try:
                target.relative_to(ASSETS_GAME.resolve())
            except ValueError:
                return str(ASSETS_GAME / "_forbidden")
            return str(target)
        rel = Path(parsed.lstrip("/"))
        if not parsed or parsed == "/":
            return str(GAME_ROOT / "index.html")
        target = (GAME_ROOT / rel).resolve()
        try:
            target.relative_to(GAME_ROOT)
        except ValueError:
            return str(GAME_ROOT / "index.html")
        return str(target)

    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args), flush=True)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def main() -> None:
    global ASSETS_GAME
    parser = argparse.ArgumentParser(description="HeroGame playtest server")
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: localhost)")
    parser.add_argument(
        "--assets",
        type=Path,
        default=ASSETS_GAME,
        help="Runtime assets folder (default: ../assets/game)",
    )
    parser.add_argument(
        "--import",
        dest="import_zips",
        action="append",
        default=[],
        metavar="ZIP",
        help="Import a herogame-pack zip (repeatable), then start",
    )
    parser.add_argument(
        "--import-only",
        action="store_true",
        help="Import packs and exit (do not start the server)",
    )
    parser.add_argument(
        "--no-incoming",
        action="store_true",
        help="Do not auto-import game/incoming/*.zip on startup",
    )
    args = parser.parse_args()
    ASSETS_GAME = args.assets.expanduser().resolve()
    ASSETS_GAME.mkdir(parents=True, exist_ok=True)

    from import_pack import import_incoming, import_pack

    for zip_path in args.import_zips:
        info = import_pack(Path(zip_path), ASSETS_GAME)
        print(
            f"已导入 {Path(zip_path).name} · {info['files']} 文件 · "
            f"英雄 {len(info['heroes'])} · 地图 {len(info['stages'])}",
            flush=True,
        )
    if not args.no_incoming:
        incoming = GAME_ROOT / "incoming"
        for info in import_incoming(incoming, ASSETS_GAME):
            if info.get("ok"):
                print(
                    f"incoming 已导入 {Path(info['file']).name} · "
                    f"英雄 {len(info.get('heroes') or [])} · 地图 {len(info.get('stages') or [])}",
                    flush=True,
                )
            else:
                print(f"incoming 跳过 {info.get('file')}: {info.get('error')}", flush=True)

    if args.import_only:
        return

    if not ASSETS_GAME.is_dir():
        raise SystemExit(f"找不到运行时资源：{ASSETS_GAME}")
    try:
        httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as err:
        raise SystemExit(f"无法监听 {args.host}:{args.port} — {err}") from err

    print(f"试玩本机 http://127.0.0.1:{args.port}", flush=True)
    print(f"只读资源 {ASSETS_GAME}", flush=True)
    print("新英雄/地图：把工坊导出的 .hgpk.zip 放到 game/incoming/ 或 --import 导入，不必开工坊。", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停。", flush=True)
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
