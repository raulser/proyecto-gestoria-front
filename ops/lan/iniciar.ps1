#Requires -Version 7.0
[CmdletBinding()]
param(
    [string] $Ip,
    [ValidateRange(1024, 65535)][int] $Puerto = 8090,
    [ValidateRange(1024, 65535)][int] $PuertoCertificado = 8092,
    [switch] $ConfigurarFirewall
)
. (Join-Path $PSScriptRoot 'comun.ps1')
if ($ConfigurarFirewall) { Assert-SaviaAdministrador }
if ($Puerto -eq $PuertoCertificado) { throw 'Los dos puertos deben ser diferentes.' }
if (-not $Ip) {
    $ruta = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' |
        Sort-Object RouteMetric | Select-Object -First 1
    if (-not $ruta) { throw 'No hay conexión a la red local.' }
    $Ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $ruta.InterfaceIndex |
        Where-Object { $_.AddressState -eq 'Preferred' } | Select-Object -First 1).IPAddress
}
$direccion = [Net.IPAddress]::Parse($Ip)
if ($direccion.AddressFamily -ne 'InterNetwork' -or
    $Ip -notmatch '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)') {
    throw 'Usa la IPv4 privada del PC en la red local.'
}
$adaptador = Get-NetIPAddress -AddressFamily IPv4 -IPAddress $Ip
$origen = "https://${Ip}:$Puerto"
$estadoAnterior = if (Test-Path $archivoEstado) { Get-Content $archivoEstado -Raw | ConvertFrom-Json } else { $null }

New-Item -ItemType Directory -Path $directorioLan -Force | Out-Null
# Los PEM privados quedan fuera del repositorio y con permisos solo para este usuario y el sistema.
$sidUsuario = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls $directorioLan /inheritance:r /grant:r "*${sidUsuario}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron restringir los permisos de storage/lan.' }
New-Item -ItemType Directory -Path (Join-Path $directorioLan 'tls'), (Join-Path $directorioLan 'public') -Force | Out-Null

