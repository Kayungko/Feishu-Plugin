import { existsSync, readFileSync } from "node:fs";
import { parseArgs, isMain, emit } from "./_args.mjs";
import { runLarkCli } from "./_larkcli.mjs";

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function convertDueForLark(value) {
  const v = value == null ? "" : String(value);
  if (!v || !v.trim()) return "";
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(v)) {
    return "date:" + v.replace(/\//g, "-");
  }
  if (v === "今天") return "date:" + formatDate(new Date());
  if (v === "明天") {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return "date:" + formatDate(d);
  }
  if (v === "后天") {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return "date:" + formatDate(d);
  }
  return "";
}

function readActionItems(json, path) {
  if (path && path.trim()) {
    if (!existsSync(path)) {
      return { error: { ok: false, issue: "action-items-file-not-found", path } };
    }
    json = readFileSync(path, "utf8");
  }
  if (!json || !json.trim()) {
    return { error: { ok: false, issue: "empty-action-items", message: "Provide -ActionItemsJson or -ActionItemsPath." } };
  }
  const parsed = JSON.parse(json);
  if (parsed && parsed.actionItems) return { items: [].concat(parsed.actionItems) };
  if (Array.isArray(parsed)) return { items: parsed };
  return { items: [parsed] };
}

export function run(opts) {
  const tasklistId = opts.tasklistId ?? "";
  const defaultAssigneeOpenId = opts.defaultAssigneeOpenId ?? "";
  const confirmCreate = Boolean(opts.confirmCreate);
  const dryRun = Boolean(opts.dryRun);

  const read = readActionItems(opts.actionItemsJson ?? "", opts.actionItemsPath ?? "");
  if (read.error) return read.error;
  const items = read.items;

  const drafts = [];
  for (const item of items) {
    const summary = item.summary == null ? "" : String(item.summary);
    if (!summary || !summary.trim()) continue;
    const due = convertDueForLark(item.due);
    let assignee = "";
    if (item.assigneeOpenId && String(item.assigneeOpenId).trim()) {
      assignee = String(item.assigneeOpenId);
    } else if (defaultAssigneeOpenId && defaultAssigneeOpenId.trim()) {
      assignee = defaultAssigneeOpenId;
    }

    const descriptionParts = [];
    if (item.owner) descriptionParts.push(`Owner hint: ${item.owner}`);
    if (item.due) descriptionParts.push(`Due hint: ${item.due}`);
    if (item.priority) descriptionParts.push(`Priority: ${item.priority}`);
    if (item.source) descriptionParts.push(`Source: ${item.source}`);
    if (descriptionParts.length === 0) descriptionParts.push("Generated from meeting action item draft.");

    drafts.push({
      summary,
      description: descriptionParts.join("\n"),
      due,
      assignee,
      tasklistId,
      needsConfirmation: item.needsConfirmation ?? null,
      sourceLine: item.sourceLine ?? null,
    });
  }

  if (!confirmCreate) {
    return {
      ok: true,
      mode: "preview",
      confirmationRequired: true,
      message: "Review the task drafts. Re-run with -ConfirmCreate to create tasks.",
      taskCount: drafts.length,
      taskDrafts: drafts,
    };
  }

  const created = [];
  for (const draft of drafts) {
    const cliArgs = ["task", "+create", "--as", "user", "--summary", draft.summary, "--description", draft.description, "--format", "json"];
    if (draft.due && draft.due.trim()) cliArgs.push("--due", draft.due);
    if (draft.assignee && draft.assignee.trim()) cliArgs.push("--assignee", draft.assignee);
    if (draft.tasklistId && draft.tasklistId.trim()) cliArgs.push("--tasklist-id", draft.tasklistId);
    if (dryRun) cliArgs.push("--dry-run");

    const { stdout, status } = runLarkCli(cliArgs);
    let data;
    try {
      data = JSON.parse(stdout);
    } catch {
      data = { raw: stdout };
    }
    created.push({
      summary: draft.summary,
      ok: (data && data.ok !== undefined && data.ok !== null) ? data.ok : status === 0,
      result: data,
    });
  }

  return {
    ok: created.filter((c) => !c.ok).length === 0,
    mode: dryRun ? "dry-run-create" : "created",
    taskCount: drafts.length,
    results: created,
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["confirm-create", "dry-run"] });
  emit(run({
    actionItemsJson: args.actionItemsJson ?? "",
    actionItemsPath: args.actionItemsPath ?? "",
    tasklistId: args.tasklistId ?? "",
    defaultAssigneeOpenId: args.defaultAssigneeOpenId ?? "",
    confirmCreate: args.confirmCreate,
    dryRun: args.dryRun,
  }));
}
