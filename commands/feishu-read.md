---
description: 读取一个飞书链接（文档/Wiki/表格/纪要等）并总结重点、待办和待确认问题
argument-hint: "<飞书链接>"
---

读取并总结这个飞书资源：$ARGUMENTS

步骤：

1. 先解析链接类型：
   ```powershell
   powershell -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/scripts/parse_feishu_url.ps1" "$ARGUMENTS"
   ```
2. 按 `feishu-workspace` skill 的路由规则，用 `lark-cli` 以用户身份读取内容（docs 命令加 `--api-version v2`，优先 `docs +fetch` 等快捷命令，`--format json`）。
3. 输出中文总结：**重点**、**待办事项**、**需要确认的问题** 三部分。

这是只读操作，可直接执行，无需写入确认。若缺少登录或权限，按 CLI 提示给出下一步，不要输出长日志。
