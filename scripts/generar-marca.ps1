# Vector assets; the application does not depend on fonts installed on the host.
Add-Type -AssemblyName System.Drawing
$projectPath = Split-Path -Parent $PSScriptRoot
$glyphs = [Drawing.Drawing2D.GraphicsPath]::new()
$family = [Drawing.FontFamily]::new('Segoe UI Semibold')
$glyphs.AddString('savia', $family, 0, 42, [Drawing.PointF]::new(0,0), [Drawing.StringFormat]::GenericTypographic)
$bounds = $glyphs.GetBounds()
$matrix = [Drawing.Drawing2D.Matrix]::new()
$matrix.Translate(58-$bounds.X, 8-$bounds.Y)
$glyphs.Transform($matrix)
$points = $glyphs.PathPoints; $types = $glyphs.PathTypes
$path = [Text.StringBuilder]::new()
$culture = [Globalization.CultureInfo]::InvariantCulture
function Format-Point($point) { $point.X.ToString('0.###',$culture)+','+$point.Y.ToString('0.###',$culture) }
for($index=0;$index -lt $points.Length;$index++) {
  $type = $types[$index] -band 7
  if($type -eq 0) { [void]$path.Append('M'+(Format-Point $points[$index])) }
  elseif($type -eq 1) { [void]$path.Append('L'+(Format-Point $points[$index])) }
  elseif($type -eq 3) {
    [void]$path.Append('C'+(Format-Point $points[$index])+' '+(Format-Point $points[$index+1])+' '+(Format-Point $points[$index+2]))
    $index+=2
  }
  if($types[$index] -band 128) { [void]$path.Append('Z') }
}
$symbol = '<rect x="2" y="2" width="44" height="44" rx="13" fill="#536BFF"/><path d="M31 14H21C12 14 12 23 21 24L27 25C36 26 36 35 27 35H17" stroke="white" stroke-width="5.5" stroke-linecap="round" fill="none"/>'
$publicPath = Join-Path $projectPath 'public'
$themePath = Join-Path $projectPath 'keycloak-theme/savia/login/resources/img'
$assets = @{
  'savia-logo-v4.svg' = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">'+$symbol+'<path d="'+$path.ToString()+'" fill="#182740"/></svg>'
  'savia-logo-light-v4.svg' = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">'+$symbol+'<path d="'+$path.ToString()+'" fill="#F4F7FF"/></svg>'
  'savia-symbol-v4.svg' = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'+$symbol+'</svg>'
  'savia-flow-v4.svg' = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 560" fill="none"><defs><linearGradient id="r" x1="120" y1="100" x2="400" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#BAC6FF"/><stop offset=".55" stop-color="#718AFF"/><stop offset="1" stop-color="#4661EC"/></linearGradient></defs><rect x="64" y="84" width="392" height="392" rx="100" stroke="#A2B4EF" stroke-opacity=".12" transform="rotate(-12 260 280)"/><rect x="72" y="92" width="376" height="376" rx="96" fill="#1B2B4B" stroke="#738BD2" stroke-opacity=".2"/><path d="M320 180H230C141 180 141 270 230 280L290 290C379 300 379 390 290 390H190" stroke="url(#r)" stroke-width="54" stroke-linecap="round"/><circle cx="75" cy="120" r="5" fill="#8C9DF4"/><circle cx="442" cy="445" r="5" fill="#8C9DF4"/></svg>'
}
foreach($asset in $assets.GetEnumerator()) {
  [IO.File]::WriteAllText((Join-Path $publicPath $asset.Key), $asset.Value, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText((Join-Path $themePath $asset.Key), $asset.Value, [Text.UTF8Encoding]::new($false))
}
$glyphs.Dispose(); $family.Dispose(); $matrix.Dispose()
