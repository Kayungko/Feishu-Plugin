// Minimal cross-platform CLI argument parser shared by the workspace scripts.
// Supports: --flag value, --switch (boolean), and positional arguments.
// Flag names are normalized from kebab-case to camelCase (e.g. --verify-auth -> verifyAuth).

import { pathToFileURL } from "node:url";

function toCamel(name) {
  return name.replace(/-([a-z0-9])/gi, (_, c) => c.toUpperCase());
}

// switches: array of kebab/camel names that take no value (boolean flags).
export function parseArgs(argv, options = {}) {
  const switches = new Set((options.switches || []).map(toCamel));
  const result = { _: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      let key = arg.slice(2);
      let value;
      const eq = key.indexOf("=");
      if (eq !== -1) {
        value = key.slice(eq + 1);
        key = key.slice(0, eq);
      }
      const camel = toCamel(key);
      if (value !== undefined) {
        result[camel] = value;
      } else if (switches.has(camel)) {
        result[camel] = true;
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          result[camel] = next;
          i++;
        } else {
          result[camel] = true;
        }
      }
    } else {
      result._.push(arg);
    }
  }

  return result;
}

// True when this module file is being executed directly as the entry script.
export function isMain(importMetaUrl) {
  if (!process.argv[1]) return false;
  try {
    return importMetaUrl === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
}

// Print a result object as pretty JSON and set exit code 1 when ok === false.
export function emit(result) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (result && result.ok === false) {
    process.exitCode = 1;
  }
}
