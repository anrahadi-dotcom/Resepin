$ErrorActionPreference = "Continue"
$todo = [ordered]@{
  "sayur-lodeh"      = "Sayur lodeh"
  "rendang"         = "Rendang"
  "coto-makassar"   = "Coto Makassar"
  "babi-guling"     = "Babi guling Bali"
  "ayam-betutu"     = "Ayam betutu"
  "ayam-sere-lemo"  = "Ayam lalapan"
  "ayam-bakar-bali" = "Ayam bakar"
  "lawar"           = "Lawar Bali"
  "ayam-bakar-kecap"= "Ayam bakar kecap"
  "fried-chicken"   = "Fried chicken"
  "pizza-teflon"    = "Pizza"
  "burger"          = "Burger"
  "spaghetti"       = "Spaghetti bolognese"
  "ramen"           = "Ramen"
  "sushi"           = "Sushi"
  "taco"            = "Taco"
  "pancake"         = "Pancake"
}
$out = "c:\Users\momoy\Resepin\assets\cand"
foreach ($k in $todo.Keys) {
  $q = $todo[$k]
  $done = $false
  for ($try = 1; $try -le 4 -and -not $done; $try++) {
    $u = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$([uri]::EscapeDataString($q))&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json"
    try {
      $r = Invoke-RestMethod $u -TimeoutSec 30 -Headers @{ "User-Agent" = "ResepinApp/1.0 (educational project)" }
      $pages = $r.query.pages.PSObject.Properties.Value
      $i = 0
      foreach ($p in $pages) {
        if (-not $p.imageinfo) { continue }
        $t = $p.imageinfo[0].thumburl
        if (-not $t -or $t -notmatch '\.(jpg|jpeg|png)') { continue }
        $i++
        $dest = Join-Path $out ("cand-$k-$i.jpg")
        if (Test-Path $dest) { continue }
        try {
          Invoke-WebRequest -Uri $t -OutFile $dest -TimeoutSec 30 -UseBasicParsing -Headers @{ "User-Agent" = "ResepinApp/1.0" }
          Write-Output "$k|$i|$($p.title)"
        } catch { }
        if ($i -ge 3) { break }
      }
      $done = $true
    } catch {
      Write-Output "$k|RETRY$try"
      Start-Sleep -Seconds 12
    }
  }
  Start-Sleep -Seconds 4
}
