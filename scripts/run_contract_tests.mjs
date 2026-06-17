// Contract regression tests for the Feishu Workspace helper scripts.
//
// Each helper emits a JSON object that is a hard contract: other scripts, the
// slash commands, and the docs depend on the exact field names, types, and
// enum values. This runner re-invokes every helper with fixed inputs and diffs
// the result against a captured baseline, so a future refactor cannot silently
// change the shape.
//
// Two tiers:
//   1. Deterministic cases  -> strict order-insensitive deep diff vs baselines/.
//      Run everywhere, including CI without lark-cli installed.
//   2. lark-cli probe cases -> structural assertions only (path/version/counts
//      vary by machine). Skipped when lark-cli is not on PATH.
//
// Usage: node scripts/run_contract_tests.mjs   (exit 1 on any failure)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./_args.mjs";

import { run as parseUrl } from "./parse_feishu_url.mjs";
import { run as extractErr } from "./extract_lark_error.mjs";
import { run as normErr } from "./normalize_lark_error.mjs";
import { run as writePlan } from "./new_workspace_write_plan.mjs";
import { run as extractActions } from "./extract_meeting_action_items.mjs";
import { run as previewTasks } from "./preview_task_creation.mjs";
import { run as teamHelp } from "./get_team_help.mjs";
import { run as projConfig } from "./get_feishu_project_config.mjs";
import { run as invokeApi } from "./invoke_feishu_project_api.mjs";
import { run as checkCli } from "./check_lark_cli.mjs";
import { run as capabilities } from "./check_lark_cli_capabilities.mjs";
import { run as projSupport } from "./check_lark_cli_project_support.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const baselineDir = join(scriptsDir, "__tests__", "baselines");

// Date the preview_tasks baseline was captured. preview_task_creation converts
// "今天"/"明天"/"后天" into absolute dates relative to "today", so the baseline
// is anchored here and the live output to the real today; we compare the
// relative day offset instead of the literal date.
const BASELINE_DATE = "2026-06-18";

const sample = "待办：张三负责整理资料索引，明天给初版。\n李四跟进表格字段，本周完成。\n需要确认消息发送范围。\n紧急：王五今天修复登录bug。";

function baseline(name) {
  return JSON.parse(readFileSync(join(baselineDir, `${name}.json`), "utf8"));
}

function todayLocalISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function dayOffset(dateStr, anchorStr) {
  const [ay, am, ad] = anchorStr.split("-").map(Number);
  const [dy, dm, dd] = dateStr.split("-").map(Number);
  const anchor = Date.UTC(ay, am - 1, ad);
  const target = Date.UTC(dy, dm - 1, dd);
  return Math.round((target - anchor) / 86400000);
}

// Replace "date:YYYY-MM-DD" strings with a "date:rel<N>" token relative to the
// given anchor, so date math is asserted by offset rather than literal value.
function relativizeDates(value, anchor) {
  if (typeof value === "string") {
    const m = value.match(/^date:(\d{4}-\d{2}-\d{2})$/);
    if (m) {
      const n = dayOffset(m[1], anchor);
      return `date:rel${n >= 0 ? "+" : ""}${n}`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => relativizeDates(v, anchor));
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = relativizeDates(value[k], anchor);
    return out;
  }
  return value;
}

