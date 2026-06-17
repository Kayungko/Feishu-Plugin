import { parseArgs, isMain, emit } from "./_args.mjs";
import { findLarkCli, runLarkCliRaw, joinLines } from "./_larkcli.mjs";

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
  }

  return result;
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["verify-auth"] });
  emit(run({ verifyAuth: args.verifyAuth }));
}
