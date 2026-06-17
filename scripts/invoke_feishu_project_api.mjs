import { parseArgs, isMain } from "./_args.mjs";
import { run as readProjectConfig } from "./get_feishu_project_config.mjs";

function getNestedValue(obj, fieldPath) {
  let current = obj;
  for (const part of fieldPath.split(".")) {
    if (current == null) return null;
    if (!Object.prototype.hasOwnProperty.call(current, part)) return null;
    current = current[part];
  }
  return current;
}

function joinUrl(baseUrl, path, query) {
  const base = baseUrl.replace(/\/+$/, "");
  let relative = path;
  if (!relative.startsWith("/")) relative = `/${relative}`;
  let url = `${base}${relative}`;
  const keys = Object.keys(query || {});
  if (keys.length > 0) {
    const pairs = keys.map((k) => `${encodeURIComponent(String(k))}=${encodeURIComponent(String(query[k]))}`);
    url = `${url}?${pairs.join("&")}`;
  }
  return url;
}

async function getProjectAccessToken(config) {
  if (config.pluginAccessToken && String(config.pluginAccessToken).trim()) {
    return config.pluginAccessToken;
  }
  if (!config.authPath || !String(config.authPath).trim()) {
    return null;
  }
  const authUrl = joinUrl(config.baseUrl, config.authPath, {});
  const authBody = JSON.stringify({ plugin_id: config.pluginId, plugin_secret: config.pluginSecret });
  const resp = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: authBody,
  });
  const data = await resp.json();
  let token = getNestedValue(data, config.tokenField);
  if (token == null) token = getNestedValue(data, "plugin_access_token");
  if (token == null) token = getNestedValue(data, "access_token");
  return token;
}

export async function run(opts) {
  const method = opts.method;
  const path = opts.path;
  const queryJson = opts.queryJson ?? "";
  const dataJson = opts.dataJson ?? "";
  const configPath = opts.configPath ?? "";
  const userKey = opts.userKey ?? "";
  const dryRun = Boolean(opts.dryRun);
  const confirmWrite = Boolean(opts.confirmWrite);

  const configResponse = readProjectConfig({ configPath, revealSecrets: true });
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isWrite && !confirmWrite && !dryRun) {
    return {
      __exit: 2,
      ok: false,
      issue: "confirmation_required",
      message: "Project write operations require explicit confirmation.",
      method,
      path,
    };
  }

  if (!configResponse.ok && !dryRun) {
    return {
      ok: false,
      issue: "missing-project-config",
      message: "Feishu Project API configuration is incomplete.",
      missing: configResponse.missing,
      configPath: configResponse.configPath,
      template: "templates/feishu-project.config.example.json",
    };
  }

  const config = configResponse.config;
  let query = {};
  if (queryJson && queryJson.trim()) {
    query = JSON.parse(queryJson);
  }

  const body = dataJson && dataJson.trim() ? dataJson : null;
  const url = joinUrl(config.baseUrl, path, query);
  const effectiveUserKey = userKey && userKey.trim() ? userKey : config.userKey;

  const headers = { ...(config.defaultHeaders || {}) };
  if (effectiveUserKey && String(effectiveUserKey).trim()) {
    headers["X-USER-KEY"] = effectiveUserKey;
  }
  if (config.authMode && String(config.authMode).trim()) {
    headers["x-auth-mode"] = config.authMode;
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      method,
      url,
      headers,
      hasBody: !!(body && body.trim()),
      writeRequiresConfirmation: isWrite,
      configReady: configResponse.ok,
      missingConfig: configResponse.missing,
    };
  }

  try {
    const token = await getProjectAccessToken(config);
    if (!token || !String(token).trim()) {
      throw new Error("Unable to resolve plugin_access_token. Provide pluginAccessToken directly or configure authPath/tokenField.");
    }
    headers["Authorization"] = `Bearer ${token}`;

    const fetchOptions = { method, headers };
    if (body && body.trim()) {
      headers["Content-Type"] = "application/json";
      fetchOptions.body = body;
    }
    const resp = await fetch(url, fetchOptions);
    const contentType = resp.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await resp.json() : await resp.text();
    return { ok: true, method, url, data };
  } catch (e) {
    return {
      ok: false,
      issue: "project-api-call-failed",
      method,
      url,
      message: e.message,
    };
  }
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["dry-run", "confirm-write"] });
  const result = await run({
    method: args.method,
    path: args.path,
    queryJson: args.queryJson ?? "",
    dataJson: args.dataJson ?? "",
    configPath: args.configPath ?? "",
    userKey: args.userKey ?? "",
    dryRun: args.dryRun,
    confirmWrite: args.confirmWrite,
  });
  const exitCode = result.__exit;
  if (exitCode !== undefined) delete result.__exit;
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (exitCode !== undefined) {
    process.exitCode = exitCode;
  } else if (result.ok === false) {
    process.exitCode = 1;
  }
}
