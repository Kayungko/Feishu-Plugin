// Shared helpers for locating the plugin root and reading its manifest.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Plugin root is the parent of the scripts/ directory.
export function pluginRoot() {
  const scriptsDir = dirname(fileURLToPath(import.meta.url));
  return dirname(scriptsDir);
}

// Read the plugin manifest, preferring the Claude Code manifest then the Codex one.
export function readManifest(root) {
  for (const rel of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
    const manifestPath = join(root, rel);
    if (existsSync(manifestPath)) {
      try {
        return JSON.parse(readFileSync(manifestPath, "utf8"));
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Count immediate subdirectories of skills/.
export function skillCount(root) {
  const skillsDir = join(root, "skills");
  try {
    return readdirSync(skillsDir).filter((name) => {
      try {
        return statSync(join(skillsDir, name)).isDirectory();
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}
