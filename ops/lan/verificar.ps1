#Requires -Version 7.0
[CmdletBinding()]
param()
. (Join-Path $PSScriptRoot 'comun.ps1')
$estado = Get-Content $archivoEstado -Raw | ConvertFrom-Json
$origen = $estado.origen
$handler = [Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$clienteHttp = [Net.Http.HttpClient]::new($handler)
try {
    $http = $clienteHttp.GetAsync($origen.Replace('https://', 'http://') + '/?solicitud=31').GetAwaiter().GetResult()
    if ([int]$http.StatusCode -ne 308 -or $http.Headers.Location.AbsoluteUri -ne "$origen/?solicitud=31") {
        throw 'El acceso IP:puerto no redirige al protocolo seguro.'
    }
    $http.Dispose()
} finally { $clienteHttp.Dispose() }
$descubrimiento = Invoke-RestMethod "$origen/auth/realms/gestoria/.well-known/openid-configuration"
if ($descubrimiento.issuer -ne "$origen/auth/realms/gestoria") { throw 'Emisor OIDC incorrecto.' }
foreach ($campo in 'authorization_endpoint', 'token_endpoint', 'jwks_uri', 'end_session_endpoint') {
    if (-not $descubrimiento.$campo.StartsWith("$origen/auth/realms/gestoria/")) {
        throw "La URL $campo no utiliza el proxy HTTPS público."
    }
}
$pagina = Invoke-WebRequest $origen
if ($pagina.StatusCode -ne 200 -or $pagina.Content -notmatch '<app-root>') { throw 'No se sirve Angular.' }
$configuracion = (Invoke-WebRequest "$origen/config.js").Content
if (-not $configuracion.Contains("$origen/auth")) { throw 'Angular no utiliza el emisor LAN.' }
foreach ($ruta in '/auth/admin/', '/auth/realms/master/', '/auth/health', '/auth/metrics') {
    $respuesta = Invoke-WebRequest "$origen$ruta" -SkipHttpErrorCheck
    if ($respuesta.StatusCode -ne 404) { throw "Ruta interna expuesta: $ruta" }
}
$sinSesion = Invoke-WebRequest "$origen/api/clientes" -SkipHttpErrorCheck
if ($sinSesion.StatusCode -notin 401, 403) { throw 'La API debe exigir una sesión.' }
foreach ($ruta in '/api/clientes', '/config.js', '/auth/realms/gestoria/') {
    $respuesta = Invoke-WebRequest "$($estado.certificado)$ruta" -SkipHttpErrorCheck
    if ($respuesta.StatusCode -ne 404) { throw "La página HTTP publica contenido de la aplicación: $ruta" }
}
$certificado = Invoke-WebRequest "$($estado.certificado)/savia-local-ca.crt"
$huellaDescarga = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([byte[]]$certificado.Content))
if ($huellaDescarga -ne $estado.huellaCa) { throw 'El certificado descargable no coincide con la CA local.' }
Write-Host 'Correcto: TLS validado, Angular, URLs OIDC, API protegida, rutas internas bloqueadas y certificado público.'
