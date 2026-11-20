#!/usr/bin/env python3
"""Export the tracked game to a self-contained Pages / itch.io HTML5 build."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

from PIL import Image
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def preview(source: Path, output: Path, *, frame=None, size=None, lossless=True) -> str:
    with Image.open(source) as image:
        if frame:
            image = image.crop((0, 0, *frame))
        if size:
            image.thumbnail(size, Image.Resampling.LANCZOS)
        name = f"{source.stem}-{digest(image.tobytes())}.webp"
        output.mkdir(parents=True, exist_ok=True)
        image.save(output / name, "WEBP", lossless=lossless, exact=lossless, quality=88, method=4)
    return name


def validate(site: Path):
    files = [p for p in site.rglob("*") if p.is_file()]
    total = sum(p.stat().st_size for p in files)
    if not (site / "index.html").is_file():
        raise ValueError("index.html must be at the ZIP root")
    if len(files) > 1000 or total > 500_000_000:
        raise ValueError("Build exceeds itch.io's 1,000 file / 500 MB extracted limits")
    for path in files:
        relative = path.relative_to(site).as_posix()
        if len(relative) > 240 or path.stat().st_size > 200_000_000:
            raise ValueError(f"itch.io path or single-file limit exceeded: {relative}")
        if path.suffix in {".html", ".css", ".js"} and "vendor" not in path.parts:
            text = path.read_text(encoding="utf-8")
            if re.search(r'''(?:["'`(])/+(?:assets|src|fonts|vendor)/''', text):
                raise ValueError(f"Root-relative URL breaks embedded hosting: {relative}")
    def check_refs(value, parent):
        if isinstance(value, dict):
            for key, item in value.items():
                if key in {"file", "bgm", "preview"} and isinstance(item, str):
                    target = (parent / item).resolve()
                    if not target.is_relative_to(site.resolve()) or not target.is_file():
                        raise ValueError(f"Missing or unsafe published asset: {parent.name}/{item}")
                else:
                    check_refs(item, parent)
        elif isinstance(value, list):
            for item in value:
                check_refs(item, parent)
    for path in [*site.glob("assets/game/heroes/*/fighter.json"), *site.glob("assets/game/stages/*/stage.json")]:
        check_refs(read_json(path), path.parent)
    for path in [site / "index.html", site / "src/ui.css"]:
        text = path.read_text(encoding="utf-8")
        for url in re.findall(r'(?:src|href)="([^"]+)"|url\("([^"]+)"\)', text):
            url = (url[0] or url[1]).split("?")[0]
            if not (path.parent / url).is_file():
                raise ValueError(f"Missing page dependency: {url}")
    return {"files": len(files), "bytes": total}


def build(source: Path, output: Path):
    """Create a fresh output atomically; never copy untracked imports or local data."""
    source, output = source.resolve(), output.resolve()
    if output.exists():
        raise ValueError(f"Output already exists; choose a fresh directory: {output}")
    # Git's tracked allowlist excludes local packs, backups, credentials and editor files.
    tracked = subprocess.check_output(
        ["git", "-C", str(source), "ls-files", "-z", "assets/game"], text=True
    ).split("\0")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".herogame-", dir=output.parent) as temp:
        site = Path(temp) / "site"
        site.mkdir()
        for name in tracked:
            if name:
                target = site / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source / name, target)
        for name in ["index.html", "src", "vendor"]:
            src = source / "game" / name
            if src.is_dir():
                shutil.copytree(src, site / name)
            else:
                shutil.copy2(src, site / name)
        shutil.copy2(source / "LICENSE", site / "LICENSE")
        (site / ".nojekyll").touch()
        assets = site / "assets/game"
        catalog = read_json(assets / "index.json")
        code = (site / "src/game.js").read_text(encoding="utf-8")
        hidden = set(re.findall(r'"([^"]+)"', re.search(r'const HIDDEN_HEROES = new Set\(\[([\s\S]*?)\]\)', code)[1]))
        fighters = {}
        for hero in catalog["heroes"]:
            path = assets / "heroes" / hero / "fighter.json"
            fighter = read_json(path)
            if hero in hidden or not fighter.get("sprites", {}).get("idle", {}).get("file"):
                shutil.rmtree(path.parent)
                continue
            # Selection uses frame zero. Preserve its exact pixels and geometry;
            # don't download entire animation sheets just to draw a still pose.
            fighter["previewSprites"] = {}
            for slot in ["select", "idle", "turnaround"]:
                spec = fighter.get("sprites", {}).get(slot)
                if not spec or not spec.get("file"):
                    continue
                options = ({"size": (320, 320), "lossless": False} if slot == "select" else
                           {"frame": (spec["frameWidth"], spec["frameHeight"])})
                name = preview(path.parent / spec["file"], path.parent / "previews", **options)
                fighter["previewSprites"][slot] = {**spec, "file": f"previews/{name}", "frames": 1}
            fighters[hero] = fighter
        catalog["heroes"] = list(fighters)
        for path in (assets / "heroes").iterdir():
            if path.is_dir() and path.name not in fighters:
                shutil.rmtree(path)
        # Lossless WebP reduces battle downloads without changing sprite pixels,
        # frame sizes, chroma-key colors, pivots or collision geometry.
        sheets = list((assets / "heroes").rglob("*.png"))
        def convert_sheet(path):
            name = preview(path, path.parent)
            with Image.open(path) as original, Image.open(path.parent / name) as converted:
                if original.convert("RGBA").tobytes() != converted.convert("RGBA").tobytes():
                    raise ValueError(f"Lossless sprite pixel mismatch: {path.name}")
            path.unlink()
            return path.relative_to(assets / "heroes").as_posix(), name
        with ThreadPoolExecutor(max_workers=4) as pool:
            converted = dict(pool.map(convert_sheet, sheets))
        def replace_sheets(value, hero):
            if isinstance(value, dict):
                for key, item in value.items():
                    if key == "file" and isinstance(item, str) and f"{hero}/{item}" in converted:
                        value[key] = str(Path(item).with_name(converted[f"{hero}/{item}"])).replace("\\", "/")
                    else:
                        replace_sheets(item, hero)
            elif isinstance(value, list):
                for item in value:
                    replace_sheets(item, hero)
        for hero, fighter in fighters.items():
            replace_sheets(fighter, hero)
        stages = {}
        for stage in catalog["stages"]:
            path = assets / "stages" / stage / "stage.json"
            meta = read_json(path)
            original = path.parent / meta.get("file", "stage.png")
            meta["preview"] = preview(original, path.parent, size=(768, 432), lossless=False)
            # Arena art is opaque, unlike color-keyed fighter sheets. WebP keeps
            # its full dimensions/collision alignment with a much smaller download.
            meta["file"] = preview(original, path.parent, lossless=False)
            original.unlink()
            write_json(path, meta)
            stages[stage] = meta
        write_json(assets / "index.json", catalog)
        for hero, fighter in fighters.items():
            write_json(assets / "heroes" / hero / "fighter.json", fighter)

        # Include all characters used by code and published metadata. The local
        # importer continues to use the complete original fonts.
        text = "".join(p.read_text(encoding="utf-8") for p in [site / "index.html", *sorted((site / "src").glob("*"))])
        text += json.dumps([fighters, stages], ensure_ascii=False) + "".join(chr(n) for n in range(32, 127))
        css = site / "src/ui.css"
        style = css.read_text(encoding="utf-8")
        (site / "fonts").mkdir()
        for name in ["GameUI", "BrushUI"]:
            options = subset.Options()
            options.flavor = "woff2"
            font = subset.load_font(str(source / f"game/fonts/{name}.ttf"), options)
            subsetter = subset.Subsetter(options=options)
            subsetter.populate(text=text)
            subsetter.subset(font)
            target = site / f"fonts/{name}.woff2"
            subset.save_font(font, str(target), options)
            font.close()
            style = style.replace(f"{name}.ttf\") format(\"truetype\")", f"{name}.woff2\") format(\"woff2\")")
        css.write_text(style, encoding="utf-8")

        payload = {"catalog": catalog, "fighters": fighters, "stages": stages}
        revision = digest(json.dumps(payload, ensure_ascii=False).encode() + b"".join(p.read_bytes() for p in sorted((site / "src").glob("*"))))
        payload["revision"] = revision
        config = "web-config.js"
        (site / config).write_text("window.HeroWeb=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
        index = (site / "index.html").read_text(encoding="utf-8")
        index = re.sub(r'(src|href)="(\./src/[^"?]+)(?:\?[^" ]*)?"', rf'\1="\2?v={revision}"', index)
        index = index.replace('    <script src="./src/game.js', f'    <script src="./{config}?v={revision}"></script>\n    <script src="./src/game.js')
        (site / "index.html").write_text(index, encoding="utf-8")
        info = {"revision": revision, "fighters": len(fighters), "stages": len(stages)}
        write_json(site / "build-info.json", info)
        stats = {**validate(site), **info}
        site.rename(output)
    zip_path = output.with_name(output.name + "-itch.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(output.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(output).as_posix())
    print(json.dumps({**stats, "zip": str(zip_path), "zip_bytes": zip_path.stat().st_size}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path, default=ROOT / "dist/herogame")
    args = parser.parse_args()
    build(args.source, args.output)
