# DevQuake one-time local setup (Windows PowerShell)
# Run from D:\Work\devquake:   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
$ErrorActionPreference = 'Stop'

function Invoke-Step([string]$Label, [scriptblock]$Command) {
  Write-Host "-> $Label" -ForegroundColor Cyan
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "Step failed: $Label (exit code $LASTEXITCODE)" }
}

Write-Host "== DevQuake setup ==" -ForegroundColor Cyan

$nodeVersion = (node --version) -replace 'v', ''
if ([version]$nodeVersion -lt [version]'20.9.0') {
  throw "Node $nodeVersion found. Install Node 22 LTS (https://nodejs.org) and re-run."
}
Write-Host "Node $nodeVersion OK"

# The Corepack bundled with older Node releases has outdated npm signing keys and fails with
# "Cannot find matching keyid". Updating Corepack first avoids that.
Invoke-Step 'Updating Corepack' { npm install -g corepack@latest }

$pnpmReady = $false
try {
  Invoke-Step 'Enabling Corepack' { corepack enable }
  Invoke-Step 'Pinning pnpm via Corepack' { corepack use pnpm@latest }
  $pnpmReady = $true
} catch {
  Write-Warning "Corepack failed: $($_.Exception.Message)"
  Write-Warning 'Falling back to a global pnpm install via npm.'
}

if (-not $pnpmReady) {
  corepack disable 2>$null
  Invoke-Step 'Installing pnpm globally' { npm install -g pnpm@latest }
  $pnpmVersion = (pnpm --version).Trim()
  # Record the version in package.json (needed by CI's pnpm/action-setup)
  $pkgPath = Join-Path (Get-Location) 'package.json'
  $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
  $pkg | Add-Member -NotePropertyName packageManager -NotePropertyValue "pnpm@$pnpmVersion" -Force
  $json = $pkg | ConvertTo-Json -Depth 20
  [System.IO.File]::WriteAllText($pkgPath, ($json -replace "`r`n", "`n") + "`n")
  Write-Host "Set packageManager to pnpm@$pnpmVersion"
}

if (-not (Test-Path 'apps\host\.env.local')) {
  Copy-Item 'apps\host\.env.example' 'apps\host\.env.local'
  Write-Host "Created apps\host\.env.local"
}

Invoke-Step 'Installing dependencies' { pnpm install }
Invoke-Step 'Generating plugin registry' { pnpm registry }
Invoke-Step 'Running SDK tests' { pnpm --filter '@devquake/plugin-sdk' test }

Write-Host ""
Write-Host "Done. Start with:  pnpm dev" -ForegroundColor Green
Write-Host "  Host:    http://localhost:3000"
Write-Host "  App:     http://shopping.localhost:3000"
