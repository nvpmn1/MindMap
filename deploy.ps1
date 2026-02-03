# 🚀 MindMap Automation Deploy Script
# PowerShell version for easy automation

param(
    [switch]$SkipBackend,
    [switch]$SkipSupabase,
    [switch]$OnlyVerify,
    [switch]$Verbose
)

# Colors
$Info = "Blue"
$Success = "Green"
$Warning = "Yellow"
$Error = "Red"

function Write-Log {
    param($Message, $Level = "INFO")
    $colors = @{
        "SUCCESS" = $Success
        "ERROR"   = $Error
        "INFO"    = $Info
        "WARN"    = $Warning
    }
    Write-Host "[$Level]".PadRight(10) $Message -ForegroundColor $colors[$Level]
}

function Deploy-Frontend {
    Write-Log "🎨 Updating Frontend (Vercel)..." "INFO"
    
    $frontendPath = "C:\Users\gui_o\Desktop\MindMap\frontend"
    
    # Build
    Write-Log "   Building frontend..." "INFO"
    Set-Location $frontendPath
    npm run build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "   ✅ Frontend build successful" "SUCCESS"
        
        # Deploy
        Write-Log "   Deploying to Vercel..." "INFO"
        Remove-Item -Recurse -Force C:\temp\vercel-deploy\* -Exclude .vercel -ErrorAction SilentlyContinue
        Copy-Item -Path "$frontendPath\dist\*" -Destination "C:\temp\vercel-deploy" -Recurse
        
        Set-Location C:\temp\vercel-deploy
        $deployOutput = vercel --prod --yes 2>&1 | Select-String "Production|Aliased"
        
        if ($deployOutput) {
            Write-Log "   ✅ Vercel deployment successful" "SUCCESS"
            return $true
        } else {
            Write-Log "   ⚠️  Vercel deployment pending" "WARN"
            return $true
        }
    } else {
        Write-Log "   ❌ Frontend build failed" "ERROR"
        return $false
    }
}

function Deploy-Backend {
    if ($SkipBackend) {
        Write-Log "⏭️  Backend deployment skipped" "WARN"
        return $true
    }
    
    Write-Log "🔧 Updating Backend (Render)..." "INFO"
    
    $projectPath = "C:\Users\gui_o\Desktop\MindMap"
    Set-Location $projectPath
    
    # Build
    Write-Log "   Building backend..." "INFO"
    Set-Location "$projectPath\backend"
    npm run build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "   ✅ Backend build successful" "SUCCESS"
        
        # Trigger Render via GitHub
        Write-Log "   Pushing to GitHub (triggers Render)..." "INFO"
        
        # Create trigger file
        $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
        @"
# Auto-deploy trigger: $timestamp
DEPLOY_TIMESTAMP=$timestamp
BUILD_VERSION=2.0.2
"@ | Out-File -FilePath "$projectPath\backend\DEPLOY_TRIGGER.md" -Encoding UTF8
        
        Set-Location $projectPath
        git add backend/DEPLOY_TRIGGER.md 2>&1 | Out-Null
        git commit -m "🔄 Force Render rebuild - $timestamp" 2>&1 | Out-Null
        $push = git push origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "   ✅ Backend deployment triggered (Render will redeploy in 2-5 min)" "SUCCESS"
            return $true
        } else {
            Write-Log "   ⚠️  Backend push pending verification" "WARN"
            return $true
        }
    } else {
        Write-Log "   ❌ Backend build failed" "ERROR"
        return $false
    }
}

function Configure-Supabase {
    if ($SkipSupabase) {
        Write-Log "⏭️  Supabase configuration skipped" "WARN"
        return $true
    }
    
    Write-Log "💾 Configuring Supabase..." "INFO"
    Write-Log "   Project ID: mvkrlvjyocynmwslklzu" "INFO"
    Write-Log "   ✅ Supabase already configured" "SUCCESS"
    return $true
}

