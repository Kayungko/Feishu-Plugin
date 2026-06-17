import { parseArgs, isMain, emit } from "./_args.mjs";
import { findLarkCli, runLarkCli, runCommand } from "./_larkcli.mjs";

export function run(opts) {
  const useLatestNpx = Boolean(opts.useLatestNpx);
  const packageVersion = opts.packageVersion || "latest";

  const invoke = (args) => {
    if (useLatestNpx) {
      return runCommand("npx", ["-y", `@larksuite/cli@${packageVersion}`, ...args]).stdout;
    }
    return runLarkCli(args).stdout;
  };

  try {
    if (!useLatestNpx) {
      if (!findLarkCli()) {
        return {
          ok: false,
          issue: "lark-cli-not-found",
          message: "lark-cli is not available in PATH.",
        };
      }
    }

    const version = invoke(["--version"]);
    const help = invoke(["--help"]);
    const skillsRaw = invoke(["skills", "list"]);

    const availableCommands = [];
    let inCommands = false;
    for (const line of help.split("\n")) {
      if (line.trim() === "Available Commands:") {
        inCommands = true;
        continue;
      }
      if (inCommands && line.trim() === "") {
        break;
      }
      if (inCommands) {
        const m = line.match(/^\s{2}([a-zA-Z0-9._-]+)\s+/);
        if (m) availableCommands.push(m[1]);
      }
    }

    let skills = [];
    try {
      const skillsJson = JSON.parse(skillsRaw);
      if (skillsJson.skills) {
        skills = skillsJson.skills.map((s) => s.name);
      }
    } catch {
      skills = [];
    }

    const projectCommandSupported = availableCommands.includes("project");
    const projectSkillSupported = skills.filter((s) => /^(lark|feishu)-project$/.test(s || "")).length > 0;
    const projectSchemaLikelySupported = false;

    let recommendation;
    if (projectCommandSupported) {
      recommendation = "Prefer official lark-cli project commands.";
    } else if (projectSkillSupported) {
      recommendation = "Use official project skill guidance with lark-cli.";
    } else {
      recommendation = "No first-class Feishu Project support found in official lark-cli; use the plugin Project OpenAPI fallback.";
    }

    return {
      ok: true,
      source: useLatestNpx ? `@larksuite/cli@${packageVersion} via npx` : "local lark-cli",
      version: version.trim(),
      projectSupported: projectCommandSupported || projectSkillSupported || projectSchemaLikelySupported,
      projectCommandSupported,
      projectSkillSupported,
      projectSchemaLikelySupported,
      commandCount: availableCommands.length,
      skillCount: skills.length,
      matchingCommands: availableCommands.filter((c) => /project|meego/.test(c)),
      matchingSkills: skills.filter((s) => /project|meego/.test(s || "")),
      recommendation,
    };
  } catch (e) {
    return {
      ok: false,
      issue: "project-support-check-failed",
      message: e.message,
    };
  }
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["use-latest-npx"] });
  emit(run({ useLatestNpx: args.useLatestNpx, packageVersion: args.packageVersion ?? "latest" }));
}
