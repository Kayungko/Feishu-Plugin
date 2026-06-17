param(
  [string]$Text = "",
  [string]$TranscriptPath = "",
  [string]$NoteId = "",
  [string]$Locale = "zh_cn",
  [string]$OutputPath = "",
  [switch]$IncludeSourceLines
)

function Get-CleanLine {
  param([string]$Line)

  $clean = $Line.Trim()
  $clean = $clean -replace "^\s*[-*]\s*\[[ xX]\]\s*", ""
  $clean = $clean -replace "^\s*[-*]\s*", ""
  $clean = $clean -replace "^#{1,6}\s*", ""
  $clean = $clean -replace "\*\*", ""
  return $clean.Trim()
}

function Get-FirstMatch {
  param(
    [string]$Value,
    [string[]]$Patterns
  )

  foreach ($pattern in $Patterns) {
    if ($Value -match $pattern) {
      for ($index = 1; $index -lt $Matches.Count; $index++) {
        if (-not [string]::IsNullOrWhiteSpace($Matches[$index])) {
          return $Matches[$index].Trim()
        }
      }
      return $Matches[0].Trim()
    }
  }
  return ""
}

function Get-Priority {
  param([string]$Value)

  if ($Value -match "紧急|阻塞|高优|今天|明天|马上|立即|风险") {
    return "high"
  }
  if ($Value -match "下周|后续|有空|低优") {
    return "low"
  }
  return "normal"
}

function Read-TranscriptFromNote {
  param(
    [string]$Id,
    [string]$TranscriptLocale
  )

  $safeId = $Id -replace "[^a-zA-Z0-9_-]", "_"
  $output = Join-Path $env:TEMP "feishu-note-$safeId-transcript.md"
  $raw = (& lark-cli note +transcript --as user --note-id $Id --locale $TranscriptLocale --transcript-format markdown --output $output --overwrite --format json 2>&1) -join "`n"
  if (-not (Test-Path -LiteralPath $output)) {
    [pscustomobject]@{
      ok = $false
      issue = "transcript-fetch-failed"
      message = "Unable to fetch transcript for note_id."
      noteId = $Id
      raw = $raw
    } | ConvertTo-Json -Depth 8
    exit 1
  }
  return Get-Content -Raw -LiteralPath $output
}

if (-not [string]::IsNullOrWhiteSpace($NoteId)) {
  $Text = Read-TranscriptFromNote $NoteId $Locale
} elseif (-not [string]::IsNullOrWhiteSpace($TranscriptPath)) {
  if (-not (Test-Path -LiteralPath $TranscriptPath)) {
    [pscustomobject]@{
      ok = $false
      issue = "transcript-file-not-found"
      path = $TranscriptPath
    } | ConvertTo-Json -Depth 6
    exit 1
  }
  $Text = Get-Content -Raw -LiteralPath $TranscriptPath
}

if ([string]::IsNullOrWhiteSpace($Text)) {
  [pscustomobject]@{
    ok = $false
    issue = "empty-meeting-content"
    message = "Provide -Text, -TranscriptPath, or -NoteId."
  } | ConvertTo-Json -Depth 6
  exit 1
}

$ownerPatterns = @(
  "负责人[:：]\s*([^，,。；;\s]+)",
  "Owner[:：]\s*([^，,。；;\s]+)",
  "@([^\s，,。；;]+)",
  "([一-龥A-Za-z0-9_]{2,16})\s*(负责|跟进|确认|整理|补充|处理|对齐)"
)
$duePatterns = @(
  "(\d{4}[-/]\d{1,2}[-/]\d{1,2})",
  "(\d{1,2}月\d{1,2}日)",
  "(今天|明天|后天|本周|下周|周一|周二|周三|周四|周五|周六|周日|周天)"
)
$candidatePatterns = @(
  "待办|行动项|TODO|Action Item|后续",
  "需要|负责|跟进|确认|整理|补充|完成|修复|对齐|提供|创建|更新|检查|排查|同步|推进|处理"
)

$items = @()
$lines = $Text -split "\r?\n"
for ($index = 0; $index -lt $lines.Count; $index++) {
  $line = Get-CleanLine $lines[$index]
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }
  if ($line.Length -lt 6) {
    continue
  }

  $isCandidate = $false
  foreach ($pattern in $candidatePatterns) {
    if ($line -match $pattern) {
      $isCandidate = $true
      break
    }
  }
  if (-not $isCandidate) {
    continue
  }

  $summary = $line
  if ($summary.Length -gt 120) {
    $summary = $summary.Substring(0, 117) + "..."
  }

  $owner = Get-FirstMatch $line $ownerPatterns
  if ($owner -match "负责|跟进|确认|整理|补充|处理|对齐") {
    $owner = $owner -replace "(负责|跟进|确认|整理|补充|处理|对齐)$", ""
  }
  if ($owner -match "^(需要|可以|应该|我们|大家|后续|待办|行动项)$") {
    $owner = ""
  }
  $due = Get-FirstMatch $line $duePatterns
  $priority = Get-Priority $line
  $confidence = 0.55
  if ($line -match "待办|行动项|TODO|Action Item") { $confidence += 0.25 }
  if (-not [string]::IsNullOrWhiteSpace($owner)) { $confidence += 0.1 }
  if (-not [string]::IsNullOrWhiteSpace($due)) { $confidence += 0.1 }
  if ($confidence -gt 0.95) { $confidence = 0.95 }

  $item = [ordered]@{
    summary = $summary
    owner = $owner
    due = $due
    priority = $priority
    confidence = [math]::Round($confidence, 2)
    needsConfirmation = [string]::IsNullOrWhiteSpace($owner) -or [string]::IsNullOrWhiteSpace($due)
    sourceLine = $index + 1
  }
  if ($IncludeSourceLines) {
    $item.source = $line
  }
  $items += [pscustomobject]$item
}

$result = [pscustomobject]@{
  ok = $true
  source = if ($NoteId) { "note:$NoteId" } elseif ($TranscriptPath) { $TranscriptPath } else { "inline-text" }
  actionItemCount = $items.Count
  actionItems = $items
  unresolvedCount = @($items | Where-Object { $_.needsConfirmation }).Count
  note = "Heuristic extraction only. Review owners and due dates before creating tasks."
}

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  $result | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
}

$result | ConvertTo-Json -Depth 12
