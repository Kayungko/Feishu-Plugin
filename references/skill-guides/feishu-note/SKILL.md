---
name: feishu-note
description: Feishu/Lark meeting note operations through lark-cli. Use for known note_id lookup, unified transcript retrieval, associated document tokens, and meeting note metadata.
---

# Feishu Note

Use when the request provides a note ID or asks for meeting note detail that is not handled by Minutes.

## Read operations

Reading note metadata, associated document token, display type, and unified transcript is safe when the user has access.

## CLI discovery

```bash
lark-cli note --help
```
