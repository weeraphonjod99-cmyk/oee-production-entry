$ErrorActionPreference = "Stop"

$gh = Join-Path $env:ProgramFiles "GitHub CLI\gh.exe"
if (-not (Test-Path -LiteralPath $gh)) {
  throw "GitHub CLI not found. Install it with: winget install --id GitHub.cli"
}

Write-Host "Paste a GitHub classic token with repo scope. Input is hidden."
$secureToken = Read-Host "GitHub token" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Token is empty."
  }
  $token | & $gh auth login --hostname github.com --with-token
  & $gh auth status
}
finally {
  if ($bstr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
  $token = $null
}
