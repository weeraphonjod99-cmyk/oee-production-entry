param(
  [string]$ScriptId = "",
  [string]$Title = "OEE Production Entry API",
  [switch]$Create,
  [switch]$Deploy
)

$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
$repoRoot = Split-Path -Parent $rootDir
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$bundledBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\bin"
if (Test-Path -LiteralPath $bundledNode) {
  $env:PATH = "$bundledNode;$bundledBin;$env:PATH"
}

$pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
if (-not $pnpm) {
  $pnpm = Join-Path $bundledBin "pnpm.cmd"
}
if (-not (Test-Path -LiteralPath $pnpm)) {
  throw "pnpm was not found. Install Node.js/pnpm or run from Codex runtime."
}

function Invoke-Clasp {
  & $pnpm dlx @google/clasp @args
}

$authFile = Join-Path $env:USERPROFILE ".clasprc.json"
if (-not (Test-Path -LiteralPath $authFile)) {
  Write-Host "Google login is required once. A browser window will open."
  Invoke-Clasp login
}

$projectFile = Join-Path $rootDir ".clasp.json"
if ($ScriptId) {
  @{ scriptId = $ScriptId; rootDir = $rootDir } |
    ConvertTo-Json -Depth 3 |
    Set-Content -LiteralPath $projectFile -Encoding UTF8
}

if ($Create) {
  Push-Location $rootDir
  try {
    Invoke-Clasp create --type standalone --title $Title --rootDir $rootDir
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path -LiteralPath $projectFile)) {
  throw "No .clasp.json found. Run with -Create, or pass -ScriptId <Apps Script script ID>."
}

Push-Location $rootDir
try {
  Invoke-Clasp push --force --project $projectFile --ignore (Join-Path $rootDir ".claspignore")

  if ($Deploy) {
    Invoke-Clasp deploy --description "OEE web app API $(Get-Date -Format yyyy-MM-dd-HHmm)" --project $projectFile
  }
} finally {
  Pop-Location
}
