param(
  [string]$ActionItemsJson = "",
  [string]$ActionItemsPath = "",
  [string]$TasklistId = "",
  [string]$DefaultAssigneeOpenId = "",
  [switch]$ConfirmCreate,
  [switch]$DryRun
)

function Read-ActionItems {
  param(
    [string]$Json,
    [string]$Path
  )

  if (-not [string]::IsNullOrWhiteSpace($Path)) {
    if (-not (Test-Path -LiteralPath $Path)) {
      [pscustomobject]@{
        ok = $false
        issue = "action-items-file-not-found"
        path = $Path
      } | ConvertTo-Json -Depth 6
      exit 1
    }
    $Json = Get-Content -Raw -LiteralPath $Path
  }

  if ([string]::IsNullOrWhiteSpace($Json)) {
    [pscustomobject]@{
      ok = $false
      issue = "empty-action-items"
      message = "Provide -ActionItemsJson or -ActionItemsPath."
    } | ConvertTo-Json -Depth 6
    exit 1
  }

  $parsed = $Json | ConvertFrom-Json
  if ($parsed.actionItems) {
    return @($parsed.actionItems)
  }
  if ($parsed -is [array]) {
    return @($parsed)
  }
  return @($parsed)
}

function Convert-DueForLark {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }
  if ($Value -match "^\d{4}[-/]\d{1,2}[-/]\d{1,2}$") {
    return "date:$($Value -replace '/', '-')"
  }
  if ($Value -eq "今天") { return "date:$(Get-Date -Format yyyy-MM-dd)" }
  if ($Value -eq "明天") { return "date:$((Get-Date).AddDays(1).ToString('yyyy-MM-dd'))" }
  if ($Value -eq "后天") { return "date:$((Get-Date).AddDays(2).ToString('yyyy-MM-dd'))" }
  return ""
}

$items = Read-ActionItems $ActionItemsJson $ActionItemsPath
$drafts = @()
foreach ($item in $items) {
  $summary = [string]$item.summary
  if ([string]::IsNullOrWhiteSpace($summary)) {
    continue
  }
  $due = Convert-DueForLark ([string]$item.due)
  $assignee = if (-not [string]::IsNullOrWhiteSpace([string]$item.assigneeOpenId)) {
    [string]$item.assigneeOpenId
  } elseif (-not [string]::IsNullOrWhiteSpace($DefaultAssigneeOpenId)) {
    $DefaultAssigneeOpenId
  } else {
    ""
  }

  $descriptionParts = @()
  if ($item.owner) { $descriptionParts += "Owner hint: $($item.owner)" }
  if ($item.due) { $descriptionParts += "Due hint: $($item.due)" }
  if ($item.priority) { $descriptionParts += "Priority: $($item.priority)" }
  if ($item.source) { $descriptionParts += "Source: $($item.source)" }
  if ($descriptionParts.Count -eq 0) { $descriptionParts += "Generated from meeting action item draft." }

  $drafts += [pscustomobject]@{
    summary = $summary
    description = ($descriptionParts -join "`n")
    due = $due
    assignee = $assignee
    tasklistId = $TasklistId
    needsConfirmation = $item.needsConfirmation
    sourceLine = $item.sourceLine
  }
}

if (-not $ConfirmCreate) {
  [pscustomobject]@{
    ok = $true
    mode = "preview"
    confirmationRequired = $true
    message = "Review the task drafts. Re-run with -ConfirmCreate to create tasks."
    taskCount = $drafts.Count
    taskDrafts = $drafts
  } | ConvertTo-Json -Depth 12
  exit 0
}

$created = @()
foreach ($draft in $drafts) {
  $args = @("task", "+create", "--as", "user", "--summary", $draft.summary, "--description", $draft.description, "--format", "json")
  if (-not [string]::IsNullOrWhiteSpace($draft.due)) { $args += @("--due", $draft.due) }
  if (-not [string]::IsNullOrWhiteSpace($draft.assignee)) { $args += @("--assignee", $draft.assignee) }
  if (-not [string]::IsNullOrWhiteSpace($draft.tasklistId)) { $args += @("--tasklist-id", $draft.tasklistId) }
  if ($DryRun) { $args += "--dry-run" }

  $raw = (& lark-cli @args 2>&1) -join "`n"
  try {
    $data = $raw | ConvertFrom-Json
  } catch {
    $data = [pscustomobject]@{ raw = $raw }
  }
  $created += [pscustomobject]@{
    summary = $draft.summary
    ok = if ($data.ok -ne $null) { $data.ok } else { $LASTEXITCODE -eq 0 }
    result = $data
  }
}

[pscustomobject]@{
  ok = @($created | Where-Object { -not $_.ok }).Count -eq 0
  mode = if ($DryRun) { "dry-run-create" } else { "created" }
  taskCount = $drafts.Count
  results = $created
} | ConvertTo-Json -Depth 16
