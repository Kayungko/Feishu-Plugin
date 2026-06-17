---
name: feishu-router
description: Route Feishu/Lark requests and links to the correct workspace skill. Use when the user provides any feishu.cn, larksuite.com, or larkoffice.com URL; asks to read, summarize, create, update, move, upload, schedule, send, or extract from Feishu; or says "飞书", "Lark", "Wiki", "文档", "表格", "多维表格", "妙记", "会议", "日程", "任务", or "群消息" without specifying a tool.
---

# Feishu Router

Use this skill first for ambiguous Feishu/Lark requests.

## Routing steps

1. Read `../feishu-shared/SKILL.md`.
2. Parse links with:
   ```bash
   node ../../scripts/parse_feishu_url.mjs "<url>"
   ```
3. Route to exactly one primary skill:
   - doc/docx creation, reading, editing: `feishu-doc`
   - wiki node reading/creation/organization: `feishu-wiki`
   - spreadsheet cells and workbook structure: `feishu-sheet`
   - bitable/base records and fields: `feishu-base`
   - file upload/download/media: `feishu-drive`
   - calendar and scheduling: `feishu-calendar`
   - meeting minutes/transcripts/action items: `feishu-minutes`
   - tasks/todos: `feishu-task`
   - messages/chats/groups: `feishu-im`
   - multi-step common office flows: `feishu-workflows`

## Defaults

- If a wiki link points to a document, use `feishu-wiki` to resolve context, then `feishu-doc` for content operations.
- If a wiki link includes `sheet=...`, use `feishu-sheet` for the sheet content after resolving access.
- If the user wants "整理到另一个文档", use `feishu-doc`.
- If the user wants "整理到表格", use `feishu-sheet` or `feishu-base` depending on link type.
- If the request affects other people, require preview and confirmation before execution.
