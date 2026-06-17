---
name: feishu-auth
description: Feishu/Lark CLI authentication, installation, identity, scope, and permission diagnosis for Codex. Use when lark-cli is missing, auth expires, user/bot identity is wrong, permission is denied, scope is missing, or users need setup help for Feishu workspace automation.
---

# Feishu Auth

Read `../feishu-shared/SKILL.md` first.

## Diagnose

```bash
node ../../scripts/check_lark_cli.mjs --verify-auth
lark-cli auth status --verify
```

## Missing CLI

Report that `lark-cli` is unavailable in PATH. Do not fabricate install commands unless the team has provided an installation method. If npm is available and the user asks to install, use the team's approved install guide.

## Expired or missing user auth

Use split-flow:

```bash
lark-cli auth login --scope "<scope>" --no-wait --json
```

Show the verification URL and tell the user to finish authorization, then complete with:

```bash
lark-cli auth login --device-code <device_code>
```

## Identity rules

- Prefer `--as user` for personal docs, wiki, drive, calendar, minutes, tasks, IM.
- Use `--as bot` only for bot-owned resources or explicitly app-owned automation.
- If bot cannot see a user resource, retry only after explaining the identity mismatch.
