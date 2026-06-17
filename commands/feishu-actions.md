---
description: 从会议纪要/逐字稿/纪要链接提取行动项，并生成任务草稿（默认不创建任务）
argument-hint: "<会议纪要链接或文本>"
---

从下面的会议内容提取行动项并生成任务草稿，**不要直接创建任务**：

$ARGUMENTS

步骤：

1. 如果输入是飞书链接，先读取内容（妙记/纪要用 `feishu-minutes` 路由，docs 加 `--api-version v2`）。
2. 提取行动项：
   ```powershell
   powershell -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/scripts/extract_meeting_action_items.ps1"
   ```
3. 生成任务草稿预览（负责人、截止时间、优先级）：
   ```powershell
   powershell -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/scripts/preview_task_creation.ps1"
   ```
4. 把草稿用中文表格展示给用户，并问是否需要真正创建任务。

只有用户明确确认后，才用 `lark-cli` 创建任务（创建是写操作，需要显式确认）。
