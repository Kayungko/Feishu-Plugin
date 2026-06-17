---
name: feishu-event
description: Feishu/Lark event operations through lark-cli. Use for consuming, subscribing, and inspecting real-time events.
---

# Feishu Event

Use for real-time event listening and subscriptions.

## Reads

Reading event stream output and listing event-related configuration is safe.

## Long-running streams

Do not leave event consumers running after the requested inspection is complete. Summarize observed events and stop the process.

## Writes

Creating or changing subscriptions affects event delivery. Show a preview and ask for confirmation.

## CLI discovery

```bash
lark-cli event --help
```
