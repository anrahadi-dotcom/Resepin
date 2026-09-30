$ErrorActionPreference = "Continue"
$out = "c:\Users\momoy\Resepin\assets\img"
$hdr = @{ "User-Agent" = "ResepinApp/1.0 (educational project)" }

# slug -> judul halaman Wikipedia Indonesia
$pages = [ordered]@{
  "sup-jagung"     = "Sup jagung"
  "nasi-goreng"    = "Nasi goreng"
  "tumis-kangkung" = "Kangkung"
  "tempe-orek"     = "Tempe"
  "capcay"         = "Capcay"
  "soto-ayam"      = "Soto ayam"
  "tahu-bacem"     = "Tahu"
  "mie-goreng"     = "Mie goreng"
  "pecel"          = "Pecel"
  "balado-telur"   = "Balado"
  "sayur-lodeh"    = "Sayur lodeh"
  "rendang"        = "Rendang"
  "coto-makassar"  = "Coto Makassar"
  "babi-guling"    = "Babi guling"
  "ayam-betutu"    = "Ayam betutu"
  "ayam-bakar-bali"= "Ayam bakar"
  "lawar"          = "Lawar"
  "fried-chicken"  = "Fried chicken"
  "pizza-teflon"   = "Pizza"
  "burger"         = "Hamburger"
  "spaghetti"      = "Spaghetti"
  "ramen"          = "Ramen"
  "sushi"          = "Sushi"
  "taco"           = "Taco"
  "pancake"        = "Pancake"
  "teriyaki"       = "Teriyaki"
  "sate-lilit"     = "Sate lilit"
  "ayam-bakar-kecap" = "Ayam goreng"
  "ayam-sere-lemo" = "Ayam sisit"
}

foreach ($k in $pages.Keys) {
  $slug = $pages[$k] -replace ' ', '_'
  $api = "https://id.wikipedia.org/api/rest_v1/page/summary/$([uri]::EscapeDataString($slug))"
  $dest = Join-Path $out "wiki-$k.jpg"
  $ok = $false
  for ($t = 1; $t -le 3 -and -not $ok; $t++) {
    try {
      $r = Invoke-RestMethod $api -TimeoutSec 25 -Headers $hdr
      $src = $r.thumbnail.source
      if (-not $src) { Write-Output "$k|NONE"; $ok = $true; break }
      # naikkan ukuran thumbnail
      $big = $src -replace '/\d+px-', '/1000px-'
      try { Invoke-WebRequest -Uri $big -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers $hdr } catch { Invoke-WebRequest -Uri $src -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers $hdr }
      Write-Output "$k|OK|$((Get-Item $dest).Length)"
      $ok = $true
    } catch {
      if ($t -eq 3) { Write-Output "$k|ERR" }
      Start-Sleep -Seconds 8
    }
  }
  Start-Sleep -Seconds 2
}
