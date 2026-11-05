#Requires -Version 7.0
[CmdletBinding()]
param()
. (Join-Path $PSScriptRoot 'lan/comun.ps1')
$politica = Get-Content (Join-Path $PSScriptRoot 'politica-sesion.json') -Raw | ConvertFrom-Json -AsHashtable
if ($politica.accessTokenLifespan -ge $politica.ssoSessionIdleTimeout -or
    $politica.ssoSessionIdleTimeout -gt $politica.ssoSessionMaxLifespan) {
    throw 'Los tiempos de sesión no son coherentes.'
}
$aplicar = @'
set -eu
config=$(mktemp)
payload=$(mktemp)
trap 'rm -f "$config" "$payload"' EXIT
cat > "$payload"
kcadm=/opt/keycloak/bin/kcadm.sh
"$kcadm" config credentials --config "$config" --server http://127.0.0.1:8080 --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null
"$kcadm" update realms/gestoria --config "$config" -f "$payload"
id=$("$kcadm" get clients --config "$config" -r gestoria -q clientId=gestoria-web --fields id --format csv --noquotes)
test -n "$id"
"$kcadm" get "clients/$id" --config "$config" -r gestoria
'@
$respuesta = Invoke-SaviaCompose -Local -EntradaJson ($politica | ConvertTo-Json) -Argumentos @('exec', '-T', 'keycloak', 'sh', '-ec', $aplicar)
$completo = ($respuesta -join "`n") | ConvertFrom-Json -AsHashtable
$cliente = @{ id = $completo.id; attributes = $completo.attributes ?? @{} }
$cliente.attributes['client.session.idle.timeout'] = '0'
$cliente.attributes['client.session.max.lifespan'] = '0'
$cliente.attributes['pkce.code.challenge.method'] = 'S256'
$actualizar = @'
set -eu
config=$(mktemp)
payload=$(mktemp)
trap 'rm -f "$config" "$payload"' EXIT
cat > "$payload"
kcadm=/opt/keycloak/bin/kcadm.sh
"$kcadm" config credentials --config "$config" --server http://127.0.0.1:8080 --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null
"$kcadm" update "clients/$SAVIA_CLIENT_ID" --config "$config" -r gestoria -f "$payload"
"$kcadm" get realms/gestoria --config "$config" --fields accessTokenLifespan,ssoSessionIdleTimeout,ssoSessionMaxLifespan,clientSessionIdleTimeout,clientSessionMaxLifespan
'@
Invoke-SaviaCompose -Local -EntradaJson ($cliente | ConvertTo-Json -Depth 20) -Argumentos @('exec', '-T', '-e', "SAVIA_CLIENT_ID=$($cliente.id)", 'keycloak', 'sh', '-ec', $actualizar)
# También se aplica a instalaciones nuevas, sin tocar usuarios ni otros ajustes.
$rutaSemilla = Join-Path $raizProyecto 'docker/keycloak/gestoria-realm.json'
if (Test-Path $rutaSemilla) {
    $semilla = Get-Content $rutaSemilla -Raw | ConvertFrom-Json -AsHashtable
    foreach ($clave in $politica.Keys) { $semilla[$clave] = $politica[$clave] }
    $semilla | ConvertTo-Json -Depth 100 | Set-Content $rutaSemilla -Encoding utf8NoBOM
}
Write-Host 'Sesión configurada: 2 h de inactividad, máximo 24 h y tokens de acceso de 5 min.'
