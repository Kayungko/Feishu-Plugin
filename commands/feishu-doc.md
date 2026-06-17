---
description: 把内容整理成飞书文档（写入共享资源前先给写入计划并等待确认）
argument-hint: "<要整理的内容或来源链接>"
---

把下面的内容整理成飞书文档：

$ARGUMENTS

步骤：

1. 如果来源是飞书链接，先读取原内容。
2. 整理出文档结构和正文草稿，用中文展示给用户预览。
3. 写入前生成写入计划：
   ```powershell
   powershell -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/scripts/new_workspace_write_plan.ps1"
   ```
   说明目标位置、文档标题、大致内容和影响范围。
4. **等待用户明确确认后**，才用 `lark-cli` 以用户身份创建/更新文档（`docs +create` / `docs +update`，加 `--api-version v2`）。

创建/更新文档是写操作。不要在确认前执行，不要擅自追加 `--yes`。若 `lark-cli` 返回 `confirmation_required`，停下并询问用户。
