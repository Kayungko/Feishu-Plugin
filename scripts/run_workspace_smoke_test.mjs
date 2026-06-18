import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, isMain, emit } from "./_args.mjs";
import { pluginRoot, readManifest, skillCount } from "./_plugin.mjs";
import { run as checkLarkCli } from "./check_lark_cli.mjs";
import { run as getTeamHelp } from "./get_team_help.mjs";
import { run as newWritePlan } from "./new_workspace_write_plan.mjs";
import { run as extractActionItems } from "./extract_meeting_action_items.mjs";
import { run as previewTaskCreation } from "./preview_task_creation.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));

function parseJsonSafe(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return { ok: false, issue: "invalid-json", message: e.message, raw: json };
  }
}

export function run(opts) {
  const skipAuthVerify = Boolean(opts.skipAuthVerify);
  const root = pluginRoot();
  const manifest = readManifest(root);

  const requiredScripts = [
    "check_lark_cli.mjs",
    "diagnose_feishu_workspace.mjs",
    "get_team_help.mjs",
    "new_workspace_write_plan.mjs",
    "extract_meeting_action_items.mjs",
    "preview_task_creation.mjs",
    "normalize_lark_error.mjs",
    "parse_feishu_url.mjs",
  ];

  const scriptChecks = requiredScripts.map((name) => ({
    name,
    exists: existsSync(join(scriptsDir, name)),
  }));

  const larkCheck = checkLarkCli(skipAuthVerify ? {} : { verifyAuth: true });
  const teamHelp = getTeamHelp({ mode: "short" });
  const writePreview = newWritePlan({
    operation: "update-doc",
    target: "https://example.feishu.cn/docx/demo",
    targetType: "docx",
    payloadSummary: "append 2 sections",
    itemCount: 2,
    effect: "adds reviewed draft content to an existing shared document",
  });

  const sampleText = "待办：张三负责整理资料索引，明天给初版。\n李四跟进表格字段，本周完成。\n需要确认消息发送范围。";
  const extract = extractActionItems({ text: sampleText, includeSourceLines: true });

  let previewTasks;
  if (extract.ok) {
    previewTasks = previewTaskCreation({ actionItemsJson: JSON.stringify(extract) });
  } else {
    previewTasks = { issue: "skipped-because-extraction-failed" };
  }

  const checks = {
    scriptsPresent: scriptChecks.filter((s) => !s.exists).length === 0,
    larkCliReady: larkCheck.ok === true,
    teamHelpReady: teamHelp.ok === true,
    writePreviewReady: writePreview.ok === true && writePreview.confirmationRequired === true,
    meetingExtractionReady: extract.ok === true && extract.actionItemCount >= 2,
    taskPreviewReady: previewTasks.ok === true && previewTasks.mode === "preview",
  };

  let authSummary = null;
  if (larkCheck.authStatus) {
    const auth = parseJsonSafe(String(larkCheck.authStatus));
    authSummary = {
      identity: auth.identity,
      verified: auth.verified,
      userName: auth?.identities?.user?.userName,
      userReady: !!(auth?.identities?.user?.available && auth?.identities?.user?.verified),
      botReady: !!(auth?.identities?.bot?.available && auth?.identities?.bot?.verified),
      tokenStatus: auth?.identities?.user?.tokenStatus,
    };
  }

  const larkCliSummary = {
    ok: larkCheck.ok,
    path: larkCheck.path,
    version: larkCheck.version,
    updateAvailable: larkCheck.updateAvailable === true,
    updateMessage: larkCheck.updateMessage || "",
    auth: authSummary,
  };

  const failed = [];
  for (const [key, value] of Object.entries(checks)) {
    if (!value) failed.push(key);
  }

  return {
    ok: failed.length === 0,
    mode: "smoke-test",
    plugin: {
      name: manifest ? manifest.name : "feishu-workspace",
      version: manifest ? manifest.version : "",
      skillCount: skillCount(root),
    },
    checks,
    failed,
    details: {
      scriptChecks,
      larkCli: larkCliSummary,
      teamHelpPromptCount: teamHelp.prompts ? teamHelp.prompts.length : 0,
      writePreview,
      extractedActionItemCount: extract.actionItemCount != null ? extract.actionItemCount : 0,
      taskDraftCount: previewTasks.taskCount != null ? previewTasks.taskCount : 0,
    },
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["skip-auth-verify"] });
  const result = run({ skipAuthVerify: args.skipAuthVerify });
  if (args.outputPath && String(args.outputPath).trim()) {
    writeFileSync(args.outputPath, JSON.stringify(result, null, 2), "utf8");
  }
  emit(result);
}
