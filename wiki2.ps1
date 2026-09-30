$ErrorActionPreference = "Continue"
$out = "c:\Users\momoy\Resepin\assets\img"
$hdr = @{ "User-Agent" = "ResepinApp/1.0 (educational project; contact: local)" }

# URL sudah diketahui dari hasil query sebelumnya
$known = [ordered]@{
  "soto-ayam"   = "https://upload.wikimedia.org/wikipedia/commons/0/05/Soto_ayam.JPG"
  "pecel"       = "https://upload.wikimedia.org/wikipedia/commons/e/e8/Pecel_Hariadhi.JPG"
  "sayur-lodeh" = "https://upload.wikimedia.org/wikipedia/commons/1/1a/Sayur_lodeh.JPG"
  "nasi-goreng" = "https://upload.wikimedia.org/wikipedia/commons/c/c3/Koh_Mak%2C_Thailand%2C_Fried_rice_with_seafood%2C_Thai_fried_rice.jpg"
}

foreach ($k in $known.Keys) {
  $dest = Join-Path $out "wiki-$k.jpg"
  for ($t = 1; $t -le 5; $t++) {
    try {
      Invoke-WebRequest -Uri $known[$k] -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers $hdr
      Write-Output "$k|OK|$((Get-Item $dest).Length)"
      break
    } catch {
      Write-Output "$k|retry$t"
      Start-Sleep -Seconds 20
    }
  }
  Start-Sleep -Seconds 8
}
