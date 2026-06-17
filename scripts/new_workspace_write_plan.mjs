import { existsSync, writeFileSync } from "node:fs";
import { parseArgs, isMain, emit } from "./_args.mjs";

function getWriteRisk(op) {
  switch (op) {
    case "create-doc-personal": return "report-after-execution";
    default: return "confirm-before-execution";
  }
}

function getOperationLabel(op) {
  switch (op) {
    case "create-doc-personal": return "Create document in personal library";
    case "create-doc-shared": return "Create document in shared location";
    case "update-doc": return "Update existing document";
    case "write-sheet": return "Write rows or cells to sheet";
    case "write-base": return "Write records to Base";
    case "create-task": return "Create task";
    case "assign-task": return "Assign task";
    case "send-im": return "Send IM message";
    case "send-mail": return "Send mail";
    case "create-calendar": return "Create calendar event";
    case "upload-file": return "Upload file";
    case "move-drive-file": return "Move Drive file";
    default: return op;
  }
}

export function run(opts) {
  const operation = opts.operation;
  const target = opts.target ?? "";
  const targetType = opts.targetType ?? "";
  const payloadSummary = opts.payloadSummary ?? "";
  const effect = opts.effect ?? "";
  const itemCount = Number(opts.itemCount ?? 0) || 0;
  const payloadPreviewPath = opts.payloadPreviewPath ?? "";
  const forceConfirmation = Boolean(opts.forceConfirmation);

  const risk = getWriteRisk(operation);
  const confirmationRequired = forceConfirmation || risk === "confirm-before-execution";
  const missing = [];

  if (!target || !target.trim()) missing.push("target");
  if (!payloadSummary || !payloadSummary.trim()) missing.push("payloadSummary");
  if (!effect || !effect.trim()) missing.push("effect");

  let previewExists = false;
  if (payloadPreviewPath && payloadPreviewPath.trim()) {
    previewExists = existsSync(payloadPreviewPath);
  }

  return {
    ok: missing.length === 0,
    mode: "write-preview",
    operation,
    operationLabel: getOperationLabel(operation),
    risk,
    confirmationRequired,
    target,
    targetType,
    payloadSummary,
    itemCount,
    effect,
    payloadPreviewPath,
    payloadPreviewExists: previewExists,
    missingFields: missing,
    nextAction: confirmationRequired
      ? "Show this preview to the user and wait for explicit confirmation before executing the write."
      : "This operation can be executed and reported after completion.",
    confirmationPrompt: confirmationRequired
      ? `确认后我会执行：${operation} -> ${target}`
      : "",
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["force-confirmation"] });
  const result = run({
    operation: args.operation ?? args._[0],
    target: args.target ?? "",
    targetType: args.targetType ?? "",
    payloadSummary: args.payloadSummary ?? "",
    effect: args.effect ?? "",
    itemCount: args.itemCount ?? 0,
    payloadPreviewPath: args.payloadPreviewPath ?? "",
    forceConfirmation: args.forceConfirmation,
  });
  if (args.outputPath && String(args.outputPath).trim()) {
    writeFileSync(args.outputPath, JSON.stringify(result, null, 2), "utf8");
  }
  emit(result);
}
