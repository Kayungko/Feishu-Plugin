param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")]
  [string]$Method,

  [Parameter(Mandatory = $true)]
  [string]$Path,

  [string]$QueryJson = "",
  [string]$DataJson = "",
  [string]$ConfigPath = "",
  [string]$UserKey = "",
  [switch]$DryRun,
  [switch]$ConfirmWrite
)

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

function Read-ProjectConfig {
  param([string]$Path)

  $scriptPath = Join-Path $PSScriptRoot "get_feishu_project_config.ps1"
  $raw = & $scriptPath -ConfigPath $Path -RevealSecrets
  if ($LASTEXITCODE -ne 0) {
    return $raw | ConvertFrom-Json
  }
  return $raw | ConvertFrom-Json
}

function Get-NestedValue {
  param(
    [object]$Object,
    [string]$FieldPath
  )

  $current = $Object
  foreach ($part in $FieldPath.Split(".")) {
    if ($null -eq $current) {
      return $null
    }
    $property = $current.PSObject.Properties[$part]
    if ($null -eq $property) {
      return $null
    }
    $current = $property.Value
  }
  return $current
}

function Join-Url {
  param(
    [string]$BaseUrl,
    [string]$Path,
    [hashtable]$Query
  )

  $base = $BaseUrl.TrimEnd("/")
  $relative = $Path
  if (-not $relative.StartsWith("/")) {
    $relative = "/$relative"
  }
  $url = "$base$relative"
  if ($Query.Count -gt 0) {
    $pairs = @()
    foreach ($key in $Query.Keys) {
      $pairs += "$([Uri]::EscapeDataString([string]$key))=$([Uri]::EscapeDataString([string]$Query[$key]))"
    }
    $url = "$url?$($pairs -join "&")"
  }
  return $url
}

function Get-ProjectAccessToken {
  param([object]$Config)

  if (-not [string]::IsNullOrWhiteSpace($Config.pluginAccessToken)) {
    return $Config.pluginAccessToken
  }

  if ([string]::IsNullOrWhiteSpace($Config.authPath)) {
    return $null
  }

  $authUrl = Join-Url $Config.baseUrl $Config.authPath @{}
  $authBody = @{
    plugin_id = $Config.pluginId
    plugin_secret = $Config.pluginSecret
  } | ConvertTo-Json -Depth 6

  $response = Invoke-RestMethod -Method Post -Uri $authUrl -ContentType "application/json" -Body $authBody
  $token = Get-NestedValue $response $Config.tokenField
  if ($null -eq $token) {
    $token = Get-NestedValue $response "plugin_access_token"
  }
  if ($null -eq $token) {
    $token = Get-NestedValue $response "access_token"
  }
  return $token
}

$configResponse = Read-ProjectConfig $ConfigPath
$isWrite = $Method -in @("POST", "PUT", "PATCH", "DELETE")
if ($isWrite -and -not $ConfirmWrite -and -not $DryRun) {
  [pscustomobject]@{
    ok = $false
    issue = "confirmation_required"
    message = "Project write operations require explicit confirmation."
    method = $Method
    path = $Path
  } | ConvertTo-Json -Depth 8
  exit 2
}

if (-not $configResponse.ok -and -not $DryRun) {
  [pscustomobject]@{
    ok = $false
    issue = "missing-project-config"
    message = "Feishu Project API configuration is incomplete."
    missing = $configResponse.missing
    configPath = $configResponse.configPath
    template = "templates/feishu-project.config.example.json"
  } | ConvertTo-Json -Depth 8
  exit 1
}

$config = $configResponse.config
$query = @{}
if (-not [string]::IsNullOrWhiteSpace($QueryJson)) {
  $query = ConvertTo-Hashtable ($QueryJson | ConvertFrom-Json)
}

$body = $null
if (-not [string]::IsNullOrWhiteSpace($DataJson)) {
  $body = $DataJson
}

$url = Join-Url $config.baseUrl $Path $query
$effectiveUserKey = if (-not [string]::IsNullOrWhiteSpace($UserKey)) { $UserKey } else { $config.userKey }

$headers = @{}
if ($config.defaultHeaders -is [System.Management.Automation.PSCustomObject]) {
  $headers = ConvertTo-Hashtable $config.defaultHeaders
} elseif ($config.defaultHeaders -is [hashtable]) {
  $headers = $config.defaultHeaders.Clone()
}

if (-not [string]::IsNullOrWhiteSpace($effectiveUserKey)) {
  $headers["X-USER-KEY"] = $effectiveUserKey
}
if (-not [string]::IsNullOrWhiteSpace($config.authMode)) {
  $headers["x-auth-mode"] = $config.authMode
}

if ($DryRun) {
  [pscustomobject]@{
    ok = $true
    dryRun = $true
    method = $Method
    url = $url
    headers = $headers
    hasBody = -not [string]::IsNullOrWhiteSpace($body)
    writeRequiresConfirmation = $isWrite
    configReady = $configResponse.ok
    missingConfig = $configResponse.missing
  } | ConvertTo-Json -Depth 10
  exit 0
}

try {
  $token = Get-ProjectAccessToken $config
  if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Unable to resolve plugin_access_token. Provide pluginAccessToken directly or configure authPath/tokenField."
  }
  $headers["Authorization"] = "Bearer $token"

  $parameters = @{
    Method = $Method
    Uri = $url
    Headers = $headers
  }
  if (-not [string]::IsNullOrWhiteSpace($body)) {
    $parameters["ContentType"] = "application/json"
    $parameters["Body"] = $body
  }

  $response = Invoke-RestMethod @parameters
  [pscustomobject]@{
    ok = $true
    method = $Method
    url = $url
    data = $response
  } | ConvertTo-Json -Depth 20
} catch {
  [pscustomobject]@{
    ok = $false
    issue = "project-api-call-failed"
    method = $Method
    url = $url
    message = $_.Exception.Message
  } | ConvertTo-Json -Depth 8
  exit 1
}
