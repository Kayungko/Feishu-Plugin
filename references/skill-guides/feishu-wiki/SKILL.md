---
name: feishu-wiki
description: Feishu/Lark Wiki knowledge base operations through lark-cli. Use for wiki links, reading wiki nodes, creating wiki documents, moving/copying wiki nodes, resolving wiki document tokens, and organizing knowledge base content.
---

# Feishu Wiki

Read `../feishu-shared/SKILL.md` first.

## Common flow

1. Parse the wiki URL.
2. Retrieve node metadata or content.
3. If the target is a doc, use `feishu-doc` for body content operations.
4. If the URL contains a sheet query, use `feishu-sheet` for sheet operations.

## Safety

- Reading wiki content is safe.
- Creating a new wiki doc can run after user asks.
- Moving/copying nodes, changing permissions, or deleting nodes requires confirmation.

## CLI discovery

When exact command flags are needed, run:

```powershell
lark-cli wiki --help
lark-cli wiki +create --help
```

Use JSON output and user identity by default.
