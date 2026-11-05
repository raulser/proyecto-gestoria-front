# Helpers para la pila de desarrollo de ProyectoGestoria. No modifica el .env base.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$raizProyecto = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$directorioLan = Join-Path $raizProyecto 'storage/lan'
$archivoEstado = Join-Path $directorioLan 'estado.json'
$archivoEntorno = Join-Path $directorioLan '.env'
$archivoCompose = Join-Path $PSScriptRoot 'compose.lan.yaml'

function Invoke-SaviaCompose {
    param([Parameter(Mandatory)][string[]] $Argumentos, [switch] $Local, [string] $EntradaJson)
    $opciones = @('--project-directory', $raizProyecto, '--env-file', (Join-Path $raizProyecto '.env'))
    if (-not $Local) { $opciones += @('--env-file', $archivoEntorno) }
    $opciones += @('-f', (Join-Path $raizProyecto 'compose.yaml'))
    if (-not $Local) { $opciones += @('-f', $archivoCompose) }
    if ($PSBoundParameters.ContainsKey('EntradaJson')) {
        $EntradaJson | & docker compose @opciones @Argumentos
    } else {
        & docker compose @opciones @Argumentos
    }
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose falló ($LASTEXITCODE)." }
}

function Assert-SaviaAdministrador {
    $identidad = [Security.Principal.WindowsIdentity]::GetCurrent()
    if (-not ([Security.Principal.WindowsPrincipal]::new($identidad)).IsInRole('Administrator')) {
        throw 'Ejecuta PowerShell como administrador para configurar el firewall local.'
    }
}

function Set-SaviaClienteLan {
    param([string] $Origen, [string] $OrigenAnterior, [switch] $Quitar)
    # Las credenciales de administración se leen dentro del contenedor.
    $leerCliente = @'
set -eu
config=$(mktemp)
trap 'rm -f "$config"' EXIT
kcadm=/opt/keycloak/bin/kcadm.sh
"$kcadm" config credentials --config "$config" --server http://127.0.0.1:8080 --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null
id=$("$kcadm" get clients --config "$config" -r gestoria -q clientId=gestoria-web --fields id --format csv --noquotes)
test -n "$id"
"$kcadm" get "clients/$id" --config "$config" -r gestoria
'@
    $respuesta = Invoke-SaviaCompose -Argumentos @('exec', '-T', 'keycloak', 'sh', '-ec', $leerCliente)
    $completo = ($respuesta -join "`n") | ConvertFrom-Json -AsHashtable
    # --fields attributes omite los valores del mapa; conservarlos desde la respuesta completa.
    $cliente = @{
        id = $completo.id
        redirectUris = $completo.redirectUris
        webOrigins = $completo.webOrigins
        attributes = $completo.attributes ?? @{}
    }
    if (-not $cliente.id) { throw 'No se encuentra el cliente gestoria-web en Keycloak.' }
    $cliente.redirectUris = @($cliente.redirectUris | Where-Object { $_ -ne "$OrigenAnterior/*" })
    $cliente.webOrigins = @($cliente.webOrigins | Where-Object { $_ -ne $OrigenAnterior })
    $salidas = @($cliente.attributes['post.logout.redirect.uris'] -split '##' | Where-Object { $_ -and $_ -ne "$OrigenAnterior/*" })
    if (-not $Quitar) {
        $cliente.redirectUris = @($cliente.redirectUris + "$Origen/*" | Select-Object -Unique)
        $cliente.webOrigins = @($cliente.webOrigins + $Origen | Select-Object -Unique)
        $salidas = @($salidas + "$Origen/*" | Select-Object -Unique)
    }
    $cliente.attributes['post.logout.redirect.uris'] = $salidas -join '##'
    $escribirCliente = @'
set -eu
config=$(mktemp)
payload=$(mktemp)
trap 'rm -f "$config" "$payload"' EXIT
cat > "$payload"
kcadm=/opt/keycloak/bin/kcadm.sh
"$kcadm" config credentials --config "$config" --server http://127.0.0.1:8080 --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null
"$kcadm" update "clients/$SAVIA_CLIENT_ID" --config "$config" -r gestoria -f "$payload"
'@
    Invoke-SaviaCompose -EntradaJson ($cliente | ConvertTo-Json -Depth 20) -Argumentos @('exec', '-T', '-e', "SAVIA_CLIENT_ID=$($cliente.id)", 'keycloak', 'sh', '-ec', $escribirCliente)
}
