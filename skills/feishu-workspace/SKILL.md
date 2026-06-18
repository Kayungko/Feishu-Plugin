---
name: feishu-workspace
description: Feishu/Lark workspace operations through lark-cli. Use for Feishu links, docs, wiki, sheets, base, drive, calendar, minutes, tasks, IM, mail, approval, contact, OKR, attendance, video meetings, notes, slides, whiteboard, markdown, apps, events, Feishu Project, and common multi-step workflows.
---

# Feishu Workspace

Use `lark-cli` as the execution layer for Feishu/Lark workspace tasks. Prefer user identity for user-owned docs, wiki, drive, calendar, minutes, tasks, IM, mail, approval, contact, OKR, attendance, video meetings, notes, slides, whiteboard, markdown, apps, and events. Use bot only when explicitly requested or when the target resource is bot-owned.

## User-facing progress style

Keep updates short and action-oriented. Do not explain internal plugin routing, risk labels, skill files, or CLI help unless the user asks how the plugin works.

- For normal reads, send at most one concise progress update before the result.
- Mention auth, scope, identity, or command discovery only when it affects the outcome or needs user action.
- Good examples:
  - "我直接查今天的主日历。"
  - "我先确认登录状态，然后读取今天的安排。"
  - "我读取这篇文档后整理重点。"
- Avoid:
  - "我先读取插件说明。"
  - "这是低风险操作。"
  - "我正在看当前命令支持的输出格式。"

## Required preflight

When the environment is unknown, check CLI and auth:

```bash
node ../../scripts/check_lark_cli.mjs --verify-auth
```

If auth fails or a scope is missing, follow the CLI hint and ask the user only when manual action is required.

## Team help and diagnostics

Use these entry points for team distribution and troubleshooting:

- Environment diagnosis: `node ../../scripts/diagnose_feishu_workspace.mjs`
- Team help summary: `node ../../scripts/get_team_help.mjs`
- Smoke test: `node ../../scripts/run_workspace_smoke_test.mjs`
- CLI capability inventory: `node ../../scripts/check_lark_cli_capabilities.mjs`
- Error normalization: `node ../../scripts/normalize_lark_error.mjs`
- Standard write preview: `node ../../scripts/new_workspace_write_plan.mjs`
- Meeting action extraction: `node ../../scripts/extract_meeting_action_items.mjs`
- Task draft preview from actions: `node ../../scripts/preview_task_creation.mjs`
- Prompt examples: `../../references/prompt-templates.md`
- Workflow recipes: `../../references/workflow-recipes.md`

When the user asks "你能做什么", "怎么用", "给我一些提示词", or similar, run `get_team_help.mjs` and summarize its output instead of listing internal skill files.

When the user asks to check whether the plugin package itself is ready, run `run_workspace_smoke_test.mjs`. Use `--skip-auth-verify` only when the user wants a package-only check without validating Feishu login.

When a CLI/API call fails, run `normalize_lark_error.mjs` or use its categories before replying. Prefer actionable fixes over raw stack traces.

## Routing

Read only the relevant internal guide when the task needs more detail:

- Auth/setup/permission: `../../references/skill-guides/feishu-auth/SKILL.md`
- Docs/docx: `../../references/skill-guides/feishu-doc/SKILL.md`
- Wiki: `../../references/skill-guides/feishu-wiki/SKILL.md`
- Sheets: `../../references/skill-guides/feishu-sheet/SKILL.md`
- Base/bitable: `../../references/skill-guides/feishu-base/SKILL.md`
- Drive/files/media: `../../references/skill-guides/feishu-drive/SKILL.md`
- Calendar/schedule/rooms: `../../references/skill-guides/feishu-calendar/SKILL.md`
- Minutes/meeting records: `../../references/skill-guides/feishu-minutes/SKILL.md`
- Video conference records: `../../references/skill-guides/feishu-vc/SKILL.md`
- Meeting notes by note id: `../../references/skill-guides/feishu-note/SKILL.md`
- Tasks/action items: `../../references/skill-guides/feishu-task/SKILL.md`
- IM/messages/groups: `../../references/skill-guides/feishu-im/SKILL.md`
- Mail: `../../references/skill-guides/feishu-mail/SKILL.md`
- Approval: `../../references/skill-guides/feishu-approval/SKILL.md`
- Contacts/users/departments: `../../references/skill-guides/feishu-contact/SKILL.md`
- OKR: `../../references/skill-guides/feishu-okr/SKILL.md`
- Attendance: `../../references/skill-guides/feishu-attendance/SKILL.md`
- Slides: `../../references/skill-guides/feishu-slides/SKILL.md`
- Whiteboard/boards: `../../references/skill-guides/feishu-whiteboard/SKILL.md`
- Drive-native Markdown: `../../references/skill-guides/feishu-markdown/SKILL.md`
- Feishu Apps/app hosting: `../../references/skill-guides/feishu-apps/SKILL.md`
- Events/subscriptions: `../../references/skill-guides/feishu-event/SKILL.md`
- Feishu Project/work items/workbench/gantt: `../../references/skill-guides/feishu-project/SKILL.md`
- Multi-step workflows: `../../references/skill-guides/feishu-workflows/SKILL.md`
- Link routing details: `../../references/skill-guides/feishu-shared/references/link-routing.md`
- Write-risk policy: `../../references/skill-guides/feishu-shared/references/risk-policy.md`

## Command conventions

- Use `--as user` unless there is a clear reason to use `--as bot`.
- For docs commands, include `--api-version v2`.
- `lark-cli` command flags change between versions. Before composing a doc/wiki/sheet/base write, confirm the current syntax from the version-matched skill (`lark-cli skills read <skill> ...`) or `lark-cli <domain> --help` rather than relying on memorized flags. If a command is rejected as a "legacy flag" or "v2-only", re-read the schema instead of retrying.
- Prefer shortcut commands such as `docs +fetch`, `docs +create`, `docs +update`, `calendar +agenda`, `contact +search-user`, `sheets ...`, and `wiki ...` before raw OpenAPI calls.
- For `project.feishu.cn` links, use URL parsing and `feishu-project`; do not route them to normal Docs, Task, or Wiki commands.
- For Feishu Project reads/writes, first check `get_feishu_project_config.mjs`; if credentials are missing, return parsed URL context plus the missing configuration fields.
- If the user asks whether official `lark-cli` supports Feishu Project, run `check_lark_cli_project_support.mjs`; if official support appears in a future version, prefer official commands before the custom Project OpenAPI fallback.
- Use `--format json` for machine-readable output.
- Pass user-provided values as separate arguments; avoid building command strings by concatenation.

## Writes and shared-resource changes

Before writes that affect shared resources or other people, show a concise preview and ask for confirmation. Use `node ../../scripts/new_workspace_write_plan.mjs` when the operation has a concrete target and payload. If `lark-cli` exits with `confirmation_required`, stop and ask the user. Do not append `--yes` unless the user explicitly confirms the exact operation.

When a CLI call fails, summarize the attempted operation, target, error message, and likely fix. If `_notice.update` appears, or the preflight reports `updateAvailable: true`, finish the current task and mention the available `lark-cli update` — an out-of-date CLI is a common cause of rejected flags.
