---
name: feishu-mail
description: Feishu/Lark Mail operations through lark-cli. Use for reading mailbox messages, searching mail, drafting, sending, replying, forwarding, labels, folders, contacts, and attachments.
---

# Feishu Mail

Use for mailbox operations.

## Read operations

Searching mail, reading message metadata, reading message body, listing folders, and downloading attachments are read operations.

## Sending and modifying mail

Before sending, replying, forwarding, deleting, moving, trashing, or modifying labels/folders, show a preview and ask for confirmation:

- recipients
- subject
- body summary
- attachments
- mailbox/account
- action to perform

## CLI discovery

```bash
lark-cli mail --help
```
