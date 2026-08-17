#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const errors = [];
const namePattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  try {
    return JSON.parse(await fs.readFile(absolutePath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be a non-empty string`);
  }
}

function validateName(value, label) {
  requireString(value, label);
  if (typeof value === "string" && !namePattern.test(value)) {
    errors.push(`${label} must be lowercase and use only alphanumerics, hyphens, and periods`);
  }
}

function parseFrontmatter(content) {
  const match = content.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  const fields = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

async function validateSkills(pluginRoot) {
  const skillsRoot = path.join(pluginRoot, "skills");
  let entries;
  try {
    entries = await fs.readdir(skillsRoot, { withFileTypes: true });
  } catch (error) {
    errors.push(`plugins/windmill/skills: ${error.message}`);
    return;
  }

  const skillNames = new Set();
  for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
    const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");
    if (!(await exists(skillPath))) {
      errors.push(`plugins/windmill/skills/${entry.name}: missing SKILL.md`);
      continue;
    }

    const fields = parseFrontmatter(await fs.readFile(skillPath, "utf8"));
    if (!fields) {
      errors.push(`plugins/windmill/skills/${entry.name}/SKILL.md: missing YAML frontmatter`);
      continue;
    }

    validateName(fields.name, `skills/${entry.name}/SKILL.md name`);
    requireString(fields.description, `skills/${entry.name}/SKILL.md description`);
    if (fields.name !== entry.name) {
      errors.push(`skills/${entry.name}/SKILL.md name must match its directory name`);
    }
    if (skillNames.has(fields.name)) {
      errors.push(`duplicate skill name: ${fields.name}`);
    }
    skillNames.add(fields.name);
  }

  if (skillNames.size === 0) {
    errors.push("plugins/windmill/skills must contain at least one skill");
  }
}

const marketplace = await readJson(".cursor-plugin/marketplace.json");
if (marketplace) {
  validateName(marketplace.name, "marketplace name");
  requireString(marketplace.owner?.name, "marketplace owner.name");
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    errors.push("marketplace plugins must be a non-empty array");
  }
}

const entry = marketplace?.plugins?.[0];
if (entry) {
  validateName(entry.name, "marketplace plugin name");
  requireString(entry.source, "marketplace plugin source");
  requireString(entry.description, "marketplace plugin description");
}

const pluginRelativeRoot = entry?.source?.replace(/^\.\//, "") ?? "plugins/windmill";
const pluginRoot = path.join(repoRoot, pluginRelativeRoot);
if (!(await exists(pluginRoot))) {
  errors.push(`${pluginRelativeRoot}: plugin source directory does not exist`);
}

const manifest = await readJson(`${pluginRelativeRoot}/.cursor-plugin/plugin.json`);
if (manifest) {
  validateName(manifest.name, "plugin name");
  requireString(manifest.displayName, "plugin displayName");
  requireString(manifest.description, "plugin description");
  requireString(manifest.author?.name, "plugin author.name");
  requireString(manifest.license, "plugin license");
  if (entry?.name && manifest.name !== entry.name) {
    errors.push("plugin name must match the marketplace entry name");
  }
  if (typeof manifest.version !== "string" || !semverPattern.test(manifest.version)) {
    errors.push("plugin version must be semantic versioning such as 1.0.0");
  }
  if (marketplace?.metadata?.version !== manifest.version) {
    errors.push("plugin version must match marketplace metadata.version");
  }
  if (!Array.isArray(manifest.keywords) || manifest.keywords.length === 0) {
    errors.push("plugin keywords must be a non-empty array");
  }
  requireString(manifest.logo, "plugin logo");
  if (typeof manifest.logo === "string" && !(await exists(path.join(pluginRoot, manifest.logo)))) {
    errors.push(`plugin logo does not exist: ${manifest.logo}`);
  }
}

const mcp = await readJson(`${pluginRelativeRoot}/mcp.json`);
const windmillServer = mcp?.mcpServers?.windmill;
if (!windmillServer) {
  errors.push("mcp.json must define an mcpServers.windmill server");
} else if (windmillServer.url !== "https://mcp.gowindmill.com/mcp") {
  errors.push("mcpServers.windmill.url must use the production Windmill MCP endpoint");
}

const claudeManifest = await readJson(`${pluginRelativeRoot}/.claude-plugin/plugin.json`);
if (manifest?.version && claudeManifest?.version !== manifest.version) {
  errors.push("Cursor and Claude plugin versions must match");
}

const claudeMcp = await readJson(`${pluginRelativeRoot}/.mcp.json`);
if (windmillServer?.url && claudeMcp?.mcpServers?.windmill?.url !== windmillServer.url) {
  errors.push("Cursor and Claude MCP endpoints must match");
}

await validateSkills(pluginRoot);

if (errors.length > 0) {
  console.error("Cursor plugin validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validated Cursor marketplace, plugin manifest, MCP config, logo, and skills.");
