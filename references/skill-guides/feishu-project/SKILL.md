---
name: feishu-project
description: Feishu Project operations for project.feishu.cn links, work items, stories, issues, workbench views, gantt views, nodes, comments, fields, attachments, and project OpenAPI discovery.
---

# Feishu Project

Use this guide for `project.feishu.cn`, `project.larksuite.com`, and Feishu Project links such as:

- `/{project_key}/story/detail/{work_item_id}`
- `/{project_key}/issue/detail/{work_item_id}`
- `/{project_key}/userGantt/{view_id}?scope=...&node=...`
- workbench, gantt, node, field, attachment, and project-space views

## Current execution model

`lark-cli` does not expose a first-class `project` command in the current installed CLI. Treat Feishu Project as a separate OpenAPI integration, not as normal Feishu Docs/Calendar APIs.

Official CLI support checked:

- Local `lark-cli 1.0.54`: no `project` command and no `lark-project` skill.
- Official npm latest `@larksuite/cli 1.0.55`: no `project` command and no `lark-project` skill.
- The official CLI currently covers core office domains such as Messenger/IM, Docs, Base, Sheets, Slides, Calendar, Mail, Tasks, Meetings, Markdown, and related skills. Feishu Project is not exposed as a first-class CLI domain yet.

Re-check official support when needed:

```powershell
../../scripts/check_lark_cli_project_support.ps1
../../scripts/check_lark_cli_project_support.ps1 -UseLatestNpx
```

If a future official CLI version adds `lark-cli project ...` or a `lark-project` skill, prefer the official command path and keep the custom Project OpenAPI layer as fallback.

Use `../../scripts/parse_feishu_url.ps1` first to extract:

- `kind`
- `projectKey`
- `projectRoute`
- `workItemType`
- `workItemId`
- `nodeId`
- query parameters such as `scope` and `node`

V2.1 provides a configurable Project API layer:

- `../../scripts/check_lark_cli_project_support.ps1`
- `../../scripts/get_feishu_project_config.ps1`
- `../../scripts/invoke_feishu_project_api.ps1`
- `../../templates/feishu-project.config.example.json`

## Required credentials

Feishu Project OpenAPI normally needs project plugin credentials and project-scoped identity information:

- Project plugin ID
- Project plugin secret
- Project base URL, for example `https://project.feishu.cn`
- `project_key`, for example `mtsgame`
- `user_key` when an API requires acting as a specific project user
- Space/workspace permission for that user or plugin

Do not pretend a Project URL can be read through normal `lark-cli docs`, `wiki`, or `task` commands.

## Configuration

Do not store real secrets in the plugin package. Use either environment variables or a local config file.

Default local config path:

```powershell
$HOME\.codex\feishu-project.config.json
```

Template:

```powershell
../../templates/feishu-project.config.example.json
```

Supported environment variables:

- `FEISHU_PROJECT_CONFIG`
- `FEISHU_PROJECT_BASE_URL`
- `FEISHU_PROJECT_PLUGIN_ID`
- `FEISHU_PROJECT_PLUGIN_SECRET`
- `FEISHU_PROJECT_PLUGIN_ACCESS_TOKEN`
- `FEISHU_PROJECT_AUTH_PATH`
- `FEISHU_PROJECT_TOKEN_FIELD`
- `FEISHU_PROJECT_AUTH_MODE`
- `FEISHU_PROJECT_USER_KEY`
- `FEISHU_PROJECT_DEFAULT_PROJECT_KEY`

Check config without exposing secrets:

```powershell
../../scripts/get_feishu_project_config.ps1
```

## Read-only MVP behavior

When credentials are not configured, still parse and explain what can be inferred from the URL:

- project key
- link type, such as work item detail or user gantt/workbench
- work item type and id when present
- node id and scope when present
- what additional credentials are needed

When credentials are configured, prefer read-only operations first:

- get work item detail
- get workflow or node detail
- get comments
- get attachments
- get related work items
- get field definitions and map field keys to labels
- get workbench/gantt view metadata when the API supports it

Use dry-run before real API calls:

```powershell
../../scripts/invoke_feishu_project_api.ps1 -Method GET -Path "/open_api/..." -DryRun
```

Then call with the official Project API path from documentation:

```powershell
../../scripts/invoke_feishu_project_api.ps1 -Method GET -Path "/open_api/..." -QueryJson '{"project_key":"mtsgame"}'
```

## Work item output

For story or issue links, return a compact summary:

- title/name
- status/stage
- owner/assignee
- priority
- business line/module when available
- description
- current node and schedule
- comments summary
- attachments
- related items
- fields that failed to resolve

## Workbench and gantt output

For `userGantt` or workbench links, return:

- project key
- view route and view id
- scope
- node id
- visible time range if available
- grouped work items or nodes if available
- unresolved fields or missing permission notes

## Writes

Any update to a Project work item, node, comment, attachment, owner, status, schedule, or field value affects shared project state. Always show a preview and ask for confirmation before writing.

The invocation script enforces this. `POST`, `PUT`, `PATCH`, and `DELETE` return `confirmation_required` unless `-ConfirmWrite` is passed after the user confirms the exact operation.

## CLI discovery

Use generic API discovery only after confirming Project credentials and API base URL:

```powershell
lark-cli api --help
lark-cli schema --help
```

If the official Project API endpoint is not included in the installed `lark-cli schema`, use the Project OpenAPI documentation and call the Project API host directly only when credentials are available.
