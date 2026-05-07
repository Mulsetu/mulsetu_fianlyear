# Create virtual environment and install dependencies (Windows PowerShell)
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Error "Python not found in PATH. Install Python 3.9+ and try again."
  exit 1
}

$venv = Join-Path $PSScriptRoot ".venv"
if (-not (Test-Path $venv)) {
  python -m venv $venv
}

$activate = Join-Path $venv "Scripts\Activate.ps1"
if (Test-Path $activate) {
  Write-Output "Activating virtual environment..."
  . $activate
} else {
  Write-Error "Failed to find Activate.ps1 in venv."
}

Write-Output "Installing requirements..."
python -m pip install --upgrade pip
python -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')

Write-Output "Setup complete. To run the server: .\run_server.ps1"