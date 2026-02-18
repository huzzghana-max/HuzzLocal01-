#!/usr/bin/env pwsh
# Quick Start Script for Huzz Project
# Usage: .\start.ps1

Write-Host "🚀 Starting Huzz Application..." -ForegroundColor Green
Write-Host ""

# Kill any existing node processes
Write-Host "🧹 Cleaning up any existing processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Check if MySQL is running
Write-Host "📊 Checking MySQL connection..." -ForegroundColor Yellow
$mysqlCheck = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
if ($mysqlCheck.TcpTestSucceeded) {
    Write-Host "✅ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL might not be running on port 3306" -ForegroundColor Red
    Write-Host "   Please start MySQL before continuing" -ForegroundColor Yellow
    Read-Host "Press Enter to continue anyway..."
}

Write-Host ""
Write-Host "=" * 50
Write-Host "Starting Backend Server (Port 5000)" -ForegroundColor Cyan
Write-Host "=" * 50

# Start backend in a new window
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\JOE\Desktop\reactpro\huzz\server'; npm start" -PassThru
Write-Host "✅ Backend starting in new window (PID: $($backendProcess.Id))" -ForegroundColor Green

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=" * 50
Write-Host "Starting Frontend Server (Port 5173)" -ForegroundColor Cyan
Write-Host "=" * 50

# Start frontend in a new window
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\JOE\Desktop\reactpro\huzz'; npm run dev" -PassThru
Write-Host "✅ Frontend starting in new window (PID: $($frontendProcess.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "=" * 50
Write-Host "🎉 Application Started!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host ""
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Login Credentials:" -ForegroundColor Yellow
Write-Host "   Email:    root@admin.com" -ForegroundColor White
Write-Host "   Password: root123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Open browser to http://localhost:5173" -ForegroundColor Gray
Write-Host "   - Click 'Sign In'" -ForegroundColor Gray
Write-Host "   - Enter credentials above" -ForegroundColor Gray
Write-Host "   - Check console (F12) if issues occur" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 To stop all servers:" -ForegroundColor Yellow
Write-Host "   1. Close both PowerShell windows" -ForegroundColor Gray
Write-Host "   2. Or run: taskkill /F /IM node.exe" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