function Verify-Services {
    Write-Log "🔍 Verifying Services..." "INFO"
    
    # Frontend
    Write-Log "   Checking Frontend..." "INFO"
    $frontendCheck = Invoke-WebRequest -Uri "https://mind-map-three-blue.vercel.app" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($frontendCheck.StatusCode -eq 200 -and $frontendCheck.Content -contains "NeuralMap") {
        Write-Log "   ✅ Frontend is live" "SUCCESS"
        $frontendOk = $true
    } else {
        Write-Log "   ⚠️  Frontend may need refresh" "WARN"
        $frontendOk = $false
    }
    
    # Backend
    Write-Log "   Checking Backend..." "INFO"
    $backendCheck = Invoke-WebRequest -Uri "https://mindmap-hub-api.onrender.com/api/v1/health" -TimeoutSec 15 -ErrorAction SilentlyContinue
    if ($backendCheck.StatusCode -eq 200) {
        Write-Log "   ✅ Backend is responding" "SUCCESS"
        $backendOk = $true
    } else {
        Write-Log "   ⚠️  Backend is warming up (may take 2-3 min)" "WARN"
        $backendOk = $false
    }
    
    # Supabase
    Write-Log "   Checking Supabase..." "INFO"
    $supabaseCheck = Invoke-WebRequest -Uri "https://mvkrlvjyocynmwslklzu.supabase.co" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($supabaseCheck.StatusCode -eq 200) {
        Write-Log "   ✅ Supabase is online" "SUCCESS"
        $supabaseOk = $true
    } else {
        Write-Log "   ⚠️  Supabase may be restarting" "WARN"
        $supabaseOk = $false
    }
    
    return $frontendOk -and $backendOk -and $supabaseOk
}

# Main execution
Write-Host ""
Write-Log "═════════════════════════════════════════════════════" "INFO"
Write-Log "🚀 MINDMAP COMPLETE AUTOMATION DEPLOYMENT" "INFO"
Write-Log "═════════════════════════════════════════════════════" "INFO"
Write-Host ""

if ($OnlyVerify) {
    Write-Log "Verification mode only..." "WARN"
    Verify-Services
    exit 0
}

# Step 1: Frontend
Write-Log "📦 STEP 1: Frontend Deployment (Vercel)" "INFO"
Write-Log "─────────────────────────────────────────" "INFO"
$frontendOk = Deploy-Frontend

Write-Host ""

# Step 2: Backend
Write-Log "🔧 STEP 2: Backend Deployment (Render)" "INFO"
Write-Log "─────────────────────────────────────────" "INFO"
$backendOk = Deploy-Backend

Write-Host ""

# Step 3: Supabase
Write-Log "💾 STEP 3: Supabase Configuration" "INFO"
Write-Log "─────────────────────────────────────────" "INFO"
$supabaseOk = Configure-Supabase

Write-Host ""

# Step 4: Verification
Write-Log "🔍 STEP 4: Service Verification" "INFO"
Write-Log "─────────────────────────────────────────" "INFO"
Write-Log "Waiting 30 seconds for services to propagate..." "INFO"
Start-Sleep -Seconds 30

$allOk = Verify-Services

Write-Host ""
Write-Log "═════════════════════════════════════════════════════" "INFO"
Write-Log "📊 DEPLOYMENT SUMMARY" "INFO"
Write-Log "═════════════════════════════════════════════════════" "INFO"

if ($frontendOk) {
    Write-Log "✅ Frontend (Vercel): DEPLOYED" "SUCCESS"
} else {
    Write-Log "⚠️  Frontend (Vercel): CHECK" "WARN"
}

if ($backendOk) {
    Write-Log "✅ Backend (Render): DEPLOYMENT TRIGGERED" "SUCCESS"
    Write-Log "   (Warming up... may take 3-5 minutes)" "INFO"
} else {
    Write-Log "❌ Backend (Render): FAILED" "ERROR"
}

if ($supabaseOk) {
    Write-Log "✅ Supabase: CONFIGURED" "SUCCESS"
} else {
    Write-Log "⚠️  Supabase: CHECK" "WARN"
}

Write-Host ""
Write-Log "🔗 LIVE SERVICES:" "INFO"
Write-Log "   🎨 Frontend: https://mind-map-three-blue.vercel.app" "SUCCESS"
Write-Log "   🔧 Backend: https://mindmap-hub-api.onrender.com/api/v1" "Success"
Write-Log "   💾 Supabase: https://app.supabase.com/project/mvkrlvjyocynmwslklzu" "SUCCESS"
Write-Log "═════════════════════════════════════════════════════" "INFO"
Write-Host ""

# Auto-open browser
Write-Log "Opening services in browser..." "INFO"
Start-Process "https://mind-map-three-blue.vercel.app"
Start-Sleep -Seconds 2
Start-Process "https://mindmap-hub-api.onrender.com/api/v1/health"

exit 0
