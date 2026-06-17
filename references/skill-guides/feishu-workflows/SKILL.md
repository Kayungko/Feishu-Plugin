---
name: feishu-workflows
description: Reusable team workflows across Feishu/Lark docs, wiki, sheets, base, minutes, tasks, drive, calendar, and IM. Use for multi-step requests such as document-to-summary, wiki-to-doc, sheet-to-doc, doc-to-sheet extraction, minutes-to-actions, local Markdown to Feishu doc, upload-and-insert, or sending a confirmed summary.
---

# Feishu Workflows

Read `../feishu-shared/SKILL.md` first. Use router and domain skills as needed. Keep workflows generic; do not include project-specific resource registration or Unity rules here.

For any write that affects a shared resource or another person, create a preview with `../../../scripts/new_workspace_write_plan.ps1` before executing the domain command.

## Workflow: document or wiki to summary doc

1. Read source with `feishu-doc` or `feishu-wiki`.
2. Extract audience, purpose, decisions, action items, risks.
3. Return the summary in chat unless the user asks for a new doc.
4. If creating a doc in a shared location or updating an existing doc, generate a write preview first.
5. Create the doc with `feishu-doc` only after required confirmation.

## Workflow: document to oral share script

1. Read source with `feishu-doc` or `feishu-wiki`.
2. Identify audience, expected length, and sections.
3. Convert written content into speaker notes with natural transitions.
4. Remove generic AI phrasing; do not add outside organization goals unless present in source.
5. Create or update a doc only after a write preview and confirmation.

## Workflow: document human rewrite

1. Read source document.
2. Preserve facts, names, dates, constraints, and original intent.
3. Replace generic phrasing with concrete, source-supported wording.
4. Show a rewritten draft and change summary.
5. Update the source only after a write preview and confirmation.

## Workflow: document to sheet

1. Read source doc.
2. Identify table schema from user request or target sheet headers.
3. Preview extracted rows.
4. Generate a write preview with target sheet, row count, fields, and expected effect.
5. Confirm before writing to a shared sheet.

## Workflow: sheet to doc

1. Read sheet headers and relevant rows.
2. Summarize by section.
3. Create a draft in chat first.
4. Create or update a doc only after a write preview and confirmation.

## Workflow: minutes to tasks

1. Fetch minutes summary/action items.
2. Use `../../../scripts/extract_meeting_action_items.ps1` when transcript text or note_id is available.
3. Use `../../../scripts/preview_task_creation.ps1` to normalize task title, owner hint, due date, and source.
4. Generate a write preview when the user asks to create tasks.
5. Confirm before creating or assigning tasks.

## Workflow: local Markdown to Feishu doc

1. Read the local file.
2. Convert to doc XML or Markdown import.
3. Generate a write preview if the target is shared.
4. Create a doc.
5. Return URL.

## Workflow: send summary to group

1. Prepare summary.
2. Resolve recipient.
3. Show exact message.
4. Generate a write preview for `send-im`.
5. Confirm before sending with `feishu-im`.
