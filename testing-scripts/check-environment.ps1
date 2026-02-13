# check-environment.ps1
# Checks if development environment is properly configured

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Development Environment Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# Check 1: Node.js
Write-Host "[1/8] Checking Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    
    # Check if version is recent enough (v14+)
    $versionNumber = [int]($nodeVersion -replace 'v|\..*')
    if ($versionNumber -lt 14) {
        $warnings += "Node.js version might be outdated (need v14+)"
        Write-Host "⚠️  Consider upgrading to v18 or later" -ForegroundColor Yellow
    }
} else {
    $issues += "Node.js not installed"
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Gray
}

Write-Host ""

# Check 2: npm
Write-Host "[2/8] Checking npm..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: v$npmVersion" -ForegroundColor Green
} else {
    $issues += "npm not installed"
    Write-Host "❌ npm not found" -ForegroundColor Red
}

Write-Host ""

# Check 3: Git
Write-Host "[3/8] Checking Git..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVersion = git --version
    Write-Host "✅ Git installed: $gitVersion" -ForegroundColor Green
} else {
    $issues += "Git not installed"
    Write-Host "❌ Git not found" -ForegroundColor Red
    Write-Host "   Download from: https://git-scm.com/downloads" -ForegroundColor Gray
}

Write-Host ""

# Check 4: AWS CLI
Write-Host "[4/8] Checking AWS CLI..." -ForegroundColor Yellow
if (Get-Command aws -ErrorAction SilentlyContinue) {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
    
    # Check if configured
    try {
        $awsIdentity = aws sts get-caller-identity 2>$null
        if ($awsIdentity) {
            Write-Host "✅ AWS CLI configured" -ForegroundColor Green
        }
    } catch {
        $warnings += "AWS CLI not configured - run 'aws configure'"
        Write-Host "⚠️  AWS CLI not configured" -ForegroundColor Yellow
        Write-Host "   Run: aws configure" -ForegroundColor Gray
    }
} else {
    $warnings += "AWS CLI not installed (optional but recommended)"
    Write-Host "⚠️  AWS CLI not found (optional)" -ForegroundColor Yellow
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Gray
}

Write-Host ""

# Check 5: Project dependencies
Write-Host "[5/8] Checking project dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
    
    # Check package.json for required dependencies
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $requiredDeps = @("react", "@clerk/clerk-react", "aws-amplify")
    
    foreach ($dep in $requiredDeps) {
        if ($packageJson.dependencies.$dep) {
            Write-Host "✅ $dep dependency found" -ForegroundColor Green
        } else {
            $warnings += "$dep not found in dependencies"
            Write-Host "⚠️  $dep not in package.json" -ForegroundColor Yellow
        }
    }
    
    if (Test-Path "node_modules") {
        Write-Host "✅ node_modules folder exists" -ForegroundColor Green
        
        # Check size
        $size = (Get-ChildItem "node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "   Size: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
    } else {
        $warnings += "node_modules not found - run 'npm install'"
        Write-Host "⚠️  node_modules not found" -ForegroundColor Yellow
        Write-Host "   Run: npm install" -ForegroundColor Gray
    }
} else {
    $issues += "package.json not found - not in project directory?"
    Write-Host "❌ package.json not found" -ForegroundColor Red
    Write-Host "   Are you in the smack-talk-central directory?" -ForegroundColor Gray
}

Write-Host ""

# Check 6: Environment files
Write-Host "[6/8] Checking environment files..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @(
        "REACT_APP_CLERK_PUBLISHABLE_KEY",
        "REACT_APP_APPSYNC_ENDPOINT",
        "REACT_APP_APPSYNC_REGION",
        "REACT_APP_APPSYNC_API_KEY",
        "REACT_APP_API_GATEWAY_URL",
        "REACT_APP_GIPHY_API_KEY"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "✅ $var is set" -ForegroundColor Green
        } else {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        $warnings += "Missing environment variables: $($missingVars -join ', ')"
        Write-Host "⚠️  Missing variables:" -ForegroundColor Yellow
        $missingVars | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
    }
} else {
    $warnings += ".env.local file missing"
    Write-Host "⚠️  .env.local not found" -ForegroundColor Yellow
    Write-Host "   Create .env.local in project root" -ForegroundColor Gray
}

# Check for .gitignore
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match ".env.local") {
        Write-Host "✅ .env.local is in .gitignore" -ForegroundColor Green
    } else {
        $warnings += ".env.local should be in .gitignore"
        Write-Host "⚠️  Add .env.local to .gitignore" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check 7: Git configuration
Write-Host "[7/8] Checking Git configuration..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
        $gitUser = git config user.name 2>$null
        $gitEmail = git config user.email 2>$null
        
        if ($gitUser -and $gitEmail) {
            Write-Host "✅ Git configured: $gitUser <$gitEmail>" -ForegroundColor Green
        } else {
            $warnings += "Git user not configured"
            Write-Host "⚠️  Git user not configured" -ForegroundColor Yellow
            Write-Host "   Run: git config --global user.name 'Your Name'" -ForegroundColor Gray
            Write-Host "   Run: git config --global user.email 'your@email.com'" -ForegroundColor Gray
        }
        
        # Check remote
        $remote = git remote get-url origin 2>$null
        if ($remote) {
            Write-Host "✅ Git remote configured: $remote" -ForegroundColor Green
            
            # Verify it's the correct repo
            if ($remote -match "smack-talk-central") {
                Write-Host "✅ Connected to smack-talk-central repo" -ForegroundColor Green
            }
        } else {
            $warnings += "No Git remote configured"
            Write-Host "⚠️  No Git remote found" -ForegroundColor Yellow
        }
        
        # Check current branch
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        if ($branch) {
            Write-Host "✅ Current branch: $branch" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Could not check Git config" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check 8: VS Code
Write-Host "[8/8] Checking VS Code..." -ForegroundColor Yellow
if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Host "✅ VS Code CLI available" -ForegroundColor Green
    
    # Try to get version
    try {
        $codeVersion = code --version 2>$null | Select-Object -First 1
        if ($codeVersion) {
            Write-Host "   Version: $codeVersion" -ForegroundColor Gray
        }
    } catch {
        # Version check failed but code exists
    }
} else {
    $warnings += "VS Code CLI not in PATH"
    Write-Host "⚠️  VS Code CLI not found in PATH" -ForegroundColor Yellow
    Write-Host "   This is normal if you haven't added it to PATH" -ForegroundColor Gray
    Write-Host "   To add: Open VS Code → Ctrl+Shift+P → 'Shell Command: Install code in PATH'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0) {
    Write-Host "✅ No critical issues found!" -ForegroundColor Green
} else {
    Write-Host "❌ Critical Issues ($($issues.Count)):" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
}

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 Environment is fully configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm start" -ForegroundColor White
    Write-Host "2. Open: http://localhost:3000" -ForegroundColor White
    Write-Host "3. Your production app: https://main.d1wt8yp0wk81a1.amplifyapp.com" -ForegroundColor White
    Write-Host ""
} elseif ($issues.Count -eq 0) {
    Write-Host "✅ Ready to develop!" -ForegroundColor Green
    Write-Host "   Address warnings when convenient" -ForegroundColor Gray
    Write-Host ""
}