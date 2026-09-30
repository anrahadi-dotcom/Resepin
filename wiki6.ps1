$ErrorActionPreference = "Continue"
$out = "c:\Users\momoy\Resepin\assets\img"
$hdr = @{ "User-Agent" = "ResepinApp/1.0 (educational project)" }
Add-Type -AssemblyName System.Drawing

$all = [ordered]@{
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

# Lewati yang sudah >= 900px
$todo = @{}
foreach ($k in $all.Keys) {
  $dest = Join-Path $out "wiki-$k.jpg"
  $w = 0
  if (Test-Path $dest) { try { $i=[System.Drawing.Image]::FromFile($dest); $w=$i.Width; $i.Dispose() } catch {} }
  if ($w -lt 900) { $todo[$k] = $all[$k] }
}
Write-Output "TODO: $($todo.Count)"

foreach ($k in $todo.Keys) {
  $slug = $todo[$k] -replace ' ', '_'
  $dest = Join-Path $out "wiki-$k.jpg"
  for ($t = 1; $t -le 5; $t++) {
    try {
      $r = Invoke-RestMethod "https://id.wikipedia.org/api/rest_v1/page/summary/$([uri]::EscapeDataString($slug))" -TimeoutSec 25 -Headers $hdr
      $orig = $r.originalimage.source
      if (-not $orig) { $orig = $r.thumbnail.source }
      if ($orig) {
        $big = $orig -replace '/\d+px-([^\/]+\.(?:jpg|jpeg|png|JPG|JPEG|PNG))$', '/1400px-$1'
        try { Invoke-WebRequest -Uri $big -OutFile $dest -TimeoutSec 40 -UseBasicParsing -Headers $hdr }
        catch { Invoke-WebRequest -Uri $orig -OutFile $dest -TimeoutSec 40 -UseBasicParsing -Headers $hdr }
      }
      break
    } catch { if ($t -eq 5) { Write-Output "$k|ERR" }; Start-Sleep -Seconds 12 }
  }
  if (Test-Path $dest) { try { $i=[System.Drawing.Image]::FromFile($dest); Write-Output "$k|$($i.Width)x$($i.Height)"; $i.Dispose() } catch { Write-Output "$k|BAD" } }
  Start-Sleep -Seconds 3
}
Write-Output "DONE"
