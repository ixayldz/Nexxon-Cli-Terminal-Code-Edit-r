param(
  [Parameter(Mandatory=$true)] [string]$File,
  [Parameter(Mandatory=$true)] [string]$Schema
)

$ErrorActionPreference = 'Stop'

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Error "Node.js is required to run validation."
  exit 2
}

node scripts/validate-configs.mjs --file $File --schema $Schema

