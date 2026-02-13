# run-all-tests.ps1
# Master script that runs all tests

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Smack Talk Central - Full Test Suite ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Production URL: https://main.d1wt8yp0wk81a1.amplifyapp.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will run all automated tests." -ForegroundColor Yellow
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Test 1: Environment Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
.\check-environment.ps1

Write-Host ""
Read-Host "Press Enter to continue to health check..."

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Test 2: Application Health" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
.\test-app-health.ps1

Write-Host ""
$deployTest = Read-Host "Run deployment verification? (y/n)"
if ($deployTest -eq 'y') {
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " Test 3: Deployment Status" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    .\verify-deployment.ps1
}

Write-Host ""
$browserTest = Read-Host "Launch multi-user browser test? (y/n)"
if ($browserTest -eq 'y') {
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " Test 4: Multi-User Browser Test" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    .\start-test-browsers.ps1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     All Automated Tests Complete!     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "https://main.d1wt8yp0wk81a1.amplifyapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available test scripts:" -ForegroundColor Yellow
Write-Host "  .\start-test-browsers.ps1  - Launch multi-user test" -ForegroundColor White
Write-Host "  .\generate-test-data.ps1   - Create test data (needs API URL)" -ForegroundColor White
Write-Host "  .\test-app-health.ps1      - Quick health check" -ForegroundColor White
Write-Host "  .\verify-deployment.ps1    - Check deployment status" -ForegroundColor White
Write-Host ""
```
