---
name: feishu-calendar
description: Feishu/Lark Calendar operations through lark-cli. Use for checking schedules, searching events, finding free time, creating or updating calendar events, and booking meetings or rooms.
---

# Feishu Calendar

Read `../feishu-shared/SKILL.md` first.

## Read operations

Checking user's own schedule, event details, free/busy status, and room availability is safe.

## Creating or updating events

Before creating or updating an event with attendees, show a preview and ask for confirmation:

- title
- date and time with timezone
- attendees
- location or meeting room
- description
- reminders

Do not invite people or book rooms silently.

## CLI discovery

```bash
lark-cli calendar --help
```
