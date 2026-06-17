---
name: feishu-doc
description: Feishu/Lark Docx document operations through lark-cli. Use for reading, creating, summarizing, rewriting, updating, appending, replacing, importing Markdown, inserting media into docs, or extracting structured information from Feishu docx links.
---

# Feishu Doc

Read `../feishu-shared/SKILL.md` first.

## Read

```bash
lark-cli docs +fetch --api-version v2 --as user --doc "<url-or-token>" --format json
```

Use `--scope outline --max-depth 3` before full reads when the doc is large. Use `--detail with-ids` when block ids are needed.

## Create

Use XML by default. Use Markdown only when importing a local `.md` or when the user explicitly asks for Markdown.

```bash
lark-cli docs +create --api-version v2 --as user --parent-position my_library --content '<title>标题</title><p>内容</p>' --format json
```

For long docs, create a skeleton first, then append sections.

## Update

Preview writes that alter shared docs. For append:

```bash
lark-cli docs +update --api-version v2 --as user --doc "<url-or-token>" --command append --content "<h1>标题</h1><p>内容</p>" --format json
```

Use XML for precise edits: `str_replace`, `block_insert_after`, `block_replace`, `block_delete`, `block_move_after`.

## Media

For images or files, prefer:

```bash
lark-cli docs +media-insert --api-version v2 --as user --doc "<doc>" --file "<path>"
```

Confirm before uploading private or large files to shared docs.
