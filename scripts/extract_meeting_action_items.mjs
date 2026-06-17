import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, isMain, emit } from "./_args.mjs";
import { runLarkCli } from "./_larkcli.mjs";

function getCleanLine(line) {
  let clean = line.trim();
  clean = clean.replace(/^\s*[-*]\s*\[[ xX]\]\s*/, "");
  clean = clean.replace(/^\s*[-*]\s*/, "");
  clean = clean.replace(/^#{1,6}\s*/, "");
  clean = clean.replace(/\*\*/g, "");
  return clean.trim();
}

function getFirstMatch(value, patterns) {
  for (const pattern of patterns) {
    const m = value.match(pattern);
    if (m) {
      for (let index = 1; index < m.length; index++) {
        if (m[index] && m[index].trim() !== "") {
          return m[index].trim();
        }
      }
      return m[0].trim();
    }
  }
  return "";
}

function getPriority(value) {
  if (/紧急|阻塞|高优|今天|明天|马上|立即|风险/.test(value)) {
    return "high";
  }
  if (/下周|后续|有空|低优/.test(value)) {
    return "low";
  }
  return "normal";
}

const ownerPatterns = [
  /负责人[:：]\s*([^，,。；;\s]+)/,
  /Owner[:：]\s*([^，,。；;\s]+)/i,
  /@([^\s，,。；;]+)/,
  /([一-龥A-Za-z0-9_]{2,16})\s*(负责|跟进|确认|整理|补充|处理|对齐)/,
];
const duePatterns = [
  /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
  /(\d{1,2}月\d{1,2}日)/,
  /(今天|明天|后天|本周|下周|周一|周二|周三|周四|周五|周六|周日|周天)/,
];
const candidatePatterns = [
  /待办|行动项|TODO|Action Item|后续/i,
  /需要|负责|跟进|确认|整理|补充|完成|修复|对齐|提供|创建|更新|检查|排查|同步|推进|处理/,
];

function readTranscriptFromNote(id, locale) {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const output = join(tmpdir(), `feishu-note-${safeId}-transcript.md`);
  const { stdout } = runLarkCli([
    "note", "+transcript", "--as", "user", "--note-id", id,
    "--locale", locale, "--transcript-format", "markdown",
    "--output", output, "--overwrite", "--format", "json",
  ]);
  if (!existsSync(output)) {
    return {
      error: {
        ok: false,
        issue: "transcript-fetch-failed",
        message: "Unable to fetch transcript for note_id.",
        noteId: id,
        raw: stdout,
      },
    };
  }
  return { text: readFileSync(output, "utf8") };
}

export function run(opts) {
  let text = opts.text ?? "";
  const transcriptPath = opts.transcriptPath ?? "";
  const noteId = opts.noteId ?? "";
  const locale = opts.locale ?? "zh_cn";
  const includeSourceLines = Boolean(opts.includeSourceLines);

  if (noteId && noteId.trim()) {
    const res = readTranscriptFromNote(noteId, locale);
    if (res.error) return res.error;
    text = res.text;
  } else if (transcriptPath && transcriptPath.trim()) {
    if (!existsSync(transcriptPath)) {
      return { ok: false, issue: "transcript-file-not-found", path: transcriptPath };
    }
    text = readFileSync(transcriptPath, "utf8");
  }

  if (!text || !text.trim()) {
    return { ok: false, issue: "empty-meeting-content", message: "Provide -Text, -TranscriptPath, or -NoteId." };
  }

  const items = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = getCleanLine(lines[index]);
    if (!line || !line.trim()) continue;
    if (line.length < 6) continue;

    let isCandidate = false;
    for (const pattern of candidatePatterns) {
      if (pattern.test(line)) {
        isCandidate = true;
        break;
      }
    }
    if (!isCandidate) continue;

    let summary = line;
    if (summary.length > 120) {
      summary = summary.slice(0, 117) + "...";
    }

    let owner = getFirstMatch(line, ownerPatterns);
    if (/负责|跟进|确认|整理|补充|处理|对齐/.test(owner)) {
      owner = owner.replace(/(负责|跟进|确认|整理|补充|处理|对齐)$/, "");
    }
    if (/^(需要|可以|应该|我们|大家|后续|待办|行动项)$/.test(owner)) {
      owner = "";
    }
    const due = getFirstMatch(line, duePatterns);
    const priority = getPriority(line);
    let confidence = 0.55;
    if (/待办|行动项|TODO|Action Item/i.test(line)) confidence += 0.25;
    if (owner && owner.trim()) confidence += 0.1;
    if (due && due.trim()) confidence += 0.1;
    if (confidence > 0.95) confidence = 0.95;

    const item = {
      summary,
      owner,
      due,
      priority,
      confidence: Math.round(confidence * 100) / 100,
      needsConfirmation: !owner || !owner.trim() || !due || !due.trim(),
      sourceLine: index + 1,
    };
    if (includeSourceLines) {
      item.source = line;
    }
    items.push(item);
  }

  return {
    ok: true,
    source: noteId ? `note:${noteId}` : (transcriptPath ? transcriptPath : "inline-text"),
    actionItemCount: items.length,
    actionItems: items,
    unresolvedCount: items.filter((i) => i.needsConfirmation).length,
    note: "Heuristic extraction only. Review owners and due dates before creating tasks.",
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["include-source-lines"] });
  const result = run({
    text: args.text ?? "",
    transcriptPath: args.transcriptPath ?? "",
    noteId: args.noteId ?? "",
    locale: args.locale ?? "zh_cn",
    includeSourceLines: args.includeSourceLines,
  });
  if (args.outputPath && String(args.outputPath).trim()) {
    writeFileSync(args.outputPath, JSON.stringify(result, null, 2), "utf8");
  }
  emit(result);
}
