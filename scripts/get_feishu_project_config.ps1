param(
  [string]$ConfigPath = "",
  [switch]$RevealSecrets
)

function Get-ConfigValue {
  param(
    [hashtable]$Config,
    [string]$Key,
    [string]$EnvName,
    [string]$DefaultValue = ""
  )

  $envValue = [Environment]::GetEnvironmentVariable($EnvName)
  if (-not [string]::IsNullOrWhiteSpace($envValue)) {
    return $envValue
  }

  if ($Config.ContainsKey($Key) -and -not [string]::IsNullOrWhiteSpace([string]$Config[$Key])) {
    return [string]$Config[$Key]
  }

  return $DefaultValue
}

function ConvertTo-Hashtable {
  param([object]$Value)

  $result = @{}
  if ($null -eq $Value) {
    return $result
  }

  foreach ($property in $Value.PSObject.Properties) {
    if ($property.Value -is [System.Management.Automation.PSCustomObject]) {
      $result[$property.Name] = ConvertTo-Hashtable $property.Value
    } else {
      $result[$property.Name] = $property.Value
    }
  }
  return $result
}

function Protect-Secret {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }
  if ($RevealSecrets) {
    return $Value
  }
  if ($Value.Length -le 6) {
    return "***"
  }
  return "$($Value.Substring(0, 3))***$($Value.Substring($Value.Length - 3))"
}

$defaultConfigPath = Join-Path $HOME ".codex\feishu-project.config.json"
$envConfigPath = [Environment]::GetEnvironmentVariable("FEISHU_PROJECT_CONFIG")
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  if (-not [string]::IsNullOrWhiteSpace($envConfigPath)) {
    $ConfigPath = $envConfigPath
  } else {
    $ConfigPath = $defaultConfigPath
  }
}

$fileConfig = @{}
if (Test-Path -LiteralPath $ConfigPath) {
  try {
    $fileConfig = ConvertTo-Hashtable (Get-Content -Raw -LiteralPath $ConfigPath | ConvertFrom-Json)
  } catch {
    [pscustomobject]@{
      ok = $false
      issue = "invalid-config-json"
      configPath = $ConfigPath
      message = $_.Exception.Message
    } | ConvertTo-Json -Depth 8
    exit 1
  }
}

$defaultHeaders = @{}
if ($fileConfig.ContainsKey("defaultHeaders") -and $fileConfig["defaultHeaders"] -is [hashtable]) {
  $defaultHeaders = $fileConfig["defaultHeaders"]
}

$config = [ordered]@{
  baseUrl = Get-ConfigValue $fileConfig "baseUrl" "FEISHU_PROJECT_BASE_URL" "https://project.feishu.cn"
  pluginId = Get-ConfigValue $fileConfig "pluginId" "FEISHU_PROJECT_PLUGIN_ID"
  pluginSecret = Get-ConfigValue $fileConfig "pluginSecret" "FEISHU_PROJECT_PLUGIN_SECRET"
  pluginAccessToken = Get-ConfigValue $fileConfig "pluginAccessToken" "FEISHU_PROJECT_PLUGIN_ACCESS_TOKEN"
  authPath = Get-ConfigValue $fileConfig "authPath" "FEISHU_PROJECT_AUTH_PATH"
  tokenField = Get-ConfigValue $fileConfig "tokenField" "FEISHU_PROJECT_TOKEN_FIELD" "data.plugin_access_token"
  authMode = Get-ConfigValue $fileConfig "authMode" "FEISHU_PROJECT_AUTH_MODE"
  userKey = Get-ConfigValue $fileConfig "userKey" "FEISHU_PROJECT_USER_KEY"
  defaultProjectKey = Get-ConfigValue $fileConfig "defaultProjectKey" "FEISHU_PROJECT_DEFAULT_PROJECT_KEY"
  defaultHeaders = $defaultHeaders
}

$missing = @()
if ([string]::IsNullOrWhiteSpace($config.baseUrl)) { $missing += "baseUrl" }
if ([string]::IsNullOrWhiteSpace($config.pluginAccessToken)) {
  if ([string]::IsNullOrWhiteSpace($config.pluginId)) { $missing += "pluginId or pluginAccessToken" }
  if ([string]::IsNullOrWhiteSpace($config.pluginSecret)) { $missing += "pluginSecret or pluginAccessToken" }
  if ([string]::IsNullOrWhiteSpace($config.authPath)) { $missing += "authPath or pluginAccessToken" }
}

$safeConfig = [ordered]@{
  ok = $missing.Count -eq 0
  configPath = $ConfigPath
  missing = $missing
  config = [ordered]@{
    baseUrl = $config.baseUrl
    pluginId = $config.pluginId
    pluginSecret = Protect-Secret $config.pluginSecret
    pluginAccessToken = Protect-Secret $config.pluginAccessToken
    authPath = $config.authPath
    tokenField = $config.tokenField
    authMode = $config.authMode
    userKey = $config.userKey
    defaultProjectKey = $config.defaultProjectKey
    defaultHeaders = $config.defaultHeaders
  }
}

$safeConfig | ConvertTo-Json -Depth 10
