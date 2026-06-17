param(
  [Parameter(ValueFromPipeline = $true)]
  [string]$InputObject
)

begin { $lines = @() }
process { $lines += $InputObject }
end {
  $raw = $lines -join "`n"
  try {
    $json = $raw | ConvertFrom-Json -ErrorAction Stop
    $error = $json.error
    [pscustomobject]@{
      ok = [bool]$json.ok
      type = $error.type
      subtype = $error.subtype
      message = $error.message
      hint = $error.hint
      identity = $json.identity
      update = $json._notice.update.message
    } | ConvertTo-Json -Depth 6
  } catch {
    [pscustomobject]@{
      ok = $false
      type = "raw-output"
      message = $raw
    } | ConvertTo-Json -Depth 4
  }
}
