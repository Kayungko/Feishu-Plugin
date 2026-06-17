---
name: feishu-task
description: Feishu/Lark Task operations through lark-cli. Use for creating tasks, reading task lists, updating task status, splitting action items into tasks, and converting docs or meeting minutes into task drafts.
---

# Feishu Task

Read `../feishu-shared/SKILL.md` first.

## Safe operations

- Read own tasks and task lists.
- Draft task breakdowns from docs or minutes.

## Confirm first

Before creating or assigning tasks, preview:

- task title
- description
- assignee
- due date
- source document/minutes link
- checklist/subtasks

Updating another person's task or assigning work requires explicit confirmation.

## CLI discovery

```powershell
lark-cli task --help
```
