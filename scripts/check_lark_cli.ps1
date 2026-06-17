param(
  [switch]$VerifyAuth
)

$cmd = Get-Command lark-cli -ErrorAction SilentlyContinue
if (-not $cmd) {
  [pscustomobject]@{
    ok = $false
    issue = "lark-cli-not-found"
    message = "lark-cli is not available in PATH."
  } | ConvertTo-Json -Depth 4
  exit 1
}

$version = (& lark-cli --version 2>$null) -join "`n"
$result = [ordered]@{
  ok = $true
  path = $cmd.Source
  version = $version
}

if ($VerifyAuth) {
  $auth = (& lark-cli auth status --verify 2>&1) -join "`n"
  $result.authStatus = $auth
}

$result | ConvertTo-Json -Depth 4
