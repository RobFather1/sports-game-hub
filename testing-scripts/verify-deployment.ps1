# verify-deployment.ps1
# Verifies deployment completed successfully

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$APP_URL = "https://main.d1wt8yp0wk81a1.amplifyapp.com"
$GITHUB_REPO = "robforee/smack-talk-central"
$AMPLIFY_APP_ID = "d1wt8yp0wk81a1"

Write-Host "App URL: $APP_URL" -ForegroundColor Cyan
Write-Host "GitHub Repo: $GITHUB_REPO" -ForegroundColor Cyan
Write-Host "Amplify App ID: $AMPLIFY_APP_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking deployment status..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Check if site is accessible
Write-Host "[1/5] Site Accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $APP_URL -Method GET -TimeoutSec 15 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Site is live and responding" -ForegroundColor Green
        
        # Check content length
        $contentLength = $response.Content.Length
        Write-Host "   Page size: $([math]::Round($contentLength/1024, 2)) KB" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Site not accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "⚠️  Check AWS Amplify console for deployment status" -ForegroundColor Yellow
    Write-Host "   https://console.aws.amazon.com/amplify/home?region=us-east-2#/$AMPLIFY_APP_ID" -ForegroundColor Cyan
    exit
}

Write-Host ""

# Test 2: Check for React app markers
Write-Host "[2/5] React App Detection..." -ForegroundColor Yellow
try {
    $content = (Invoke-WebRequest -Uri $APP_URL -UseBasicParsing).Content
    if ($content -match "root" -or $content -match "react") {
        Write-Host "✅ React app detected in HTML" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not confirm React app in HTML" -ForegroundColor Yellow
    }
    
    # Check for common React build artifacts
    if ($content -match "static/js" -or $content -match "bundle.js") {
        Write-Host "✅ React build files detected" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error checking content" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check environment variables are working
Write-Host "[3/5] Environment Variables Check..." -ForegroundColor Yellow
Write-Host "   Checking if Clerk initializes (requires CLERK_PUBLISHABLE_KEY)" -ForegroundColor Gray
Write-Host ""
Write-Host "   ⚠️  Manual verification required:" -ForegroundColor Yellow
Write-Host "   1. Open $APP_URL in browser" -ForegroundColor White
Write-Host "   2. Open DevTools Console (F12)" -ForegroundColor White
Write-Host "   3. Look for Clerk initialization messages" -ForegroundColor White
Write-Host "   4. No errors = environment variables loaded correctly" -ForegroundColor White
Write-Host ""
Write-Host "   Common issues:" -ForegroundColor Gray
Write-Host "   - Missing env vars in Amplify Console" -ForegroundColor Gray
Write-Host "   - Typos in REACT_APP_ prefix" -ForegroundColor Gray
Write-Host "   - Need to redeploy after adding env vars" -ForegroundColor Gray

Write-Host ""

# Test 4: Check recent Git commits
Write-Host "[4/5] Recent Git Commits..." -ForegroundColor Yellow
try {
    # Check if we're in a git repository
    $gitStatus = git rev-parse --is-inside-work-tree 2>$null
    
    if ($gitStatus -eq "true") {
        $commits = git log --oneline -n 5 2>$null
        Write-Host "Recent commits:" -ForegroundColor Cyan
        $commits | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        Write-Host "✅ Git history accessible" -ForegroundColor Green
        
        # Check current branch
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        Write-Host "Current branch: $branch" -ForegroundColor Cyan
        
        # Check if there are unpushed commits
        $unpushed = git log origin/$branch..$branch --oneline 2>$null
        if ($unpushed) {
            Write-Host "⚠️  You have unpushed commits:" -ForegroundColor Yellow
            $unpushed | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
        } else {
            Write-Host "✅ All commits pushed to GitHub" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  Not in a Git repository" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not read Git history" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Deployment checklist
Write-Host "[5/5] Deployment Checklist..." -ForegroundColor Yellow
Write-Host ""

$checklist = @(
    "Amplify build completed successfully",
    "No errors in Amplify console logs",
    "Can access app at $APP_URL",
    "Can log in with Clerk",
    "Can send and receive messages in real-time",
    "Reactions sync across browsers",
    "Polls work correctly",
    "Score updates display",
    "Giphy search works",
    "XP system tracking correctly",
    "Leaderboard displays",
    "All environment variables set in Amplify Console"
)

Write-Host "Manual Verification Checklist:" -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Gray
foreach ($item in $checklist) {
    Write-Host "  [ ] $item" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Visit AWS Amplify Console:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/amplify/home?region=us-east-2#/$AMPLIFY_APP_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Check latest build:" -ForegroundColor White
Write-Host "   - Build status should be green (Deployed)" -ForegroundColor Gray
Write-Host "   - Review logs for any warnings" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test app functionality:" -ForegroundColor White
Write-Host "   - Open: $APP_URL" -ForegroundColor Cyan
Write-Host "   - Run through smoke test checklist above" -ForegroundColor Gray
Write-Host ""
Write-Host "4. If issues found:" -ForegroundColor White
Write-Host "   - Check Amplify build logs" -ForegroundColor Gray
Write-Host "   - Verify environment variables" -ForegroundColor Gray
Write-Host "   - Check browser console for errors" -ForegroundColor Gray
Write-Host ""