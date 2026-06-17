---
name: feishu-contact
description: Feishu/Lark contact operations through lark-cli. Use for resolving people by name, email, open_id, department, profile, and user identity before messages, meetings, approvals, or tasks.
---

# Feishu Contact

Use for user and department lookup. Prefer this before IM, calendar attendee operations, approval routing, task assignment, and any workflow that needs a stable user identifier.

## Read operations

Safe operations include searching users, resolving open IDs, reading basic profile fields, and checking departments.

## Privacy

Only return fields needed for the task. Do not expose phone, email, department, or status unless relevant.

## CLI discovery

```powershell
lark-cli contact --help
```