$archivoCa = Join-Path $directorioLan 'ca.json'
$ca = $null
if (Test-Path $archivoCa) {
    $metadatosCa = Get-Content $archivoCa -Raw | ConvertFrom-Json
    $ca = Get-Item "Cert:/CurrentUser/My/$($metadatosCa.thumbprint)" -ErrorAction SilentlyContinue
}
if (-not $ca -or $ca.NotAfter -lt (Get-Date).AddDays(30)) {
    $ca = New-SelfSignedCertificate -Type Custom -Subject 'CN=Savia LAN desarrollo' -FriendlyName 'Savia LAN desarrollo (CA local)' `
        -CertStoreLocation Cert:/CurrentUser/My -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 `
        -KeyExportPolicy NonExportable -KeyUsage CertSign,CRLSign -NotAfter (Get-Date).AddYears(2) `
        -TextExtension @('2.5.29.19={critical}{text}ca=TRUE&pathlength=0')
    @{ thumbprint = $ca.Thumbprint } | ConvertTo-Json | Set-Content $archivoCa -Encoding utf8NoBOM
}
$archivoCert = Join-Path $directorioLan 'tls/server.crt'
$archivoClave = Join-Path $directorioLan 'tls/server.key'
$renovar = -not (Test-Path $archivoCert) -or -not (Test-Path $archivoClave) -or
    -not $estadoAnterior -or $estadoAnterior.ip -ne $Ip -or
    -not $estadoAnterior.PSObject.Properties['caThumbprint'] -or $estadoAnterior.caThumbprint -ne $ca.Thumbprint
if (-not $renovar) {
    $existente = [Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPemFile($archivoCert, $archivoClave)
    $renovar = $existente.NotAfter -lt (Get-Date).AddDays(7) -or $existente.Issuer -ne $ca.Subject
    $existente.Dispose()
}
if ($renovar) {
    $servidor = New-SelfSignedCertificate -Type Custom -Subject "CN=$Ip" -FriendlyName "Savia LAN $Ip" `
        -Signer $ca -CertStoreLocation Cert:/CurrentUser/My -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
        -KeyExportPolicy Exportable -KeyUsage DigitalSignature,KeyEncipherment -NotAfter (Get-Date).AddMonths(6) `
        -TextExtension @("2.5.29.17={text}IPAddress=$Ip&DNS=localhost&IPAddress=127.0.0.1", '2.5.29.37={text}1.3.6.1.5.5.7.3.1', '2.5.29.19={critical}{text}ca=FALSE')
    $clave = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($servidor)
    try {
        [IO.File]::WriteAllText($archivoClave, $clave.ExportPkcs8PrivateKeyPem(), [Text.Encoding]::ASCII)
        [IO.File]::WriteAllText($archivoCert, $servidor.ExportCertificatePem(), [Text.Encoding]::ASCII)
    } finally { $clave.Dispose() }
    # Nginx utiliza la copia PEM protegida; no se necesita otra clave exportable en el almacén.
    Remove-Item -LiteralPath "Cert:/CurrentUser/My/$($servidor.Thumbprint)"
}
$archivoCaPublica = Join-Path $directorioLan 'public/savia-local-ca.crt'
Export-Certificate -Cert $ca -FilePath $archivoCaPublica -Type CERT -Force | Out-Null
if (-not (Test-Path "Cert:/CurrentUser/Root/$($ca.Thumbprint)")) {
    & certutil -user -f -addstore Root $archivoCaPublica | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar la CA local en el usuario de Windows.' }
}
$huellaCa = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($ca.RawData))
$rutaNormalizada = $directorioLan.Replace('\', '/')
@"
SAVIA_LAN_IP=$Ip
SAVIA_LAN_HTTPS_PORT=$Puerto
SAVIA_LAN_SETUP_PORT=$PuertoCertificado
SAVIA_LAN_ROOT=$rutaNormalizada
KEYCLOAK_PUBLIC_URL=$origen/auth
GESTORIA_WEB_URL=$origen
CORS_ALLOWED_ORIGINS=http://localhost:8090,http://localhost:4200,$origen
"@ | Set-Content $archivoEntorno -Encoding utf8NoBOM

$plantilla = Get-Content (Join-Path $PSScriptRoot 'android.html') -Raw
$plantilla.Replace('{{ORIGEN}}', $origen).Replace('{{HUELLA}}', $huellaCa) |
    Set-Content (Join-Path $directorioLan 'public/index.html') -Encoding utf8NoBOM

if ($ConfigurarFirewall) {
    foreach ($regla in @(@{nombre='Savia-LAN-HTTPS'; puerto=$Puerto}, @{nombre='Savia-LAN-Certificado'; puerto=$PuertoCertificado})) {
        Get-NetFirewallRule -Name $regla.nombre -ErrorAction SilentlyContinue | Remove-NetFirewallRule
        New-NetFirewallRule -Name $regla.nombre -DisplayName $regla.nombre -Group 'Savia LAN desarrollo' `
            -Direction Inbound -Action Allow -Protocol TCP -LocalPort $regla.puerto -LocalAddress $Ip `
            -RemoteAddress LocalSubnet -InterfaceAlias $adaptador.InterfaceAlias -Profile Any | Out-Null
    }
}
Invoke-SaviaCompose -Argumentos @('config', '--quiet')
Invoke-SaviaCompose -Argumentos @('up', '-d', '--wait', '--wait-timeout', '180', 'keycloak', 'api', 'web', 'lan')
Invoke-SaviaCompose -Argumentos @('exec', '-T', 'lan', '/docker-entrypoint.d/20-envsubst-on-templates.sh')
Invoke-SaviaCompose -Argumentos @('exec', '-T', 'lan', 'nginx', '-t')
Invoke-SaviaCompose -Argumentos @('exec', '-T', 'lan', 'nginx', '-s', 'reload')
$origenAnterior = if ($estadoAnterior) { $estadoAnterior.origen } else { $origen }
Set-SaviaClienteLan -Origen $origen -OrigenAnterior $origenAnterior
@{ ip=$Ip; origen=$origen; certificado="http://${Ip}:$PuertoCertificado"; huellaCa=$huellaCa; caThumbprint=$ca.Thumbprint } |
    ConvertTo-Json | Set-Content $archivoEstado -Encoding utf8NoBOM
# Una comprobación TLS real: usa la CA instalada, sin saltarse su validación.
$configuracion = Invoke-RestMethod "$origen/auth/realms/gestoria/.well-known/openid-configuration"
if ($configuracion.issuer -ne "$origen/auth/realms/gestoria") { throw 'El emisor OIDC no coincide con la URL LAN.' }
Invoke-WebRequest $origen -Method Head | Out-Null
Write-Host "Savia: $origen"
Write-Host "Preparar Android: http://${Ip}:$PuertoCertificado"
Write-Host 'Acceso del PC: http://localhost:8090'
