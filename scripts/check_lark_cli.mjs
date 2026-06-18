import { parseArgs, isMain, emit } from "./_args.mjs";
import {
  findLarkCli,
  runLarkCliRaw,
  joinLines,
  MIN_LARK_CLI_VERSION,
  parseVersion,
  compareVersions,
} from "./_larkcli.mjs";

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
  const version = joinLines(versionRaw.stdout);
  const result = {
    ok: true,
    path,
    version,
    expectedVersion: MIN_LARK_CLI_VERSION,
    meetsExpected: true,
  };

  // Plugin-authoritative floor: compare the installed version against the
  // version the plugin was validated against. Below the floor, documented
  // commands may not work, so prompt an upgrade. This is the cheap default
  // check (no network) since `--version` was already invoked above.
  const installed = parseVersion(version);
  const expected = parseVersion(MIN_LARK_CLI_VERSION);
  if (installed && expected && compareVersions(installed, expected) < 0) {
    result.meetsExpected = false;
    result.updateMessage = `This plugin expects lark-cli >= ${MIN_LARK_CLI_VERSION} but found ${installed.join(".")}. Run: lark-cli update`;
  }

  if (verifyAuth) {
    const auth = runLarkCliRaw(["auth", "status", "--verify"]);
    result.authStatus = joinLines([auth.stdout, auth.stderr].filter(Boolean).join("\n"));

    // Secondary, informational nudge: npm has a newer release. Only surface it
    // when the plugin floor is already met, to avoid double-messaging an
    // already-flagged below-floor install.
    if (result.meetsExpected) {
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
  }

  return result;
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["verify-auth"] });
  emit(run({ verifyAuth: args.verifyAuth }));
}
