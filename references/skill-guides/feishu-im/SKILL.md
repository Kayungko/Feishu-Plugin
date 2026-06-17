---
name: feishu-im
description: Feishu/Lark IM operations through lark-cli. Use for sending messages, sharing document links, notifying users or groups, searching chats, checking group members, and posting summaries to Feishu conversations.
---

# Feishu IM

Read `../feishu-shared/SKILL.md` first.

## Safe operations

- Search or resolve a chat when user asks.
- Prepare a message draft.

## Confirm before sending

Always show:

- recipient person or group
- exact message content
- included links or attachments

Then ask for confirmation before sending.

Do not send sensitive content, @all, urgent notifications, SMS, or phone alerts without explicit confirmation.

## CLI discovery

```bash
lark-cli im --help
```