function dropKeys(obj, keys) {
  if (!obj || typeof obj !== "object") return obj;
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

// Order-insensitive deep diff -> list of "path: a != b".
function diff(a, b, path = "") {
  const out = [];
  const ta = typeof a, tb = typeof b;
  if (a === null || b === null || ta !== "object" || tb !== "object") {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${path || "(root)"}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    return out;
  }
  const arrA = Array.isArray(a), arrB = Array.isArray(b);
  if (arrA || arrB) {
    if (!arrA || !arrB || a.length !== b.length) { out.push(`${path}: array shape ${JSON.stringify(a)} != ${JSON.stringify(b)}`); return out; }
    for (let i = 0; i < a.length; i++) out.push(...diff(a[i], b[i], `${path}[${i}]`));
    return out;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) out.push(...diff(a[k], b[k], path ? `${path}.${k}` : k));
  return out;
}

export async function run() {
  const today = todayLocalISO();
  let pass = 0, fail = 0, skip = 0;
  const log = [];

  // --- Tier 1: deterministic contract cases ---
  const previewActual = previewTasks({ actionItemsJson: JSON.stringify(extractActions({ text: sample })) });
  const invokeDry = await invokeApi({ method: "GET", path: "/open_api/projects", dryRun: true });

  const cases = [
    ["parse_docx", parseUrl({ url: "https://sample.feishu.cn/docx/Abc123def" })],
    ["parse_project", parseUrl({ url: "https://project.feishu.cn/myproj/story/detail/12345" })],
    ["parse_wiki", parseUrl({ url: "https://sample.feishu.cn/wiki/Wik987?sheet=ST1" })],
    ["extract_err", extractErr({ input: "{}" })],
    ["normalize_err", normErr({ message: "permission denied: no access to document", operation: "read-doc", target: "docx:Abc" })],
    ["write_plan", writePlan({ operation: "update-doc", target: "https://example.feishu.cn/docx/demo", targetType: "docx", payloadSummary: "append 2 sections", itemCount: 2, effect: "adds reviewed draft content to an existing shared document" })],
    ["extract_actions", extractActions({ text: sample, includeSourceLines: true })],
    ["help_short", teamHelp({ mode: "short" })],
    ["help_full", teamHelp({ mode: "full" })],
    ["invoke_dryrun", invokeDry],
    // configPath embeds the OS home dir; dropped from baseline and actual.
    ["project_config", dropKeys(projConfig({}), ["configPath"])],
    // due dates are compared as offsets relative to today / baseline date.
    ["preview_tasks", relativizeDates(previewActual, today)],
  ];

  for (let [name, actual] of cases) {
    let base = baseline(name);
    if (name === "preview_tasks") base = relativizeDates(base, BASELINE_DATE);
    const diffs = diff(actual, base);
    if (diffs.length === 0) {
      log.push(`PASS  ${name}`);
      pass++;
    } else {
      log.push(`FAIL  ${name}`);
      for (const d of diffs) log.push(`        ${d}`);
      fail++;
    }
  }

  // --- Tier 2: lark-cli probe cases (structural only; skip if CLI absent) ---
  const cli = checkCli({});
  const cliMissing = cli.ok === false && cli.issue === "lark-cli-not-found";

  function shape(name, value, checks) {
    if (cliMissing) {
      log.push(`SKIP  ${name}  (lark-cli not on PATH)`);
      skip++;
      return;
    }
    const bad = checks.filter((c) => !c.ok(value)).map((c) => c.desc);
    if (bad.length === 0) {
      log.push(`PASS  ${name}  (shape)`);
      pass++;
    } else {
      log.push(`FAIL  ${name}  (shape)`);
      for (const b of bad) log.push(`        expected: ${b}`);
      fail++;
    }
  }

  shape("check_cli", cli, [
    { desc: "ok === true", ok: (v) => v.ok === true },
    { desc: "path is a non-empty string", ok: (v) => typeof v.path === "string" && v.path.length > 0 },
    { desc: "version mentions lark-cli", ok: (v) => typeof v.version === "string" && /lark-cli/i.test(v.version) },
  ]);

  shape("capabilities", capabilities({}), [
    { desc: "ok === true", ok: (v) => v.ok === true },
    { desc: "commandCount is a number", ok: (v) => typeof v.commandCount === "number" },
    { desc: "skillCount is a number", ok: (v) => typeof v.skillCount === "number" },
    { desc: "domains is an array", ok: (v) => Array.isArray(v.domains) },
    { desc: "project is an object", ok: (v) => v.project !== null && typeof v.project === "object" },
  ]);

  shape("project_support", projSupport({}), [
    { desc: "ok === true", ok: (v) => v.ok === true },
    { desc: "projectSupported is a boolean", ok: (v) => typeof v.projectSupported === "boolean" },
    { desc: "matchingCommands is an array", ok: (v) => Array.isArray(v.matchingCommands) },
    { desc: "recommendation is a string", ok: (v) => typeof v.recommendation === "string" },
  ]);

  return {
    ok: fail === 0,
    pass,
    fail,
    skip,
    log,
  };
}

if (isMain(import.meta.url)) {
  const result = await run();
  for (const line of result.log) console.log(line);
  console.log(`\n${result.pass} passed, ${result.fail} failed, ${result.skip} skipped`);
  if (!result.ok) process.exitCode = 1;
}
