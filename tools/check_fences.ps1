param([string]$FilePath)
$fc = (Select-String -Path $FilePath -Pattern '^```').Count
$lines = (Get-Content $FilePath).Count
$parity = if ($fc % 2 -eq 0) { 'EVEN-OK' } else { 'ODD-FIX' }
Write-Host "Fences=$fc parity=$parity Lines=$lines"
