import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { configuracionEjecucion } from './configuracion-ejecucion';
import { interceptorAutenticacion } from './interceptor-autenticacion';
import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';

describe('interceptorAutenticacion', () => {
  const autenticacion = { obtenerTokenActualizado: vi.fn() };

  beforeEach(() => {
    autenticacion.obtenerTokenActualizado.mockReset();
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
});
