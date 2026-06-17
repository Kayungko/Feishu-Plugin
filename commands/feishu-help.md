---
description: 介绍飞书工作区插件能做什么，并给出最常用的提示词
argument-hint: "[short|full]"
---

运行团队帮助脚本并把结果整理成简洁的能力清单和提示词建议，不要罗列内部 skill 文件或原始 CLI 帮助。

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/get_team_help.mjs" --mode "$ARGUMENTS"
```

如果 `$ARGUMENTS` 为空，按 `short` 模式运行。把输出按「能做什么」「常用提示词」「使用规则」三部分用中文总结，每条简短可执行。
