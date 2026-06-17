---
name: feishu-shared
description: Shared Feishu/Lark CLI rules for Codex plugin skills. Use for lark-cli setup checks, auth/identity handling, permission errors, risk confirmation policy, link parsing, and common command conventions before any Feishu workspace operation.
---

# Feishu Shared Rules

Use `lark-cli` as the execution layer. Prefer user identity for user-owned docs, wiki, drive, calendar, minutes, tasks, and IM. Use bot only when explicitly requested or when the target resource is bot-owned.

## User-facing progress style

Keep progress updates short and action-oriented. The user should feel that Feishu tasks are being handled directly, not that internal plugin routing is being explained.

- Do not announce that you are reading this skill file, shared rules, or CLI help unless the user asks how the plugin works.
- Do not mention risk categories such as "low risk" for normal read operations.
- Do not narrate every preflight step. Combine setup checks into one short update when useful.
- Prefer one concise update before execution, then the result.
- Mention auth, scope, identity, or command discovery only when it affects the outcome or needs user action.
- For read operations, use direct wording such as:
  - "我直接查今天的主日历。"
  - "我先确认登录状态，然后读取日程。"
  - "已连上用户身份，正在拉取今天的安排。"
- Avoid slow-sounding wording such as:
  - "我先读取插件说明，确认认证和查询命令格式。"
  - "读取日程是低风险操作，使用用户身份查询即可。"
  - "我正在看当前命令支持的输出格式。"

## Required preflight

1. Check `lark-cli` when the environment is unknown:
   ```bash
   node ../../../scripts/check_lark_cli.mjs --verify-auth
   ```
2. If auth fails or needs refresh, run:
   ```bash
   lark-cli auth status --verify
   ```
3. If scope is missing, use the CLI hint. For user auth, prefer minimum scope login:
   ```bash
   lark-cli auth login --scope "<missing_scope>" --no-wait --json
   ```

## Link routing

Use `../../../scripts/parse_feishu_url.mjs` or read `references/link-routing.md` when a user provides a Feishu/Lark URL and the resource type is not obvious.

## Command conventions

- Use `--as user` unless there is a clear reason to use `--as bot`.
- For docs commands, always include `--api-version v2`.
- Prefer shortcut commands such as `docs +fetch`, `docs +create`, `docs +update`, `sheets ...`, `wiki ...` before raw OpenAPI calls.
- Use `--format json` for machine-readable output.
- Pass user-provided values as separate arguments; avoid building command strings by concatenation.

## Risk policy

Read `references/risk-policy.md` before writes that affect shared resources or other people.

If `lark-cli` exits with confirmation_required, stop and ask the user. Do not append `--yes` unless the user explicitly confirms the exact operation.

## Error handling

When a CLI call fails, summarize:

- identity used
- operation attempted
- target resource
- error message
- likely fix

If `_notice.update` appears, finish the current task and mention the available `lark-cli update`.

