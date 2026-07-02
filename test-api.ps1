# Test API Script - Huzz Backend

$apiUrl = "https://huzzgh.onrender.com/api"

# Step 1: Register a provider user
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "1. REGISTERING USER" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$registerBody = @{
    name = "John Smith Provider"
    email = "john.smith@huzz.app"
    password = "TestPassword123!"
    role = "provider"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$apiUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "✓ User registered successfully" -ForegroundColor Green
    Write-Host "  Email: $($registerData.user.email)"
    Write-Host "  User ID: $($registerData.user.id)"
    Write-Host "  Role: $($registerData.user.role)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "User already exists (409)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Registration error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 2: Login
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "2. LOGGING IN" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$loginBody = @{
    email = "john.smith@huzz.app"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$apiUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    $userId = $loginData.user.id
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 30))..."
    Write-Host "  User ID: $userId"
} catch {
    Write-Host "✗ Login error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 3: Create a service
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "3. CREATING SERVICE" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$serviceBody = @{
    title = "Professional Photography Services"
    description = "Professional event and portrait photography with 10 years of experience"
    category = "Photography"
    price = 500
    duration = "4 hours"
    phone = "+233244123456"
    location = "Accra, Ghana"
    latitude = 5.6037
    longitude = -0.1870
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $serviceResponse = Invoke-WebRequest -Uri "$apiUrl/vendor/services" -Method POST -Headers $headers -Body $serviceBody
    $serviceData = $serviceResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ Service created successfully" -ForegroundColor Green
    Write-Host "  Service ID: $($serviceData.serviceId)"
    Write-Host "  Title: $($serviceData.title)"
    Write-Host "  Status: $($serviceData.status)"
} catch {
    Write-Host "✗ Service creation error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Query approved services
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "4. QUERYING APPROVED SERVICES" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

try {
    $servicesResponse = Invoke-WebRequest -Uri "$apiUrl/approved-services" -Method GET
    $services = $servicesResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ Query successful" -ForegroundColor Green
    Write-Host "  Total approved services: $($services.Count)"
    
    if ($services.Count -gt 0) {
        Write-Host "`nServices:" -ForegroundColor Cyan
        $services | ForEach-Object {
            Write-Host "  - Title: $($_.title)"
            Write-Host "    Provider: $($_.provider_name)"
            Write-Host "    Price: GHS $($_.price)"
            Write-Host "    Category: $($_.category)"
            Write-Host ""
        }
    }
} catch {
    Write-Host "✗ Query error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "API TEST COMPLETE" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
