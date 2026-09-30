$ErrorActionPreference = "Continue"
$out = "c:\Users\momoy\Resepin\assets\img"
$hdr = @{ "User-Agent" = "ResepinApp/1.0 (educational project)" }
$pages = [ordered]@{
  "sushi"           = "Sushi"
  "taco"            = "Taco"
  "pancake"         = "Pancake"
  "teriyaki"        = "Teriyaki"
  "sate-lilit"      = "Sate lilit"
  "ayam-bakar-kecap"= "Ayam goreng"
  "ayam-sere-lemo"  = "Ayam sisit"
  "sup-jagung"      = "Sup jagung"
  "ayam-betutu"     = "Betutu"
}
foreach ($k in $pages.Keys) {
  $slug = $pages[$k] -replace ' ', '_'
  $api = "https://id.wikipedia.org/api/rest_v1/page/summary/$([uri]::EscapeDataString($slug))"
  $dest = Join-Path $out "wiki-$k.jpg"
  for ($t = 1; $t -le 3; $t++) {
    try {
      $r = Invoke-RestMethod $api -TimeoutSec 25 -Headers $hdr
      $src = $r.thumbnail.source
      if (-not $src) { Write-Output "$k|NONE"; break }
      $big = $src -replace '/\d+px-', '/1000px-'
      try { Invoke-WebRequest -Uri $big -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers $hdr } catch { Invoke-WebRequest -Uri $src -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers $hdr }
      Write-Output "$k|OK|$((Get-Item $dest).Length)"
      break
    } catch { if ($t -eq 3) { Write-Output "$k|ERR" }; Start-Sleep -Seconds 8 }
  }
  Start-Sleep -Seconds 2
}
