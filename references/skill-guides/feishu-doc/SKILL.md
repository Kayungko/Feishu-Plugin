---
name: feishu-doc
description: Feishu/Lark Docx document operations through lark-cli. Use for reading, creating, summarizing, rewriting, updating, appending, replacing, importing Markdown, inserting media into docs, or extracting structured information from Feishu docx links.
---

# Feishu Doc

Read `../feishu-shared/SKILL.md` first.

## Confirm the current command schema before any write

`lark-cli` ships its own version-matched doc skill. The exact update commands and content format change between CLI versions — the v1 `--mode/--markdown/--selection-by-title` interface was removed in favor of v2 `--command/--content/--block-id`. Do not rely on memorized flags or copy command shapes from this file for creates/updates/media. Before composing a write command, read the live schema from the CLI itself:

```bash
lark-cli skills read lark-doc references/lark-doc-update.md   # update commands + examples
lark-cli skills read lark-doc references/lark-doc-xml.md      # XML content format (default)
lark-cli skills read lark-doc references/lark-doc-md.md       # Markdown content format
lark-cli docs +update --help                                 # flags for the installed CLI
```

If a command is rejected with a "v2-only" or "legacy flag" error, the CLI version moved on — re-read the schema above instead of retrying the old flags.

## Read

```bash
lark-cli docs +fetch --api-version v2 --as user --doc "<url-or-token>" --format json
```

Use `--scope outline --max-depth 3` before full reads when the doc is large. Use `--detail with-ids` when block ids are needed — `block_*` edits require a block id from a `with-ids` fetch.

## Create / Update / Media

Always pass `--api-version v2`, and confirm the exact invocation from the live skill (above) before running.

- **Create** (`docs +create`): supply content via `--content`. XML by default; Markdown only when importing a local `.md` or when the user explicitly asks. For long docs, create a skeleton first, then fill sections.
- **Update** (`docs +update`): preview before altering a shared doc. Precise edits use a `--command` such as `str_replace`, `block_insert_after`, `block_replace`, `block_delete`, or `block_move_after` with a `--block-id` from a `--detail with-ids` fetch. Whole-doc writes use `append` or `overwrite`.
- **Media** (`docs +media-insert`): pass `--file "<path>"`; confirm before uploading private or large files to shared docs.
