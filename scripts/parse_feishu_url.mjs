import { parseArgs, isMain, emit } from "./_args.mjs";

const patterns = [
  { kind: "doc", regex: /\/docx\/([^/?#]+)/i },
  { kind: "wiki", regex: /\/wiki\/([^/?#]+)/i },
  { kind: "sheet", regex: /\/sheets?\/([^/?#]+)/i },
  { kind: "base", regex: /\/base\/([^/?#]+)/i },
  { kind: "minutes", regex: /\/minutes\/([^/?#]+)/i },
  { kind: "drive", regex: /\/file\/([^/?#]+)/i },
  { kind: "slides", regex: /\/slides\/([^/?#]+)/i },
  { kind: "project", regex: /\/project\/([^/?#]+)/i },
];

export function run(opts) {
  const url = opts.url;

  let kind = "unknown";
  let token = null;
  let projectKey = null;
  let projectRoute = null;
  let workItemType = null;
  let workItemId = null;
  let nodeId = null;

  try {
    const uri = new URL(url);
    const host = uri.hostname;
    if (/(^|\.)project\.(feishu|larksuite)\.cn$/i.test(host) ||
        /(^|\.)project\.larkoffice\.com$/i.test(host)) {
      const segments = uri.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
      if (segments.length >= 1) {
        projectKey = segments[0];
        token = projectKey;
        kind = "project";
      }
      if (segments.length >= 2) {
        projectRoute = segments[1];
        switch (projectRoute) {
          case "story":
            if (segments.length >= 4 && segments[2] === "detail") {
              kind = "project-story";
              workItemType = "story";
              workItemId = segments[3];
            }
            break;
          case "issue":
            if (segments.length >= 4 && segments[2] === "detail") {
              kind = "project-issue";
              workItemType = "issue";
              workItemId = segments[3];
            }
            break;
          case "userGantt":
            kind = "project-workbench";
            break;
          case "workItem":
            kind = "project-workitem";
            break;
        }
      }
    }
  } catch {
    // ignore malformed URLs; fall through to pattern matching
  }

  if (kind === "unknown") {
    for (const pattern of patterns) {
      const m = url.match(pattern.regex);
      if (m) {
        kind = pattern.kind;
        token = m[1];
        break;
      }
    }
  }

  const query = {};
  try {
    const uri = new URL(url);
    const search = uri.search;
    if (search) {
      for (const pair of search.replace(/^\?/, "").split("&")) {
        if (pair.includes("=")) {
          const eq = pair.indexOf("=");
          const key = pair.slice(0, eq);
          const value = decodeURIComponent(pair.slice(eq + 1));
          query[key] = value;
        }
      }
      if (Object.prototype.hasOwnProperty.call(query, "node")) {
        nodeId = query["node"];
      }
    }
  } catch {
    // ignore
  }

  return {
    kind,
    token,
    projectKey,
    projectRoute,
    workItemType,
    workItemId,
    nodeId,
    query,
    url,
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const url = args.url || args._[0];
  emit(run({ url }));
}
