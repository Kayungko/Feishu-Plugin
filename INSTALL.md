# Feishu Workspace Plugin - Team Guide

This plugin lets Codex use Feishu/Lark workspace features through `lark-cli`: docs, wiki, sheets, base, drive, calendar, minutes, notes, tasks, IM, mail, approval, contacts, Project fallback, and common office workflows.

The public Codex entry is one skill: `feishu-workspace`. Internal guides are hidden by default so version/details pages stay readable.

## Prerequisites

The helper scripts run on Node.js (already installed alongside `lark-cli`, which is the npm package `@larksuite/cli`). Node 18+ is required (global `fetch` and modern ESM). The scripts are cross-platform: Windows, macOS, and Linux all run them with `node`.

## Install

Use the packaged zip or the local personal marketplace source prepared by the maintainer.

Local personal marketplace install:

```bash
codex plugin add feishu-workspace@personal
```

If Codex reports Windows cache access denied, close extra Codex windows or ask the maintainer to refresh the cache package. This usually means the desktop app is holding the previous plugin cache.

## Update

The maintainer updates the plugin version with a Codex cachebuster such as:

```text
0.1.0+codex.20260617132329
```

After update, start a new Codex thread before testing. Existing threads may keep the old plugin metadata in context.

## Claude Code Desktop (Claude Code 桌面端)

The same package also ships a Claude Code plugin manifest (`.claude-plugin/plugin.json`) and a local marketplace (`.claude-plugin/marketplace.json`), so it works in Claude Code alongside Codex without duplicating skills or scripts.

### Quick local test

Load the plugin directly without installing:

```bash
claude --plugin-dir .
```

### Install via local marketplace

In a Claude Code session, add this folder as a marketplace and install the plugin:

```text
/plugin marketplace add G:\feishu_CLIforMe\feishu-workspace
/plugin install feishu-workspace@feishu-workspace-market
```

Then run `/reload-plugins` (or restart) to load skills and commands.

### Slash commands

Claude Code exposes these namespaced slash commands (the `feishu-workspace` skill still auto-triggers from context):

- `/feishu-workspace:feishu-help` — what the plugin can do + common prompts
- `/feishu-workspace:feishu-read <飞书链接>` — read and summarize a Feishu resource
- `/feishu-workspace:feishu-agenda [日期]` — today's schedule and prep items
- `/feishu-workspace:feishu-actions <纪要/链接>` — extract action items, draft tasks (no creation)
- `/feishu-workspace:feishu-doc <内容>` — organize into a Feishu doc (preview before write)
- `/feishu-workspace:feishu-check [--skip-auth]` — diagnose environment and run package smoke test

### Update

Bump `version` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, then in Claude Code run `/plugin marketplace update` followed by `/reload-plugins`. Start a new session before testing.

## Login

Check Feishu CLI and user auth:

```bash
node ./scripts/check_lark_cli.mjs --verify-auth
```

Expected:

- `ok: true`
- `lark-cli version ...`
- user identity is ready

If auth fails, run the login flow suggested by `lark-cli`. Use user identity for normal personal workspace operations.

## Verify Plugin Package

Run package smoke test:

```bash
node ./scripts/run_workspace_smoke_test.mjs
```

Package-only test without Feishu auth verification:

```bash
node ./scripts/run_workspace_smoke_test.mjs --skip-auth-verify
```

Expected checks:

- scripts present
- `lark-cli` ready
- team help ready
- write preview dry-run ready
- meeting action extraction ready
- task draft preview ready

### Contract regression tests (maintainers)

After changing any helper script, run the contract tests to confirm the JSON output shape is unchanged:

```bash
node ./scripts/run_contract_tests.mjs
```

Deterministic cases diff against baselines in `scripts/__tests__/baselines/` and run anywhere (no `lark-cli` needed); the three `lark-cli` probe cases are structural and auto-skip when `lark-cli` is not on PATH.

## First Thread Test

In a new Codex thread, test these prompts:

```text
@feishu-workspace 这个插件怎么用？给我 8 条最常用的提示词。
```

```text
@feishu-workspace 检查一下这个插件包是否正常，包含本地脚本和 dry-run，不要执行真实飞书写入。
```

```text
@feishu-workspace 查询我今天的日程，并按时间顺序列出我需要准备的事情。
```

```text
@feishu-workspace 读取这个飞书文档，总结重点、待办和需要确认的问题：
<文档链接>
```

```text
@feishu-workspace 把这次会议纪要整理成行动项，先生成任务草稿，不要直接创建任务：
<会议纪要或逐字稿>
```

```text
@feishu-workspace 把下面清单写入这个表格前，先给字段映射、行数和写入计划：
<表格链接>
<清单>
```

## Safety Rules

- Reads can run directly.
- Shared writes require preview first.
- Sending IM/mail, creating tasks, assigning tasks, inviting attendees, writing sheets/base records, moving files, and changing permissions require explicit confirmation.
- The plugin should not show internal skill lists, raw CLI help, or long scope/version details unless asked.

## Common Issues

`codex plugin add` reports `拒绝访问`:

- Cause: Codex desktop is holding the previous plugin cache.
- Fix: restart Codex or ask the maintainer to refresh the cache package.

Calendar/doc/sheet access fails:

- Cause: missing auth, expired token, missing scope, or no document permission.
- Fix: run `node ./scripts/check_lark_cli.mjs --verify-auth`, then retry after login or permission grant.

Project links cannot be read:

- Cause: official `lark-cli` may not support Feishu Project commands.
- Fix: use the Project OpenAPI fallback config when Project access is required.

Output is too verbose:

- Ask: `只给结论和下一步，不要展开内部命令。`
- Maintainer should check `get_team_help.mjs`, `run_workspace_smoke_test.mjs`, and progress style rules in `skills/feishu-workspace/SKILL.md`.

Write operation starts too early:

- Stop the operation and require a write preview.
- Use `node scripts/new_workspace_write_plan.mjs` before shared writes.
