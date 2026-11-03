import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

import { configuracionEjecucion } from './configuracion-ejecucion';

@Injectable({ providedIn: 'root' })
export class ServicioAutenticacionKeycloak {
  private readonly keycloak = new Keycloak({
    url: configuracionEjecucion.urlKeycloak,
    realm: configuracionEjecucion.reinoKeycloak,
    clientId: configuracionEjecucion.idClienteKeycloak,
  });

  async inicializar(): Promise<void> {
    await this.keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: true,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    });
  }

  get autenticado(): boolean {
    return this.keycloak.authenticated === true;
  }

  get token(): string {
    return this.keycloak.token ?? '';
  }

  async obtenerTokenActualizado(): Promise<string> {
    if (!this.autenticado) {
      return '';
    }
    await this.keycloak.updateToken(30);
    return this.token;
  }

  iniciarSesion(): Promise<void> {
    const solicitud = new URLSearchParams(window.location.search).get('solicitud');
    const redirectUri =
      solicitud && /^\d+$/.test(solicitud)
        ? `${window.location.origin}/?solicitud=${solicitud}`
        : window.location.origin;
    return this.keycloak.login({ redirectUri });
  }

  cerrarSesion(): Promise<void> {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
