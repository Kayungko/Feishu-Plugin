# Feishu Workspace Workflow Recipes

These recipes define stable team workflows. They are not separate public skills; route through the single `feishu-workspace` skill.

## Diagnose Workspace

User entry:

```text
检查一下我的飞书环境
```

Steps:

1. Run `scripts/diagnose_feishu_workspace.ps1`.
2. Summarize available capabilities.
3. List missing configuration or auth issues.
4. Give next actions in plain language.

Output:

- CLI status
- current identity
- available domains
- Project fallback status
- recommended fixes

## Team Help

User entry:

```text
这个插件怎么用？
```

```text
给我一些常用提示词
```

Steps:

1. Run `scripts/get_team_help.ps1`.
2. Summarize capability groups.
3. Show 8 to 12 prompt examples.
4. Do not list internal skill files or raw command help unless the user asks.

Output:

- capability groups
- common prompts
- write-confirmation rule
- troubleshooting entry

## Smoke Test

User entry:

```text
检查一下这个插件包是否正常
```

Steps:

1. Run `scripts/run_workspace_smoke_test.ps1`.
2. If the user only wants local package validation, use `-SkipAuthVerify`.
3. Report failed checks first.
4. Keep the result short; include version, script readiness, dry-run status, and auth status when checked.

Output:

- plugin version
- script presence
- lark-cli/auth readiness
- write-preview dry-run result
- meeting-to-task dry-run result

## Standard Write Preview

Use this before writes that affect shared resources or other people.

User entry:

```text
先给我看一下写入计划，不要直接执行
```

Steps:

1. Prepare the intended operation, target, payload summary, item count, and expected effect.
2. Run `scripts/new_workspace_write_plan.ps1` to produce a stable preview.
3. Show the preview in plain language.
4. Execute only after the user confirms the exact target and operation.

Script example:

```powershell
../../scripts/new_workspace_write_plan.ps1 -Operation update-doc -Target "<doc-url>" -TargetType docx -PayloadSummary "append 3 sections" -Effect "adds content to existing shared doc"
```

Output:

- target
- operation
- payload summary
- expected effect
- confirmation requirement

## Meeting To Actions

User entry:

```text
把这次会议纪要整理成行动项
```

```text
读取这个 note_id 的逐字稿并提取行动项，先生成任务草稿，不要直接创建：
<note_id>
```

Steps:

1. Locate the Minutes, VC, or Note target.
2. Read summary and transcript when available.
3. Use `scripts/extract_meeting_action_items.ps1` for repeatable action-item extraction from pasted text, transcript files, or Note transcript by `note_id`.
4. Use `scripts/preview_task_creation.ps1` to convert extracted items into task drafts.
5. Ask for confirmation before creating tasks or sending messages. Do not create tasks from heuristic extraction without a reviewed preview.

Output:

- meeting summary
- decisions
- task draft table
- unresolved owner/date questions

Script examples:

```powershell
../../scripts/extract_meeting_action_items.ps1 -Text "<meeting text>" -IncludeSourceLines
../../scripts/extract_meeting_action_items.ps1 -NoteId "<note_id>" -OutputPath actions.json
../../scripts/preview_task_creation.ps1 -ActionItemsPath actions.json
```

## Requirement To UI Intake Checklist

User entry:

```text
把这个需求整理成入版执行清单
```

Steps:

1. Parse the input as Project URL, Doc/Wiki URL, or pasted text.
2. If Project URL and config is missing, report parsed context and request missing requirement content.
3. Extract UI states, resources, interaction points, adaptation points, and risk areas.
4. Separate automatic checks from manual confirmation items.
5. Create a doc or table only after confirmation.

Output:

- background
- UI scope
- resource checklist
- implementation checklist
- risk list
- questions to confirm

## Document To Structured Summary

User entry:

```text
读取这篇文档，总结重点、待办和需要确认的问题
```

Steps:

1. Read the source doc or wiki outline first when the document is large.
2. Extract background, decisions, action items, risks, and open questions.
3. Keep quotes short; paraphrase long content.
4. Return a structured summary in chat unless the user asks to create a new doc.
5. If creating or updating a doc, generate a write preview first.

Output:

- background
- key decisions
- action items
- risks
- open questions

## Document To Oral Share Script

User entry:

```text
把这篇文档整理成口语化分享稿
```

Steps:

1. Read source doc or wiki.
2. Identify the intended audience and duration from the user request when available.
3. Convert written sections into speaker notes with natural transitions.
4. Remove generic AI phrasing and avoid adding external organization goals unless present in source.
5. Offer 5/10/15 minute versions when useful.
6. Create a new doc only after a write preview and confirmation.

Output:

- title
- opening
- section-by-section speaker notes
- transition lines
- optional short version

## Document To Human Rewrite

User entry:

```text
把这篇文档去一下 AI 味，保留原意
```

Steps:

1. Read the source document.
2. Preserve facts, structure, names, dates, and constraints.
3. Replace generic claims with concrete wording already supported by the source.
4. Prefer shorter sentences and direct phrasing.
5. Return a diff-style summary before updating the original doc.
6. Update the source only after a write preview and confirmation.

Output:

- rewritten draft
- changed tone notes
- risky assumptions
- update plan

## Multi-Link Knowledge Index

User entry:

```text
把这些飞书链接整理成资料索引
```

Steps:

1. Parse each link type.
2. Fetch title and short summary when accessible.
3. Group by topic and audience.
4. Produce a draft index with tags and recommended reading order.
5. Create a doc or wiki node only after a write preview and confirmation.

Output:

- grouped links
- summaries
- tags
- recommended reading order

## Resource Paths To Sheet

User entry:

```text
把这批资源路径登记到表格
```

Steps:

1. Parse resource names and paths.
2. Infer category and variant when safe.
3. Preview target fields and row count.
4. Use `scripts/new_workspace_write_plan.ps1` for the sheet/base write preview.
5. Write rows only after confirmation.

Output:

- preview table
- ambiguous rows
- write plan

## Personal Daily Brief

User entry:

```text
帮我整理今天要处理的事情
```

Steps:

1. Read today's calendar.
2. Read unfinished tasks.
3. Optionally search relevant meeting notes.
4. Sort by time and urgency.
5. Mark unclear or blocked items.

Output:

- today's meetings
- tasks
- preparation notes
- risks
- recommended order
