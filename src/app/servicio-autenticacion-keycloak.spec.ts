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
    isTokenExpired: ReturnType<typeof vi.fn>;
    onAuthLogout?: () => void;
    onTokenExpired?: () => void;
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
      isTokenExpired: vi.fn().mockReturnValue(false),
    };
    (servicio as unknown as { keycloak: typeof keycloak }).keycloak = keycloak;
  });

  afterEach(() => {
    servicio.ngOnDestroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
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
    expect(keycloak.updateToken).toHaveBeenCalledWith(60);
  });

  it('inicia y cierra sesion regresando al portal', async () => {
    await servicio.iniciarSesion();
    await servicio.cerrarSesion();
    expect(keycloak.login).toHaveBeenCalledWith({ redirectUri: window.location.origin });
    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: window.location.origin });
  });

  it('redirige una sola vez al login tras una renovación rechazada y bloquea los envíos', async () => {
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
    expect(keycloak.login).toHaveBeenCalledExactlyOnceWith({
      redirectUri: `${window.location.origin}/?sesion=perdida`,
      prompt: 'login',
    });
    expect(TestBed.inject(ServicioFeedback).mensajes()).toHaveLength(0);
  });

  it('reconoce el cierre desde otra pestaña después de establecer la sesión', async () => {
    keycloak.authenticated = true;
    keycloak.token = 'token';
    await servicio.inicializar();
    keycloak.authenticated = false;
    keycloak.onAuthLogout?.();
    await expect(servicio.obtenerTokenActualizado()).rejects.toBeInstanceOf(ErrorSesionCaducada);
    expect(keycloak.login).toHaveBeenCalledOnce();
    expect(TestBed.inject(ServicioFeedback).mensajes()).toHaveLength(0);
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

  it('conserva la solicitud al perder sesión y limpia el aviso tras volver a entrar', async () => {
    window.history.replaceState({ ejemplo: 1 }, '', '/?solicitud=31&sesion=perdida');
    try {
      keycloak.authenticated = true;
      keycloak.token = 'token';
      await servicio.inicializar();
      expect(window.location.search).toBe('?solicitud=31');
      expect(window.history.state).toEqual({ ejemplo: 1 });
      servicio.notificarSesionCaducada();
      expect(keycloak.login).toHaveBeenCalledWith({
        redirectUri: `${window.location.origin}/?solicitud=31&sesion=perdida`,
        prompt: 'login',
      });
    } finally {
      window.history.replaceState({}, '', '/');
    }
  });

  function activarReloj(): void {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    keycloak.authenticated = true;
    keycloak.token = 'token';
  }

  function capturarActividad(): Map<string, EventListener> {
    const escuchas = new Map<string, EventListener>();
    const agregar = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((tipo, escucha, opciones) => {
      if (typeof escucha === 'function') escuchas.set(tipo, escucha as EventListener);
      agregar(tipo, escucha, opciones);
    });
    return escuchas;
  }

  it('escribir y comprobar un token vigente no genera renovaciones', async () => {
    activarReloj();
    const escuchas = capturarActividad();
    await servicio.inicializar();
    for (let i = 0; i < 100; i++) escuchas.get('input')?.({ isTrusted: true } as Event);
    expect(keycloak.updateToken).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(keycloak.isTokenExpired).toHaveBeenCalledWith(60);
    expect(keycloak.updateToken).not.toHaveBeenCalled();
  });

  it('mantiene una edición de 35 minutos renovando solo cuando queda un minuto', async () => {
    activarReloj();
    let vencimiento = Date.now() + 300_000;
    keycloak.isTokenExpired.mockImplementation(
      (margen: number) => Date.now() + margen * 1000 >= vencimiento,
    );
    keycloak.updateToken.mockImplementation(async () => {
      vencimiento = Date.now() + 300_000;
      return true;
    });
    const escuchas = capturarActividad();
    await servicio.inicializar();
    for (let minuto = 0; minuto < 35; minuto++) {
      const anteriores = keycloak.updateToken.mock.calls.length;
      escuchas.get('keydown')?.({ isTrusted: true } as Event);
      expect(keycloak.updateToken.mock.calls.length).toBe(anteriores);
      await vi.advanceTimersByTimeAsync(60_000);
    }
    expect(keycloak.updateToken).toHaveBeenCalledTimes(8);
    expect(keycloak.login).not.toHaveBeenCalled();
  });

  it('no mantiene una pestaña desatendida por eventos sintéticos', async () => {
    activarReloj();
    const vence = Date.now() + 300_000;
    keycloak.isTokenExpired.mockImplementation(
      (margen: number) => Date.now() + margen * 1000 >= vence,
    );
    await servicio.inicializar();
    for (let i = 0; i < 8; i++) {
      document.dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(60_000);
    }
    expect(keycloak.updateToken).not.toHaveBeenCalled();
  });

  it('al volver del segundo plano renueva si el token está a punto de caducar', async () => {
    activarReloj();
    let estado: DocumentVisibilityState = 'hidden';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => estado);
    keycloak.isTokenExpired.mockReturnValue(true);
    await servicio.inicializar();
    await vi.advanceTimersByTimeAsync(300_000);
    expect(keycloak.updateToken).not.toHaveBeenCalled();
    estado = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(keycloak.updateToken).toHaveBeenCalledOnce();
  });

  it('espera a recuperar conexión y comparte la renovación entre peticiones simultáneas', async () => {
    activarReloj();
    let conectado = false;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => conectado);
    keycloak.isTokenExpired.mockReturnValue(true);
    await servicio.inicializar();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(keycloak.updateToken).not.toHaveBeenCalled();
    conectado = true;
    let resolver!: () => void;
    keycloak.updateToken.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolver = () => resolve(true);
        }),
    );
    window.dispatchEvent(new Event('online'));
    const pendiente = servicio.obtenerTokenActualizado();
    expect(keycloak.updateToken).toHaveBeenCalledOnce();
    resolver();
    await expect(pendiente).resolves.toBe('token');
  });

  it('retira los temporizadores y los eventos al destruirse', async () => {
    activarReloj();
    keycloak.isTokenExpired.mockReturnValue(true);
    await servicio.inicializar();
    servicio.ngOnDestroy();
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(300_000);
    expect(keycloak.updateToken).not.toHaveBeenCalled();
  });
});
