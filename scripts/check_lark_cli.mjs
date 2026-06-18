import { parseArgs, isMain, emit } from "./_args.mjs";
import { findLarkCli, runLarkCliRaw, joinLines } from "./_larkcli.mjs";

// Surface a binary/skills version skew early. `lark-cli doctor` emits a
// cli_update check that is non-"pass" when the installed CLI is behind; an
// out-of-date binary is exactly what makes documented v2 flags get rejected.
// Returns null when doctor is unavailable or not JSON, so detection is best-effort.
function detectUpdate() {
  const res = runLarkCliRaw(["doctor"]);
  let parsed;
  try {
    parsed = JSON.parse(res.stdout);
  } catch {
    return null;
  }
  const checks = Array.isArray(parsed.checks) ? parsed.checks : [];
  const updateCheck = checks.find((c) => c && c.name === "cli_update");
  if (!updateCheck) return null;
  return {
    available: updateCheck.status !== "pass",
    message: joinLines(updateCheck.message || ""),
  };
}

export function run(opts) {
  const verifyAuth = Boolean(opts.verifyAuth);

  const path = findLarkCli();
  if (!path) {
    return {
      ok: false,
      issue: "lark-cli-not-found",
      message: "lark-cli is not available in PATH.",
    };
  }

  const versionRaw = runLarkCliRaw(["--version"]);
  const result = {
    ok: true,
    path,
    version: joinLines(versionRaw.stdout),
  };

  if (verifyAuth) {
    const auth = runLarkCliRaw(["auth", "status", "--verify"]);
    result.authStatus = joinLines([auth.stdout, auth.stderr].filter(Boolean).join("\n"));

    const update = detectUpdate();
    if (update) {
      result.updateAvailable = update.available;
      if (update.available) {
        result.updateMessage = update.message
          ? `lark-cli out of date (${update.message}). Run: lark-cli update`
          : "A newer lark-cli is available. Run: lark-cli update";
      }
    }
  }

  return result;
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["verify-auth"] });
  emit(run({ verifyAuth: args.verifyAuth }));
}
