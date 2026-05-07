# Run the FastAPI server (Windows PowerShell)
$venv = Join-Path $PSScriptRoot ".venv"
$activate = Join-Path $venv "Scripts\Activate.ps1"
if (Test-Path $activate) {
  . $activate
} else {
  Write-Error "Virtual environment not found. Run .\setup.ps1 first."
  exit 1
}

# Optionally read PORT env var
$port = $env:MODEL_SERVER_PORT
if (-not $port) { $port = 8000 }

Write-Output "Starting uvicorn on port $port..."
uvicorn app:app --host 0.0.0.0 --port $port --reload
