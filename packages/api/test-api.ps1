# API Service Test Script

Write-Host "Testing API Service..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:8080"

# Test 1: Health Check
Write-Host "[Test 1] Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "Status: $($health.status)" -ForegroundColor Cyan
    Write-Host "Service: $($health.service)" -ForegroundColor Cyan
} catch {
    Write-Host "Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: User Registration
Write-Host "[Test 2] User Registration" -ForegroundColor Yellow
$registerBody = @{
    email = "test_user_$(Get-Random)@example.com"
    password = "password123"
    displayName = "Test User"
} | ConvertTo-Json
try {
    $register = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "User ID: $($register.user.id)" -ForegroundColor Cyan
    Write-Host "Email: $($register.user.email)" -ForegroundColor Cyan
    Write-Host "Access Token: $($register.access_token.Substring(0, 50))..." -ForegroundColor Gray
    
    # Save for later tests
    $script:accessToken = $register.access_token
    $script:refreshToken = $register.refresh_token
} catch {
    WriteMask "Registration failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: User Login
Write-Host "[Test 3] User Login" -ForegroundColor Yellow
$loginBody = @{
    email = ($registerBody | ConvertFrom-Json).email
    password = "password123"
} | ConvertTo-Json
try {
    $login = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "User ID: $($login.user.id)" -ForegroundColor Cyan
    $script:accessToken = $login.access_token
    $script:refreshToken = $login.refresh_token
} catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Current User
Write-Host "[Test 4] Get Current User" -ForegroundColor Yellow
try {
    $me = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/me" -Method GET -Headers @{ Authorization = "Bearer $script:accessToken" }
    Write-Host "User ID: $($me.id)" -ForegroundColor Cyan
    Write-Host "Email: $($me.email)" -ForegroundColor Cyan
} catch {
    Write-Host "Get user failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Refresh Token
Write-Host "[Test 5] Refresh Token" -ForegroundColor Yellow
try {
    $refreshBody = @{ refresh_token = $script:refreshToken } | ConvertTo-Json
    $refresh = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
    Write-Host "New access token received!" -ForegroundColor Green
} catch {
    Write-Host "Refresh failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Green