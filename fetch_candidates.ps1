$ErrorActionPreference = "Stop"
$queries = [ordered]@{
  "sup-jagung"      = "Sup jagung"
  "nasi-goreng"     = "Nasi goreng"
  "tumis-kangkung"  = "Tumis kangkung"
  "tempe-orek"      = "Orek"
  "capcay"          = "Capcay"
  "soto-ayam"       = "Soto ayam"
  "tahu-bacem"      = "Tahu bacem"
  "mie-goreng"      = "Mie goreng"
  "pecel"           = "Pecel"
  "balado-telur"    = "Balado telur"
  "sayur-lodeh"     = "Sayur lodeh"
  "rendang"         = "Rendang"
  "coto-makassar"   = "Coto Makassar"
  "babi-guling"     = "Babi guling"
  "ayam-betutu"     = "Ayam betutu"
  "ayam-sere-lemo"  = "Ayam betutu Bali"
  "ayam-bakar-bali" = "Ayam bakar Bali"
  "lawar"           = "Lawar"
  "ayam-bakar-kecap"= "Ayam bakar"
  "fried-chicken"   = "Fried chicken"
  "pizza-teflon"    = "Pizza"
  "burger"          = "Burger"
  "spaghetti"       = "Spaghetti bolognese"
  "ramen"           = "Ramen"
  "sushi"           = "Sushi roll"
  "taco"            = "Tacos"
  "pancake"         = "Pancakes"
  "teriyaki"        = "Chicken teriyaki"
  "sate-lilit"      = "Sate lilit"
}
$out = "c:\Users\momoy\Resepin\assets\img"
$report = @()
foreach ($k in $queries.Keys) {
  $q = $queries[$k]
  $u = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$([uri]::EscapeDataString($q))&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json"
  try {
    $r = Invoke-RestMethod $u -TimeoutSec 30 -Headers @{ "User-Agent" = "ResepinApp/1.0 (educational project)" }
    $pages = $r.query.pages.PSObject.Properties.Value
    $i = 0
    foreach ($p in $pages) {
      if (-not $p.imageinfo) { continue }
      $t = $p.imageinfo[0].thumburl
      if (-not $t) { continue }
      # hanya gambar (jpg/png)
      if ($t -notmatch '\.(jpg|jpeg|png)') { continue }
      $i++
      $name = "$k-$i.jpg"
      $dest = Join-Path $out ("cand-" + $name)
      if (Test-Path $dest) { continue }
      try {
        Invoke-WebRequest -Uri $t -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers @{ "User-Agent" = "ResepinApp/1.0" }
        $report += "$k|$i|$($p.title)"
      } catch { }
      if ($i -ge 3) { break }
    }
  } catch { $report += "$k|ERR|$($_.Exception.Message)" }
  Start-Sleep -Milliseconds 200
}
$report | ForEach-Object { $_ }
