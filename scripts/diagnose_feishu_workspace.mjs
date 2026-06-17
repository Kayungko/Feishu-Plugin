import { homedir } from "node:os";
import { parseArgs, isMain, emit } from "./_args.mjs";
import { pluginRoot, readManifest, skillCount } from "./_plugin.mjs";
import { run as checkLarkCli } from "./check_lark_cli.mjs";
import { run as checkCapabilities } from "./check_lark_cli_capabilities.mjs";
import { run as getProjectConfig } from "./get_feishu_project_config.mjs";
import { run as checkProjectSupport } from "./check_lark_cli_project_support.mjs";

function parseJsonSafe(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return { ok: false, issue: "invalid-json", message: e.message, raw: json };
  }
}

export function run(opts) {
  const detailed = Boolean(opts.detailed);

  const root = pluginRoot();
  const manifest = readManifest(root);

  const larkCheck = checkLarkCli({ verifyAuth: true });
  const capabilityCheck = checkCapabilities({});
  const projectConfig = getProjectConfig({});
  const projectSupport = checkProjectSupport({});

  let identity = "unknown";
  let userName = "";
  if (larkCheck.authStatus) {
    const auth = parseJsonSafe(String(larkCheck.authStatus));
    if (auth.identity) identity = auth.identity;
    if (auth?.identities?.user?.userName) userName = auth.identities.user.userName;
  }

  const availableDomains = [];
  const missingDomains = [];
  if (capabilityCheck.domains) {
    for (const domain of capabilityCheck.domains) {
      if (domain.command || domain.skill) {
        availableDomains.push(domain.name);
      } else {
        missingDomains.push(domain.name);
      }
    }
  }

  const issues = [];
  if (!larkCheck.ok) issues.push("lark-cli not ready");
  if (identity === "unknown") issues.push("auth status unknown");
  if (!projectConfig.ok) issues.push("Project OpenAPI config incomplete");
  if (projectSupport.ok && !projectSupport.projectSupported) issues.push("official lark-cli has no Project command");

  const fixes = [];
  if (!larkCheck.ok) fixes.push("Install or repair lark-cli.");
  if (identity === "unknown") fixes.push("Run lark-cli auth status --verify, then login if needed.");
  if (!projectConfig.ok) fixes.push(`Create ${homedir()}/.codex/feishu-project.config.json from templates/feishu-project.config.example.json when Project access is needed.`);
  if (projectSupport.ok && !projectSupport.projectSupported) fixes.push("Use Project OpenAPI fallback for project.feishu.cn links.");

  return {
    ok: issues.length === 0 || (larkCheck.ok && capabilityCheck.ok),
    plugin: {
      name: manifest?.name ?? null,
      version: manifest?.version ?? null,
      skillCount: skillCount(root),
    },
    larkCli: {
      ok: larkCheck.ok,
      path: larkCheck.path,
      version: larkCheck.version,
      identity,
      userName,
    },
    capabilities: {
      availableCount: availableDomains.length,
      missingCount: missingDomains.length,
      available: availableDomains,
      missing: missingDomains,
    },
    project: {
      officialCliSupported: projectSupport.ok ? projectSupport.projectSupported : false,
      configReady: projectConfig.ok,
      missingConfig: projectConfig.missing,
      configPath: projectConfig.configPath,
    },
    issues,
    recommendedFixes: fixes,
    details: detailed ? {
      larkCheck,
      capabilityCheck,
      projectConfig,
      projectSupport,
    } : null,
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["detailed"] });
  emit(run({ detailed: args.detailed }));
}
