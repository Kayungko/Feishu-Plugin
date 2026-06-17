---
description: 检查飞书环境与插件包是否就绪（登录、CLI 版本、脚本、dry-run）
argument-hint: "[--skip-auth]"
---

检查飞书工作区环境和插件包是否正常。

1. 环境诊断（CLI、登录、能力）：
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/diagnose_feishu_workspace.mjs"
   ```
2. 插件包冒烟测试（脚本齐全、dry-run，不做真实写入）：
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/run_workspace_smoke_test.mjs"
   ```

如果 `$ARGUMENTS` 含 `--skip-auth`，给冒烟测试加 `--skip-auth-verify` 做仅包检查。

用中文汇总：哪些就绪、哪些缺配置、下一步该做什么。失败时优先给原因分类和修复动作，不要贴长日志。
