---
name: feishu-sheet
description: Feishu/Lark spreadsheet operations through lark-cli. Use for reading sheets, writing cells, batch updates, table-like extraction, converting docs to sheets, converting sheets to docs, handling sheet URLs, and wiki links with sheet query parameters.
---

# Feishu Sheet

Read `../feishu-shared/SKILL.md` first.

## Read before write

Always inspect workbook/sheet structure before updating:

```bash
lark-cli sheets --help
```

Use commands that read spreadsheet metadata and target ranges before writing values.

## Write policy

Writing shared sheets requires preview and confirmation. Show:

- target spreadsheet
- sheet/tab
- range or matching field
- number of rows/cells affected
- sample rows

## Common workflows

- Extract a table from docs/wiki and append to a sheet.
- Read a sheet and generate a summary doc.
- Batch fill missing values after confirming row matching logic.

Do not invent row mapping rules. If key columns are unclear, ask for or infer them from headers and show the inference before writing.
