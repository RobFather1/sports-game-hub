# test-app-health.ps1
# Quick health check for Smack Talk Central services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smack Talk Central - Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$APP_URL = "https://main.d1wt8yp0wk81a1.amplifyapp.com"
$API_URL = "https://o4trgcru2c.execute-api.us-east-2.amazonaws.com/default/SmackTalkAPI"  # UPDATE THIS when you have your API Gateway URL

# Test 1: Check if app is accessible
Write-Host "[1/4] Testing App Accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $APP_URL -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ App is accessible at $APP_URL" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ App not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check API Gateway health
Write-Host "[2/4] Testing API Gateway..." -ForegroundColor Yellow

if ($API_URL -match "your-api-id") {
    Write-Host "⚠️  API Gateway URL not configured in script yet" -ForegroundColor Yellow
    Write-Host "   Update the `$API_URL variable with your actual API Gateway URL" -ForegroundColor Gray
} else {
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/user-stats/test-user" -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API Gateway responding" -ForegroundColor Green
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ API Gateway responding (404 expected for test user)" -ForegroundColor Green
        } else {
            Write-Host "❌ API Gateway error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 3: Check if DynamoDB tables exist (requires AWS CLI)
Write-Host "[3/4] Checking AWS Services..." -ForegroundColor Yellow

# Check if AWS CLI is installed
if (Get-Command aws -ErrorAction SilentlyContinue) {
    try {
        # List DynamoDB tables
        $tables = aws dynamodb list-tables --region us-east-2 --output json | ConvertFrom-Json
        
        if ($tables.TableNames -contains "SmackTalkMessages") {
            Write-Host "✅ DynamoDB Messages table exists" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Messages table not found" -ForegroundColor Yellow
        }
        
        if ($tables.TableNames -contains "SmackTalkUserStats") {
            Write-Host "✅ DynamoDB UserStats table exists" -ForegroundColor Green
        } else {
            Write-Host "⚠️  UserStats table not found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not check DynamoDB: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Make sure AWS CLI is configured with: aws configure" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  AWS CLI not installed - skipping DynamoDB check" -ForegroundColor Yellow
    Write-Host "   Install from: https://aws.amazon.com/cli/" -ForegroundColor Gray
}

Write-Host ""

# Test 4: Check environment variables
Write-Host "[4/4] Checking Local Environment..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    
    $requiredVars = @(
        "REACT_APP_CLERK_PUBLISHABLE_KEY",
        "REACT_APP_APPSYNC_ENDPOINT",
        "REACT_APP_APPSYNC_REGION",
        "REACT_APP_APPSYNC_API_KEY",
        "REACT_APP_API_GATEWAY_URL",
        "REACT_APP_GIPHY_API_KEY"
    )
    
    $allPresent = $true
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "❌ $var is missing" -ForegroundColor Red
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host ""
        Write-Host "✅ All environment variables present" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "   Create .env.local in project root with required variables" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Health check complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app URL: $APP_URL" -ForegroundColor Cyan
Write-Host ""