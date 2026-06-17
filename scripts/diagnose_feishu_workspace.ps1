param(
  [switch]$Detailed
)

function ConvertFrom-JsonSafe {
  param([string]$Json)

  try {
    return $Json | ConvertFrom-Json
  } catch {
    return [pscustomobject]@{
      ok = $false
      issue = "invalid-json"
      message = $_.Exception.Message
      raw = $Json
    }
  }
}

function Invoke-ScriptJson {
  param(
    [string]$ScriptPath,
    [string[]]$ArgsList = @()
  )

  $raw = (& $ScriptPath @ArgsList 2>&1) -join "`n"
  return ConvertFrom-JsonSafe $raw
}

$pluginRoot = Split-Path -Parent $PSScriptRoot
$manifest = $null
foreach ($rel in @(".claude-plugin\plugin.json", ".codex-plugin\plugin.json")) {
  $manifestPath = Join-Path $pluginRoot $rel
  if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    break
  }
}

$larkCheckRaw = (& (Join-Path $PSScriptRoot "check_lark_cli.ps1") -VerifyAuth 2>&1) -join "`n"
$larkCheck = ConvertFrom-JsonSafe -Json $larkCheckRaw
$capabilityCheck = Invoke-ScriptJson -ScriptPath (Join-Path $PSScriptRoot "check_lark_cli_capabilities.ps1")
$projectConfig = Invoke-ScriptJson -ScriptPath (Join-Path $PSScriptRoot "get_feishu_project_config.ps1")
$projectSupport = Invoke-ScriptJson -ScriptPath (Join-Path $PSScriptRoot "check_lark_cli_project_support.ps1")

$identity = "unknown"
$userName = ""
if ($larkCheck.authStatus) {
  $auth = ConvertFrom-JsonSafe -Json ([string]$larkCheck.authStatus)
  if ($auth.identity) { $identity = $auth.identity }
  if ($auth.identities.user.userName) { $userName = $auth.identities.user.userName }
}

$availableDomains = @()
$missingDomains = @()
if ($capabilityCheck.domains) {
  foreach ($domain in $capabilityCheck.domains) {
    if ($domain.command -or $domain.skill) {
      $availableDomains += $domain.name
    } else {
      $missingDomains += $domain.name
    }
  }
}

$issues = @()
if (-not $larkCheck.ok) { $issues += "lark-cli not ready" }
if ($identity -eq "unknown") { $issues += "auth status unknown" }
if (-not $projectConfig.ok) { $issues += "Project OpenAPI config incomplete" }
if ($projectSupport.ok -and -not $projectSupport.projectSupported) { $issues += "official lark-cli has no Project command" }

$fixes = @()
if (-not $larkCheck.ok) { $fixes += "Install or repair lark-cli." }
if ($identity -eq "unknown") { $fixes += "Run lark-cli auth status --verify, then login if needed." }
if (-not $projectConfig.ok) { $fixes += "Create $HOME\\.codex\\feishu-project.config.json from templates\\feishu-project.config.example.json when Project access is needed." }
if ($projectSupport.ok -and -not $projectSupport.projectSupported) { $fixes += "Use Project OpenAPI fallback for project.feishu.cn links." }

[pscustomobject]@{
  ok = $issues.Count -eq 0 -or ($larkCheck.ok -and $capabilityCheck.ok)
  plugin = [pscustomobject]@{
    name = $manifest.name
    version = $manifest.version
    skillCount = @(Get-ChildItem -LiteralPath (Join-Path $pluginRoot "skills") -Directory -ErrorAction SilentlyContinue).Count
  }
  larkCli = [pscustomobject]@{
    ok = $larkCheck.ok
    path = $larkCheck.path
    version = $larkCheck.version
    identity = $identity
    userName = $userName
  }
  capabilities = [pscustomobject]@{
    availableCount = $availableDomains.Count
    missingCount = $missingDomains.Count
    available = $availableDomains
    missing = $missingDomains
  }
  project = [pscustomobject]@{
    officialCliSupported = if ($projectSupport.ok) { $projectSupport.projectSupported } else { $false }
    configReady = $projectConfig.ok
    missingConfig = $projectConfig.missing
    configPath = $projectConfig.configPath
  }
  issues = $issues
  recommendedFixes = $fixes
  details = if ($Detailed) {
    [pscustomobject]@{
      larkCheck = $larkCheck
      capabilityCheck = $capabilityCheck
      projectConfig = $projectConfig
      projectSupport = $projectSupport
    }
  } else {
    $null
  }
} | ConvertTo-Json -Depth 16
