# Test Authentication Script
# This script helps debug authentication issues

$API_URL = "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com"

Write-Host "Testing TaskBreaker Authentication..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if API is responding
Write-Host "Test 1: Checking API health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✓ API is responding" -ForegroundColor Green
} catch {
    Write-Host "✗ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Try signup
Write-Host "Test 2: Testing signup..." -ForegroundColor Yellow
$signupBody = @{
    email = "test$(Get-Random)@example.com"
    password = "TestPass123!"
    name = "Test User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/signup" `
        -Method POST `
        -ContentType "application/json" `
        -Body $signupBody `
        -ErrorAction Stop
    
    Write-Host "✓ Signup successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Signup failed" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error: $($errorDetails.error.message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking CloudWatch logs..." -ForegroundColor Yellow
    Write-Host "Run this command to see detailed logs:" -ForegroundColor Cyan
    Write-Host "aws logs tail /aws/lambda/taskbreaker-api --since 5m --follow" -ForegroundColor White
}
Write-Host ""

# Instructions
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. If signup failed, check CloudWatch logs for detailed error" -ForegroundColor White
Write-Host "2. Verify Cognito User Pool settings in AWS Console" -ForegroundColor White
Write-Host "3. Check Lambda environment variables" -ForegroundColor White
Write-Host ""
Write-Host "To view logs, install AWS CLI and run:" -ForegroundColor Yellow
Write-Host "aws logs tail /aws/lambda/taskbreaker-api --since 10m" -ForegroundColor White
