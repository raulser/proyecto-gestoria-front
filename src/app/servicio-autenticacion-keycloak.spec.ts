import { TestBed } from '@angular/core/testing';
import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';
import { ErrorConexionSesion, ErrorSesionCaducada } from './error-sesion';
import { ServicioFeedback } from './infraestructura/servicio-feedback';

describe('ServicioAutenticacionKeycloak', () => {
  let servicio: ServicioAutenticacionKeycloak;
  let keycloak: {
    authenticated: boolean;
    token?: string;
    init: ReturnType<typeof vi.fn>;
    updateToken: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    onAuthLogout?: () => void;
  };

  beforeEach(() => {
    servicio = TestBed.inject(ServicioAutenticacionKeycloak);
    keycloak = {
      authenticated: false,
      token: undefined,
      init: vi.fn().mockResolvedValue(true),
      updateToken: vi.fn().mockResolvedValue(true),
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    (servicio as unknown as { keycloak: typeof keycloak }).keycloak = keycloak;
  });

  it('inicializa Keycloak con PKCE y comprobacion SSO', async () => {
    await servicio.inicializar();
    expect(keycloak.init).toHaveBeenCalledWith(
      expect.objectContaining({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: true,
      }),
    );
  });

  it('devuelve token vacio cuando no hay sesion', async () => {
    expect(servicio.autenticado).toBe(false);
    expect(servicio.token).toBe('');
    expect(await servicio.obtenerTokenActualizado()).toBe('');
    expect(keycloak.updateToken).not.toHaveBeenCalled();
  });

  it('renueva el token antes de entregarlo', async () => {
    keycloak.authenticated = true;
    keycloak.token = 'token-renovado';
    expect(await servicio.obtenerTokenActualizado()).toBe('token-renovado');
    expect(keycloak.updateToken).toHaveBeenCalledWith(30);
  });

  it('inicia y cierra sesion regresando al portal', async () => {
    await servicio.iniciarSesion();
    await servicio.cerrarSesion();
    expect(keycloak.login).toHaveBeenCalledWith({ redirectUri: window.location.origin });
    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: window.location.origin });
  });

  it('bloquea las peticiones tras una renovación rechazada y muestra un único aviso recuperable', async () => {
    keycloak.authenticated = true;
    keycloak.token = 'token-anterior';
    keycloak.updateToken.mockImplementation(async () => {
      keycloak.authenticated = false;
      keycloak.token = undefined;
      throw new Error('invalid_token');
    });
    await expect(servicio.obtenerTokenActualizado()).rejects.toBeInstanceOf(ErrorSesionCaducada);
    await expect(servicio.obtenerTokenActualizado()).rejects.toBeInstanceOf(ErrorSesionCaducada);
    expect(keycloak.updateToken).toHaveBeenCalledOnce();
    const mensajes = TestBed.inject(ServicioFeedback).mensajes();
    expect(mensajes).toHaveLength(1);
    expect(mensajes[0].accion).toBe('iniciar-sesion');
  });

  it('reconoce el cierre desde otra pestaña después de establecer la sesión', async () => {
    keycloak.authenticated = true;
    keycloak.token = 'token';
    await servicio.inicializar();
    keycloak.authenticated = false;
    keycloak.onAuthLogout?.();
    await expect(servicio.obtenerTokenActualizado()).rejects.toBeInstanceOf(ErrorSesionCaducada);
    expect(TestBed.inject(ServicioFeedback).mensajes()).toHaveLength(1);
  });

  it('permite reintentar una renovación tras un fallo de red sin declarar caducada la sesión', async () => {
    keycloak.authenticated = true;
    keycloak.token = 'token';
    keycloak.updateToken.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(servicio.obtenerTokenActualizado()).rejects.toBeInstanceOf(ErrorConexionSesion);
    expect(TestBed.inject(ServicioFeedback).mensajes()).toHaveLength(0);
    await expect(servicio.obtenerTokenActualizado()).resolves.toBe('token');
    expect(keycloak.logout).not.toHaveBeenCalled();
  });

  it('no anuncia caducidad al cerrar la sesión de forma voluntaria', async () => {
    keycloak.authenticated = true;
    await servicio.inicializar();
    await servicio.cerrarSesion();
    keycloak.onAuthLogout?.();
    expect(TestBed.inject(ServicioFeedback).mensajes()).toHaveLength(0);
  });

  it('conserva el enlace documental después de identificarse', async () => {
    window.history.replaceState({}, '', '/?solicitud=31');
    try {
      await servicio.iniciarSesion();
      expect(keycloak.login).toHaveBeenCalledWith({
        redirectUri: `${window.location.origin}/?solicitud=31`,
      });
    } finally {
      window.history.replaceState({}, '', '/');
    }
  });
});
