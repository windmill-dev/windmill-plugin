# Skill Format Specification

This document defines the metadata format for public Windmill skills in this repository.

## Overview

Skills can be defined in two ways:

1. **Simple skills**: A single `SKILL.md` file with frontmatter (backwards compatible)
2. **Variant-aware skills**: A `skill.json` manifest that defines multiple variants

## Simple Skills (SKILL.md only)

For skills without feature-flag variants, use a single `SKILL.md` file with frontmatter:

```markdown
---
name: skill-name
description: Short description for skill discovery
requiredTools:                    # optional
  - tool_name_1
  - tool_name_2
---

# Skill Content
...
```

## Variant-Aware Skills (skill.json)

For skills with behavior that varies by feature flag or tool availability, use a `skill.json` manifest:

```
skills/skill-name/
  skill.json        # manifest defining variants
  variant-a.md      # content for variant A
  variant-b.md      # content for variant B
```

### skill.json Schema

```json
{
  "id": "skill-name",
  "resourceFilename": "skill_resource_name.md",
  "description": "Skill description for discovery (applies to all variants)",
  "variants": [
    {
      "id": "variant-id",
      "description": "Optional variant-specific description",
      "file": "variant-filename.md",
      "gate": {
        "flag": "feature-flag-name",
        "enabledWhen": true | false
      },
      "requiredTools": ["tool_a", "tool_b"],
      "optionalTools": ["tool_c"]
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Canonical skill identifier. Must match directory name. |
| `resourceFilename` | string | yes | Canonical MCP resource filename (e.g., `managing_one-on-ones_skill.md`). This is the filename go-windmill uses to serve the skill as an MCP resource. |
| `description` | string | yes | Human-readable description for skill discovery. |
| `variants` | array | yes | One or more variant definitions. |
| `variants[].id` | string | yes | Variant identifier (unique within skill). |
| `variants[].description` | string | no | Variant-specific description override. |
| `variants[].file` | string | yes | Path to variant content file (relative to skill directory). |
| `variants[].gate` | object | no | Feature gate for variant selection. |
| `variants[].gate.flag` | string | yes* | Feature flag name. *Required if gate is present. |
| `variants[].gate.enabledWhen` | boolean | yes* | Flag value that activates this variant. |
| `variants[].requiredTools` | array | no | MCP tools required for this variant. |
| `variants[].optionalTools` | array | no | MCP tools that may be used if available (capability-dependent). |

### Variant Resolution Rules

When a consumer (e.g., go-windmill) loads a variant-aware skill:

1. Evaluate each variant's `gate` against current feature flags
2. Select the first variant whose gate matches
3. If no gates match, use the first variant without a gate (fallback)
4. If all variants have gates and none match, the skill is unavailable

### Content File Format

Variant content files use the same markdown format as simple skills, but without frontmatter (metadata is in `skill.json`):

```markdown
# Skill Title

## Section
...
```

## Capability-Aware Content

Within skill content, behavior can adapt to tool availability at runtime:

- Load data using the available tool
- Check the returned content shape (string/markdown vs structured JSON)
- Use the appropriate update tool based on content shape and tool availability

This allows a single variant to handle multiple tool configurations without needing separate variants for each tool combination.

## Migration Notes

When migrating a simple skill to variant-aware:

1. Create `skill.json` with the manifest
2. Move content to variant-specific files
3. Remove the original `SKILL.md` (or keep it empty for backwards compatibility during transition)
4. Update go-windmill to parse `skill.json` when present

The presence of `skill.json` indicates a variant-aware skill. Consumers should check for `skill.json` first, falling back to `SKILL.md` for simple skills.
