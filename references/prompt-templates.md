# Feishu Workspace Prompt Templates

Use these prompts as team-facing examples. Keep prompts short, explicit, and confirmation-aware.

## Environment

```text
@feishu-workspace 这个插件怎么用？给我 8 条最常用的提示词。
```

```text
@feishu-workspace 检查一下这个插件包是否正常，包含本地脚本和 dry-run，不要执行真实飞书写入。
```

```text
@feishu-workspace 检查一下我的飞书环境，告诉我哪些能力可用，哪些还缺配置。
```

```text
@feishu-workspace 这个飞书操作失败了，帮我判断是登录、权限、scope 还是配置问题：
<粘贴错误信息>
```

## Docs and Wiki

```text
@feishu-workspace 读取这个飞书文档，总结重点、待办和需要确认的问题：
<文档链接>
```

```text
@feishu-workspace 读取这篇 Wiki，整理成结构化摘要：背景、结论、风险、待办、需要确认的问题。
<Wiki 链接>
```

```text
@feishu-workspace 把下面内容整理成飞书文档，结构为：背景、现状、方案、风险、下一步。
<粘贴内容>
```

```text
@feishu-workspace 读取这篇文档，改写成更口语化的内部分享稿，不要增加公司目标相关表述：
<文档链接>
```

```text
@feishu-workspace 把这篇文档去一下 AI 味，保留事实和原结构。先给改写稿，不要直接覆盖原文：
<文档链接>
```

```text
@feishu-workspace 把这篇文档整理成 10 分钟分享稿，按“开场、每页讲什么、过渡句、收尾”输出：
<文档链接>
```

```text
@feishu-workspace 根据下面内容准备新文档。先给标题、目录和写入计划，不要直接创建：
<粘贴内容>
```

## Meetings

```text
@feishu-workspace 搜索昨天的会议纪要，提取行动项、负责人、截止时间，先生成任务草稿，不要直接创建任务。
```

```text
@feishu-workspace 把这次会议纪要整理成行动项，先生成任务草稿，不要直接创建任务：
<粘贴会议纪要或逐字稿>
```

```text
@feishu-workspace 读取这个 note_id 的逐字稿并提取行动项，输出任务草稿和需要人工确认的问题：
<note_id>
```

```text
@feishu-workspace 把这次会议纪要整理成一份复盘文档，包含结论、分歧、待办和风险：
<妙记或会议链接>
```

## Calendar and Tasks

```text
@feishu-workspace 查询我今天的日程，并按时间顺序列出我需要准备的事情。
```

```text
@feishu-workspace 帮我找明天下午 30 分钟的可约时间，参会人是 <姓名列表>，先给候选时间，不要直接建会。
```

```text
@feishu-workspace 把下面内容拆成任务草稿，按负责人、截止时间、优先级整理，先不要创建：
<粘贴内容>
```

```text
@feishu-workspace 把这些任务草稿创建到飞书任务前，先给我看写入计划：
<任务草稿>
```

## Sheets and Base

```text
@feishu-workspace 把这批资源路径整理成表格字段：名称、类型、路径、用途、状态。先预览，不要直接写入。
<粘贴资源清单>
```

```text
@feishu-workspace 把下面清单写入这个表格前，先给字段映射、行数和写入计划：
<表格链接>
<粘贴清单>
```

```text
@feishu-workspace 读取这个表格，找出缺字段、重复项和需要人工确认的行：
<表格链接>
```

```text
@feishu-workspace 把下面 AI 使用案例整理成多维表记录草稿，字段为：工具、场景、输入、产出、风险、复用建议。
<粘贴案例>
```

## Project

```text
@feishu-workspace 解析这个飞书项目需求单链接，告诉我项目 key、工作项类型、ID，以及当前还缺什么配置：
<project.feishu.cn 链接>
```

```text
@feishu-workspace 把这个需求整理成入版执行清单。如果无法读取需求单，就告诉我需要补充哪些内容：
<project.feishu.cn 链接>
```

## IM and Mail

```text
@feishu-workspace 根据这份文档生成一条发给 <姓名> 的飞书消息草稿，不要直接发送：
<文档链接>
```

```text
@feishu-workspace 把这段内容整理成群消息草稿。发送前必须让我确认完整消息：
<粘贴内容>
```

```text
@feishu-workspace 帮我起草一封邮件，说明这次分享资料已经整理完成。只生成草稿，不要发送。
```

## Weekly Summary

```text
@feishu-workspace 汇总我本周和 AI / 入版相关的日程、任务、会议纪要，生成周报草稿。
```

```text
@feishu-workspace 把这些飞书链接整理成一个资料索引，按主题分组，每条包含标题、摘要、适合谁读：
<粘贴多个链接>
```

```text
@feishu-workspace 把这些链接整理成资料索引文档。先输出草稿和写入计划，不要直接创建：
<粘贴多个链接>
```
