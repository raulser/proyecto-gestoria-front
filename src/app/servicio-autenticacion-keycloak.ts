import { Injectable, OnDestroy, signal } from '@angular/core';
import Keycloak from 'keycloak-js';

import { configuracionEjecucion } from './configuracion-ejecucion';
import { ErrorConexionSesion, ErrorSesionCaducada } from './error-sesion';

@Injectable({ providedIn: 'root' })
export class ServicioAutenticacionKeycloak implements OnDestroy {
  readonly redireccionandoAlLogin = signal(false);
  readonly errorRedireccion = signal('');
  private sesionEstablecida = false;
  private saliendo = false;
  private sesionRechazada = false;
  private ultimaActividad = 0;
  private temporizador?: number;
  private renovacion: Promise<string> | null = null;
  private readonly limpiarEscuchas: Array<() => void> = [];
  private readonly margenRenovacion = 60;
  private readonly keycloak = new Keycloak({
    url: configuracionEjecucion.urlKeycloak,
    realm: configuracionEjecucion.reinoKeycloak,
    clientId: configuracionEjecucion.idClienteKeycloak,
  });

  async inicializar(): Promise<void> {
    this.keycloak.onAuthLogout = () => {
      if (this.sesionEstablecida && !this.saliendo) this.notificarSesionCaducada();
    };
    this.keycloak.onTokenExpired = () => void this.renovarSiHaceFalta();
    await this.keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: true,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    });
    this.sesionEstablecida = this.autenticado;
    if (this.autenticado) {
      const actual = new URL(window.location.href);
      if (actual.searchParams.get('sesion') === 'perdida') {
        actual.searchParams.delete('sesion');
        window.history.replaceState(
          window.history.state,
          '',
          actual.pathname + actual.search + actual.hash,
        );
      }
      this.iniciarMantenimiento();
    }
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
    if (this.renovacion) return this.renovacion;
    const pendiente = this.renovarToken();
    this.renovacion = pendiente;
    try {
      return await pendiente;
    } finally {
      if (this.renovacion === pendiente) this.renovacion = null;
    }
  }

  private async renovarToken(): Promise<string> {
    try {
      await this.keycloak.updateToken(this.margenRenovacion);
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
    if (!this.sesionRechazada && !this.saliendo) {
      this.sesionRechazada = true;
      this.redireccionandoAlLogin.set(true);
      this.detenerMantenimiento();
      void this.iniciarSesion().catch(() => {});
    }
    return new ErrorSesionCaducada();
  }

  iniciarSesion(): Promise<void> {
    const solicitud = new URLSearchParams(window.location.search).get('solicitud');
    const retorno = new URL(window.location.origin);
    if (solicitud && /^\d+$/.test(solicitud)) retorno.searchParams.set('solicitud', solicitud);
    if (this.sesionRechazada) retorno.searchParams.set('sesion', 'perdida');
    const redirectUri = retorno.search ? retorno.href : window.location.origin;
    this.errorRedireccion.set('');
    return this.keycloak
      .login({ redirectUri, ...(this.sesionRechazada ? { prompt: 'login' as const } : {}) })
      .catch((error: unknown) => {
        this.errorRedireccion.set(
          'No se pudo abrir el acceso. Revisa la conexión y vuelve a intentarlo.',
        );
        throw error;
      });
  }

  cerrarSesion(): Promise<void> {
    this.saliendo = true;
    this.detenerMantenimiento();
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }

  private iniciarMantenimiento(): void {
    this.detenerMantenimiento();
    this.ultimaActividad = Date.now();
    const registrar = (evento: Event) => {
      // Las pulsaciones solo registran actividad: no hacen peticiones.
      if (evento.isTrusted) this.ultimaActividad = Date.now();
    };
    for (const tipo of ['pointerdown', 'pointermove', 'keydown', 'input', 'wheel', 'touchstart']) {
      document.addEventListener(tipo, registrar, { capture: true, passive: true });
      this.limpiarEscuchas.push(() => document.removeEventListener(tipo, registrar, true));
    }
    const reanudar = () => {
      if (document.visibilityState !== 'visible') return;
      this.ultimaActividad = Date.now();
      void this.renovarSiHaceFalta();
    };
    for (const tipo of ['focus', 'online', 'pageshow']) {
      window.addEventListener(tipo, reanudar);
      this.limpiarEscuchas.push(() => window.removeEventListener(tipo, reanudar));
    }
    document.addEventListener('visibilitychange', reanudar);
    this.limpiarEscuchas.push(() => document.removeEventListener('visibilitychange', reanudar));
    this.temporizador = window.setInterval(() => void this.renovarSiHaceFalta(), 30_000);
  }

  private async renovarSiHaceFalta(): Promise<void> {
    if (
      this.saliendo ||
      this.sesionRechazada ||
      !this.autenticado ||
      !navigator.onLine ||
      document.visibilityState !== 'visible' ||
      Date.now() - this.ultimaActividad > 120_000
    )
      return;
    try {
      // isTokenExpired es una comprobación local, sin tráfico ni renovación.
      if (!this.keycloak.isTokenExpired(this.margenRenovacion)) return;
      await this.obtenerTokenActualizado();
    } catch {
      /* La pérdida real ya redirige; un fallo de red se reintenta después. */
    }
  }

  private detenerMantenimiento(): void {
    if (this.temporizador !== undefined) window.clearInterval(this.temporizador);
    this.temporizador = undefined;
    this.limpiarEscuchas.splice(0).forEach((limpiar) => limpiar());
  }

  ngOnDestroy(): void {
    this.saliendo = true;
    this.detenerMantenimiento();
    this.keycloak.onAuthLogout = undefined;
    this.keycloak.onTokenExpired = undefined;
  }
}
