# Feishu Workspace Risk Policy

Use this policy for all Feishu/Lark operations.

## No confirmation needed

- Read docs, wiki, sheets, base records, drive metadata, calendar availability, minutes summaries, tasks.
- Fetch document outlines or block ids.
- Parse links and diagnose authentication.

## Report after execution

- Create a document in the current user's personal library.
- Create a local draft file.
- Download a file to a user-requested local path.

## Confirm before execution

- Write to an existing shared doc, wiki, sheet, base, or task.
- Create or update calendar events with attendees.
- Send IM messages to a person or group.
- Assign tasks to other users.
- Upload files to shared locations.
- Move, copy, delete, or change permissions.

Confirmation must include target, operation, payload summary, and expected effect.

Use `../../../../scripts/new_workspace_write_plan.mjs` when a stable machine-readable preview is useful. The script does not execute writes; it standardizes target, operation, payload summary, item count, expected effect, and confirmation wording.

## Never do silently

- Delete documents, files, sheets, base records, tasks, or comments.
- Transfer ownership.
- Send messages containing sensitive content without showing the exact message first.
- Create calendar events that invite people without showing time, attendees, title, and description first.
