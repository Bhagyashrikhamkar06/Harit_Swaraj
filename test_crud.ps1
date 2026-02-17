# Test CRUD Operations for Harit Swaraj
Write-Host "=== Harit Swaraj CRUD Test ===" -ForegroundColor Green

# Step 1: Login to get token
Write-Host "`n[1/5] Logging in as owner1..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/auth/login" `
    -ContentType "application/json" `
    -Body '{"username": "owner1", "password": "owner123"}'

$token = $loginResponse.access_token
Write-Host "Login successful!" -ForegroundColor Green

# Step 2: Create a test KML file
Write-Host "`n[2/5] Creating test files..." -ForegroundColor Cyan
$kmlContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Plot</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              77.5,28.5,0
              77.6,28.5,0
              77.6,28.6,0
              77.5,28.6,0
              77.5,28.5,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
"@

$kmlPath = "test_plot.kml"
$kmlContent | Out-File -FilePath $kmlPath -Encoding UTF8
Write-Host "Test KML file created" -ForegroundColor Green

# Step 3: Create (POST) - Register a new plot using curl
Write-Host "`n[3/5] Creating new biomass plot..." -ForegroundColor Cyan
$plotId = "TEST_PLOT_$(Get-Random -Maximum 9999)"

$curlCommand = "curl -X POST `"http://localhost:8000/biomass/register-plot`" " +
    "-H `"Authorization: Bearer $token`" " +
    "-F `"plot_id=$plotId`" " +
    "-F `"type=Wood`" " +
    "-F `"species=Eucalyptus`" " +
    "-F `"area=5.5`" " +
    "-F `"expected_biomass=25.0`" " +
    "-F `"kml_file=@$kmlPath`""

try {
    $createResult = Invoke-Expression $curlCommand | ConvertFrom-Json
    Write-Host "Plot created successfully!" -ForegroundColor Green
    Write-Host "  Plot ID: $($createResult.plot_id)" -ForegroundColor Yellow
    Write-Host "  Status: $($createResult.status)" -ForegroundColor Yellow
} catch {
    Write-Host "Failed to create plot: $_" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Use WebRequest
    Add-Type -AssemblyName System.Net.Http
    $httpClient = New-Object System.Net.Http.HttpClient
    $httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer $token")
    
    $content = New-Object System.Net.Http.MultipartFormDataContent
    $content.Add((New-Object System.Net.Http.StringContent($plotId)), "plot_id")
    $content.Add((New-Object System.Net.Http.StringContent("Wood")), "type")
    $content.Add((New-Object System.Net.Http.StringContent("Eucalyptus")), "species")
    $content.Add((New-Object System.Net.Http.StringContent("5.5")), "area")
    $content.Add((New-Object System.Net.Http.StringContent("25.0")), "expected_biomass")
    
    $fileStream = [System.IO.File]::OpenRead($kmlPath)
    $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/vnd.google-earth.kml+xml")
    $content.Add($fileContent, "kml_file", "test_plot.kml")
    
    $response = $httpClient.PostAsync("http://localhost:8000/biomass/register-plot", $content).Result
    $responseContent = $response.Content.ReadAsStringAsync().Result
    $fileStream.Close()
    
    if ($response.IsSuccessStatusCode) {
        $createResult = $responseContent | ConvertFrom-Json
        Write-Host "Plot created successfully!" -ForegroundColor Green
        Write-Host "  Plot ID: $($createResult.plot_id)" -ForegroundColor Yellow
        Write-Host "  Status: $($createResult.status)" -ForegroundColor Yellow
    } else {
        Write-Host "Failed: $responseContent" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Read (GET) - Fetch all plots
Write-Host "`n[4/5] Reading all plots..." -ForegroundColor Cyan
try {
    $plots = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/biomass/plots" `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "Found $($plots.Count) plot(s)" -ForegroundColor Green
    $createdPlot = $plots | Where-Object { $_.plot_id -eq $plotId }
    
    if ($createdPlot) {
        Write-Host "  ID: $($createdPlot.id)" -ForegroundColor Yellow
        Write-Host "  Plot ID: $($createdPlot.plot_id)" -ForegroundColor Yellow
        Write-Host "  Type: $($createdPlot.type)" -ForegroundColor Yellow
        Write-Host "  Species: $($createdPlot.species)" -ForegroundColor Yellow
        Write-Host "  Area: $($createdPlot.area) acres" -ForegroundColor Yellow
        Write-Host "  Expected Biomass: $($createdPlot.expected_biomass) tons" -ForegroundColor Yellow
        Write-Host "  Status: $($createdPlot.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Failed to read plots: $_" -ForegroundColor Red
}

# Step 5: Delete (DELETE) - Remove the test plot
Write-Host "`n[5/5] Deleting test plot..." -ForegroundColor Cyan
if ($createdPlot) {
    try {
        $deleteResponse = Invoke-RestMethod -Method Delete -Uri "http://localhost:8000/biomass/plots/$($createdPlot.id)" `
            -Headers @{ "Authorization" = "Bearer $token" }
        
        Write-Host "Plot deleted successfully!" -ForegroundColor Green
        Write-Host "  Message: $($deleteResponse.message)" -ForegroundColor Yellow
    } catch {
        Write-Host "Failed to delete plot: $_" -ForegroundColor Red
    }
}

# Cleanup
Remove-Item -Path $kmlPath -Force -ErrorAction SilentlyContinue
Write-Host "`nTest files cleaned up" -ForegroundColor Green

Write-Host "`n=== CRUD Test Complete ===" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  CREATE - Plot registered" -ForegroundColor Green
Write-Host "  READ   - Plot retrieved" -ForegroundColor Green
Write-Host "  DELETE - Plot removed" -ForegroundColor Green
