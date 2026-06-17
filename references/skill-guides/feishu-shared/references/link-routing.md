# Feishu Link Routing

Route by URL path first, then fall back to CLI fetch errors.

| Path | Skill |
|---|---|
| `/docx/` | `feishu-doc` |
| `/wiki/` | `feishu-wiki` first; then fetch underlying doc when needed |
| `/sheets/`, `/sheet/` | `feishu-sheet` |
| `/base/`, `/bitable/` | `feishu-base` |
| `/minutes/` | `feishu-minutes` |
| `/drive/`, `/file/`, `/folder/` | `feishu-drive` |
| calendar event links | `feishu-calendar` |
| task links | `feishu-task` |
| chat/message links | `feishu-im` |
| `project.feishu.cn`, `project.larksuite.com`, `project.larkoffice.com` | `feishu-project` |
| mail links or mailbox requests | `feishu-mail` |
| approval tasks or instances | `feishu-approval` |
| contact/user/department lookup | `feishu-contact` |
| OKR links or objective/key result requests | `feishu-okr` |
| attendance requests | `feishu-attendance` |
| VC/meeting record links | `feishu-vc` |
| note id / meeting note links | `feishu-note` |
| slides/presentation links | `feishu-slides` |
| whiteboard/board links | `feishu-whiteboard` |
| Markdown Drive files | `feishu-markdown` |
| app hosting/deploy requests | `feishu-apps` |
| event subscription/listening requests | `feishu-event` |

If a wiki link contains a `sheet=` query parameter, treat it as an embedded spreadsheet target and use `feishu-sheet` after resolving access.

For Feishu Project URLs, parse the host and path before choosing an operation:

- `/{project_key}/story/detail/{id}` means a story/work item detail page.
- `/{project_key}/issue/detail/{id}` means an issue/work item detail page.
- `/{project_key}/userGantt/{view_id}?scope=...&node=...` means a workbench or gantt view, not a single document.
