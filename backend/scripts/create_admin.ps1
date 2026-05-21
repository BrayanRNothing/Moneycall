$body = @{ nombre='Administrador'; username='admin'; password='123456'; isSuperAdmin=$true } | ConvertTo-Json
try {
  $r = Invoke-RestMethod -Uri 'https://moneycall-production.up.railway.app/api/vendedores' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
  $r | ConvertTo-Json -Depth 5
} catch {
  Write-Output 'Create vendor failed:'
  if ($_.Exception.Response) {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output $sr.ReadToEnd()
  } else {
    Write-Output $_.Exception.Message
  }
}
