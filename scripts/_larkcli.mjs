// Cross-platform lark-cli location + invocation helpers.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

const isWindows = process.platform === "win32";

// Candidate executable names, in priority order.
function candidateNames() {
  if (isWindows) {
    return ["lark-cli.cmd", "lark-cli.exe", "lark-cli.ps1", "lark-cli"];
  }
  return ["lark-cli"];
}

// Resolve lark-cli's full path by scanning PATH, mirroring `Get-Command lark-cli`.
// Returns the resolved absolute path, or null when not found.
export function findLarkCli() {
  const pathEnv = process.env.PATH || process.env.Path || "";
  const dirs = pathEnv.split(delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const name of candidateNames()) {
      const full = join(dir, name);
      if (existsSync(full)) {
        return full;
      }
    }
  }
  return null;
}

// Mimic PowerShell `(& cmd ...) -join "\n"`: normalize CRLF and strip one trailing newline.
export function joinLines(s) {
  return String(s || "").replace(/\r\n/g, "\n").replace(/\n$/, "");
}

// Quote an argument for cmd.exe: wrap in double quotes and double any inner quotes.
// A fully double-quoted argument is treated literally by cmd (spaces, &, |, etc.).
function winQuote(arg) {
  const s = String(arg);
  if (s === "") return '""';
  return '"' + s.replace(/"/g, '""') + '"';
}

// Spawn a command cross-platform without the shell-array concatenation pitfall.
// Windows: route through cmd.exe (needed for .cmd/.bat shims) using a single quoted
// command string so args are not re-split (avoids DEP0190 and arg-injection).
// POSIX: spawn the binary directly with shell:false.
function spawnCross(bin, args) {
  if (isWindows) {
    const command = [bin, ...args.map(winQuote)].join(" ");
    return spawnSync(command, {
      encoding: "utf8",
      shell: true,
      windowsHide: true,
    });
  }
  return spawnSync(bin, args, {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
}

// Run lark-cli, returning raw { stdout, stderr, status } without combining streams.
export function runLarkCliRaw(args) {
  const res = spawnCross("lark-cli", args);
  return {
    stdout: res.stdout || "",
    stderr: res.stderr || "",
    status: res.status === null ? 1 : res.status,
  };
}

// Run lark-cli with the given args, capturing stdout+stderr joined (like `2>&1`).
// Returns { stdout, status }. Never throws on non-zero exit.
export function runLarkCli(args, options = {}) {
  const res = runLarkCliRaw(args);
  const stdout = [res.stdout, res.stderr].filter(Boolean).join("\n");
  return { stdout, status: res.status };
}

// Run an external command (npx etc.) capturing combined output.
export function runCommand(cmd, args) {
  const res = spawnCross(cmd, args);
  const stdout = [res.stdout || "", res.stderr || ""].filter(Boolean).join("\n");
  return { stdout, status: res.status === null ? 1 : res.status };
}
