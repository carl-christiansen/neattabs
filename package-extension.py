#!/usr/bin/env python3
"""Creates a clean Chrome Web Store submission ZIP containing only runtime extension files."""

import json
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "manifest.json"

INCLUDE_FILES = [
    "manifest.json",
    "background.js",
    "shared.js",
    "options.html",
    "options.js",
    "options.css",
]

INCLUDE_DIRS = [
    "icons",
]


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    name_slug = manifest["name"].lower().replace(" ", "-")
    version = manifest["version"]
    output_path = ROOT / f"{name_slug}-v{version}.zip"

    files_to_pack: list[pathlib.Path] = []
    for rel in INCLUDE_FILES:
        path = ROOT / rel
        if not path.is_file():
            raise FileNotFoundError(f"Required extension file missing: {rel}")
        files_to_pack.append(path)

    for rel_dir in INCLUDE_DIRS:
        dir_path = ROOT / rel_dir
        if not dir_path.is_dir():
            raise FileNotFoundError(f"Required directory missing: {rel_dir}")
        for path in sorted(dir_path.rglob("*")):
            if path.is_file() and not path.name.startswith("."):
                files_to_pack.append(path)

    if output_path.exists():
        output_path.unlink()

    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in files_to_pack:
            arcname = path.relative_to(ROOT).as_posix()
            zf.write(path, arcname)

    size_kb = output_path.stat().st_size / 1024
    print(f"Created {output_path.name} ({size_kb:.1f} KB) with {len(files_to_pack)} files:")
    for path in files_to_pack:
        print(f"  - {path.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
