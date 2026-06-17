param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$kind = "unknown"
$token = $null
$projectKey = $null
$projectRoute = $null
$workItemType = $null
$workItemId = $null
$nodeId = $null

$patterns = @(
  @{ kind = "doc"; regex = "/docx/([^/?#]+)" },
  @{ kind = "wiki"; regex = "/wiki/([^/?#]+)" },
  @{ kind = "sheet"; regex = "/sheets?/([^/?#]+)" },
  @{ kind = "base"; regex = "/base/([^/?#]+)" },
  @{ kind = "minutes"; regex = "/minutes/([^/?#]+)" },
  @{ kind = "drive"; regex = "/file/([^/?#]+)" },
  @{ kind = "slides"; regex = "/slides/([^/?#]+)" },
  @{ kind = "project"; regex = "/project/([^/?#]+)" }
)

try {
  $uriForProject = [Uri]$Url
  if ($uriForProject.Host -match "(^|\.)project\.(feishu|larksuite)\.cn$" -or $uriForProject.Host -match "(^|\.)project\.larkoffice\.com$") {
    $segments = $uriForProject.AbsolutePath.Trim("/").Split("/", [System.StringSplitOptions]::RemoveEmptyEntries)
    if ($segments.Count -ge 1) {
      $projectKey = $segments[0]
      $token = $projectKey
      $kind = "project"
    }
    if ($segments.Count -ge 2) {
      $projectRoute = $segments[1]
      switch ($projectRoute) {
        "story" {
          if ($segments.Count -ge 4 -and $segments[2] -eq "detail") {
            $kind = "project-story"
            $workItemType = "story"
            $workItemId = $segments[3]
          }
        }
        "issue" {
          if ($segments.Count -ge 4 -and $segments[2] -eq "detail") {
            $kind = "project-issue"
            $workItemType = "issue"
            $workItemId = $segments[3]
          }
        }
        "userGantt" {
          $kind = "project-workbench"
        }
        "workItem" {
          $kind = "project-workitem"
        }
      }
    }
  }
} catch {}

if ($kind -eq "unknown") {
  foreach ($pattern in $patterns) {
    if ($Url -match $pattern.regex) {
      $kind = $pattern.kind
      $token = $Matches[1]
      break
    }
  }
}

$query = @{}
try {
  $uri = [Uri]$Url
  if ($uri.Query) {
    $uri.Query.TrimStart("?").Split("&") | ForEach-Object {
      if ($_ -match "=") {
        $parts = $_.Split("=", 2)
        $query[$parts[0]] = [Uri]::UnescapeDataString($parts[1])
      }
    }
    if ($query.ContainsKey("node")) {
      $nodeId = $query["node"]
    }
  }
} catch {}

[pscustomobject]@{
  kind = $kind
  token = $token
  projectKey = $projectKey
  projectRoute = $projectRoute
  workItemType = $workItemType
  workItemId = $workItemId
  nodeId = $nodeId
  query = $query
  url = $Url
} | ConvertTo-Json -Depth 6
