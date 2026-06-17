param(
  [switch]$SkipAuthVerify,
  [string]$OutputPath = ""
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

function Invoke-JsonScript {
  param(
    [string]$ScriptPath,
    [hashtable]$NamedArgs = @{}
  )

  $raw = (& $ScriptPath @NamedArgs 2>&1) -join "`n"
  $parsed = ConvertFrom-JsonSafe $raw
  return [pscustomobject]@{
    ok = if ($parsed.ok -ne $null) { [bool]$parsed.ok } else { $LASTEXITCODE -eq 0 }
    data = $parsed
    raw = if ($parsed.issue -eq "invalid-json") { $raw } else { "" }
  }
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

$requiredScripts = @(
  "check_lark_cli.ps1",
  "diagnose_feishu_workspace.ps1",
  "get_team_help.ps1",
  "new_workspace_write_plan.ps1",
  "extract_meeting_action_items.ps1",
  "preview_task_creation.ps1",
  "normalize_lark_error.ps1",
  "parse_feishu_url.ps1"
)

$scriptChecks = @()
foreach ($script in $requiredScripts) {
  $path = Join-Path $PSScriptRoot $script
  $scriptChecks += [pscustomobject]@{
    name = $script
    exists = Test-Path -LiteralPath $path
  }
}

$larkArgs = @{}
if (-not $SkipAuthVerify) {
  $larkArgs.VerifyAuth = $true
}
$larkCheck = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "check_lark_cli.ps1") -NamedArgs $larkArgs

$teamHelp = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "get_team_help.ps1") -NamedArgs @{ Mode = "short" }
$writePreview = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "new_workspace_write_plan.ps1") -NamedArgs @{
  Operation = "update-doc"
  Target = "https://example.feishu.cn/docx/demo"
  TargetType = "docx"
  PayloadSummary = "append 2 sections"
  ItemCount = 2
  Effect = "adds reviewed draft content to an existing shared document"
}

$sampleText = "待办：张三负责整理资料索引，明天给初版。`n李四跟进表格字段，本周完成。`n需要确认消息发送范围。"
$extract = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "extract_meeting_action_items.ps1") -NamedArgs @{
  Text = $sampleText
  IncludeSourceLines = $true
}

$previewTasks = $null
if ($extract.ok) {
  $extractJson = $extract.data | ConvertTo-Json -Depth 12
  $previewTasks = Invoke-JsonScript -ScriptPath (Join-Path $PSScriptRoot "preview_task_creation.ps1") -NamedArgs @{
    ActionItemsJson = $extractJson
  }
} else {
  $previewTasks = [pscustomobject]@{
    ok = $false
    data = [pscustomobject]@{ issue = "skipped-because-extraction-failed" }
    raw = ""
  }
}

$checks = [ordered]@{
  scriptsPresent = @($scriptChecks | Where-Object { -not $_.exists }).Count -eq 0
  larkCliReady = $larkCheck.ok
  teamHelpReady = $teamHelp.ok
  writePreviewReady = $writePreview.ok -and $writePreview.data.confirmationRequired
  meetingExtractionReady = $extract.ok -and $extract.data.actionItemCount -ge 2
  taskPreviewReady = $previewTasks.ok -and $previewTasks.data.mode -eq "preview"
}

$authSummary = $null
if ($larkCheck.data.authStatus) {
  $auth = ConvertFrom-JsonSafe -Json ([string]$larkCheck.data.authStatus)
  $authSummary = [pscustomobject]@{
    identity = $auth.identity
    verified = $auth.verified
    userName = $auth.identities.user.userName
    userReady = $auth.identities.user.available -and $auth.identities.user.verified
    botReady = $auth.identities.bot.available -and $auth.identities.bot.verified
    tokenStatus = $auth.identities.user.tokenStatus
  }
}

$larkCliSummary = [pscustomobject]@{
  ok = $larkCheck.data.ok
  path = $larkCheck.data.path
  version = $larkCheck.data.version
  auth = $authSummary
}

$failed = @()
foreach ($entry in $checks.GetEnumerator()) {
  if (-not $entry.Value) {
    $failed += $entry.Key
  }
}

$result = [ordered]@{
  ok = $failed.Count -eq 0
  mode = "smoke-test"
  plugin = [pscustomobject]@{
    name = if ($manifest) { $manifest.name } else { "feishu-workspace" }
    version = if ($manifest) { $manifest.version } else { "" }
    skillCount = @(Get-ChildItem -LiteralPath (Join-Path $pluginRoot "skills") -Directory -ErrorAction SilentlyContinue).Count
  }
  checks = [pscustomobject]$checks
  failed = $failed
  details = [pscustomobject]@{
    scriptChecks = $scriptChecks
    larkCli = $larkCliSummary
    teamHelpPromptCount = if ($teamHelp.data.prompts) { @($teamHelp.data.prompts).Count } else { 0 }
    writePreview = $writePreview.data
    extractedActionItemCount = if ($extract.data.actionItemCount -ne $null) { $extract.data.actionItemCount } else { 0 }
    taskDraftCount = if ($previewTasks.data.taskCount -ne $null) { $previewTasks.data.taskCount } else { 0 }
  }
}

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  [pscustomobject]$result | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
}

[pscustomobject]$result | ConvertTo-Json -Depth 16
