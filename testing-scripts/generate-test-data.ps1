# generate-test-data.ps1
# Generates test data scenarios for API testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Data Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = "https://o4trgcru2c.execute-api.us-east-2.amazonaws.com/default/SmackTalkAPI"  # UPDATE THIS when you have your API Gateway URL

# Check if API URL is configured
if ($API_URL -match "your-api-id") {
    Write-Host "⚠️  API Gateway URL not configured yet" -ForegroundColor Yellow
    Write-Host "" 
    Write-Host "To use this script:" -ForegroundColor White
    Write-Host "1. Find your API Gateway URL in AWS Console" -ForegroundColor Gray
    Write-Host "2. Update the `$API_URL variable at the top of this script" -ForegroundColor Gray
    Write-Host "3. Run the script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Your API Gateway URL will look like:" -ForegroundColor White
    Write-Host "https://abc123xyz.execute-api.us-east-2.amazonaws.com/prod" -ForegroundColor Cyan
    Write-Host ""
    exit
}

# Check if curl is available
if (-not (Get-Command curl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ curl is required but not found" -ForegroundColor Red
    Write-Host "   curl should be installed by default on Windows 10+" -ForegroundColor Yellow
    Write-Host "   If missing, install from: https://curl.se/windows/" -ForegroundColor Gray
    exit
}

Write-Host "API Gateway: $API_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Select test scenario:" -ForegroundColor Yellow
Write-Host "1. Create test user with stats" -ForegroundColor White
Write-Host "2. Test leaderboard with multiple users" -ForegroundColor White
Write-Host "3. Test XP progression" -ForegroundColor White
Write-Host "4. View existing user stats" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Creating test user..." -ForegroundColor Yellow
        
        $username = Read-Host "Enter test username (e.g., TestDad)"
        $userId = Read-Host "Enter user ID (e.g., test_user_001)"
        
        Write-Host ""
        Write-Host "Simulating user activity..." -ForegroundColor Cyan
        
        # Create user stats
        $body = @{
            userId = $userId
            username = $username
            totalXP = 150
            currentLevel = 2
            messageCount = 10
            reactionCount = 8
            pollsCreated = 2
            votesCount = 5
        } | ConvertTo-Json
        
        Write-Host "Sending request to API..." -ForegroundColor Gray
        Write-Host "POST $API_URL/user-stats" -ForegroundColor Gray
        
        try {
            $response = curl -X POST "$API_URL/user-stats" `
                -H "Content-Type: application/json" `
                -d $body `
                --silent --show-error
            
            Write-Host "✅ User created successfully" -ForegroundColor Green
            Write-Host $response
        } catch {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "Creating leaderboard test data..." -ForegroundColor Yellow
        Write-Host "This will create 5 test users with different XP levels" -ForegroundColor Gray
        Write-Host ""
        
        $testUsers = @(
            @{ username = "TestDad"; userId = "test_dad"; xp = 500; level = 5 },
            @{ username = "TestSon1"; userId = "test_son1"; xp = 350; level = 4 },
            @{ username = "TestSon2"; userId = "test_son2"; xp = 200; level = 3 },
            @{ username = "TestMom"; userId = "test_mom"; xp = 150; level = 2 },
            @{ username = "TestRookie"; userId = "test_rookie"; xp = 50; level = 1 }
        )
        
        foreach ($user in $testUsers) {
            Write-Host "Creating $($user.username) (Level $($user.level), $($user.xp) XP)..." -ForegroundColor Cyan
            
            $body = @{
                userId = $user.userId
                username = $user.username
                totalXP = $user.xp
                currentLevel = $user.level
                messageCount = [math]::Floor($user.xp / 10)
                reactionCount = [math]::Floor($user.xp / 20)
                pollsCreated = [math]::Floor($user.level)
                votesCount = [math]::Floor($user.xp / 30)
            } | ConvertTo-Json
            
            try {
                $response = curl -X POST "$API_URL/user-stats" `
                    -H "Content-Type: application/json" `
                    -d $body `
                    --silent --show-error
                
                Write-Host "  ✅ Created" -ForegroundColor Green
                Start-Sleep -Seconds 1
            } catch {
                Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "✅ Test leaderboard data created!" -ForegroundColor Green
        Write-Host ""
        Write-Host "View leaderboard at: https://main.d1wt8yp0wk81a1.amplifyapp.com" -ForegroundColor Cyan
        Write-Host "Navigate to the leaderboard section in the app" -ForegroundColor Gray
    }
    
    "3" {
        Write-Host ""
        Write-Host "XP Progression Test" -ForegroundColor Yellow
        
        $userId = Read-Host "Enter user ID to test"
        
        Write-Host ""
        Write-Host "Simulating XP progression:" -ForegroundColor Cyan
        Write-Host "  Starting at 0 XP..." -ForegroundColor Gray
        
        $xpLevels = @(0, 50, 100, 200, 400, 800)
        
        foreach ($xp in $xpLevels) {
            $level = switch ($xp) {
                {$_ -lt 100} { 1 }
                {$_ -lt 200} { 2 }
                {$_ -lt 400} { 3 }
                {$_ -lt 800} { 4 }
                default { 5 }
            }
            
            Write-Host "  Setting XP to $xp (Level $level)..." -ForegroundColor Cyan
            
            $body = @{
                userId = $userId
                username = "ProgressionTest"
                totalXP = $xp
                currentLevel = $level
                messageCount = [math]::Floor($xp / 10)
                reactionCount = [math]::Floor($xp / 20)
            } | ConvertTo-Json
            
            try {
                curl -X POST "$API_URL/user-stats" `
                    -H "Content-Type: application/json" `
                    -d $body `
                    --silent --show-error | Out-Null
                
                Write-Host "    ✅ Updated" -ForegroundColor Green
                Start-Sleep -Seconds 2
            } catch {
                Write-Host "    ❌ Error" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "✅ Progression test complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Login to app and check XP display for user: $userId" -ForegroundColor Cyan
    }
    
    "4" {
        Write-Host ""
        $userId = Read-Host "Enter user ID to view"
        
        Write-Host ""
        Write-Host "Fetching user stats..." -ForegroundColor Yellow
        
        try {
            $response = curl -X GET "$API_URL/user-stats/$userId" --silent --show-error
            
            Write-Host ""
            Write-Host "User Stats:" -ForegroundColor Green
            Write-Host "----------" -ForegroundColor Gray
            $stats = $response | ConvertFrom-Json
            
            Write-Host "Username: $($stats.username)" -ForegroundColor White
            Write-Host "Level: $($stats.currentLevel)" -ForegroundColor White
            Write-Host "Total XP: $($stats.totalXP)" -ForegroundColor White
            Write-Host "Messages: $($stats.messageCount)" -ForegroundColor White
            Write-Host "Reactions: $($stats.reactionCount)" -ForegroundColor White
            Write-Host "Polls Created: $($stats.pollsCreated)" -ForegroundColor White
            Write-Host "Votes: $($stats.votesCount)" -ForegroundColor White
        } catch {
            Write-Host "❌ User not found or error occurred" -ForegroundColor Red
            Write-Host "   Check that the user ID is correct" -ForegroundColor Gray
        }
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""