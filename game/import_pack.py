#!/usr/bin/env python3
"""Merge a herogame-pack zip into assets/game and update index.json.

The fighting game never talks to the art studio. Colleagues export a pack
from the studio; you drop it here (or pass --import to serve.py).
"""

from __future__ import annotations

import argparse
import json
import shutil
import zipfile
from pathlib import Path

PACK_FORMAT = "herogame-pack"
PACK_VERSION = 1
SKIP_DIR_NAMES = {"_bak", "__pycache__"}
SKIP_FILE_NAMES = {".ds_store", "thumbs.db"}

GAME_ROOT = Path(__file__).resolve().parent
DEFAULT_ASSETS = GAME_ROOT.parent / "assets" / "game"


def _read_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def _write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def refresh_index(assets: Path) -> dict:
    heroes = sorted(
        p.parent.name
        for p in assets.glob("heroes/*/fighter.json")
        if p.is_file()
    )
    stages = sorted(
        p.parent.name
        for p in assets.glob("stages/*/stage.json")
        if p.is_file()
    )
    data = {
        "heroes": heroes,
        "stages": stages,
        "style": (assets / "style" / "style.png").is_file(),
    }
    _write_json(assets / "index.json", data)
    return data


def _safe_member(name: str) -> Path | None:
    raw = name.replace("\\", "/").strip()
    if not raw or raw.endswith("/"):
        return None
    if raw.startswith("/") or raw.startswith("..") or "/../" in f"/{raw}/":
        return None
    path = Path(raw)
    if path.is_absolute() or ".." in path.parts:
        return None
    if any(part in SKIP_DIR_NAMES for part in path.parts):
        return None
    if path.name.lower() in SKIP_FILE_NAMES:
        return None
    return path


def import_pack(zip_path: Path, assets: Path) -> dict:
    zip_path = zip_path.expanduser().resolve()
    assets = assets.expanduser().resolve()
    if not zip_path.is_file():
        raise FileNotFoundError(f"找不到数据包：{zip_path}")
    assets.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        if "pack.json" not in names:
            raise ValueError("不是英雄/地图数据包（缺少 pack.json）。请用工坊「导出数据包」。")
        try:
            meta = json.loads(zf.read("pack.json").decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise ValueError(f"pack.json 读不出来：{exc}") from exc
        if not isinstance(meta, dict) or meta.get("format") != PACK_FORMAT:
            raise ValueError("pack.json 格式不对。")
        try:
            version = int(meta.get("version") or 1)
        except (TypeError, ValueError) as exc:
            raise ValueError("pack.json version 无效。") from exc
        if version > PACK_VERSION:
            raise ValueError(f"数据包版本 {version} 比游戏支持的 {PACK_VERSION} 新，请更新对战端。")

        heroes = [str(x.get("id") or "") for x in (meta.get("heroes") or []) if isinstance(x, dict)]
        stages = [str(x.get("id") or "") for x in (meta.get("stages") or []) if isinstance(x, dict)]
        written = 0
        for name in names:
            if name == "pack.json":
                continue
            rel = _safe_member(name)
            if rel is None:
                continue
            parts = rel.parts
            if len(parts) < 2 or parts[0] not in {"heroes", "stages"}:
                continue
            dest = assets / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(name) as src, dest.open("wb") as out:
                shutil.copyfileobj(src, out)
            written += 1

    index = refresh_index(assets)
    return {
        "ok": True,
        "file": str(zip_path),
        "heroes": [h for h in heroes if h],
        "stages": [s for s in stages if s],
        "files": written,
        "index": index,
    }


def import_incoming(incoming: Path, assets: Path) -> list[dict]:
    incoming.mkdir(parents=True, exist_ok=True)
    done = incoming / "_done"
    done.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []
    for path in sorted(incoming.glob("*.zip")):
        try:
            info = import_pack(path, assets)
            dest = done / path.name
            if dest.exists():
                dest.unlink()
            shutil.move(str(path), str(dest))
            info["movedTo"] = str(dest)
            results.append(info)
        except Exception as exc:  # noqa: BLE001
            results.append({"ok": False, "file": str(path), "error": str(exc)})
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="把工坊导出的 .hgpk.zip 并入对战 assets/game")
    parser.add_argument("zip_path", type=Path, help="数据包路径")
    parser.add_argument(
        "--assets",
        type=Path,
        default=DEFAULT_ASSETS,
        help="对战资源目录（默认 ../assets/game）",
    )
    args = parser.parse_args()
    info = import_pack(args.zip_path, args.assets)
    print(
        f"已导入 {info['files']} 个文件 · 英雄 {len(info['heroes'])} · 地图 {len(info['stages'])}",
        flush=True,
    )
    for hid in info["heroes"]:
        print(f"  英雄 {hid}", flush=True)
    for sid in info["stages"]:
        print(f"  地图 {sid}", flush=True)
    print(f"名单 {args.assets / 'index.json'}", flush=True)


if __name__ == "__main__":
    main()
