$ErrorActionPreference = "Continue"
$titles = [ordered]@{
  "sup-jagung"     = "Sup jagung"
  "nasi-goreng"    = "Nasi goreng"
  "tempe-orek"     = "Tempe orek"
  "capcay"         = "Capcay"
  "soto-ayam"      = "Soto ayam"
  "tahu-bacem"     = "Tahu"
  "mie-goreng"     = "Mie goreng"
  "pecel"          = "Pecel"
  "balado-telur"   = "Balado"
  "sayur-lodeh"    = "Sayur lodeh"
  "coto-makassar"  = "Coto Makassar"
  "tumis-kangkung" = "Kangkung"
}
$out = "c:\Users\momoy\Resepin\assets\img"
$hdr = @{ "User-Agent" = "ResepinApp/1.0 (educational project)" }
foreach ($k in $titles.Keys) {
  $t = $titles[$k]
  $u = "https://id.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&titles=$([uri]::EscapeDataString($t))&format=json"
  try {
    $r = Invoke-RestMethod $u -TimeoutSec 25 -Headers $hdr
    $p = $r.query.pages.PSObject.Properties.Value
    $src = $p.original.source
    if ($src) {
      $dest = Join-Path $out "wiki-$k.jpg"
      Invoke-WebRequest -Uri $src -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers $hdr
      Write-Output "$k|OK|$src"
    } else { Write-Output "$k|NONE" }
  } catch { Write-Output "$k|ERR|$($_.Exception.Message)" }
  Start-Sleep -Milliseconds 600
}
