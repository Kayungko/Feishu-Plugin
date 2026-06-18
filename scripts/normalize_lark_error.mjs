import { existsSync, readFileSync } from "node:fs";
import { parseArgs, isMain, emit } from "./_args.mjs";
import { skillForDomain } from "./_larkcli.mjs";

// Domain hints, ordered most-specific-first, for inferring which Feishu domain
// a failed command belonged to when the CLI error itself names no skill doc.
const DOMAIN_HINTS = [
  ["docs", /docx|\bdocs?\b/],
  ["wiki", /\bwiki\b/],
  ["sheets", /\bsheets?\b/],
  ["base", /\bbase\b|bitable/],
  ["drive", /\bdrive\b/],
  ["calendar", /\bcalendar\b/],
  ["minutes", /\bminutes\b/],
  ["vc", /\bvc\b/],
  ["task", /\btasks?\b/],
  ["mail", /\bmail\b/],
  ["approval", /\bapproval\b/],
  ["contact", /\bcontact\b/],
  ["okr", /\bokr\b/],
  ["attendance", /\battendance\b/],
  ["slides", /\bslides?\b/],
  ["whiteboard", /\bwhiteboard\b/],
  ["note", /\bnote\b/],
  ["event", /\bevent\b/],
  ["apps", /\bapps\b/],
  ["markdown", /\bmarkdown\b/],
  ["im", /\bim\b/],
];

function inferDomain(s) {
  const lower = String(s || "").toLowerCase();
  for (const [domain, re] of DOMAIN_HINTS) {
    if (re.test(lower)) return domain;
  }
  return null;
}

// Best-effort parse of a lark-cli structured error body. Returns the inner
// error fields when present, or an empty object for plain-text input.
function parseStructuredError(text) {
  try {
    const json = JSON.parse(text);
    const error = json && json.error ? json.error : {};
    return {
      type: error.type ?? null,
      subtype: error.subtype ?? null,
      message: error.message ?? null,
      param: error.param ?? null,
    };
  } catch {
    return { type: null, subtype: null, message: null, param: null };
  }
}

