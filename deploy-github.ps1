$ErrorActionPreference = "Stop"

$repoDefault = "oee-production-entry"
$repoName = Read-Host "Repository name [$repoDefault]"
if ([string]::IsNullOrWhiteSpace($repoName)) {
  $repoName = $repoDefault
}

$visibility = Read-Host "Visibility: public or private [public]"
if ([string]::IsNullOrWhiteSpace($visibility)) {
  $visibility = "public"
}
if ($visibility -notin @("public", "private")) {
  throw "Visibility must be public or private."
}

$gh = Join-Path $env:ProgramFiles "GitHub CLI\gh.exe"
$git = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$pnpm = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
$nodeBin = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:PATH = "$nodeBin;$env:PATH"

& $gh auth status
& $pnpm build

$status = & $git status --short
if ($status) {
  & $git add .
  & $git commit -m "Build GitHub Pages output"
}

$args = @("repo", "create", $repoName, "--source=.", "--remote=origin", "--push")
if ($visibility -eq "public") {
  $args += "--public"
} else {
  $args += "--private"
}
& $gh @args

$owner = (& $gh api user --jq ".login").Trim()
$repoFull = "$owner/$repoName"

if ($visibility -eq "public") {
  $body = @{ source = @{ branch = "main"; path = "/docs" } } | ConvertTo-Json -Compress
  try {
    $body | & $gh api "repos/$repoFull/pages" --method POST --input -
  }
  catch {
    $body | & $gh api "repos/$repoFull/pages" --method PUT --input -
  }
  Write-Host "GitHub Pages requested for https://$owner.github.io/$repoName/"
} else {
  Write-Host "Private repo pushed. GitHub Pages may require a paid GitHub plan for private repositories."
}
