$projectDirectory = Join-Path $PSScriptRoot 'campus-app'
Set-Location -LiteralPath $projectDirectory
Write-Host 'Starting Campus Lost N Found at http://127.0.0.1:3100'
pnpm dev
