---
name: feishu-base
description: Feishu/Lark Base or Bitable operations through lark-cli. Use for Base links, reading app/table schema, reading records, creating records, updating fields, views, forms, and structured workflow data in Feishu Base.
---

# Feishu Base

Read `../feishu-shared/SKILL.md` first.

## Default flow

1. Parse app token and table id from URL when present.
2. Read schema before reading or writing records.
3. For updates, match records by stable fields only.
4. Preview record count and changed fields before writing.

## Safety

- Reading schema and records is safe.
- Creating/updating records in shared Base requires confirmation.
- Deleting records, fields, views, forms, dashboards, or roles is high risk and requires explicit confirmation.

## CLI discovery

```powershell
lark-cli base --help
```
