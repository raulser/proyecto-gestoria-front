import { TestBed } from '@angular/core/testing';
import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';

describe('ServicioAutenticacionKeycloak', () => {
  let servicio: ServicioAutenticacionKeycloak;
  let keycloak: {
    authenticated: boolean;
    token?: string;
    init: ReturnType<typeof vi.fn>;
    updateToken: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
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
});
