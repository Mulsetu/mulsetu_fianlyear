# Simple test script to call local model server after it's running
$Url = 'http://localhost:8000/predict'
$payload = @{ crop='Water Melon'; mandi='Azadpur_APMC'; horizon='7D'; recentPrices=@(3200,3150,3180,3220,3190,3210,3230) }

try {
  $resp = Invoke-RestMethod -Uri $Url -Method Post -Body ($payload | ConvertTo-Json -Depth 4) -ContentType 'application/json' -TimeoutSec 15
  $resp | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $PSScriptRoot 'last_test_response.json') -Encoding utf8
  Write-Output "Test successful, saved to last_test_response.json"
} catch {
  Write-Error "Test failed: $_"
  exit 1
}