// Build the list of concrete next-step commands for a schema/flag failure.
// Priority: surface commands the CLI already printed (version-matched, exact);
// only when none are present do we infer the domain and point at its skill+help.
function buildSuggestedCommands(text, { operation, target, param, isSchema }) {
  const cmds = [];
  const seen = new Set();
  const push = (c) => {
    const t = String(c).trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      cmds.push(t);
    }
  };

  const skillsRe = /lark-cli skills read\s+[\w-]+\s+[^\s`'")]+/g;
  for (const m of text.matchAll(skillsRe)) push(m[0]);
  const helpRe = /lark-cli\s+[\w-]+(?:\s+\+[\w-]+)?\s+--help/g;
  for (const m of text.matchAll(helpRe)) push(m[0]);

  if (isSchema && cmds.length === 0) {
    const domain = inferDomain([text, operation, target, param].filter(Boolean).join(" "));
    if (domain) {
      push(`lark-cli skills read ${skillForDomain(domain)}`);
      const subMatch = `${text} ${operation || ""}`.match(new RegExp(`${domain}\\s+(\\+[\\w-]+)`));
      push(subMatch ? `lark-cli ${domain} ${subMatch[1]} --help` : `lark-cli ${domain} --help`);
    }
  }
  return cmds;
}

export function run(opts) {
  let message = String(opts.message ?? "");
  const jsonPath = opts.jsonPath ?? "";
  const operation = opts.operation ?? "";
  const target = opts.target ?? "";

  if (jsonPath && existsSync(jsonPath)) {
    message = readFileSync(jsonPath, "utf8");
  }

  const text = String(message);
  const lower = text.toLowerCase();
  const structured = parseStructuredError(text);
  const param = structured.param ?? "";

  // A schema/flag mismatch is the highest-value category to detect: it is what
  // makes documented commands get rejected across CLI versions. Gate the broad
  // "validation"/"is required" signals behind a structured validation type or
  // an explicit flag token so we don't steal permission/not-found errors.
  const structuredValidation = structured.subtype === "invalid_argument" || structured.type === "validation";
  const flagKeywords = /v2-only|legacy v1 flag|no longer supported|unknown flag|unrecognized|unexpected argument|invalid_argument/.test(lower);
  const requiredFlag = /is required/.test(lower) && /--[\w-]+/.test(text);
  const isSchema = structuredValidation || flagKeywords || requiredFlag;

  let category = "unknown";
  let severity = "medium";
  let userMessage = "操作失败，但错误类型未识别。";
  let fixes = [
    "保留原始错误信息。",
    "确认链接、权限、登录状态后重试。",
  ];

  if (/confirmation_required/.test(lower)) {
    category = "confirmation-required";
    severity = "high";
    userMessage = "这是写操作或高风险操作，需要你明确确认后才能执行。";
    fixes = ["检查预览内容。", "确认目标、影响范围和是否通知他人。", '明确回复"确认执行"后再继续。'];
  } else if (/missing-project-config|project api configuration is incomplete|feishu_project/.test(lower)) {
    category = "project-config-missing";
    severity = "medium";
    userMessage = "飞书项目 OpenAPI 配置不完整，无法读取或修改项目需求单。";
    fixes = ["从 templates/feishu-project.config.example.json 复制配置模板。", "补充 Project pluginId/pluginSecret/authPath 或 pluginAccessToken。", "重新运行 scripts/get_feishu_project_config.mjs 验证。"];
  } else if (isSchema) {
    category = "schema-mismatch";
    severity = "medium";
    userMessage = "命令参数或 schema 不匹配（常因 lark-cli 版本间 flag 改版或缺必填参数）。";
    fixes = ["不要凭记忆改 flag 重试。", "先按 suggestedCommands 读取版本匹配的命令 schema。", "用 --help 确认当前参数后再组装命令。"];
  } else if (/permission|forbidden|access denied|no permission|无权限|没有权限|403/.test(lower)) {
    category = "permission-denied";
    severity = "medium";
    userMessage = "当前身份没有访问权限。";
    fixes = ["确认你能在浏览器打开目标链接。", "让资源所有者给当前飞书账号授权。", "确认 CLI 当前身份是否是你本人。"];
  } else if (/unauthorized|token expired|invalid token|needs_refresh|auth|未登录|登录|401/.test(lower)) {
    category = "auth-required";
    severity = "medium";
    userMessage = "飞书登录或 token 状态异常。";
    fixes = ["运行 lark-cli auth status --verify。", "如仍失败，运行 lark-cli auth login 重新登录。", "确认使用的是 user 身份还是 bot 身份。"];
  } else if (/missing scope|scope|权限范围|99991663/.test(lower)) {
    category = "scope-missing";
    severity = "medium";
    userMessage = "当前授权缺少这个操作需要的 scope。";
    fixes = ["查看 CLI 错误里的 missing scope。", "按提示用最小 scope 重新登录。", "如果是企业应用能力，确认管理员已授权对应权限。"];
  } else if (/not found|404|不存在|找不到/.test(lower)) {
    category = "not-found";
    severity = "low";
    userMessage = "目标资源不存在，或当前身份无法看到它。";
    fixes = ["检查链接或 token 是否复制完整。", "确认资源没有被删除或移动。", "确认当前账号有可见权限。"];
  } else if (/rate limit|too many requests|429|频率/.test(lower)) {
    category = "rate-limited";
    severity = "low";
    userMessage = "请求频率过高，被服务端限流。";
    fixes = ["稍后重试。", "减少批量请求数量。", "必要时分批执行。"];
  } else if (/network|timeout|etimedout|econnreset|连接|超时/.test(lower)) {
    category = "network";
    severity = "low";
    userMessage = "网络或服务连接异常。";
    fixes = ["稍后重试。", "确认网络和代理状态。", "如果持续失败，运行 lark-cli doctor。"];
  } else if (/lark-cli-not-found|not recognized|无法将.*lark-cli|不是内部或外部命令/.test(lower)) {
    category = "cli-missing";
    severity = "high";
    userMessage = "本机没有可用的 lark-cli。";
    fixes = ["安装 @larksuite/cli。", "确认 npm 全局 bin 在 PATH 中。", "安装后重新打开终端或 Codex。"];
  }

  const suggestedCommands = buildSuggestedCommands(text, {
    operation,
    target,
    param,
    isSchema: category === "schema-mismatch",
  });

  return {
    ok: false,
    category,
    severity,
    operation,
    target,
    userMessage,
    recommendedFixes: fixes,
    suggestedCommands,
    raw: message,
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  emit(run({
    message: args.message ?? "",
    jsonPath: args.jsonPath ?? "",
    operation: args.operation ?? "",
    target: args.target ?? "",
  }));
}
