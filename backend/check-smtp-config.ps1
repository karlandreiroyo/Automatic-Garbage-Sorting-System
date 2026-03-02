# PowerShell script to check SMTP configuration
# Run this from the backend directory: .\check-smtp-config.ps1

Write-Host "`n[CHECK] Checking SMTP Configuration...`n" -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env file not found at: $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Reading .env file...`n" -ForegroundColor Yellow

# Read .env file
$envContent = Get-Content $envFile -Raw

# Extract SMTP values
$smtpUser = ""
$smtpPass = ""
$smtpHost = ""
$smtpPort = ""

if ($envContent -match 'SMTP_USER=(.+)') {
    $smtpUser = $matches[1].Trim()
}

if ($envContent -match 'SMTP_PASS=(.+?)(?:\r?\n|$)') {
    $smtpPass = $matches[1].Trim()
    # Remove quotes if present
    $smtpPass = $smtpPass -replace '^["'']|["'']$', ''
}

if ($envContent -match 'SMTP_HOST=(.+)') {
    $smtpHost = $matches[1].Trim()
}

if ($envContent -match 'SMTP_PORT=(.+)') {
    $smtpPort = $matches[1].Trim()
}

Write-Host "[CONFIG] Current Configuration:" -ForegroundColor Green
Write-Host "  SMTP_HOST: $smtpHost"
Write-Host "  SMTP_PORT: $smtpPort"
Write-Host "  SMTP_USER: $smtpUser"

if ($smtpPass) {
    $passLength = $smtpPass.Replace(" ", "").Length
    Write-Host "  SMTP_PASS: " -NoNewline
    Write-Host "***" -NoNewline
    Write-Host "$($smtpPass.Substring([Math]::Max(0, $smtpPass.Length - 4)))" -NoNewline
    Write-Host " (Length: $passLength characters)"
} else {
    Write-Host "  SMTP_PASS: NOT SET" -ForegroundColor Red
}

Write-Host "`n[ANALYSIS] Analysis:" -ForegroundColor Cyan

# Check password length
if ($smtpPass) {
    $passLength = $smtpPass.Replace(" ", "").Length
    if ($passLength -eq 16) {
        Write-Host "  [OK] Password length is correct (16 characters)" -ForegroundColor Green
    } elseif ($passLength -gt 16) {
        Write-Host "  [ERROR] Password is $passLength characters (should be 16)" -ForegroundColor Red
        Write-Host "     You're likely using your regular Gmail password!" -ForegroundColor Red
        Write-Host "     Generate an App Password: https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
    } else {
        Write-Host "  [WARNING] Password is $passLength characters (should be 16)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [ERROR] SMTP_PASS is not set" -ForegroundColor Red
}

# Check for placeholder values
if ($smtpUser -like "*your_*" -or $smtpUser -like "*example*") {
    Write-Host "  [ERROR] SMTP_USER contains placeholder value" -ForegroundColor Red
} else {
    Write-Host "  [OK] SMTP_USER looks valid" -ForegroundColor Green
}

if ($smtpPass -like "*your_*" -or $smtpPass -like "*password*") {
    Write-Host "  [ERROR] SMTP_PASS contains placeholder value" -ForegroundColor Red
}

# Check Gmail configuration
if ($smtpHost -eq "smtp.gmail.com") {
    Write-Host "`n[GMAIL] Gmail Configuration:" -ForegroundColor Cyan
    if ($smtpUser -like "*@gmail.com") {
        Write-Host "  [OK] SMTP_USER is a Gmail address" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] SMTP_USER is not a Gmail address" -ForegroundColor Yellow
    }
    
    if ($smtpPort -eq "587" -or $smtpPort -eq "465") {
        Write-Host "  [OK] SMTP_PORT is correct for Gmail" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] SMTP_PORT should be 587 or 465 for Gmail" -ForegroundColor Yellow
    }
}

Write-Host "`n[NEXT STEPS] Next Steps:" -ForegroundColor Cyan
if ($smtpPass -and ($smtpPass.Replace(" ", "").Length -ne 16)) {
    Write-Host "  1. Go to: https://myaccount.google.com/apppasswords" -ForegroundColor White
    Write-Host "  2. Generate a 16-character App Password" -ForegroundColor White
    Write-Host "  3. Update SMTP_PASS in backend/.env" -ForegroundColor White
    Write-Host "  4. Restart the backend server" -ForegroundColor White
} else {
    Write-Host "  [OK] Configuration looks good!" -ForegroundColor Green
    Write-Host "  If emails still fail, check:" -ForegroundColor White
    Write-Host "    - 2-Step Verification is enabled" -ForegroundColor White
    Write-Host "    - App Password matches SMTP_USER email" -ForegroundColor White
}

Write-Host ""
