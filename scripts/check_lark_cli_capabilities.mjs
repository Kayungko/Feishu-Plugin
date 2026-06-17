import { parseArgs, isMain, emit } from "./_args.mjs";
import { findLarkCli, runLarkCli } from "./_larkcli.mjs";

function parseCommands(helpText) {
  const commands = [];
  let inCommands = false;
  for (const line of helpText.split("\n")) {
    if (line.trim() === "Available Commands:") {
      inCommands = true;
      continue;
    }
    if (inCommands && line.trim() === "") {
      break;
    }
    if (inCommands) {
      const m = line.match(/^\s{2}([a-zA-Z0-9._-]+)\s+/);
      if (m) commands.push(m[1]);
    }
  }
  return commands;
}

const expectedDomains = [
  "approval", "apps", "attendance", "base", "calendar", "contact", "docs",
  "drive", "event", "im", "mail", "markdown", "minutes", "note", "okr",
  "sheets", "slides", "task", "vc", "whiteboard", "wiki",
];

const skillNameOverrides = { docs: "lark-doc" };

export function run(opts) {
  const includeHelp = Boolean(opts.includeHelp);

  try {
    const path = findLarkCli();
    if (!path) {
      return {
        ok: false,
        issue: "lark-cli-not-found",
        message: "lark-cli is not available in PATH.",
      };
    }

    const version = runLarkCli(["--version"]).stdout;
    const help = runLarkCli(["--help"]).stdout;
    const commands = parseCommands(help);

    let skills = [];
    const skillsRaw = runLarkCli(["skills", "list"]).stdout;
    try {
      const skillsJson = JSON.parse(skillsRaw);
      if (skillsJson.skills) {
        skills = skillsJson.skills.map((s) => ({
          name: s.name,
          version: s.version,
          cliHelp: s?.metadata?.cliHelp,
        }));
      }
    } catch {
      // leave skills empty
    }

    const domains = expectedDomains.map((domain) => {
      const skillName = Object.prototype.hasOwnProperty.call(skillNameOverrides, domain)
        ? skillNameOverrides[domain]
        : `lark-${domain}`;
      return {
        name: domain,
        command: commands.includes(domain),
        skill: skills.filter((s) => s.name === skillName).length > 0,
      };
    });

    return {
      ok: true,
      path,
      version: version.trim(),
      commandCount: commands.length,
      skillCount: skills.length,
      domains,
      project: {
        command: commands.includes("project"),
        skill: skills.filter((s) => /^(lark|feishu)-project$/.test(s.name || "")).length > 0,
        recommendation: "Use Project OpenAPI fallback when command and skill are false.",
      },
      commands: includeHelp ? commands : null,
      skills: includeHelp ? skills : null,
    };
  } catch (e) {
    return {
      ok: false,
      issue: "capability-check-failed",
      message: e.message,
    };
  }
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["include-help"] });
  emit(run({ includeHelp: args.includeHelp }));
}
