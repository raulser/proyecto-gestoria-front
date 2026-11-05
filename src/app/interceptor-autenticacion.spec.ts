import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { configuracionEjecucion } from './configuracion-ejecucion';
import { destinoApi, interceptorAutenticacion } from './interceptor-autenticacion';
import { ErrorSesionCaducada } from './error-sesion';
import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';

describe('interceptorAutenticacion', () => {
  const autenticacion = { obtenerTokenActualizado: vi.fn(), notificarSesionCaducada: vi.fn() };

  beforeEach(() => {
    autenticacion.obtenerTokenActualizado.mockReset();
    autenticacion.notificarSesionCaducada.mockReset().mockReturnValue(new ErrorSesionCaducada());
    TestBed.configureTestingModule({
      providers: [{ provide: ServicioAutenticacionKeycloak, useValue: autenticacion }],
    });
  });

  it('anade el token Bearer a las peticiones de la API', async () => {
    autenticacion.obtenerTokenActualizado.mockResolvedValue('token-seguro');
    let capturada: HttpRequest<unknown> | undefined;

    await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        interceptorAutenticacion(
          new HttpRequest('GET', `${configuracionEjecucion.urlApi}/api/clientes`),
          (solicitud) => {
            capturada = solicitud;
            return of(new HttpResponse({ status: 200 }));
          },
        ),
      ),
    );

    expect(capturada?.headers.get('Authorization')).toBe('Bearer token-seguro');
  });

  it('no anade cabecera si la sesion no tiene token', async () => {
    autenticacion.obtenerTokenActualizado.mockResolvedValue('');
    let capturada: HttpRequest<unknown> | undefined;

    await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        interceptorAutenticacion(
          new HttpRequest('GET', `${configuracionEjecucion.urlApi}/api/salud`),
          (solicitud) => {
            capturada = solicitud;
            return of(new HttpResponse({ status: 200 }));
          },
        ),
      ),
    );

    expect(capturada?.headers.has('Authorization')).toBe(false);
  });

  it('no consulta Keycloak para destinos externos', async () => {
    await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        interceptorAutenticacion(new HttpRequest('GET', 'https://example.test/recurso'), () =>
          of(new HttpResponse({ status: 200 })),
        ),
      ),
    );

    expect(autenticacion.obtenerTokenActualizado).not.toHaveBeenCalled();
  });

  it('restringe el token al origen y ruta de la API incluso con base vacía o parecida', () => {
    const origen = 'https://192.168.1.43:8090';
    expect(destinoApi('/api/clientes', '', origen)?.origin).toBe(origen);
    expect(destinoApi('https://externo.test/api/clientes', '', origen)).toBeNull();
    expect(destinoApi('/manuales/manual.pdf', '', origen)).toBeNull();
    expect(
      destinoApi('https://api.test.ejemplo/api/clientes', 'https://api.test', origen),
    ).toBeNull();
    expect(destinoApi('/backend/api/clientes', '/backend', origen)?.pathname).toBe(
      '/backend/api/clientes',
    );
  });

  it('comprueba la salud sin renovar sesión ni reenviar un token antiguo', async () => {
    let capturada: HttpRequest<unknown> | undefined;
    await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        interceptorAutenticacion(
          new HttpRequest('GET', `${configuracionEjecucion.urlApi}/api/salud`, {
            headers: undefined,
          }).clone({ setHeaders: { Authorization: 'Bearer antiguo' } }),
          (solicitud) => {
            capturada = solicitud;
            return of(new HttpResponse({ status: 200 }));
          },
        ),
      ),
    );
    expect(capturada?.headers.has('Authorization')).toBe(false);
    expect(autenticacion.obtenerTokenActualizado).not.toHaveBeenCalled();
  });

  it('no envía una operación si la sesión ha caducado', async () => {
    autenticacion.obtenerTokenActualizado.mockRejectedValue(new ErrorSesionCaducada());
    const siguiente = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    await expect(
      firstValueFrom(
        TestBed.runInInjectionContext(() =>
          interceptorAutenticacion(
            new HttpRequest('POST', `${configuracionEjecucion.urlApi}/api/asignaciones`, {}),
            siguiente,
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(ErrorSesionCaducada);
    expect(siguiente).not.toHaveBeenCalled();
  });

  it('un 401 ofrece recuperar acceso y no reenvía automáticamente una operación', async () => {
    autenticacion.obtenerTokenActualizado.mockResolvedValue('token');
    const siguiente = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    await expect(
      firstValueFrom(
        TestBed.runInInjectionContext(() =>
          interceptorAutenticacion(
            new HttpRequest('POST', `${configuracionEjecucion.urlApi}/api/solicitudes`, {}),
            siguiente,
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(ErrorSesionCaducada);
    expect(autenticacion.notificarSesionCaducada).toHaveBeenCalledOnce();
    expect(siguiente).toHaveBeenCalledOnce();
  });

  it('mantiene los errores de permisos sin convertirlos en una sesión caducada', async () => {
    autenticacion.obtenerTokenActualizado.mockResolvedValue('token');
    const error = new HttpErrorResponse({ status: 403 });
    await expect(
      firstValueFrom(
        TestBed.runInInjectionContext(() =>
          interceptorAutenticacion(
            new HttpRequest('GET', `${configuracionEjecucion.urlApi}/api/usuarios`),
            () => throwError(() => error),
          ),
        ),
      ),
    ).rejects.toBe(error);
    expect(autenticacion.notificarSesionCaducada).not.toHaveBeenCalled();
  });
});
