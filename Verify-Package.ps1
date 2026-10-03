Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'MANIFEST_SHA256.json') -Raw | ConvertFrom-Json
foreach ($item in $manifest.files) {
    $path = Join-Path $PSScriptRoot $item.path
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing: $($item.path)" }
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $item.sha256) { throw "Integrity mismatch: $($item.path)" }
}
Write-Output "PASS: $($manifest.files.Count) package files verified. Runtime inputs added after delivery require their own freeze manifest."