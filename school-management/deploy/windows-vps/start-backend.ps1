$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $backendRoot "..\\backend"
Set-Location (Resolve-Path $backendRoot)

& node .\src\server.js
