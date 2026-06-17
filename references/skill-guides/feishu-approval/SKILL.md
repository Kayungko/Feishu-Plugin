---
name: feishu-approval
description: Feishu/Lark Approval operations through lark-cli. Use for approval instances, approval tasks, pending approvals, initiated approvals, detail lookup, pass/refuse/forward/rollback/remind operations.
---

# Feishu Approval

Use for approval tasks and approval instances. Approval tasks are not Feishu Tasks; do not route them to `feishu-task`.

## Read operations

Safe reads include listing pending approvals, listing initiated instances, reading instance details, and reading task details.

## Approval actions

Passing, refusing, forwarding, adding sign, rollback, remind, or adding CC changes a business approval flow. Always show a preview and ask for confirmation.

## CLI discovery

```powershell
lark-cli approval --help
```
