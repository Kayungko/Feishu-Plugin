param(
  [switch]$IncludeHelp
)

function Invoke-LarkCli {
  param([string[]]$ArgsList)
  return (& lark-cli @ArgsList 2>&1) -join "`n"
}

function Parse-Commands {
  param([string]$HelpText)

  $commands = @()
  $inCommands = $false
  foreach ($line in $HelpText.Split("`n")) {
    if ($line.Trim() -eq "Available Commands:") {
      $inCommands = $true
      continue
    }
    if ($inCommands -and [string]::IsNullOrWhiteSpace($line)) {
      break
    }
    if ($inCommands -and $line -match "^\s{2}([a-zA-Z0-9._-]+)\s+") {
      $commands += $Matches[1]
    }
  }
  return $commands
}

$expectedDomains = @(
  "approval",
  "apps",
  "attendance",
  "base",
  "calendar",
  "contact",
  "docs",
  "drive",
  "event",
  "im",
  "mail",
  "markdown",
  "minutes",
  "note",
  "okr",
  "sheets",
  "slides",
  "task",
  "vc",
  "whiteboard",
  "wiki"
)

$skillNameOverrides = @{
  docs = "lark-doc"
}

try {
  $cmd = Get-Command lark-cli -ErrorAction SilentlyContinue
  if (-not $cmd) {
    [pscustomobject]@{
      ok = $false
      issue = "lark-cli-not-found"
      message = "lark-cli is not available in PATH."
    } | ConvertTo-Json -Depth 8
    exit 1
  }

  $version = Invoke-LarkCli @("--version")
  $help = Invoke-LarkCli @("--help")
  $commands = @(Parse-Commands $help)

  $skills = @()
  $skillsRaw = Invoke-LarkCli @("skills", "list")
  try {
    $skillsJson = $skillsRaw | ConvertFrom-Json
    if ($skillsJson.skills) {
      $skills = @($skillsJson.skills | ForEach-Object {
        [pscustomobject]@{
          name = $_.name
          version = $_.version
          cliHelp = $_.metadata.cliHelp
        }
      })
    }
  } catch {}

  $domains = @()
  foreach ($domain in $expectedDomains) {
    $skillName = if ($skillNameOverrides.ContainsKey($domain)) { $skillNameOverrides[$domain] } else { "lark-$domain" }
    $domains += [pscustomobject]@{
      name = $domain
      command = $commands -contains $domain
      skill = @($skills | Where-Object { $_.name -eq $skillName }).Count -gt 0
    }
  }

  [pscustomobject]@{
    ok = $true
    path = $cmd.Source
    version = $version.Trim()
    commandCount = $commands.Count
    skillCount = $skills.Count
    domains = $domains
    project = [pscustomobject]@{
      command = $commands -contains "project"
      skill = @($skills | Where-Object { $_.name -match "^(lark|feishu)-project$" }).Count -gt 0
      recommendation = "Use Project OpenAPI fallback when command and skill are false."
    }
    commands = if ($IncludeHelp) { $commands } else { $null }
    skills = if ($IncludeHelp) { $skills } else { $null }
  } | ConvertTo-Json -Depth 12
} catch {
  [pscustomobject]@{
    ok = $false
    issue = "capability-check-failed"
    message = $_.Exception.Message
  } | ConvertTo-Json -Depth 8
  exit 1
}
