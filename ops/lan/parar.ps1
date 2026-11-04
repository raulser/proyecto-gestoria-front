#Requires -Version 7.0
[CmdletBinding()]
param()
. (Join-Path $PSScriptRoot 'comun.ps1')
if (-not (Test-Path $archivoEstado)) { throw 'No consta una configuración LAN activa.' }
$estado = Get-Content $archivoEstado -Raw | ConvertFrom-Json
$reglas = @(Get-NetFirewallRule -Name 'Savia-LAN-HTTPS', 'Savia-LAN-Certificado' -ErrorAction SilentlyContinue)
if ($reglas.Count -gt 0) { Assert-SaviaAdministrador }
Set-SaviaClienteLan -OrigenAnterior $estado.origen -Quitar
Invoke-SaviaCompose -Argumentos @('stop', 'lan')
Invoke-SaviaCompose -Argumentos @('rm', '-f', 'lan')
if ($reglas.Count -gt 0) {
    $reglas | Remove-NetFirewallRule
}
Invoke-SaviaCompose -Local -Argumentos @('up', '-d', '--wait', '--wait-timeout', '180', 'keycloak', 'api', 'web')
Write-Host 'Acceso LAN desactivado. Savia sigue en http://localhost:8090.'
Write-Host 'Se conservan los datos y el certificado local para futuros arranques.'
