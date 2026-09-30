$ErrorActionPreference = "Continue"
$out = "c:\Users\momoy\Resepin\assets\img"
$hdr = @{ "User-Agent" = "ResepinApp/1.0 (educational project)" }
$pages = [ordered]@{
  "sup-jagung"="Sup jagung"; "nasi-goreng"="Nasi goreng"; "tumis-kangkung"="Kangkung";
  "tempe-orek"="Tempe"; "capcay"="Capcay"; "soto-ayam"="Soto ayam"; "tahu-bacem"="Tahu";
  "mie-goreng"="Mie goreng"; "pecel"="Pecel"; "balado-telur"="Balado"; "sayur-lodeh"="Sayur lodeh";
  "rendang"="Rendang"; "coto-makassar"="Coto Makassar"; "babi-guling"="Babi guling";
  "ayam-betutu"="Betutu"; "ayam-bakar-bali"="Ayam bakar"; "lawar"="Lawar";
  "fried-chicken"="Fried chicken"; "pizza-teflon"="Pizza"; "burger"="Hamburger";
  "spaghetti"="Spaghetti"; "ramen"="Ramen"; "sushi"="Sushi"; "taco"="Taco";
  "pancake"="Pancake"; "teriyaki"="Teriyaki"; "sate-lilit"="Sate lilit";
  "ayam-bakar-kecap"="Ayam goreng"
}
Add-Type -AssemblyName System.Drawing
foreach ($k in $pages.Keys) {
  $slug = $pages[$k] -replace ' ', '_'
  $dest = Join-Path $out "wiki-$k.jpg"
  $got = $false
  for ($t = 1; $t -le 4 -and -not $got; $t++) {
    try {
      $r = Invoke-RestMethod "https://id.wikipedia.org/api/rest_v1/page/summary/$([uri]::EscapeDataString($slug))" -TimeoutSec 25 -Headers $hdr
      $orig = $r.originalimage.source
      if (-not $orig) { $orig = $r.thumbnail.source }
      if (-not $orig) { Write-Output "$k|NONE"; $got = $true; break }
      # ganti thumbnail 330px menjadi 1200px
      $big = $orig -replace '/\d+px-([^\/]+\.(?:jpg|jpeg|png|JPG|))$', '/1200px-$1'
      $got = $true
      try { Invoke-WebRequest -Uri $big -OutFile $dest -TimeoutSec 40 -UseBasicParsing -Headers $hdr }
      catch { Invoke-WebRequest -Uri $orig -OutFile $dest -TimeoutSec 40 -UseBasicParsing -Headers $hdr }
    } catch { if ($t -eq 4) { Write-Output "$k|ERR"; $got = $true } else { Start-Sleep -Seconds 10 } }
  }
  if (Test-Path $dest) {
    $i = [System.Drawing.Image]::FromFile($dest)
    Write-Output "$k|$($i.Width)x$($i.Height)"
    $i.Dispose()
  }
  Start-Sleep -Seconds 2
}
