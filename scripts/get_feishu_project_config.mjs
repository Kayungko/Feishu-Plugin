import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs, isMain, emit } from "./_args.mjs";

function isBlank(v) {
  return v == null || String(v).trim() === "";
}

function getConfigValue(config, key, envName, defaultValue = "") {
  const envValue = process.env[envName];
  if (!isBlank(envValue)) return envValue;
  if (Object.prototype.hasOwnProperty.call(config, key) && !isBlank(config[key])) {
    return String(config[key]);
  }
  return defaultValue;
}

export function run(opts) {
  const revealSecrets = Boolean(opts.revealSecrets);

  const protectSecret = (value) => {
    if (isBlank(value)) return "";
    if (revealSecrets) return value;
    if (value.length <= 6) return "***";
    return `${value.slice(0, 3)}***${value.slice(value.length - 3)}`;
  };

  let configPath = opts.configPath ?? "";
  const defaultConfigPath = join(homedir(), ".codex", "feishu-project.config.json");
  const envConfigPath = process.env.FEISHU_PROJECT_CONFIG;
  if (isBlank(configPath)) {
    configPath = !isBlank(envConfigPath) ? envConfigPath : defaultConfigPath;
  }

  let fileConfig = {};
  if (existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(readFileSync(configPath, "utf8")) || {};
    } catch (e) {
      return {
        ok: false,
        issue: "invalid-config-json",
        configPath,
        message: e.message,
      };
    }
  }

  let defaultHeaders = {};
  if (fileConfig.defaultHeaders && typeof fileConfig.defaultHeaders === "object" && !Array.isArray(fileConfig.defaultHeaders)) {
    defaultHeaders = fileConfig.defaultHeaders;
  }

  const config = {
    baseUrl: getConfigValue(fileConfig, "baseUrl", "FEISHU_PROJECT_BASE_URL", "https://project.feishu.cn"),
    pluginId: getConfigValue(fileConfig, "pluginId", "FEISHU_PROJECT_PLUGIN_ID"),
    pluginSecret: getConfigValue(fileConfig, "pluginSecret", "FEISHU_PROJECT_PLUGIN_SECRET"),
    pluginAccessToken: getConfigValue(fileConfig, "pluginAccessToken", "FEISHU_PROJECT_PLUGIN_ACCESS_TOKEN"),
    authPath: getConfigValue(fileConfig, "authPath", "FEISHU_PROJECT_AUTH_PATH"),
    tokenField: getConfigValue(fileConfig, "tokenField", "FEISHU_PROJECT_TOKEN_FIELD", "data.plugin_access_token"),
    authMode: getConfigValue(fileConfig, "authMode", "FEISHU_PROJECT_AUTH_MODE"),
    userKey: getConfigValue(fileConfig, "userKey", "FEISHU_PROJECT_USER_KEY"),
    defaultProjectKey: getConfigValue(fileConfig, "defaultProjectKey", "FEISHU_PROJECT_DEFAULT_PROJECT_KEY"),
    defaultHeaders,
  };

  const missing = [];
  if (isBlank(config.baseUrl)) missing.push("baseUrl");
  if (isBlank(config.pluginAccessToken)) {
    if (isBlank(config.pluginId)) missing.push("pluginId or pluginAccessToken");
    if (isBlank(config.pluginSecret)) missing.push("pluginSecret or pluginAccessToken");
    if (isBlank(config.authPath)) missing.push("authPath or pluginAccessToken");
  }

  return {
    ok: missing.length === 0,
    configPath,
    missing,
    config: {
      baseUrl: config.baseUrl,
      pluginId: config.pluginId,
      pluginSecret: protectSecret(config.pluginSecret),
      pluginAccessToken: protectSecret(config.pluginAccessToken),
      authPath: config.authPath,
      tokenField: config.tokenField,
      authMode: config.authMode,
      userKey: config.userKey,
      defaultProjectKey: config.defaultProjectKey,
      defaultHeaders: config.defaultHeaders,
    },
  };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), { switches: ["reveal-secrets"] });
  emit(run({ configPath: args.configPath ?? "", revealSecrets: args.revealSecrets }));
}
