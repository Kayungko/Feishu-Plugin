---
name: feishu-drive
description: Feishu/Lark Drive file operations through lark-cli. Use for uploading files, downloading files or document media, creating folders, moving/copying files, reading file metadata, and inserting uploaded images/files into Feishu documents.
---

# Feishu Drive

Read `../feishu-shared/SKILL.md` first.

## Safe reads

- Get file metadata.
- Download a user-requested file to a local path.
- Preview document media when needed.

## Writes

Confirm before uploading to shared folders, moving/copying files, changing permissions, or deleting.

For document images/attachments, prefer `feishu-doc` media commands when the target is a doc.

## CLI discovery

```bash
lark-cli drive --help
```
