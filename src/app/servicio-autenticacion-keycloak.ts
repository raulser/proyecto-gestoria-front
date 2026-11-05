import { Injectable, inject } from '@angular/core';
import Keycloak from 'keycloak-js';

import { configuracionEjecucion } from './configuracion-ejecucion';
import { ServicioFeedback } from './infraestructura/servicio-feedback';
import { ErrorConexionSesion, ErrorSesionCaducada } from './error-sesion';

@Injectable({ providedIn: 'root' })
export class ServicioAutenticacionKeycloak {
  private readonly feedback = inject(ServicioFeedback);
  private sesionEstablecida = false;
  private saliendo = false;
  private sesionRechazada = false;
  private readonly keycloak = new Keycloak({
    url: configuracionEjecucion.urlKeycloak,
    realm: configuracionEjecucion.reinoKeycloak,
    clientId: configuracionEjecucion.idClienteKeycloak,
  });

  async inicializar(): Promise<void> {
    this.keycloak.onAuthLogout = () => {
      if (this.sesionEstablecida && !this.saliendo) this.notificarSesionCaducada();
    };
    await this.keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: true,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    });
    this.sesionEstablecida = this.autenticado;
  }

  get autenticado(): boolean {
    return this.keycloak.authenticated === true;
  }

  get token(): string {
    return this.keycloak.token ?? '';
  }

  async obtenerTokenActualizado(): Promise<string> {
    if (this.sesionRechazada && !this.saliendo) throw this.notificarSesionCaducada();
    if (!this.autenticado) {
      if (this.sesionEstablecida && !this.saliendo) throw this.notificarSesionCaducada();
      return '';
    }
    this.sesionEstablecida = true;
    try {
      await this.keycloak.updateToken(30);
      if (!this.autenticado || !this.token) throw this.notificarSesionCaducada();
      return this.token;
    } catch (error) {
      if (error instanceof ErrorSesionCaducada || !this.autenticado) {
        throw this.notificarSesionCaducada();
      }
      throw new ErrorConexionSesion(error);
    }
  }

  notificarSesionCaducada(): ErrorSesionCaducada {
    this.sesionRechazada = true;
    this.feedback.conAccion(
      'Tu sesión ha caducado',
      'Vuelve a iniciar sesión para continuar.',
      'iniciar-sesion',
    );
    return new ErrorSesionCaducada();
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
    this.saliendo = true;
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
