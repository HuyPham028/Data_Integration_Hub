param(
    [string]$BackendUrl    = "http://localhost:4000/api/v1",
    [string]$AdminUser     = "admin",
    [string]$AdminPassword = "12345678",
    [string]$EC2Url        = "http://localhost:3001",
    [string]$MockToken     = "mock-secret-2026"
)

$ErrorActionPreference = "Stop"

# Step 1: Login
Write-Host "[1/3] Logging in as '$AdminUser'..." -ForegroundColor Cyan
$loginBody = '{"username":"' + $AdminUser + '","password":"' + $AdminPassword + '"}'
$loginResponse = Invoke-RestMethod -Method Post -Uri "$BackendUrl/auth/login" `
    -ContentType "application/json" -Body $loginBody

$jwt = $loginResponse.accessToken
if (-not $jwt) { Write-Error "Login failed."; exit 1 }
$headers = @{ Authorization = "Bearer $jwt"; "Content-Type" = "application/json" }
Write-Host "  Login OK." -ForegroundColor Green

# Step 2: Create/update mockServer source config
Write-Host "[2/3] Upserting mockServer source config..." -ForegroundColor Cyan

$sourceConfigBody = '{"sourceId":"mockServer","baseUrl":"' + $EC2Url + '","token":"' + $MockToken + '","isActive":true,"displayName":"EC2 Mock Server","description":"Mock server for 22 catalog tables"}'

try {
    $r = Invoke-RestMethod -Method Post -Uri "$BackendUrl/source-configs" `
        -Headers $headers -Body $sourceConfigBody
    Write-Host "  Created: mockServer -> $($r.baseUrl)" -ForegroundColor Green
} catch {
    $statusCode = $null
    if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
    Write-Host "  POST failed (HTTP $statusCode), trying PUT..." -ForegroundColor Yellow
    $r = Invoke-RestMethod -Method Put -Uri "$BackendUrl/source-configs/mockServer" `
        -Headers $headers -Body $sourceConfigBody
    Write-Host "  Updated: mockServer -> $($r.baseUrl)" -ForegroundColor Green
}

# Step 3: Upsert Schema Registry for 22 catalog tables
Write-Host "[3/3] Upserting Schema Registry for 22 catalog tables..." -ForegroundColor Cyan

$importPayload = @(
    @{ tableName="dm_chuc_danh_khoa_hoc";      primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_chuc_danh_khoa_hoc";      dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_chung_chi_ngoai_ngu";  primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_chung_chi_ngoai_ngu";  dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_doi_tuong_anqp";       primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_doi_tuong_anqp";       dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_nhom_luong";              primaryKey=@("nhomLuong"); dataFrom="mockServer"; dataFromApi="/dm_nhom_luong";              dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_trinh_do_pho_thong";      primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_trinh_do_pho_thong";      dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_vi_tri_viec_lam";         primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_vi_tri_viec_lam";         dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_doi_tuong_chinh_sach";    primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_doi_tuong_chinh_sach";    dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_chung_chi_tin_hoc";    primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_chung_chi_tin_hoc";    dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_hinh_thuc_cm";         primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_hinh_thuc_cm";         dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_van_bang_llct";        primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_van_bang_llct";        dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_ngach_cdnn";              primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_ngach_cdnn";              dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_noi_cap_cccd";            primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_noi_cap_cccd";            dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_xep_loai_chuyen_mon";     primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_xep_loai_chuyen_mon";     dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_ngoai_ngu";            primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_ngoai_ngu";            dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_loai_chuc_vu";            primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_loai_chuc_vu";            dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_loai_phu_cap";            primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_loai_phu_cap";            dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_ngan_hang";               primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_ngan_hang";               dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_chuyen_nganh_bgd";        primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_chuyen_nganh_bgd";        dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_danh_hieu_nha_nuoc";      primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_danh_hieu_nha_nuoc";      dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_chung_chi_bdnv";       primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_chung_chi_bdnv";       dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_dt_hinh_thuc_llct";       primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_dt_hinh_thuc_llct";       dataFromMethod="GET"; status="stable"; syncStrategy="upsert" },
    @{ tableName="dm_gioi_tinh_2";             primaryKey=@("ma");        dataFrom="mockServer"; dataFromApi="/dm_gioi_tinh_2";             dataFromMethod="GET"; status="stable"; syncStrategy="upsert" }
)

$importBody = $importPayload | ConvertTo-Json -Depth 5

try {
    $result = Invoke-RestMethod -Method Post -Uri "$BackendUrl/schema-registry/import" `
        -Headers $headers -Body $importBody
    Write-Host "  Status  : $($result.status)" -ForegroundColor Green
    Write-Host "  Success : $($result.successCount) / $($importPayload.Count)" -ForegroundColor Green
    if ($result.failedCount -gt 0) {
        Write-Host "  Failed  : $($result.failedCount)" -ForegroundColor Red
    }
} catch {
    Write-Error "Schema registry import failed: $_"
}

$tableList = ($importPayload | ForEach-Object { '"' + $_.tableName + '"' }) -join ","
Write-Host ""
Write-Host "Done! To sync all 22 tables:" -ForegroundColor Cyan
Write-Host "POST $BackendUrl/integration/run-custom-sync" -ForegroundColor Yellow
Write-Host ('Body: {"tables":[' + $tableList + ']}') -ForegroundColor Yellow
