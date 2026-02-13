# start-test-browsers.ps1
# Opens multiple browser windows for testing multi-user features

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Multi-User Test Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$APP_URL = "https://main.d1wt8yp0wk81a1.amplifyapp.com"
$NUM_WINDOWS = 3  # Number of test windows to open

Write-Host "App URL: $APP_URL" -ForegroundColor Cyan
Write-Host "Opening $NUM_WINDOWS browser windows..." -ForegroundColor Yellow
Write-Host "Each window will open in incognito/private mode" -ForegroundColor Gray
Write-Host ""

# Function to detect default browser
function Get-DefaultBrowser {
    try {
        $browser = (Get-ItemProperty HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice -ErrorAction SilentlyContinue).ProgId
        
        if ($browser -like "*Chrome*") { return "Chrome" }
        if ($browser -like "*Firefox*") { return "Firefox" }
        if ($browser -like "*Edge*") { return "Edge" }
        return "Unknown"
    } catch {
        return "Unknown"
    }
}

$defaultBrowser = Get-DefaultBrowser
Write-Host "Detected browser: $defaultBrowser" -ForegroundColor Cyan
Write-Host ""

# Test scenarios to display
Write-Host "Suggested Test Scenarios:" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Gray
Write-Host "1. Window 1: Dad (experienced user)" -ForegroundColor White
Write-Host "   - Create polls" -ForegroundColor Gray
Write-Host "   - Update scores" -ForegroundColor Gray
Write-Host "   - Send GIFs" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Window 2: Son #1 (new user)" -ForegroundColor White
Write-Host "   - Send messages" -ForegroundColor Gray
Write-Host "   - Add reactions" -ForegroundColor Gray
Write-Host "   - Vote on polls" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Window 3: Son #2 (mid-level user)" -ForegroundColor White
Write-Host "   - Test real-time sync" -ForegroundColor Gray
Write-Host "   - React to messages" -ForegroundColor Gray
Write-Host "   - Watch XP updates" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to launch browsers..."
Read-Host

# Launch browsers based on type
switch ($defaultBrowser) {
    "Chrome" {
        for ($i = 1; $i -le $NUM_WINDOWS; $i++) {
            Write-Host "Launching Chrome window $i..." -ForegroundColor Green
            Start-Process "chrome.exe" -ArgumentList "--incognito", $APP_URL
            Start-Sleep -Seconds 2
        }
    }
    "Firefox" {
        for ($i = 1; $i -le $NUM_WINDOWS; $i++) {
            Write-Host "Launching Firefox window $i..." -ForegroundColor Green
            Start-Process "firefox.exe" -ArgumentList "-private-window", $APP_URL
            Start-Sleep -Seconds 2
        }
    }
    "Edge" {
        for ($i = 1; $i -le $NUM_WINDOWS; $i++) {
            Write-Host "Launching Edge window $i..." -ForegroundColor Green
            Start-Process "msedge.exe" -ArgumentList "-inprivate", $APP_URL
            Start-Sleep -Seconds 2
        }
    }
    default {
        Write-Host "⚠️  Could not auto-detect browser" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please manually open $NUM_WINDOWS incognito/private windows to:" -ForegroundColor White
        Write-Host $APP_URL -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Chrome: Ctrl+Shift+N" -ForegroundColor Gray
        Write-Host "Firefox: Ctrl+Shift+P" -ForegroundColor Gray
        Write-Host "Edge: Ctrl+Shift+N" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Browser windows launched!" -ForegroundColor Green
Write-Host ""
Write-Host "Testing Tips:" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Gray
Write-Host "• Log in with different test accounts in each window" -ForegroundColor White
Write-Host "• Keep windows side-by-side to see real-time sync" -ForegroundColor White
Write-Host "• Test sending messages, reactions, polls simultaneously" -ForegroundColor White
Write-Host "• Watch for XP updates in all windows" -ForegroundColor White
Write-Host "• Verify score updates sync across all windows" -ForegroundColor White
Write-Host "• Test Giphy search in one window, see in others" -ForegroundColor White
Write-Host ""
Write-Host "Quick Test Checklist:" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Gray
Write-Host "[ ] User 1 sends message → Users 2 & 3 see it immediately" -ForegroundColor White
Write-Host "[ ] User 2 adds reaction → Shows in all windows" -ForegroundColor White
Write-Host "[ ] User 3 creates poll → Everyone can vote" -ForegroundColor White
Write-Host "[ ] Update score → All windows show new score" -ForegroundColor White
Write-Host "[ ] All users earn correct XP for actions" -ForegroundColor White
Write-Host ""