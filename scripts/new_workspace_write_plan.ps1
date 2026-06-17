param(
  [Parameter(Mandatory = $true)]
  [ValidateSet(
    "create-doc-personal",
    "create-doc-shared",
    "update-doc",
    "write-sheet",
    "write-base",
    "create-task",
    "assign-task",
    "send-im",
    "send-mail",
    "create-calendar",
    "upload-file",
    "move-drive-file"
  )]
  [string]$Operation,

  [string]$Target = "",
  [string]$TargetType = "",
  [string]$PayloadSummary = "",
  [string]$Effect = "",
  [int]$ItemCount = 0,
  [string]$PayloadPreviewPath = "",
  [switch]$ForceConfirmation,
  [string]$OutputPath = ""
)

function Get-WriteRisk {
  param([string]$OperationName)

  switch ($OperationName) {
    "create-doc-personal" { return "report-after-execution" }
    "create-doc-shared" { return "confirm-before-execution" }
    "update-doc" { return "confirm-before-execution" }
    "write-sheet" { return "confirm-before-execution" }
    "write-base" { return "confirm-before-execution" }
    "create-task" { return "confirm-before-execution" }
    "assign-task" { return "confirm-before-execution" }
    "send-im" { return "confirm-before-execution" }
    "send-mail" { return "confirm-before-execution" }
    "create-calendar" { return "confirm-before-execution" }
    "upload-file" { return "confirm-before-execution" }
    "move-drive-file" { return "confirm-before-execution" }
    default { return "confirm-before-execution" }
  }
}

function Get-OperationLabel {
  param([string]$OperationName)

  switch ($OperationName) {
    "create-doc-personal" { return "Create document in personal library" }
    "create-doc-shared" { return "Create document in shared location" }
    "update-doc" { return "Update existing document" }
    "write-sheet" { return "Write rows or cells to sheet" }
    "write-base" { return "Write records to Base" }
    "create-task" { return "Create task" }
    "assign-task" { return "Assign task" }
    "send-im" { return "Send IM message" }
    "send-mail" { return "Send mail" }
    "create-calendar" { return "Create calendar event" }
    "upload-file" { return "Upload file" }
    "move-drive-file" { return "Move Drive file" }
    default { return $OperationName }
  }
}

$risk = Get-WriteRisk $Operation
$confirmationRequired = $ForceConfirmation.IsPresent -or ($risk -eq "confirm-before-execution")
$missing = @()

if ([string]::IsNullOrWhiteSpace($Target)) { $missing += "target" }
if ([string]::IsNullOrWhiteSpace($PayloadSummary)) { $missing += "payloadSummary" }
if ([string]::IsNullOrWhiteSpace($Effect)) { $missing += "effect" }

$previewExists = $false
if (-not [string]::IsNullOrWhiteSpace($PayloadPreviewPath)) {
  $previewExists = Test-Path -LiteralPath $PayloadPreviewPath
}

$plan = [ordered]@{
  ok = $missing.Count -eq 0
  mode = "write-preview"
  operation = $Operation
  operationLabel = Get-OperationLabel $Operation
  risk = $risk
  confirmationRequired = $confirmationRequired
  target = $Target
  targetType = $TargetType
  payloadSummary = $PayloadSummary
  itemCount = $ItemCount
  effect = $Effect
  payloadPreviewPath = $PayloadPreviewPath
  payloadPreviewExists = $previewExists
  missingFields = $missing
  nextAction = if ($confirmationRequired) {
    "Show this preview to the user and wait for explicit confirmation before executing the write."
  } else {
    "This operation can be executed and reported after completion."
  }
  confirmationPrompt = if ($confirmationRequired) {
    "确认后我会执行：$Operation -> $Target"
  } else {
    ""
  }
}

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  [pscustomobject]$plan | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
}

[pscustomobject]$plan | ConvertTo-Json -Depth 10
