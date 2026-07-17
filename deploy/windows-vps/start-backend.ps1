$ErrorActionPreference = "Stop"

$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$apiRoot = Join-Path $repositoryRoot "apps\api"
Set-Location (Resolve-Path $apiRoot)

& node .\src\server.js
