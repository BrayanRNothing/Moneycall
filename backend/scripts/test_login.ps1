$body = @{ username='admin'; password='123456' } | ConvertTo-Json
try {
  $l = Invoke-RestMethod -Uri 'https://moneycall-production.up.railway.app/api/login' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
  $l | ConvertTo-Json -Depth 5
} catch {
  Write-Output 'Login failed:'
  if ($_.Exception.Response) {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output $sr.ReadToEnd()
  } else {
    Write-Output $_.Exception.Message
  }
}
