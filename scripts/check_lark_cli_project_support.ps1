param(
  [switch]$UseLatestNpx,
  [string]$PackageVersion = "latest"
)

function Invoke-LarkCli {
  param([string[]]$ArgsList)

  if ($UseLatestNpx) {
    return (& npx -y "@larksuite/cli@$PackageVersion" @ArgsList 2>&1) -join "`n"
  }

  return (& lark-cli @ArgsList 2>&1) -join "`n"
}

try {
  if (-not $UseLatestNpx) {
    $cmd = Get-Command lark-cli -ErrorAction SilentlyContinue
    if (-not $cmd) {
      [pscustomobject]@{
        ok = $false
        issue = "lark-cli-not-found"
        message = "lark-cli is not available in PATH."
      } | ConvertTo-Json -Depth 6
      exit 1
    }
  }

  $version = Invoke-LarkCli @("--version")
  $help = Invoke-LarkCli @("--help")
  $skillsRaw = Invoke-LarkCli @("skills", "list")

  $availableCommands = @()
  $inCommands = $false
  foreach ($line in $help.Split("`n")) {
    if ($line.Trim() -eq "Available Commands:") {
      $inCommands = $true
      continue
    }
    if ($inCommands -and [string]::IsNullOrWhiteSpace($line)) {
      break
    }
    if ($inCommands -and $line -match "^\s{2}([a-zA-Z0-9._-]+)\s+") {
      $availableCommands += $Matches[1]
    }
  }

  $skills = @()
  try {
    $skillsJson = $skillsRaw | ConvertFrom-Json
    if ($skillsJson.skills) {
      $skills = @($skillsJson.skills | ForEach-Object { $_.name })
    }
  } catch {
    $skills = @()
  }

  $projectCommandSupported = $availableCommands -contains "project"
  $projectSkillSupported = @($skills | Where-Object { $_ -match "^(lark|feishu)-project$" }).Count -gt 0
  $projectSchemaLikelySupported = $false

  [pscustomobject]@{
    ok = $true
    source = if ($UseLatestNpx) { "@larksuite/cli@$PackageVersion via npx" } else { "local lark-cli" }
    version = $version.Trim()
    projectSupported = $projectCommandSupported -or $projectSkillSupported -or $projectSchemaLikelySupported
    projectCommandSupported = $projectCommandSupported
    projectSkillSupported = $projectSkillSupported
    projectSchemaLikelySupported = $projectSchemaLikelySupported
    commandCount = $availableCommands.Count
    skillCount = $skills.Count
    matchingCommands = @($availableCommands | Where-Object { $_ -match "project|meego" })
    matchingSkills = @($skills | Where-Object { $_ -match "project|meego" })
    recommendation = if ($projectCommandSupported) {
      "Prefer official lark-cli project commands."
    } elseif ($projectSkillSupported) {
      "Use official project skill guidance with lark-cli."
    } else {
      "No first-class Feishu Project support found in official lark-cli; use the plugin Project OpenAPI fallback."
    }
  } | ConvertTo-Json -Depth 8
} catch {
  [pscustomobject]@{
    ok = $false
    issue = "project-support-check-failed"
    message = $_.Exception.Message
  } | ConvertTo-Json -Depth 6
  exit 1
}
