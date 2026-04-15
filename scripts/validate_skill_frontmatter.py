#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from pathlib import Path


REQUIRED_FIELDS = (
    "name",
    "description",
    "domain",
    "resourceFilename",
)


def extract_frontmatter(text: str) -> str | None:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None

    frontmatter_lines: list[str] = []
    for line in lines[1:]:
        if line.strip() == "---":
            return "\n".join(frontmatter_lines)
        frontmatter_lines.append(line)

    return None


def parse_frontmatter(frontmatter: str, path: Path) -> tuple[dict[str, str], list[str]]:
    data: dict[str, str] = {}
    errors: list[str] = []
    current_key: str | None = None
    current_value_lines: list[str] = []

    def commit_current() -> None:
        nonlocal current_key, current_value_lines
        if current_key is None:
            return
        value = "\n".join(current_value_lines).strip()
        if current_key in data:
            errors.append(f"{path}: duplicate frontmatter key '{current_key}'")
        else:
            data[current_key] = value
        current_key = None
        current_value_lines = []

    for index, line in enumerate(frontmatter.splitlines(), start=2):
        if re.match(r"^[A-Za-z0-9_-]+:\s*.*$", line):
            commit_current()
            key, value = line.split(":", 1)
            current_key = key.strip()
            current_value_lines = [value.strip()]
            continue

        if line.startswith((" ", "\t")):
            if current_key is None:
                errors.append(f"{path}:{index}: unexpected indented frontmatter line")
                continue
            current_value_lines.append(line.strip())
            continue

        if not line.strip():
            if current_key is not None:
                current_value_lines.append("")
            continue

        errors.append(f"{path}:{index}: unsupported frontmatter syntax")

    commit_current()
    return data, errors


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    skill_files = sorted(root.glob("plugins/windmill/skills/*/SKILL.md"))

    if not skill_files:
        print("No skill files found under plugins/windmill/skills/*/SKILL.md", file=sys.stderr)
        return 1

    errors: list[str] = []
    names: dict[str, Path] = {}
    resource_filenames: dict[str, Path] = {}

    for skill_file in skill_files:
        text = skill_file.read_text(encoding="utf-8")
        frontmatter = extract_frontmatter(text)
        if frontmatter is None:
            errors.append(f"{skill_file}: missing YAML frontmatter")
            continue

        parsed, parse_errors = parse_frontmatter(frontmatter, skill_file)
        errors.extend(parse_errors)

        for field in REQUIRED_FIELDS:
            value = parsed.get(field, "").strip()
            if not value:
                errors.append(f"{skill_file}: missing required frontmatter field '{field}'")

        name = parsed.get("name", "").strip()
        if name:
            previous = names.get(name)
            if previous is not None:
                errors.append(
                    f"{skill_file}: duplicate name '{name}' also used by {previous}"
                )
            else:
                names[name] = skill_file

        resource_filename = parsed.get("resourceFilename", "").strip()
        if resource_filename:
            previous = resource_filenames.get(resource_filename)
            if previous is not None:
                errors.append(
                    f"{skill_file}: duplicate resourceFilename '{resource_filename}' also used by {previous}"
                )
            else:
                resource_filenames[resource_filename] = skill_file

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print(f"Validated {len(skill_files)} skill files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
